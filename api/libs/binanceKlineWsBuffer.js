/**
 * Rolling Binance kline buffer via public WebSocket streams.
 * Used when REST klines return 418/429 (IP ban / rate limit).
 *
 * Stream: wss://stream.binance.com:9443/ws/{symbol}@kline_{interval}
 */
import WebSocket from "ws";

const BINANCE_WS_PRIMARY =
  (process.env.BINANCE_WS_BASE_URL || "wss://stream.binance.com:9443").replace(/\/$/, "");
const BINANCE_WS_DATA =
  (process.env.BINANCE_WS_DATA_URL || "wss://data-stream.binance.vision").replace(/\/$/, "");

const PREWARM_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const WS_CONNECT_TIMEOUT_MS = Math.min(
  8_000,
  Math.max(2_000, Number.parseInt(process.env.BINANCE_WS_KLINE_TIMEOUT_MS || "4000", 10)),
);
const WS_MIN_CANDLES = 20;
const BUFFER_MAX_CANDLES = 1000;

/** @type {Map<string, { candles: unknown[][]; updatedAt: number }>} */
const buffers = new Map();

/** @type {Map<string, Promise<void>>} */
const inflightSubscribe = new Map();

function bufferKey(symbol, interval) {
  return `${symbol.toUpperCase()}|${interval}`;
}

function wsStreamName(symbol, interval) {
  return `${symbol.toLowerCase()}@kline_${interval}`;
}

/**
 * @param {object} k
 * @returns {unknown[] | null}
 */
function wsKlineToRestRow(k) {
  if (!k || typeof k !== "object") return null;
  const t = k.t;
  const o = k.o;
  const h = k.h;
  const l = k.l;
  const c = k.c;
  const v = k.v;
  const T = k.T;
  const q = k.q;
  const n = k.n;
  if (t == null || o == null) return null;
  return [t, o, h, l, c, v, T, q, n, "0", "0", "0"];
}

/**
 * @param {string} symbol
 * @param {string} interval
 * @param {unknown[][]} rows
 */
function storeBuffer(symbol, interval, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const key = bufferKey(symbol, interval);
  buffers.set(key, { candles: rows.slice(-BUFFER_MAX_CANDLES), updatedAt: Date.now() });
}

/**
 * @param {string} url
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @returns {Promise<unknown[][]>}
 */
function collectKlinesFromWs(url, symbol, interval, limit) {
  const stream = wsStreamName(symbol, interval);
  const wsUrl = `${url}/ws/${stream}`;

  return new Promise((resolve, reject) => {
    /** @type {Map<number, unknown[]>} */
    const byOpenTime = new Map();
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      const rows = [...byOpenTime.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, row]) => row);
      if (rows.length >= Math.min(limit, WS_MIN_CANDLES)) {
        resolve(rows.slice(-limit));
      } else {
        reject(new Error("Binance WS kline buffer: insufficient candles"));
      }
    }, WS_CONNECT_TIMEOUT_MS);

    const ws = new WebSocket(wsUrl, { rejectUnauthorized: false });

    ws.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err instanceof Error ? err : new Error(String(err)));
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        const k = msg?.k;
        if (!k) return;
        const row = wsKlineToRestRow(k);
        if (!row) return;
        byOpenTime.set(Number(row[0]), row);
        if (k.x === true && byOpenTime.size >= Math.min(limit, WS_MIN_CANDLES)) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          const rows = [...byOpenTime.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, r]) => r)
            .slice(-limit);
          storeBuffer(symbol, interval, rows);
          ws.close();
          resolve(rows);
        }
      } catch {
        /* ignore malformed */
      }
    });
  });
}

/**
 * Subscribe briefly and fill buffer for symbol|interval.
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 */
async function ensureWsBuffer(symbol, interval, limit) {
  const sym = symbol.toUpperCase();
  const key = bufferKey(sym, interval);
  const existing = inflightSubscribe.get(key);
  if (existing) {
    await existing;
    return;
  }

  const task = (async () => {
    const endpoints = [BINANCE_WS_PRIMARY, BINANCE_WS_DATA];
    let lastErr;
    for (const base of endpoints) {
      try {
        const rows = await collectKlinesFromWs(base, sym, interval, limit);
        storeBuffer(sym, interval, rows);
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr ?? "WS subscribe failed"));
  })();

  inflightSubscribe.set(key, task);
  try {
    await task;
  } finally {
    inflightSubscribe.delete(key);
  }
}

/**
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @returns {Promise<unknown[][] | null>}
 */
export async function getBinanceKlinesFromWsBuffer(symbol, interval, limit) {
  const sym = symbol.toUpperCase();
  const key = bufferKey(sym, interval);
  const hit = buffers.get(key);
  const minNeeded = Math.min(limit, WS_MIN_CANDLES);
  if (hit?.candles?.length >= minNeeded) {
    return hit.candles.slice(-limit);
  }

  try {
    await ensureWsBuffer(sym, interval, limit);
    const refreshed = buffers.get(key);
    if (refreshed?.candles?.length) {
      return refreshed.candles.slice(-limit);
    }
  } catch (err) {
    console.warn("[binanceKlineWsBuffer] fetch failed:", err?.message || err);
  }
  return null;
}

/**
 * Prewarm WS buffers for top symbols on server boot.
 */
export function prewarmBinanceKlineWsBuffers() {
  for (const symbol of PREWARM_SYMBOLS) {
    ensureWsBuffer(symbol, "1h", 200).catch((err) => {
      console.warn(`[binanceKlineWsBuffer] prewarm ${symbol}:`, err?.message || err);
    });
  }
}
