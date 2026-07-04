/**
 * Coinbase public candles → Binance-shaped kline rows for BTC when Binance REST is banned.
 * Coinbase: [time_sec, low, high, open, close, volume] (newest first).
 */
import { btcRateLimitedFetch } from "./btcProviderRateLimiter.js";

const COINBASE_CANDLES_URL = "https://api.exchange.coinbase.com/products/BTC-USD/candles";

const INTERVAL_TO_GRANULARITY = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 21600,
  "1d": 86400,
};

/**
 * @param {string} interval
 * @returns {number | null}
 */
function granularityForInterval(interval) {
  return INTERVAL_TO_GRANULARITY[interval] ?? null;
}

/**
 * @param {unknown[]} row
 * @param {number} granularitySec
 * @returns {unknown[] | null}
 */
function coinbaseRowToBinanceKline(row, granularitySec) {
  if (!Array.isArray(row) || row.length < 6) return null;
  const timeSec = Number(row[0]);
  const low = Number(row[1]);
  const high = Number(row[2]);
  const open = Number(row[3]);
  const close = Number(row[4]);
  const volume = Number(row[5]);
  if (![timeSec, low, high, open, close].every((n) => Number.isFinite(n))) return null;
  const openTime = Math.floor(timeSec * 1000);
  const closeTime = openTime + granularitySec * 1000 - 1;
  const vol = Number.isFinite(volume) ? String(volume) : "0";
  return [
    openTime,
    String(open),
    String(high),
    String(low),
    String(close),
    vol,
    closeTime,
    vol,
    0,
    "0",
    "0",
    "0",
  ];
}

/**
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<unknown[][] | null>}
 */
export async function fetchBtcKlinesFromCoinbase(symbol, interval, limit, opts = {}) {
  if (String(symbol).toUpperCase() !== "BTCUSDT") return null;
  const granularity = granularityForInterval(interval);
  if (granularity == null) return null;

  const want = Math.min(300, Math.max(1, limit));
  const url = `${COINBASE_CANDLES_URL}?granularity=${granularity}`;
  const res = await btcRateLimitedFetch(url, {
    headers: { Accept: "application/json" },
    ...(opts.signal ? { signal: opts.signal } : {}),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(body)) return null;

  const rows = body
    .map((row) => coinbaseRowToBinanceKline(row, granularity))
    .filter(Boolean)
    .sort((a, b) => Number(a[0]) - Number(b[0]));

  if (rows.length < 20) return null;
  return rows.slice(-want);
}
