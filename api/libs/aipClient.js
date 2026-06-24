/**
 * AIP consumer adapter — discover, resolve, and delegate tasks to external AIP agents.
 * Uses agent wallet + x402 for outbound payment when treasury anonymousId is configured.
 */
import { getAgentFetch } from "./agentFetch.js";
import { getAgentKeypair } from "./agentWallet.js";
import { pay402AndRetry } from "./agentX402Client.js";
import { verifyAipCounterparty, resolveDidAip } from "./aipDidClient.js";
import { getAipMarketplaceApiUrl, getAipTreasuryAnonymousId } from "../config/aipConfig.js";

/** @typedef {{ success: true; data: unknown } | { success: false; error: string; status?: number }} AipToolResult */

/**
 * @param {string} endpoint - agent A2A base URL (without /a2a)
 * @returns {string}
 */
function normalizeAgentEndpoint(endpoint) {
  const raw = String(endpoint || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  if (raw.endsWith("/a2a")) return raw;
  return `${raw}/a2a`;
}

/**
 * @param {string} cardUrl
 */
async function fetchAgentCard(cardUrl) {
  const url = String(cardUrl || "").trim();
  if (!url) throw new Error("cardUrl is required");
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Agent Card fetch failed (${res.status}): ${url}`);
  }
  return res.json();
}

/**
 * Discover agents from AIP marketplace API (best-effort).
 * @param {Record<string, string>} [params]
 * @returns {Promise<AipToolResult>}
 */
export async function discoverAipAgents(params = {}) {
  const q = String(params.q || params.query || "").trim().toLowerCase();
  const limitRaw = params.limit != null ? Number(params.limit) : 25;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 25;

  const apiBase = getAipMarketplaceApiUrl();
  /** @type {Array<Record<string, unknown>>} */
  let agents = [];

  try {
    const res = await fetch(`${apiBase}/agents?limit=${limit}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const body = await res.json();
      agents = Array.isArray(body?.agents)
        ? body.agents
        : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];
    }
  } catch (e) {
    console.warn("[aip] marketplace discover skipped:", e?.message || e);
  }

  if (q) {
    agents = agents.filter((a) => {
      const hay = `${a?.name ?? ""} ${a?.did ?? ""} ${a?.endpoint ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  return {
    success: true,
    data: {
      count: agents.length,
      agents: agents.slice(0, limit),
      note: "Use aip-resolve to verify did:aip on-chain; aip-delegate to submit a task with agent wallet payment.",
      marketplace: apiBase,
    },
  };
}

/**
 * Resolve did:aip and optionally fetch off-chain Agent Card.
 * @param {Record<string, string>} params
 */
export async function resolveAipAgent(params = {}) {
  const did = String(params.did || "").trim();
  const cardUrl = String(params.cardUrl || params.card_url || "").trim();

  if (!did && !cardUrl) {
    return { success: false, error: "did or cardUrl is required", status: 400 };
  }

  /** @type {Record<string, unknown>} */
  const data = {};

  if (did) {
    const verified = await verifyAipCounterparty(did);
    if (!verified.ok) {
      return { success: false, error: verified.error, status: 404 };
    }
    data.did = did;
    data.agentRecord = verified.record;
    data.didDocument = verified.didDocument;
    data.endpoint = verified.record.endpoint;
  }

  const resolvedCardUrl =
    cardUrl ||
    (data.endpoint ? `${String(data.endpoint).replace(/\/a2a\/?$/, "")}/.well-known/agent.json` : "");

  if (resolvedCardUrl) {
    try {
      data.agentCard = await fetchAgentCard(resolvedCardUrl);
    } catch (e) {
      data.agentCardError = e instanceof Error ? e.message : String(e);
    }
  }

  return { success: true, data };
}

/**
 * JSON-RPC call to an AIP agent A2A endpoint.
 * @param {string} a2aUrl
 * @param {string} method
 * @param {object} rpcParams
 * @param {RequestInit} [fetchOpts]
 */
async function a2aJsonRpc(a2aUrl, method, rpcParams, fetchOpts = {}) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method,
    params: rpcParams,
    id: `syra_${Date.now()}`,
  });
  const res = await fetch(a2aUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(fetchOpts.headers || {}),
    },
    body,
    ...fetchOpts,
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON-RPC response (${res.status}): ${text.slice(0, 200)}`);
  }
  if (parsed?.error) {
    const msg = parsed.error?.message || JSON.stringify(parsed.error);
    throw new Error(msg);
  }
  return parsed?.result ?? parsed;
}

/**
 * Poll task/status until terminal state or timeout.
 * @param {string} a2aUrl
 * @param {string} taskId
 * @param {number} [timeoutMs]
 */
async function pollAipTask(a2aUrl, taskId, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = await a2aJsonRpc(a2aUrl, "task/status", { taskId });
    const state = String(status?.status || "").toUpperCase();
    if (state === "COMPLETED" || state === "FAILED") {
      return status;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`AIP task timed out after ${timeoutMs}ms`);
}

/**
 * Delegate a task to an external AIP agent (buy side).
 * @param {Record<string, string>} params
 * @param {{ anonymousId?: string; host?: string }} [ctx]
 */
export async function delegateToAipAgent(params = {}, ctx = {}) {
  const did = String(params.did || "").trim();
  const endpoint = String(params.endpoint || params.url || "").trim();
  const capability = String(params.capability || params.capabilityId || "").trim();
  const input = String(params.input || params.prompt || params.query || "").trim();
  const cardUrl = String(params.cardUrl || "").trim();

  if (!input) {
    return { success: false, error: "input is required", status: 400 };
  }
  if (!capability) {
    return { success: false, error: "capability is required", status: 400 };
  }

  let a2aUrl = endpoint ? normalizeAgentEndpoint(endpoint) : "";
  let verifiedDid = did;

  if (did) {
    const verified = await verifyAipCounterparty(did);
    if (!verified.ok) {
      return { success: false, error: verified.error, status: 403 };
    }
    if (!a2aUrl && verified.record.endpoint) {
      a2aUrl = normalizeAgentEndpoint(verified.record.endpoint);
    }
  }

  if (!a2aUrl && cardUrl) {
    const card = await fetchAgentCard(cardUrl);
    if (card?.endpoint) a2aUrl = normalizeAgentEndpoint(card.endpoint);
    if (card?.did) verifiedDid = card.did;
  }

  if (!a2aUrl) {
    return {
      success: false,
      error: "Could not resolve A2A endpoint — pass endpoint, did, or cardUrl",
      status: 400,
    };
  }

  const anonymousId = ctx.anonymousId || getAipTreasuryAnonymousId();
  if (!anonymousId) {
    return {
      success: false,
      error: "Agent wallet required — pass anonymousId or configure AIP_TREASURY_ANONYMOUS_ID",
      status: 400,
    };
  }

  const keypair = await getAgentKeypair(anonymousId);
  if (!keypair) {
    return {
      success: false,
      error: "Agent wallet not found for delegation",
      status: 404,
    };
  }

  const fetchFn = await getAgentFetch(anonymousId);

  /** @type {Record<string, string>} */
  const headers = { "Content-Type": "application/json" };

  let createResult;
  try {
    const paid = await pay402AndRetry(
      keypair,
      {
        url: a2aUrl,
        method: "POST",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "task/create",
          params: { capability, input },
          id: `syra_${Date.now()}`,
        }),
        extraHeaders: headers,
      },
      fetchFn
    );
    if (!paid.success) {
      return {
        success: false,
        error: paid.error || "AIP x402 payment failed",
        status: paid.budgetExceeded ? 402 : 502,
        ...(paid.budgetExceeded ? { budgetExceeded: true } : {}),
      };
    }
    createResult = paid.data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      error: `AIP task/create failed: ${msg}`,
      status: 502,
    };
  }

  const taskId = createResult?.taskId;
  if (!taskId) {
    if (createResult?.artifact != null) {
      return {
        success: true,
        data: {
          did: verifiedDid || null,
          endpoint: a2aUrl,
          capability,
          status: createResult?.status || "COMPLETED",
          artifact: createResult.artifact,
          sync: true,
        },
      };
    }
    return { success: false, error: "AIP task/create returned no taskId", status: 502 };
  }

  let finalStatus;
  try {
    finalStatus = await pollAipTask(a2aUrl, taskId);
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      status: 504,
      data: { taskId, endpoint: a2aUrl },
    };
  }

  if (String(finalStatus?.status).toUpperCase() === "FAILED") {
    return {
      success: false,
      error: finalStatus?.error || "AIP task failed",
      status: 502,
      data: { taskId, endpoint: a2aUrl, status: finalStatus },
    };
  }

  return {
    success: true,
    data: {
      did: verifiedDid || null,
      endpoint: a2aUrl,
      capability,
      taskId,
      status: finalStatus?.status,
      artifact: finalStatus?.artifact,
    },
  };
}

/**
 * Brain helper: try delegating to an AIP specialist when question matches patterns.
 * @param {string} question
 * @param {{ anonymousId?: string; host?: string }} [ctx]
 * @returns {Promise<{ delegated: true; data: unknown } | { delegated: false }>}
 */
export async function tryAipBrainDelegation(question, ctx = {}) {
  if (String(process.env.AIP_BRAIN_DELEGATION_ENABLED || "true").toLowerCase() === "false") {
    return { delegated: false };
  }

  const q = String(question || "").trim();
  if (!q) return { delegated: false };

  /** @type {{ capability: string; pattern: RegExp; defaultDid?: string } | null} */
  let match = null;

  if (/\b(summarize|summary|tl;dr|tldr)\b/i.test(q) && q.length > 120) {
    match = {
      capability: "text.summarize",
      pattern: /summarize/i,
      defaultDid: process.env.AIP_DEFAULT_SUMMARY_DID?.trim(),
    };
  } else if (/\b(translate|translation)\b/i.test(q)) {
    match = {
      capability: "text.translate",
      pattern: /translate/i,
      defaultDid: process.env.AIP_DEFAULT_TRANSLATE_DID?.trim(),
    };
  } else if (/\b(audit|review code|vulnerability|security scan)\b/i.test(q)) {
    match = {
      capability: "code.audit",
      pattern: /audit/i,
      defaultDid: process.env.AIP_DEFAULT_AUDIT_DID?.trim(),
    };
  }

  if (!match?.defaultDid) return { delegated: false };

  const result = await delegateToAipAgent(
    {
      did: match.defaultDid,
      capability: match.capability,
      input: q,
    },
    ctx
  );

  if (!result.success) {
    console.warn("[aip] brain delegation skipped:", result.error);
    return { delegated: false };
  }

  return { delegated: true, data: result.data };
}

/**
 * @param {"discover"|"resolve"|"delegate"} action
 * @param {Record<string, string>} params
 * @param {{ anonymousId?: string; host?: string }} [ctx]
 */
export async function runAipToolForAgent(action, params = {}, ctx = {}) {
  switch (action) {
    case "discover":
      return discoverAipAgents(params);
    case "resolve":
      return resolveAipAgent(params);
    case "delegate":
      return delegateToAipAgent(params, ctx);
    default:
      return { success: false, error: `Unknown AIP action: ${action}`, status: 400 };
  }
}

export { resolveDidAip, verifyAipCounterparty };
