/**
 * Client for 8004scan.io Public API (ERC-8004 agent data).
 * Uses EIGHTYFOUR_SCAN_API_KEY in X-API-Key header for higher rate limits.
 * @see https://www.8004scan.io/api/v1/public/docs/openapi.json
 */

const BASE_URL = "https://www.8004scan.io/api/v1/public";
const DEFAULT_TIMEOUT_MS = 15_000;

function getApiKey() {
  return (process.env["EIGHTYFOUR_SCAN_API_KEY"] || "").trim();
}

/**
 * @param {string} path - Path without leading slash (e.g. "agents", "stats")
 * @param {Record<string, string | number | boolean | undefined>} [query]
 * @returns {Promise<{ success: boolean; data: unknown; meta?: object }>}
 */
async function request(path, query = {}) {
  const url = new URL(path.startsWith("http") ? path : `${BASE_URL}/${path.replace(/^\//, "")}`);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  const headers = { Accept: "application/json" };
  const apiKey = getApiKey();
  if (apiKey) headers["X-API-Key"] = apiKey;

  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error?.message || body?.message || `8004scan API error: ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

/**
 * List agents (paginated, optional filters).
 * @param {object} [opts] - page, limit, chainId, ownerAddress, search, protocol, sortBy, sortOrder, isTestnet
 */
export async function listAgents(opts = {}) {
  return request("agents", {
    page: opts.page,
    limit: opts.limit,
    chainId: opts.chainId,
    ownerAddress: opts.ownerAddress,
    search: opts.search,
    protocol: opts.protocol,
    sortBy: opts.sortBy,
    sortOrder: opts.sortOrder,
    isTestnet: opts.isTestnet,
  });
}

/**
 * Get agent by chain ID and token ID.
 * @param {number} chainId
 * @param {number} tokenId
 */
export async function getAgent(chainId, tokenId) {
  return request(`agents/${chainId}/${tokenId}`);
}

/**
 * Semantic search for agents.
 * @param {object} opts - q (required), limit, chainId, semanticWeight
 */
export async function searchAgents(opts) {
  if (!opts?.q) throw new Error("searchAgents requires q (search query)");
  return request("agents/search", {
    q: opts.q,
    limit: opts.limit,
    chainId: opts.chainId,
    semanticWeight: opts.semanticWeight,
  });
}

/**
 * Get agents by owner address (EVM 0x...).
 * @param {string} address - Ethereum address
 * @param {object} [opts] - page, limit, sortBy, sortOrder
 */
export async function getAgentsByOwner(address, opts = {}) {
  if (!address || typeof address !== "string") throw new Error("address is required");
  return request(`accounts/${encodeURIComponent(address)}/agents`, {
    page: opts.page,
    limit: opts.limit,
    sortBy: opts.sortBy,
    sortOrder: opts.sortOrder,
  });
}

/**
 * Platform statistics (total agents, users, feedbacks, validations).
 */
export async function getStats() {
  return request("stats");
}

/**
 * List feedbacks (paginated, optional filters).
 * @param {object} [opts] - page, limit, chainId, tokenId, minScore, maxScore
 */
export async function listFeedbacks(opts = {}) {
  return request("feedbacks", {
    page: opts.page,
    limit: opts.limit,
    chainId: opts.chainId,
    tokenId: opts.tokenId,
    minScore: opts.minScore,
    maxScore: opts.maxScore,
  });
}

/**
 * List supported chains.
 */
export async function listChains() {
  return request("chains");
}
