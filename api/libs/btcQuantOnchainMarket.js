/**
 * Onchain market data for BTC quant lab — cbBTC on Solana only (no CEX APIs).
 * - OHLCV: Birdeye x402 (indexed Solana DEX trades)
 * - Spot: Jupiter Price API v2 (onchain route aggregation)
 */
import { CryptoAnalysisEngine } from "../scripts/cryptoAnalysisEngine.js";
import {
  BTC_QUANT_QUOTE_MINT,
  CBBTC_MINT,
} from "../config/tradingExperimentStrategies.js";
import { callBirdeyeWithTreasury } from "./agentBirdeyeClient.js";
import { barDurationMsGeneric, lastClosedAnchorFromEngineRows } from "./experimentCandleAnchor.js";
import { fetchWithRetry } from "../utils/resilientFetch.js";

export const BTC_ONCHAIN_DATA_SOURCE = "onchain_birdeye";
export const BTC_ONCHAIN_SYMBOL = "cbBTC/USDC";

const JUPITER_API_BASE = process.env.JUPITER_API_KEY ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const JUPITER_PRICE_API = `${JUPITER_API_BASE}/price/v2`;

/** @param {string} [bar] */
export function barToBirdeyeOhlcvType(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  const map = {
    "1m": "1m",
    "3m": "3m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1H",
    "2h": "2H",
    "4h": "4H",
    "6h": "6H",
    "8h": "8H",
    "12h": "12H",
    "1d": "1D",
    "1w": "1W",
  };
  return map[b] || "1H";
}

function jupiterHeaders() {
  const headers = { Accept: "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }
  return headers;
}

/**
 * @param {unknown} body
 * @returns {unknown[]}
 */
function extractBirdeyeOhlcvItems(body) {
  if (!body || typeof body !== "object") return [];
  const o = /** @type {Record<string, unknown>} */ (body);
  const data = o.data;
  if (data && typeof data === "object") {
    const items = /** @type {Record<string, unknown>} */ (data).items;
    if (Array.isArray(items)) return items;
  }
  if (Array.isArray(o.items)) return o.items;
  return [];
}

/**
 * @param {string} bar
 * @param {number} [limit]
 */
function ohlcvTimeWindowSec(bar, limit = 200) {
  const candles = Math.min(Math.max(Number(limit) || 200, 30), 1000);
  const durMs = barDurationMsGeneric(bar);
  return Math.ceil((durMs * candles) / 1000) + 3600;
}

/**
 * @param {string} bar
 * @param {number} [limit]
 * @returns {Promise<unknown[][]>}
 */
export async function fetchCbbtcOnchainOhlcvRows(bar, limit = 200) {
  const type = barToBirdeyeOhlcvType(bar);
  const nowSec = Math.floor(Date.now() / 1000);
  const spanSec = ohlcvTimeWindowSec(bar, limit);
  const timeFrom = nowSec - spanSec;

  const result = await callBirdeyeWithTreasury("/x402/defi/ohlcv/base_quote", "GET", {
    base_address: CBBTC_MINT,
    quote_address: BTC_QUANT_QUOTE_MINT,
    type,
    time_from: String(timeFrom),
    time_to: String(nowSec),
  });

  if (!result.success) {
    throw new Error(result.error || "Birdeye onchain OHLCV failed");
  }

  const items = extractBirdeyeOhlcvItems(result.data);
  const rows = items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const c = /** @type {Record<string, unknown>} */ (item);
      const ts = Number(c.unixTime);
      const o = Number(c.o);
      const h = Number(c.h);
      const l = Number(c.l);
      const close = Number(c.c);
      const v = Number(c.v ?? c.vQuote ?? 0);
      if ([ts, o, h, l, close].some((n) => !Number.isFinite(n))) return null;
      return [ts * 1000, o, h, l, close, Number.isFinite(v) ? v : 0];
    })
    .filter(Boolean)
    .sort((a, b) => /** @type {number[]} */ (a)[0] - /** @type {number[]} */ (b)[0]);

  if (rows.length < 20) {
    throw new Error(`Onchain OHLCV: insufficient candles (${rows.length}) for ${type}`);
  }

  const maxRows = Math.min(Math.max(limit, 50), 1000);
  return rows.slice(-maxRows);
}

/**
 * cbBTC/USD spot from Jupiter Price API (onchain liquidity aggregation).
 * @returns {Promise<number | null>}
 */
export async function fetchCbbtcSpotPriceUsd() {
  try {
    const url = `${JUPITER_PRICE_API}?ids=${encodeURIComponent(CBBTC_MINT)}`;
    const res = await fetchWithRetry(url, { headers: jupiterHeaders() });
    const body = await res.json().catch(() => ({}));
    const px = Number(body?.data?.[CBBTC_MINT]?.price);
    if (Number.isFinite(px) && px > 0) return px;
  } catch {
    // optional birdeye fallback below
  }

  try {
    const result = await callBirdeyeWithTreasury("/x402/defi/price", "GET", {
      address: CBBTC_MINT,
    });
    if (result.success && result.data && typeof result.data === "object") {
      const data = /** @type {Record<string, unknown>} */ (result.data);
      const inner = data.data && typeof data.data === "object" ? data.data : data;
      const px = Number(
        /** @type {Record<string, unknown>} */ (inner).value ??
          /** @type {Record<string, unknown>} */ (inner).price,
      );
      if (Number.isFinite(px) && px > 0) return px;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * @param {{ bar?: string; limit?: number }} params
 * @returns {Promise<{ source: string; meta: Record<string, string>; report: Record<string, unknown>; anchorCloseMs: number | null; instrument: string }>}
 */
export async function buildBtcOnchainSignalReport(params = {}) {
  const bar = params.bar || "1h";
  const limit = params.limit ?? 200;
  const rows = await fetchCbbtcOnchainOhlcvRows(bar, limit);
  const instrument = BTC_ONCHAIN_SYMBOL;
  const engine = new CryptoAnalysisEngine({ data: rows }, instrument, "SOLANA_DEX");
  const report = engine.analyze();
  const anchorCloseMs = lastClosedAnchorFromEngineRows(rows, barDurationMsGeneric(bar));

  return {
    source: BTC_ONCHAIN_DATA_SOURCE,
    meta: {
      base_mint: CBBTC_MINT,
      quote_mint: BTC_QUANT_QUOTE_MINT,
      pair: instrument,
      bar,
      birdeye_type: barToBirdeyeOhlcvType(bar),
      venue: "solana_dex",
    },
    report,
    anchorCloseMs,
    instrument,
  };
}
