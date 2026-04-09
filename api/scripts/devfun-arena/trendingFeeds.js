/**
 * Trending-style feeds from public Dexscreener APIs (no key).
 * Optional Dextools hook when DEXTOOLS_API_KEY is set (best-effort).
 */

const DEX_BOOSTS = "https://api.dexscreener.com/token-boosts/latest/v1";
const DEX_PROFILES = "https://api.dexscreener.com/token-profiles/latest/v1";

/** @typedef {{ term: string; weight: number }} WeightedTerm */

/**
 * @typedef {{
 *   fetchedAt: number;
 *   solMintsBoost: Set<string>;
 *   solMintsProfile: Set<string>;
 *   solMintsAll: Set<string>;
 *   termWeights: Map<string, number>;
 *   boostRows: number;
 *   profileRows: number;
 *   dextoolsOk: boolean;
 *   error: string | null;
 * }} TrendingSnapshot
 */

const STOP = new Set([
  "the",
  "and",
  "for",
  "you",
  "that",
  "this",
  "with",
  "from",
  "are",
  "was",
  "has",
  "have",
  "will",
  "your",
  "our",
  "all",
  "not",
  "but",
  "can",
  "get",
  "new",
  "one",
  "out",
  "now",
  "just",
  "like",
  "what",
  "when",
  "who",
  "how",
  "its",
  "also",
  "after",
  "before",
  "then",
  "than",
  "into",
  "over",
  "more",
  "some",
  "any",
  "https",
  "http",
  "www",
  "com",
  "solana",
  "token",
  "coin",
  "pump",
  "fun",
]);

/**
 * @param {string} raw
 * @returns {string[]}
 */
function tokenizeCorpus(raw) {
  const s = String(raw || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9$#]+/g, " ");
  const parts = s.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  return parts;
}

/**
 * @param {unknown} row
 * @param {Map<string, number>} acc
 */
function ingestRowText(row, acc) {
  if (!row || typeof row !== "object") return;
  const r = /** @type {Record<string, unknown>} */ (row);
  const chunks = [r.description, r.title, r.symbol, r.name];
  for (const c of chunks) {
    if (typeof c !== "string") continue;
    for (const t of tokenizeCorpus(c)) {
      acc.set(t, (acc.get(t) ?? 0) + 1);
    }
  }
  const og = r.openGraph;
  if (typeof og === "string" && !og.startsWith("http")) {
    for (const t of tokenizeCorpus(og)) acc.set(t, (acc.get(t) ?? 0) + 1);
  }
}

/**
 * @param {Map<string, number>} counts
 * @returns {Map<string, number>}
 */
function countsToWeights(counts) {
  const out = new Map();
  let max = 1;
  for (const v of counts.values()) max = Math.max(max, v);
  for (const [k, v] of counts) {
    out.set(k, Math.log1p(v) / Math.log1p(max));
  }
  return out;
}

/**
 * @returns {Promise<TrendingSnapshot>}
 */
export async function fetchTrendingSnapshot() {
  /** @type {Map<string, number>} */
  const termCounts = new Map();
  const solMintsBoost = new Set();
  const solMintsProfile = new Set();
  let error = /** @type {string | null} */ (null);
  let boostRows = 0;
  let profileRows = 0;

  try {
    const [rb, rp] = await Promise.all([
      fetch(DEX_BOOSTS, { headers: { Accept: "application/json" } }),
      fetch(DEX_PROFILES, { headers: { Accept: "application/json" } }),
    ]);

    const boosts = rb.ok ? await rb.json() : [];
    const profiles = rp.ok ? await rp.json() : [];
    const bArr = Array.isArray(boosts) ? boosts : [];
    const pArr = Array.isArray(profiles) ? profiles : [];

    for (const row of bArr) {
      const ch = String(/** @type {Record<string, unknown>} */ (row).chainId ?? "").toLowerCase();
      if (ch !== "solana") continue;
      boostRows += 1;
      const a = /** @type {Record<string, unknown>} */ (row).tokenAddress;
      if (typeof a === "string") solMintsBoost.add(a.toLowerCase());
      ingestRowText(row, termCounts);
    }
    for (const row of pArr) {
      const ch = String(/** @type {Record<string, unknown>} */ (row).chainId ?? "").toLowerCase();
      if (ch !== "solana") continue;
      profileRows += 1;
      const a = /** @type {Record<string, unknown>} */ (row).tokenAddress;
      if (typeof a === "string") solMintsProfile.add(a.toLowerCase());
      ingestRowText(row, termCounts);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const solMintsAll = new Set([...solMintsBoost, ...solMintsProfile]);

  let dextoolsOk = false;
  const dtKey = (process.env.DEXTOOLS_API_KEY || "").trim();
  if (dtKey) {
    try {
      dextoolsOk = await fetchDextoolsSolanaHotMints(dtKey, solMintsAll, termCounts);
    } catch {
      dextoolsOk = false;
    }
  }

  const termWeights = countsToWeights(termCounts);

  return {
    fetchedAt: Date.now(),
    solMintsBoost,
    solMintsProfile,
    solMintsAll,
    termWeights,
    boostRows,
    profileRows,
    dextoolsOk,
    error,
  };
}

/**
 * Best-effort Dextools (plan/key varies). Mutates mint set + term counts on success.
 * @param {string} apiKey
 * @param {Set<string>} mintSet
 * @param {Map<string, number>} termCounts
 */
async function fetchDextoolsSolanaHotMints(apiKey, mintSet, termCounts) {
  const base = (process.env.DEXTOOLS_API_BASE_URL || "https://public-api.dextools.io").replace(/\/$/, "");
  const url = `${base}/trending/solana?chain=solana`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-KEY": apiKey,
    },
  });
  if (!res.ok) return false;
  const data = await res.json();
  const rows = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
  if (!Array.isArray(rows) || rows.length === 0) return false;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (row);
    const m = r.address ?? r.tokenAddress ?? r.mint;
    if (typeof m === "string") mintSet.add(m.toLowerCase());
    ingestRowText(row, termCounts);
  }
  return true;
}

/**
 * @param {TrendingSnapshot} snap
 * @returns {boolean}
 */
export function snapshotIsUsable(snap) {
  return snap.solMintsAll.size > 0 || snap.termWeights.size > 3;
}
