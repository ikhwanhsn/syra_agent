/**
 * Rolling Binance kline buffer via data-api REST seed + persistent WebSocket streams.
 * Used when main REST klines return 418/429 (IP ban / rate limit).
 *
 * Stream: wss://stream.binance.com:9443/ws/{symbol}@kline_{interval}
 */
import WebSocket from "ws";

const BINANCE_WS_PRIMARY =
  (process.env.BINANCE_WS_BASE_URL || "wss://stream.binance.com:9443").replace(/\/$/, "");
const BINANCE_WS_DATA =
  (process.env.BINANCE_WS_DATA_URL || "wss://data-stream.binance.vision").replace(/\/$/, "");
const BINANCE_DATA_API =
  (process.env.BINANCE_DATA_API_BASE_URL || "https://data-api.binance.vision/api/v3").replace(
    /\/$/,
    "",
  );

const PREWARM_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
const WS_MIN_CANDLES = 20;
const BUFFER_MAX_CANDLES = 1000;
const REST_SEED_TIMEOUT_MS = Math.min(
  8_000,
  Math.max(2_000, Number.parseInt(process.env.BINANCE_WS_KLINE_TIMEOUT_MS || "4000", 10)),
);
const WS_FAILURE_COOLDOWN_MS = 60_000;
const WARN_THROTTLE_MS = 60_000;

/** @type {Map<string, { candles: unknown[][]; updatedAt: number }>} */
const buffers = new Map();

/** @type {Map<string, Promise<void>>} */
const inflightSubscribe = new Map();

/** @type {Map<string, number>} */
const failureCooldownUntil = new Map();

/** @type {Map<string, number>} */
const lastWarnAt = new Map();

/** @type {Map<string, { ws: import('ws'); baseUrl: string }>} */
const persistentSubs = new Map();

function bufferKey(symbol, interval) {
  return `${symbol.toUpperCase()}|${interval}`;
}

function wsStreamName(symbol, interval) {
  return `${symbol.toLowerCase()}@kline_${interval}`;
}

function minNeeded(limit) {
  return Math.min(limit, WS_MIN_CANDLES);
}

function warnThrottled(key, message) {
  const now = Date.now();
  const last = lastWarnAt.get(key) ?? 0;
  if (now - last < WARN_THROTTLE_MS) return;
  lastWarnAt.set(key, now);
  console.warn(message);
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
  const existing = buffers.get(key);
  /** @type {Map<number, unknown[]>} */
  const merged = new Map();
  for (const row of existing?.candles ?? []) {
    if (Array.isArray(row) && row[0] != null) merged.set(Number(row[0]), row);
  }
  for (const row of rows) {
    if (Array.isArray(row) && row[0] != null) merged.set(Number(row[0]), row);
  }
  const mergedRows = [...merged.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, row]) => row)
    .slice(-BUFFER_MAX_CANDLES);
  buffers.set(key, { candles: mergedRows, updatedAt: Date.now() });
}

/**
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @returns {Promise<unknown[][]>}
 */
async function seedKlinesFromDataApi(symbol, interval, limit) {
  const url = new URL(`${BINANCE_DATA_API}/klines`);
  url.searchParams.set("symbol", symbol.toUpperCase());
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(Math.min(1000, Math.max(1, limit))));

  const signal =
    typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(REST_SEED_TIMEOUT_MS)
      : undefined;

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    ...(signal ? { signal } : {}),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = body?.msg ?? body?.message ?? `HTTP ${res.status}`;
    throw new Error(`Binance data-api klines [${res.status}]: ${msg}`);
  }
  if (!Array.isArray(body) || body.length === 0) {
    throw new Error("Binance data-api klines: invalid response");
  }
  return body;
}

/**
 * @param {string} baseUrl
 * @param {string} symbol
 * @param {string} interval
 */
function ensurePersistentWs(baseUrl, symbol, interval) {
  const key = bufferKey(symbol, interval);
  const existing = persistentSubs.get(key);
  if (existing?.ws && existing.ws.readyState <= WebSocket.OPEN && existing.baseUrl === baseUrl) {
    return;
  }

  if (existing?.ws) {
    try {
      existing.ws.close();
    } catch {
      /* ignore */
    }
  }

  const stream = wsStreamName(symbol, interval);
  const wsUrl = `${baseUrl}/ws/${stream}`;
  // nosemgrep: problem-based-packs.insecure-transport.js-node.bypass-tls-verification.bypass-tls-verification
  const ws = new WebSocket(wsUrl, { rejectUnauthorized: false });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(String(raw));
      const k = msg?.k;
      if (!k) return;
      const row = wsKlineToRestRow(k);
      if (!row) return;
      const hit = buffers.get(key);
      /** @type {Map<number, unknown[]>} */
      const byOpenTime = new Map();
      for (const existingRow of hit?.candles ?? []) {
        if (Array.isArray(existingRow) && existingRow[0] != null) {
          byOpenTime.set(Number(existingRow[0]), existingRow);
        }
      }
      byOpenTime.set(Number(row[0]), row);
      const rows = [...byOpenTime.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, r]) => r)
        .slice(-BUFFER_MAX_CANDLES);
      buffers.set(key, { candles: rows, updatedAt: Date.now() });
    } catch {
      /* ignore malformed */
    }
  });

  ws.on("close", () => {
    persistentSubs.delete(key);
    setTimeout(() => {
      if (persistentSubs.has(key)) return;
      ensurePersistentWs(baseUrl, symbol, interval);
    }, 5_000);
  });

  ws.on("error", () => {
    /* close handler reconnects */
  });

  persistentSubs.set(key, { ws, baseUrl });
}

/**
 * @param {string} symbol
 * @param {string} interval
 */
function startPersistentSubscriptions(symbol, interval) {
  for (const base of [BINANCE_WS_PRIMARY, BINANCE_WS_DATA]) {
    try {
      ensurePersistentWs(base, symbol, interval);
      return;
    } catch {
      /* try next endpoint */
    }
  }
}

async function runEnsureWsBuffer(symbol, interval, limit) {
  const sym = symbol.toUpperCase();
  const key = bufferKey(sym, interval);
  const needed = minNeeded(limit);

  const cooledUntil = failureCooldownUntil.get(key);
  if (cooledUntil != null && Date.now() < cooledUntil) {
    return;
  }

  const hit = buffers.get(key);
  if (hit?.candles?.length >= needed) {
    return;
  }

  try {
    const seeded = await seedKlinesFromDataApi(sym, interval, limit);
    storeBuffer(sym, interval, seeded);
    if (seeded.length >= needed) {
      failureCooldownUntil.delete(key);
      startPersistentSubscriptions(sym, interval);
      return;
    }
  } catch {
    /* REST seed failed — fall through to persistent WS */
  }

  startPersistentSubscriptions(sym, interval);

  const refreshed = buffers.get(key);
  if (refreshed?.candles?.length >= needed) {
    failureCooldownUntil.delete(key);
    return;
  }

  failureCooldownUntil.set(key, Date.now() + WS_FAILURE_COOLDOWN_MS);
  throw new Error("Binance WS kline buffer: insufficient candles");
}

/**
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

  const task = runEnsureWsBuffer(sym, interval, limit);
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
  const needed = minNeeded(limit);
  const hit = buffers.get(key);
  if (hit?.candles?.length >= needed) {
    return hit.candles.slice(-limit);
  }

  try {
    await ensureWsBuffer(sym, interval, limit);
    const refreshed = buffers.get(key);
    if (refreshed?.candles?.length >= needed) {
      return refreshed.candles.slice(-limit);
    }
  } catch (err) {
    warnThrottled(key, `[binanceKlineWsBuffer] fetch failed: ${err?.message || err}`);
  }
  return null;
}

/**
 * Prewarm WS buffers for top symbols on server boot.
 */
export function prewarmBinanceKlineWsBuffers() {
  for (const symbol of PREWARM_SYMBOLS) {
    ensureWsBuffer(symbol, "1h", 200).catch((err) => {
      warnThrottled(
        bufferKey(symbol, "1h"),
        `[binanceKlineWsBuffer] prewarm ${symbol}: ${err?.message || err}`,
      );
    });
  }
}
