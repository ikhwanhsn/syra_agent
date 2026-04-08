import { getDexscreenerTokenInfo } from "../getDexscreenerTokenInfo.js";

const RUGCHECK_REPORT = "https://api.rugcheck.xyz/v1/tokens";

/**
 * Prefer pump.fun on Solana, then highest USD liquidity.
 * @param {unknown} dexJson
 */
export function pickBestPair(dexJson) {
  const pairs = Array.isArray(dexJson?.pairs) ? dexJson.pairs : [];
  const sol = pairs.filter((p) => p?.chainId === "solana");
  const ranked = [...sol].sort((a, b) => {
    const pa = String(a?.dexId || "").toLowerCase() === "pump.fun" ? 1 : 0;
    const pb = String(b?.dexId || "").toLowerCase() === "pump.fun" ? 1 : 0;
    if (pa !== pb) return pb - pa;
    const la = Number(a?.liquidity?.usd) || 0;
    const lb = Number(b?.liquidity?.usd) || 0;
    return lb - la;
  });
  return ranked[0] ?? null;
}

/**
 * @param {string} mint
 * @returns {Promise<unknown | null>}
 */
export async function fetchRugcheckReport(mint) {
  const url = `${RUGCHECK_REPORT}/${encodeURIComponent(mint)}/report`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * @param {string} mint
 */
export async function fetchDexscreenerForMint(mint) {
  return getDexscreenerTokenInfo(mint);
}

/**
 * Rugcheck: higher numeric score usually means more risk flags (treat as dump bias).
 * @param {unknown} report
 */
export function rugcheckDumpBias(report) {
  if (!report || typeof report !== "object") return 0;
  const r = /** @type {Record<string, unknown>} */ (report);
  const score = Number(r.score ?? r.rugScore ?? r.totalScore);
  let t = 0;
  if (Number.isFinite(score)) {
    t = Math.min(1, Math.max(0, (score - 2) / 18));
  }
  const risks = r.risks ?? r.Risks;
  const riskCount = Array.isArray(risks) ? risks.length : 0;
  const riskBump = Math.min(1, riskCount / 16) * 0.32;
  const combined = Math.min(1, t + riskBump);
  return -0.26 * combined;
}

/**
 * Dex momentum aligned with S2 horizon emphasis (2h/6h heavier than 24h in arena rules).
 * @param {unknown} pair
 */
export function dexMomentumScore(pair) {
  if (!pair || typeof pair !== "object") return 0;
  const p = /** @type {Record<string, unknown>} */ (pair);
  const pc = p.priceChange && typeof p.priceChange === "object" ? p.priceChange : {};
  const ch = /** @type {Record<string, unknown>} */ (pc);
  const h1 = Number(ch.h1) || 0;
  const h6 = Number(ch.h6) || 0;
  const h24 = Number(ch.h24) || 0;
  // Slightly 6h-heavy to align with Arena S2 horizon weights.
  const blended = 0.2 * h1 + 0.55 * h6 + 0.25 * h24;
  return Math.tanh(blended / 25);
}

/**
 * Buy pressure from recent txns (h1).
 * @param {unknown} pair
 */
export function dexBuyPressure(pair) {
  if (!pair || typeof pair !== "object") return 0;
  const p = /** @type {Record<string, unknown>} */ (pair);
  const tx = p.txns && typeof p.txns === "object" ? p.txns : {};
  const h1 = /** @type {Record<string, unknown>} */ (tx).h1;
  if (!h1 || typeof h1 !== "object") return 0;
  const t = /** @type {Record<string, unknown>} */ (h1);
  const buys = Number(t.buys) || 0;
  const sells = Number(t.sells) || 0;
  const sum = buys + sells;
  if (sum < 2) return 0;
  const ratio = buys / sum;
  return (ratio - 0.5) * 2;
}

/**
 * Low liquidity → shrink confidence.
 * @param {unknown} pair
 */
export function liquidityUsd(pair) {
  if (!pair || typeof pair !== "object") return 0;
  const p = /** @type {Record<string, unknown>} */ (pair);
  const liq = p.liquidity && typeof p.liquidity === "object" ? p.liquidity : {};
  return Number(/** @type {Record<string, unknown>} */ (liq).usd) || 0;
}

/**
 * Short-horizon volume vs longer horizon: positive = activity front-loaded (often continuation).
 * @param {unknown} pair
 */
export function volumeTrendScore(pair) {
  if (!pair || typeof pair !== "object") return 0;
  const p = /** @type {Record<string, unknown>} */ (pair);
  const vol = p.volume && typeof p.volume === "object" ? p.volume : {};
  const v = /** @type {Record<string, unknown>} */ (vol);
  const h1 = Number(v.h1) || 0;
  const h6 = Number(v.h6) || 0;
  if (h1 < 1 && h6 < 1) return 0;
  const perHourLong = h6 > 0 ? h6 / 6 : h1;
  if (perHourLong < 1) return 0;
  const rel = (h1 - perHourLong) / (perHourLong + 1);
  return Math.tanh(rel * 1.5);
}

/**
 * Minutes since pair creation (Dexscreener). Very new = noisier path.
 * @param {unknown} pair
 */
export function pairAgeMinutes(pair) {
  if (!pair || typeof pair !== "object") return null;
  const p = /** @type {Record<string, unknown>} */ (pair);
  const created = Number(p.pairCreatedAt);
  if (!Number.isFinite(created) || created <= 0) return null;
  const ms = created > 1e12 ? created : created * 1000;
  return Math.max(0, (Date.now() - ms) / 60_000);
}
