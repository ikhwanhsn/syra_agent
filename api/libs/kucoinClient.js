/**
 * KuCoin REST API client for spot market data (no auth).
 * Tries KUCOIN_API_BASE env, then api.kucoin.com, falls back to api.kucoin.tr.
 * Response format: { code: "200000", data: ... }.
 */

const KUCOIN_ENDPOINTS = [
  process.env.KUCOIN_API_BASE,
  "https://api.kucoin.com",
  "https://api.kucoin.tr",
].filter(Boolean);

let activeBASE = KUCOIN_ENDPOINTS[0];

async function request(path) {
  let lastErr;
  for (const base of [activeBASE, ...KUCOIN_ENDPOINTS.filter((b) => b !== activeBASE)]) {
    try {
      const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(8000) });
      const json = await res.json().catch(() => ({}));
      if (json.code !== "200000") {
        const msg = json.msg || json.message || json.error || "KuCoin request failed";
        throw new Error(msg);
      }
      if (base !== activeBASE) {
        try {
          console.log(`[KuCoin] switched active base to ${new URL(base).hostname}`);
        } catch {
          console.log('[KuCoin] switched active base');
        }
        activeBASE = base;
      }
      return json.data;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("All KuCoin endpoints unreachable");
}

/**
 * All tickers or single symbol. Single: use /api/v1/market/orderbook/level1 for best bid/ask.
 * @param {string} [symbol] - e.g. BTC-USDT; omit for all tickers
 */
export async function getTicker(symbol) {
  if (symbol && String(symbol).trim()) {
    const data = await request(`/api/v1/market/orderbook/level1?symbol=${encodeURIComponent(String(symbol).trim())}`);
    return data;
  }
  return request("/api/v1/market/allTickers");
}

/**
 * 24h stats for a symbol.
 * @param {string} [symbol='BTC-USDT']
 */
export async function getStats(symbol = "BTC-USDT") {
  const sym = symbol && String(symbol).trim() ? String(symbol).trim() : "BTC-USDT";
  return request(`/api/v1/market/stats?symbol=${encodeURIComponent(sym)}`);
}

/**
 * Order book. level: level2_20 (default), level2_100.
 * @param {string} [symbol='BTC-USDT']
 * @param {string} [level='level2_20']
 */
export async function getOrderbook(symbol = "BTC-USDT", level = "level2_20") {
  const sym = symbol && String(symbol).trim() ? String(symbol).trim() : "BTC-USDT";
  const lvl = ["level2_20", "level2_100"].includes(String(level)) ? level : "level2_20";
  return request(`/api/v1/market/orderbook/${lvl}?symbol=${encodeURIComponent(sym)}`);
}

/**
 * Recent trades.
 * @param {string} [symbol='BTC-USDT']
 */
export async function getTrades(symbol = "BTC-USDT") {
  const sym = symbol && String(symbol).trim() ? String(symbol).trim() : "BTC-USDT";
  return request(`/api/v1/market/histories?symbol=${encodeURIComponent(sym)}`);
}

/**
 * Klines/candles. type: 1min, 3min, 5min, 15min, 30min, 1hour, 2hour, 4hour, 6hour, 8hour, 12hour, 1day, 1week.
 * @param {string} [symbol='BTC-USDT']
 * @param {string} [type='1min']
 * @param {number} [limit=100]
 */
export async function getCandles(symbol = "BTC-USDT", type = "1min", limit = 100) {
  const sym = symbol && String(symbol).trim() ? String(symbol).trim() : "BTC-USDT";
  const validTypes = ["1min", "3min", "5min", "15min", "30min", "1hour", "2hour", "4hour", "6hour", "8hour", "12hour", "1day", "1week"];
  const t = validTypes.includes(String(type)) ? type : "1min";
  const lim = Math.min(Math.max(1, parseInt(limit, 10) || 100), 1500);
  return request(`/api/v1/market/candles?symbol=${encodeURIComponent(sym)}&type=${encodeURIComponent(t)}&pageSize=${lim}`);
}

/**
 * List of tradeable symbols.
 */
export async function getSymbols() {
  return request("/api/v2/symbols");
}

/**
 * List of currencies.
 */
export async function getCurrencies() {
  return request("/api/v2/currencies");
}

/**
 * Server time (ms).
 */
export async function getServerTime() {
  const ts = await request("/api/v1/timestamp");
  return typeof ts === "number" ? { timestamp: ts } : ts;
}
