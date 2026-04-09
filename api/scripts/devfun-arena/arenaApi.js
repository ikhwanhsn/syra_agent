/** @typedef {import('./credentials.js').ArenaCredentials} ArenaCredentials */

const ARENA_BASE = "https://arena.dev.fun/api/arena";

/** Normalize Arena or Dex timestamps (seconds vs ms) to epoch ms. */
export function toEpochMs(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1e12) return Math.round(n * 1000);
  return Math.round(n);
}

/** Only exclude known terminal states; missing/unknown status still allowed to try submit. */
export function isExplicitlyClosedStatus(status) {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  return ["closed", "settled", "resolved", "expired", "failed", "cancelled", "canceled"].includes(s);
}

/**
 * @param {string} apiKey
 * @param {string} path
 * @param {RequestInit} [init]
 */
async function arenaFetch(apiKey, path, init = {}) {
  const url = `${ARENA_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "x-arena-api-key": apiKey,
    ...(init.headers && typeof init.headers === "object" ? init.headers : {}),
  };
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { _raw: text };
  }
  if (!res.ok) {
    const msg = body?.error || body?.message || text || res.statusText;
    throw new Error(`Arena ${init.method || "GET"} ${path}: ${res.status} ${msg}`);
  }
  return body;
}

/**
 * @param {string} apiKey
 */
export async function listActiveCompetitions(apiKey) {
  return arenaFetch(apiKey, "/competition/list-active");
}

/**
 * @param {string} apiKey
 * @param {string} competitionId
 */
export async function listCurrentChallenges(apiKey, competitionId) {
  const q = new URLSearchParams({ competitionId });
  return arenaFetch(apiKey, `/challenge/current?${q}`);
}

/**
 * @param {string} apiKey
 * @param {number} [limit] max 100 per Arena API
 * @param {string} [competitionId] optional filter
 * @param {number} [offset]
 */
export async function listSubmissions(apiKey, limit = 100, competitionId, offset = 0) {
  const cap = Math.min(100, Math.max(1, Math.floor(limit)));
  const q = new URLSearchParams({
    limit: String(cap),
    offset: String(Math.max(0, Math.floor(offset))),
  });
  if (competitionId) q.set("competitionId", competitionId);
  return arenaFetch(apiKey, `/agent/submissions?${q}`);
}

/**
 * Paginate until a short page or max pages (100 IDs per page).
 * @param {string} apiKey
 * @param {string} competitionId
 * @param {number} [maxPages]
 * @returns {Promise<Set<string>>}
 */
export async function fetchAllSubmittedChallengeIds(apiKey, competitionId, maxPages = 20) {
  const ids = new Set();
  for (let page = 0; page < maxPages; page++) {
    const body = await listSubmissions(apiKey, 100, competitionId, page * 100);
    const rows = body?.data;
    if (!Array.isArray(rows) || rows.length === 0) break;
    for (const row of rows) {
      const cid = row?.challenge?.id ?? row?.challengeId;
      if (typeof cid === "string") ids.add(cid);
    }
    if (rows.length < 100) break;
  }
  return ids;
}

/**
 * @param {string} apiKey
 * @param {string} challengeId
 * @param {Record<string, unknown>} body
 */
export async function submitPumpOrDump(apiKey, challengeId, body) {
  return arenaFetch(apiKey, `/challenge/${challengeId}/submit-pump-or-dump`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * @param {unknown} listActiveResponse
 * @returns {{ id: string; name?: string; gameType?: string } | null}
 */
export function pickFirstActiveCompetition(listActiveResponse) {
  const raw = listActiveResponse?.value ?? listActiveResponse?.data ?? listActiveResponse;
  const arr = Array.isArray(raw) ? raw : [];
  const first = arr[0];
  if (first && typeof first.id === "string") {
    return { id: first.id, name: first.name, gameType: first.gameType };
  }
  return null;
}

/**
 * @param {unknown} currentResponse
 * @returns {Array<{
 *   id: string;
 *   status: string;
 *   submissionDeadline: number;
 *   releasedAt: number;
 *   uniqueId?: string;
 *   data?: { contractAddress?: string; mint?: string; tokenName?: string; tokenSymbol?: string; priceAtRelease?: number };
 * }>}
 */
export function normalizeChallenges(currentResponse) {
  const raw = currentResponse?.value ?? currentResponse?.data ?? currentResponse;
  if (!Array.isArray(raw)) return [];
  return raw.filter((c) => c && typeof c.id === "string");
}
