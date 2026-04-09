/**
 * Meta alignment: same name / shared keywords vs Dexscreener trending corpus.
 */

/**
 * @typedef {import('./trendingFeeds.js').TrendingSnapshot} TrendingSnapshot
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
  "new",
  "coin",
  "token",
  "sol",
  "solana",
  "pump",
  "fun",
]);

/**
 * @param {string} raw
 * @returns {string[]}
 */
export function tokenizeTarget(raw) {
  const s = String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9$#]+/g, " ");
  return [...new Set(s.split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)))];
}

/**
 * @param {string} mint
 * @param {TrendingSnapshot} snap
 * @returns {{ inBoost: boolean; inProfile: boolean; inAny: boolean }}
 */
export function mintTrendingStatus(mint, snap) {
  const m = String(mint || "").toLowerCase();
  return {
    inBoost: snap.solMintsBoost.has(m),
    inProfile: snap.solMintsProfile.has(m),
    inAny: snap.solMintsAll.has(m),
  };
}

/**
 * Overlap of challenge name/symbol tokens with trending term weights → roughly -1..1.
 * Strong positive = shares hot meta (ai agent, narrative themes, etc.).
 *
 * @param {string} tokenName
 * @param {string} tokenSymbol
 * @param {TrendingSnapshot} snap
 */
export function computeMetaTrendScore(tokenName, tokenSymbol, snap) {
  const terms = [
    ...tokenizeTarget(tokenName),
    ...tokenizeTarget(tokenSymbol.replace(/^\$+/, "")),
  ];
  if (terms.length === 0) return 0;

  let sum = 0;
  let hit = 0;
  for (const t of terms) {
    const w = snap.termWeights.get(t);
    if (w != null && w > 0) {
      sum += w;
      hit += 1;
    }
  }

  const density = hit / terms.length;
  const mag = Math.tanh((sum / Math.max(1, terms.length)) * 2.2 + density * 0.85);
  return Math.max(-1, Math.min(1, mag));
}
