/**
 * Market data for BTC quant experiments (btc1/btc2/btc3) — free public APIs only.
 * - OHLCV: Binance BTCUSDT spot klines
 * - Spot: Jupiter Price API v2 (cbBTC, free lite tier) → Binance BTCUSDT fallback
 */
import { CryptoAnalysisEngine } from "../scripts/cryptoAnalysisEngine.js";
import {
  BTC_QUANT_QUOTE_MINT,
  CBBTC_MINT,
} from "../config/tradingExperimentStrategies.js";
import { fetchBinanceKlinesJson } from "./binanceSignalAnalysis.js";
import { fetchBinanceSpotPublic } from "./binanceSpotClient.js";
import { barDurationMsGeneric, lastClosedAnchorFromEngineRows } from "./experimentCandleAnchor.js";
import { fetchWithRetry } from "../utils/resilientFetch.js";

/** Stored on experiment runs as market feed key (legacy docs may say onchain_birdeye). */
export const BTC_ONCHAIN_DATA_SOURCE = "binance_spot";
export const BTC_ONCHAIN_SYMBOL = "BTC/USDT";

const JUPITER_API_BASE = process.env.JUPITER_API_KEY ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const JUPITER_PRICE_API = `${JUPITER_API_BASE}/price/v2`;

function jupiterHeaders() {
  const headers = { Accept: "application/json" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }
  return headers;
}

function sliceOhlcvRows(rows, limit) {
  const maxRows = Math.min(Math.max(limit, 50), 1000);
  return rows.slice(-maxRows);
}

/**
 * @param {unknown[]} k
 * @returns {number[] | null}
 */
function binanceKlineToOhlcvRow(k) {
  if (!Array.isArray(k) || k.length < 6) return null;
  const ts = Number(k[0]);
  const o = Number(k[1]);
  const h = Number(k[2]);
  const l = Number(k[3]);
  const c = Number(k[4]);
  const v = Number(k[5]);
  if ([ts, o, h, l, c].some((n) => !Number.isFinite(n))) return null;
  return [ts, o, h, l, c, Number.isFinite(v) ? v : 0];
}

/**
 * @param {string} bar
 * @param {number} limit
 * @returns {Promise<number[][]>}
 */
async function fetchBinanceBtcOhlcvRows(bar, limit = 200) {
  const raw = await fetchBinanceKlinesJson("BTCUSDT", { bar, limit });
  const rows = raw
    .map(binanceKlineToOhlcvRow)
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0]);
  if (rows.length < 20) {
    throw new Error(`Binance OHLCV: insufficient candles (${rows.length}) for ${bar}`);
  }
  return rows;
}

/**
 * @param {string} bar
 * @param {number} [limit]
 * @returns {Promise<number[][]>}
 */
export async function fetchCbbtcOnchainOhlcvRows(bar, limit = 200) {
  const rows = await fetchBinanceBtcOhlcvRows(bar, limit);
  return sliceOhlcvRows(rows, limit);
}

/**
 * @returns {Promise<number | null>}
 */
async function fetchBinanceBtcSpotPriceUsd() {
  try {
    const data = await fetchBinanceSpotPublic("ticker/price", { symbol: "BTCUSDT" });
    const px = Number(data?.price);
    if (Number.isFinite(px) && px > 0) return px;
  } catch {
    // ignore
  }
  return null;
}

/**
 * cbBTC/USD spot from Jupiter Price API; Binance BTCUSDT when Jupiter is unavailable.
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
    // Binance fallback below
  }

  return fetchBinanceBtcSpotPriceUsd();
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
  const engine = new CryptoAnalysisEngine({ data: rows }, instrument, "BINANCE_SPOT");
  const report = engine.analyze();
  const anchorCloseMs = lastClosedAnchorFromEngineRows(rows, barDurationMsGeneric(bar));

  return {
    source: BTC_ONCHAIN_DATA_SOURCE,
    meta: {
      base_mint: CBBTC_MINT,
      quote_mint: BTC_QUANT_QUOTE_MINT,
      pair: instrument,
      bar,
      interval: bar,
      venue: "binance_spot",
    },
    report,
    anchorCloseMs,
    instrument,
  };
}
