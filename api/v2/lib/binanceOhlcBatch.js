/**
 * Fetch OHLC batch directly from Binance API. Used by V2 correlation routes
 * so they don't depend on BASE_URL / internal HTTP call to /binance/ohlc/batch.
 * Uses axios so it works on Node < 18 (no global fetch).
 */
import pLimit from "p-limit";
import axios from "axios";

const limit = pLimit(5);
const BINANCE_API = "https://api.binance.com/api/v3";

async function fetchOneSymbol(symbol, interval) {
  const sym = String(symbol).toUpperCase();
  try {
    const url = `${BINANCE_API}/klines?symbol=${sym}&interval=${interval}&limit=100`;
    const response = await axios.get(url, { timeout: 15000, validateStatus: () => true });

    let body = response.data;

    // Binance can return 200 with error object { code, msg } or raw array of candles
    if (response.status !== 200) {
      const msg = body?.msg ?? body?.message ?? response.statusText;
      throw new Error(`Binance ${response.status}: ${msg}`);
    }
    if (body && typeof body === "object" && !Array.isArray(body)) {
      if (body.msg) throw new Error(body.msg);
      if (Array.isArray(body.data)) body = body.data;
      else throw new Error("Unexpected response: not an array");
    }
    const rawData = Array.isArray(body) ? body : [];
    const data = rawData.map((d) => ({
      time: d[0],
      open: d[1],
      high: d[2],
      low: d[3],
      close: d[4],
      volume: d[5],
    }));
    return { symbol: sym, success: true, data };
  } catch (err) {
    const msg = err?.response?.data?.msg ?? err?.message ?? String(err);
    return { symbol: sym, success: false, error: msg };
  }
}

/**
 * Fetch OHLC for multiple symbols from Binance. Returns same shape as /binance/ohlc/batch.
 * @param {string} symbolsComma - e.g. "BTCUSDT,ETHUSDT,BNBUSDT"
 * @param {string} [interval='1m']
 * @returns {Promise<{ count: number, interval: string, timestamp: number, results: Array }>}
 */
export async function fetchBinanceOhlcBatch(symbolsComma, interval = "1m") {
  const list = symbolsComma.split(",").map((s) => s.trim()).filter(Boolean);
  const tasks = list.map((symbol) => limit(() => fetchOneSymbol(symbol, interval)));
  const results = await Promise.all(tasks);
  return {
    count: results.length,
    interval,
    timestamp: Date.now(),
    results,
  };
}
