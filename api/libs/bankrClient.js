/**
 * Bankr API client – agent prompts, job status, and balances.
 * Set BANKR_API_KEY in .env (bk_...). Used by /bankr routes.
 * @see https://github.com/BankrBot/skills/tree/main/bankr
 */

const BANKR_API_URL = (process.env.BANKR_API_URL || "https://api.bankr.bot").replace(/\/$/, "");
const API_KEY = (process.env.BANKR_API_KEY || "").trim();
const TIMEOUT_MS = Number(process.env.BANKR_TIMEOUT_MS) || 30_000;

function headers() {
  return {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
  };
}

async function fetchBankr(path, options = {}) {
  if (!API_KEY) {
    return { ok: false, status: 503, data: { error: "BANKR_API_KEY not configured" } };
  }
  const url = `${BANKR_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers(), ...options.headers },
      signal: options.signal || controller.signal,
    });
    clearTimeout(to);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(to);
    const message = err.name === "AbortError" ? "Bankr request timeout" : (err.message || String(err));
    return { ok: false, status: 502, data: { error: message } };
  }
}

/**
 * GET /agent/balances – wallet balances across chains.
 * @param {{ chains?: string }} opts - Optional comma-separated chains: base, polygon, mainnet, unichain, solana
 * @returns {Promise<{ balances?: unknown; error?: string }>}
 */
export async function getBalances(opts = {}) {
  const path = opts.chains ? `/agent/balances?chains=${encodeURIComponent(opts.chains)}` : "/agent/balances";
  const { ok, status, data } = await fetchBankr(path, { method: "GET" });
  if (!ok) {
    return { error: data?.error || data?.message || `Bankr balances failed (${status})` };
  }
  return { balances: data };
}

/**
 * POST /agent/prompt – submit a natural language prompt (async job).
 * @param {{ prompt: string; threadId?: string }} body
 * @returns {Promise<{ jobId?: string; threadId?: string; error?: string }>}
 */
export async function submitPrompt(body) {
  const { prompt, threadId } = body || {};
  if (!prompt || typeof prompt !== "string") {
    return { error: "prompt is required" };
  }
  if (prompt.length > 10_000) {
    return { error: "Prompt too long (max 10,000 characters)" };
  }
  const payload = { prompt: prompt.trim() };
  if (threadId && typeof threadId === "string") payload.threadId = threadId.trim();
  const { ok, status, data } = await fetchBankr("/agent/prompt", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!ok) {
    return { error: data?.error || data?.message || `Bankr prompt failed (${status})` };
  }
  return {
    jobId: data?.jobId,
    threadId: data?.threadId,
    status: data?.status,
    message: data?.message,
  };
}

/**
 * GET /agent/job/:jobId – job status and result.
 * @param {string} jobId
 * @returns {Promise<{ jobId?: string; threadId?: string; status?: string; response?: string; error?: string; richData?: unknown[]; [key: string]: unknown }>}
 */
export async function getJob(jobId) {
  if (!jobId || typeof jobId !== "string") {
    return { error: "jobId is required" };
  }
  const id = jobId.trim();
  if (!id) return { error: "jobId is required" };
  const { ok, status, data } = await fetchBankr(`/agent/job/${encodeURIComponent(id)}`, { method: "GET" });
  if (!ok) {
    return { error: data?.error || data?.message || `Bankr job failed (${status})` };
  }
  return {
    jobId: data?.jobId,
    threadId: data?.threadId,
    status: data?.status,
    prompt: data?.prompt,
    response: data?.response,
    richData: data?.richData,
    error: data?.error,
    statusUpdates: data?.statusUpdates,
    createdAt: data?.createdAt,
    completedAt: data?.completedAt,
    cancelledAt: data?.cancelledAt,
    processingTime: data?.processingTime,
  };
}

/**
 * POST /agent/job/:jobId/cancel – cancel a pending/processing job.
 * @param {string} jobId
 * @returns {Promise<{ success?: boolean; status?: string; error?: string }>}
 */
export async function cancelJob(jobId) {
  if (!jobId || typeof jobId !== "string") {
    return { error: "jobId is required" };
  }
  const id = jobId.trim();
  if (!id) return { error: "jobId is required" };
  const { ok, status, data } = await fetchBankr(`/agent/job/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (!ok) {
    return { error: data?.error || data?.message || `Bankr cancel failed (${status})` };
  }
  return { success: data?.success, jobId: data?.jobId, status: data?.status };
}

export const bankrConfig = {
  configured: !!API_KEY,
  apiUrl: BANKR_API_URL,
};
