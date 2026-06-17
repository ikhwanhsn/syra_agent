/**
 * BTC intelligence scheduler — provider rate budgets and derived refresh intervals.
 *
 * Intervals are computed so estimated calls per refresh stay under each provider's
 * per-minute cap (with safety margin). Override via env when you have higher quotas.
 */
import { isCoingeckoProDataApiUrl } from "../utils/coingeckoAPI.js";

/** Estimated CoinGecko HTTP calls per refresh group (conservative). */
export const BTC_COINGECKO_CALLS_PER_REFRESH = {
  overview: 3,
  dashboardCore: 16,
  bubblemap: 1,
};

/** Estimated Binance HTTP calls per refresh group. */
export const BTC_BINANCE_CALLS_PER_REFRESH = {
  overview: 2,
  dashboardCore: 8,
  bubblemap: 1,
};

/**
 * @returns {number} Max CoinGecko data API requests per minute for this deployment.
 */
export function getCoingeckoRequestsPerMinute() {
  const raw = Number(process.env.COINGECKO_RATE_LIMIT_PER_MIN);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  // Demo/public ~30/min; Pro plans vary — default high with env key on pro host.
  return isCoingeckoProDataApiUrl() ? 200 : 22;
}

/**
 * @returns {number} Max Binance spot/futures requests per minute (IP weight proxy).
 */
export function getBinanceRequestsPerMinute() {
  const raw = Number(process.env.BINANCE_RATE_LIMIT_PER_MIN);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return 80;
}

/**
 * @returns {number} Max Coinbase public requests per minute.
 */
export function getCoinbaseRequestsPerMinute() {
  const raw = Number(process.env.COINBASE_RATE_LIMIT_PER_MIN);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return 40;
}

const SAFETY_FACTOR = 1.35;

/**
 * Minimum ms between refreshes so `calls` requests fit in provider per-minute budget.
 * @param {number} calls
 * @param {number} perMinute
 * @param {number} floorMs
 */
function intervalFromBudget(calls, perMinute, floorMs) {
  if (perMinute <= 0 || calls <= 0) return floorMs;
  const ms = Math.ceil((calls / perMinute) * 60_000 * SAFETY_FACTOR);
  return Math.max(floorMs, ms);
}

/**
 * Derived refresh intervals — bottleneck is usually CoinGecko on demo keys.
 * @returns {{
 *   tickMs: number;
 *   startupDelayMs: number;
 *   overviewMs: number;
 *   dashboardMs: number;
 *   newsSentimentMs: number;
 *   bubblemapMs: number;
 *   coingeckoPerMin: number;
 *   binancePerMin: number;
 * }}
 */
export function getBtcIntelligenceRefreshIntervals() {
  const cgPerMin = getCoingeckoRequestsPerMinute();
  const bnPerMin = getBinanceRequestsPerMinute();

  const cgMsPerCall = (60_000 / cgPerMin) * SAFETY_FACTOR;

  const overviewMs = intervalFromBudget(
    BTC_COINGECKO_CALLS_PER_REFRESH.overview,
    cgPerMin,
    120_000,
  );

  const dashboardCgMs = intervalFromBudget(
    BTC_COINGECKO_CALLS_PER_REFRESH.dashboardCore,
    cgPerMin,
    300_000,
  );
  const dashboardBnMs = intervalFromBudget(
    BTC_BINANCE_CALLS_PER_REFRESH.dashboardCore,
    bnPerMin,
    180_000,
  );

  const bubblemapCgMs = intervalFromBudget(
    BTC_COINGECKO_CALLS_PER_REFRESH.bubblemap,
    cgPerMin,
    45_000,
  );
  const bubblemapBnMs = intervalFromBudget(
    BTC_BINANCE_CALLS_PER_REFRESH.bubblemap,
    bnPerMin,
    30_000,
  );

  const newsRaw = Number(process.env.BTC_INTELLIGENCE_NEWS_MS);
  const newsSentimentMs =
    Number.isFinite(newsRaw) && newsRaw >= 60_000 ? newsRaw : 900_000;

  const tickRaw = Number(process.env.BTC_INTELLIGENCE_TICK_MS);
  const tickMs = Number.isFinite(tickRaw) && tickRaw >= 5_000 ? tickRaw : 15_000;

  const startupRaw = Number(process.env.BTC_INTELLIGENCE_BOOT_DELAY_MS);
  const startupDelayMs =
    Number.isFinite(startupRaw) && startupRaw >= 0 ? startupRaw : 15_000;

  return {
    tickMs,
    startupDelayMs,
    overviewMs,
    dashboardMs: Math.max(dashboardCgMs, dashboardBnMs),
    newsSentimentMs,
    bubblemapMs: Math.max(bubblemapCgMs, bubblemapBnMs),
    coingeckoPerMin: cgPerMin,
    binancePerMin: bnPerMin,
    coingeckoMsPerCall: Math.ceil(cgMsPerCall),
  };
}

/** Provider keys for {@link acquireBtcProviderSlot}. */
export const BTC_PROVIDER_KEYS = ["coingecko", "binance", "coinbase", "other"];

/**
 * Per-provider max requests per rolling 60s window (single Node process).
 * @type {Record<string, number>}
 */
export function getBtcProviderLimitsPerMinute() {
  return {
    coingecko: getCoingeckoRequestsPerMinute(),
    binance: getBinanceRequestsPerMinute(),
    coinbase: getCoinbaseRequestsPerMinute(),
    other: 120,
  };
}
