/**
 * Dynamic x402 USD for GET /pumpfun/coin/:mint and GET /pumpfun/coin?mint=…
 *
 * Fetches pump `coins-v2` once (cached) to read `usd_market_cap`, then:
 *   totalUsd = baseReadUsd + min((usd_market_cap / 1_000_000) * PUMPFUN_COIN_READ_FEE_USD_PER_MCAP_MILLION, cap)
 *
 * If the metadata fetch fails, returns base only (no surcharge).
 *
 * Env:
 *   PUMPFUN_COIN_READ_FEE_USD_PER_MCAP_MILLION — extra USD per $1M of reported usd_market_cap (default "0.002")
 *   PUMPFUN_COIN_READ_MARKET_CAP_FEE_CAP_USD — max extra USD from market-cap tier (default "3")
 *   PUMPFUN_COIN_PRICE_CACHE_MS — cache TTL ms (default "90000")
 */
import { X402_API_PRICE_PUMP_FUN_READ_USD } from "../../../config/x402Pricing.js";

const FRONTEND_API_BASE = (process.env.PUMP_FUN_FRONTEND_API_URL || "https://frontend-api-v3.pump.fun").replace(
  /\/$/,
  ""
);

/** @type {Map<string, { expiry: number; mcap: number }>} */
const mcapCache = new Map();
const MAX_CACHE = 800;

function cachePrune() {
  if (mcapCache.size <= MAX_CACHE) return;
  const now = Date.now();
  for (const [k, v] of mcapCache) {
    if (v.expiry < now) mcapCache.delete(k);
  }
  if (mcapCache.size <= MAX_CACHE) return;
  const keys = [...mcapCache.keys()].slice(0, mcapCache.size - MAX_CACHE);
  keys.forEach((k) => mcapCache.delete(k));
}

function parseUsdMarketCap(data) {
  if (!data || typeof data !== "object") return NaN;
  const raw = /** @type {{ usd_market_cap?: unknown }} */ (data).usd_market_cap;
  if (raw == null) return NaN;
  if (typeof raw === "number") return raw;
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * @param {string} mint
 * @returns {Promise<number>}
 */
async function fetchUsdMarketCapUncached(mint) {
  const url = `${FRONTEND_API_BASE}/coins-v2/${encodeURIComponent(mint)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) return NaN;
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NaN;
    }
    return parseUsdMarketCap(data);
  } catch {
    return NaN;
  } finally {
    clearTimeout(t);
  }
}

/**
 * @param {string} mint
 * @returns {Promise<number>}
 */
async function getCachedUsdMarketCap(mint) {
  const ttl = Math.max(10_000, parseInt(process.env.PUMPFUN_COIN_PRICE_CACHE_MS || "90000", 10) || 90_000);
  const hit = mcapCache.get(mint);
  const now = Date.now();
  if (hit && hit.expiry > now) return hit.mcap;

  const mcap = await fetchUsdMarketCapUncached(mint);
  if (Number.isFinite(mcap) && mcap >= 0) {
    mcapCache.set(mint, { expiry: now + ttl, mcap });
    cachePrune();
  }
  return mcap;
}

/**
 * @param {import("express").Request} req
 * @returns {string}
 */
export function getPumpfunCoinMintFromReq(req) {
  const fromPath = req.params && typeof req.params.mint === "string" ? req.params.mint.trim() : "";
  const q = req.query && typeof req.query.mint === "string" ? req.query.mint.trim() : "";
  return fromPath || q || "";
}

/**
 * @param {import("express").Request} req
 * @returns {Promise<number>}
 */
export async function getPumpfunCoinReadPriceUsd(req) {
  const base = Number(X402_API_PRICE_PUMP_FUN_READ_USD);
  const baseUsd = Number.isFinite(base) && base >= 0 ? base : 0;

  const mint = getPumpfunCoinMintFromReq(req);
  if (!mint) return baseUsd;

  const perM = parseFloat(process.env.PUMPFUN_COIN_READ_FEE_USD_PER_MCAP_MILLION || "0.002");
  const cap = parseFloat(process.env.PUMPFUN_COIN_READ_MARKET_CAP_FEE_CAP_USD || "3");
  const perMN = Number.isFinite(perM) && perM >= 0 ? perM : 0;
  const capN = Number.isFinite(cap) && cap >= 0 ? cap : 0;

  const mcap = await getCachedUsdMarketCap(mint);
  if (!Number.isFinite(mcap) || mcap <= 0) return baseUsd;

  const extra = Math.min((mcap / 1_000_000) * perMN, capN);
  return baseUsd + extra;
}
