/**
 * Aggregate on-chain / registry signals for AI & utility projects (partnership scout input).
 * Each source is best-effort; failures are logged and omitted.
 */

import pLimit from "p-limit";
import { fetchTrendingJupiter } from "./analyticsFetchers.js";
import { run8004Leaderboard, run8004AgentsSearch } from "./8004ReadApi.js";
import { searchAgents as search8004scanAgents, getStats as get8004scanStats } from "./8004scanClient.js";
import { fetchCatalog as fetchPayshCatalog } from "./payshClient.js";
import { PARTNERSHIP_SCOUT_MAX_CANDIDATES } from "../config/syraPartnershipScoutConfig.js";

const REGISTRATION_FETCH_LIMIT = pLimit(6);

const SYRA_LINK_HOSTS = new Set([
  "syraa.fun",
  "api.syraa.fun",
  "agent.syraa.fun",
  "docs.syraa.fun",
  "playground.syraa.fun",
  "dashboard.syraa.fun",
]);

/**
 * @typedef {{
 *   id: string;
 *   name: string;
 *   source: string;
 *   category: string;
 *   utility: string;
 *   signals: string[];
 *   score?: number | null;
 *   link?: string | null;
 *   handle?: string | null;
 * }} PartnershipCandidate
 */

/**
 * @param {unknown} err
 * @returns {string}
 */
function errMsg(err) {
  return err instanceof Error ? err.message : String(err);
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isSyraOwnedUrl(url) {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, "");
    return SYRA_LINK_HOSTS.has(host);
  } catch {
    return false;
  }
}

/**
 * @param {unknown[]} values
 * @returns {string | null}
 */
function pickExternalHttpUrl(...values) {
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (!s.startsWith("http://") && !s.startsWith("https://")) continue;
    if (isSyraOwnedUrl(s)) continue;
    return s.slice(0, 200);
  }
  return null;
}

/**
 * @param {unknown} json
 * @returns {string | null}
 */
function extractProjectLinkFromRegistrationJson(json) {
  if (!json || typeof json !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (json);
  const services = Array.isArray(o.services) ? o.services : [];
  for (const service of services) {
    if (!service || typeof service !== "object") continue;
    const url = pickExternalHttpUrl(/** @type {Record<string, unknown>} */ (service).value);
    if (url) return url;
  }
  return pickExternalHttpUrl(o.external_url, o.website, o.homepage, o.url);
}

/**
 * @param {string} uri
 * @returns {Promise<{ name?: string; description?: string; link?: string | null } | null>}
 */
async function fetchRegistrationFields(uri) {
  if (!uri || typeof uri !== "string") return null;
  try {
    const trimmed = String(uri).trim();
    const gateway = (process.env.IPFS_GATEWAY && String(process.env.IPFS_GATEWAY).trim())
      ? String(process.env.IPFS_GATEWAY).trim().replace(/\/$/, "")
      : "https://ipfs.io";
    let url = trimmed;
    if (trimmed.startsWith("ipfs://")) {
      const cid = trimmed.slice(7).replace(/^\/+/, "");
      url = `${gateway}/ipfs/${cid}`;
    } else if (trimmed.startsWith("/ipfs/")) {
      url = `${gateway}${trimmed}`;
    }
    if (!url.startsWith("http")) return null;
    const timeoutMs = Number(process.env.IPFS_GATEWAY_TIMEOUT_MS) || 10000;
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || typeof json !== "object") return null;
    return {
      name: typeof json.name === "string" ? json.name.trim() : undefined,
      description: typeof json.description === "string" ? json.description.trim() : undefined,
      link: extractProjectLinkFromRegistrationJson(json),
    };
  } catch {
    return null;
  }
}

/**
 * @param {unknown} agentId
 * @returns {string | null}
 */
function solana8004MarketLink(agentId) {
  const id = String(agentId ?? "").trim();
  if (!id) return null;
  return `https://8004market.io/agent/solana/mainnet-beta/${encodeURIComponent(id)}`;
}

/**
 * @param {unknown} chainId
 * @param {unknown} tokenId
 * @returns {string | null}
 */
function erc8004scanAgentLink(chainId, tokenId) {
  if (chainId == null || tokenId == null) return null;
  return `https://www.8004scan.io/agents/${chainId}/${tokenId}`;
}

/**
 * @param {Record<string, unknown>} x
 * @returns {Promise<string | null>}
 */
async function resolveSolana8004AgentLink(x) {
  const services = Array.isArray(x.services) ? x.services : [];
  for (const service of services) {
    if (!service || typeof service !== "object") continue;
    const url = pickExternalHttpUrl(/** @type {Record<string, unknown>} */ (service).value);
    if (url) return url;
  }

  const inline = pickExternalHttpUrl(x.external_url, x.website, x.homepage, x.url);
  if (inline) return inline;

  const agentUri = typeof x.agent_uri === "string" ? x.agent_uri.trim() : null;
  if (agentUri) {
    const reg = await REGISTRATION_FETCH_LIMIT(() => fetchRegistrationFields(agentUri));
    if (reg?.link) return reg.link;
    if (agentUri.startsWith("http") && !isSyraOwnedUrl(agentUri)) return agentUri.slice(0, 200);
  }

  return solana8004MarketLink(x.agent_id);
}

/**
 * @param {unknown} body
 * @returns {unknown[]}
 */
function asArray(body) {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const o = /** @type {Record<string, unknown>} */ (body);
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.agents)) return o.agents;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.results)) return o.results;
    if (o.data && typeof o.data === "object") {
      const d = /** @type {Record<string, unknown>} */ (o.data);
      if (Array.isArray(d.agents)) return d.agents;
      if (Array.isArray(d.items)) return d.items;
    }
  }
  return [];
}

/**
 * @param {PartnershipCandidate} c
 * @param {Map<string, PartnershipCandidate>} byId
 */
function addCandidate(c, byId) {
  const id = String(c.id || "").trim();
  if (!id || !c.name) return;
  const prev = byId.get(id);
  if (!prev) {
    byId.set(id, c);
    return;
  }
  byId.set(id, {
    ...prev,
    signals: [...new Set([...(prev.signals || []), ...(c.signals || [])])].slice(0, 8),
    utility: c.utility || prev.utility,
    score: c.score ?? prev.score,
    link: c.link || prev.link,
    name: prev.name.length < c.name.length ? c.name : prev.name,
  });
}

/**
 * @returns {Promise<PartnershipCandidate[]>}
 */
async function collect8004Solana() {
  const [leaderboard, search] = await Promise.all([
    run8004Leaderboard({ limit: 25 }),
    run8004AgentsSearch({ limit: 25 }),
  ]);
  /** @type {PartnershipCandidate[]} */
  const out = [];
  const lists = [
    { raw: leaderboard, source: "8004-leaderboard" },
    { raw: search?.agents ?? search, source: "8004-search" },
  ];
  /** @type {{ raw: Record<string, unknown>; source: string }[]} */
  const pending = [];
  for (const { raw, source } of lists) {
    for (const a of asArray(raw)) {
      if (!a || typeof a !== "object") continue;
      const x = /** @type {Record<string, unknown>} */ (a);
      const asset = String(x.asset || x.pubkey || "").trim();
      if (!asset && !x.nft_name && !x.name) continue;
      pending.push({ raw: x, source });
    }
  }

  const enriched = await Promise.all(
    pending.map(async ({ raw: x, source }) => {
      const asset = String(x.asset || x.pubkey || "").trim();
      const agentUri = typeof x.agent_uri === "string" ? x.agent_uri.trim() : null;
      const reg = agentUri
        ? await REGISTRATION_FETCH_LIMIT(() => fetchRegistrationFields(agentUri))
        : null;

      const name =
        String(reg?.name || x.nft_name || x.name || "").trim().slice(0, 120) ||
        (asset ? asset.slice(0, 12) : "");
      if (!name && !asset) return null;

      const tier = x.tier != null ? String(x.tier) : "";
      const score =
        typeof x.score === "number" ? x.score : typeof x.reputation === "number" ? x.reputation : null;
      const link = await resolveSolana8004AgentLink(x);

      return {
        id: asset ? `8004:${asset}` : `8004:${name.toLowerCase().slice(0, 32)}`,
        name: name || asset,
        source,
        category: "8004-agent-registry",
        utility: String(reg?.description || x.description || "Solana ERC-8004 registered agent").slice(0, 400),
        signals: [tier ? `tier:${tier}` : "", asset ? `asset:${asset.slice(0, 16)}…` : ""].filter(Boolean),
        score,
        link,
      };
    }),
  );

  for (const candidate of enriched) {
    if (candidate) out.push(candidate);
  }
  return out;
}

/**
 * @param {string} q
 * @returns {Promise<PartnershipCandidate[]>}
 */
async function collect8004scanSearch(q) {
  const body = await search8004scanAgents({ q, limit: 15 });
  /** @type {PartnershipCandidate[]} */
  const out = [];
  for (const a of asArray(body)) {
    if (!a || typeof a !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (a);
    const chainId = x.chainId ?? x.chain_id;
    const tokenId = x.tokenId ?? x.token_id;
    const name = String(x.name || x.agentName || x.title || "").trim().slice(0, 120);
    if (!name) continue;
    const id =
      chainId != null && tokenId != null
        ? `8004scan:${chainId}:${tokenId}`
        : `8004scan:${name.toLowerCase().replace(/\s+/g, "-")}`;
    const scanLink =
      pickExternalHttpUrl(x.endpoint, x.url, x.website, x.service_url) ??
      erc8004scanAgentLink(chainId, tokenId);
    out.push({
      id,
      name,
      source: "8004scan-search",
      category: "cross-chain-agent",
      utility: String(x.description || x.bio || `Registry agent matching "${q}"`).slice(0, 400),
      signals: [
        x.protocol ? `protocol:${String(x.protocol)}` : "",
        chainId != null ? `chain:${chainId}` : "",
      ].filter(Boolean),
      score: typeof x.feedbackScore === "number" ? x.feedbackScore : null,
      link: scanLink,
    });
  }
  return out;
}

/**
 * @returns {Promise<PartnershipCandidate[]>}
 */
async function collectJupiterTrending() {
  const data = await fetchTrendingJupiter();
  const mints = Array.isArray(data.contractAddresses) ? data.contractAddresses : [];
  const summaries = Array.isArray(data.tokenSummary) ? data.tokenSummary : [];
  const news = Array.isArray(data.newsSummary) ? data.newsSummary : [];
  /** @type {PartnershipCandidate[]} */
  const out = [];
  const n = Math.min(mints.length, summaries.length, 20);
  for (let i = 0; i < n; i++) {
    const mint = String(mints[i] || "").trim();
    const summary = String(summaries[i] || news[i] || "").trim();
    if (!mint) continue;
    const blob = summary.toLowerCase();
    const aiish =
      /\b(ai|agent|bot|x402|api|oracle|data|trading|defi|llm|autonom)\b/.test(blob) || blob.length > 40;
    if (!aiish && i > 12) continue;
    out.push({
      id: `jupiter:${mint}`,
      name: summary.slice(0, 80) || mint.slice(0, 12),
      source: "jupiter-trending",
      category: "solana-token-utility",
      utility: summary.slice(0, 400) || "Jupiter trending token",
      signals: ["jupiter:cooking", `mint:${mint.slice(0, 12)}…`],
      link: `https://jup.ag/tokens/${mint}`,
    });
  }
  return out;
}

const PAYSH_AI_RE = /\b(ai|agent|llm|trading|data|search|oracle|sentiment|news|x402|api|defi|analytics)\b/i;

/**
 * @returns {Promise<PartnershipCandidate[]>}
 */
async function collectPayshProviders() {
  const catalog = await fetchPayshCatalog();
  const providers = Array.isArray(catalog.providers) ? catalog.providers : [];
  /** @type {PartnershipCandidate[]} */
  const out = [];
  for (const p of providers) {
    if (!p || typeof p !== "object") continue;
    const fqn = String(p.fqn || "").trim();
    const title = String(p.title || fqn).trim();
    const blob = `${p.description || ""} ${p.use_case || ""} ${p.category || ""}`;
    if (!PAYSH_AI_RE.test(blob)) continue;
    out.push({
      id: `paysh:${fqn}`,
      name: title,
      source: "paysh-catalog",
      category: String(p.category || "x402-skill"),
      utility: String(p.use_case || p.description || "pay.sh x402 API provider").slice(0, 400),
      signals: [
        p.has_metering ? "metered-x402" : "",
        typeof p.min_price_usd === "number" ? `from-$${p.min_price_usd}` : "",
        `${p.endpoint_count ?? 0} endpoints`,
      ].filter(Boolean),
      link: String(p.service_url || "https://pay.sh").slice(0, 200),
    });
  }
  return out.slice(0, 20);
}

/**
 * @returns {Promise<{
 *   candidates: PartnershipCandidate[];
 *   sourceStats: Record<string, number>;
 *   ecosystemNotes: string[];
 * }>}
 */
export async function collectOnchainPartnershipSignals() {
  /** @type {Map<string, PartnershipCandidate>} */
  const byId = new Map();
  /** @type {Record<string, number>} */
  const sourceStats = {};
  /** @type {string[]} */
  const ecosystemNotes = [];

  const tasks = [
    { key: "solana8004", fn: collect8004Solana },
    { key: "scanAi", fn: () => collect8004scanSearch("AI agent trading") },
    { key: "scanX402", fn: () => collect8004scanSearch("x402 micropayments") },
    { key: "jupiter", fn: collectJupiterTrending },
    { key: "paysh", fn: collectPayshProviders },
  ];

  await Promise.all(
    tasks.map(async ({ key, fn }) => {
      try {
        const list = await fn();
        sourceStats[key] = list.length;
        for (const c of list) addCandidate(c, byId);
      } catch (e) {
        sourceStats[key] = 0;
        console.warn(`[partnership-scout] source ${key} failed:`, errMsg(e));
      }
    }),
  );

  try {
    const statsBody = await get8004scanStats();
    const total =
      statsBody?.data && typeof statsBody.data === "object"
        ? /** @type {Record<string, unknown>} */ (statsBody.data).totalAgents
        : null;
    if (total != null) ecosystemNotes.push(`8004scan registry: ~${total} agents indexed`);
  } catch {
    /* optional */
  }

  const candidates = [...byId.values()]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, PARTNERSHIP_SCOUT_MAX_CANDIDATES);

  return { candidates, sourceStats, ecosystemNotes };
}
