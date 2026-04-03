/**
 * Real-time spot prices via each venue's **public WebSocket** ticker streams (push updates).
 *
 * Doc references (market / public WS):
 * - Binance Spot: https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams
 * - Coinbase Advanced Trade: https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-channels
 * - OKX v5: https://www.okx.com/docs-v5/en/#websocket-api-public-channel-tickers-channel
 * - Bybit v5 spot: https://bybit-exchange.github.io/docs/v5/websocket/public/ticker
 * - Kraken v2: https://docs.kraken.com/api/docs/websocket-v2/ticker
 * - Bitget spot v2: https://www.bitget.com/api-doc/spot/websocket/public/Tickers-Channel
 * - KuCoin spot: https://www.kucoin.com/docs/websocket/spot-trading/public-channels/ticker
 * - Upbit: https://global-docs.upbit.com/reference/websocket-ticker
 * - Crypto.com Exchange v1: https://exchange-docs.crypto.com/exchange/v1/rest-ws/index.html
 *
 * TLS: rejectUnauthorized=false on all outbound connections so the module works
 * behind corporate proxies / local CAs that MITM public TLS certificates.
 *
 * ISP blocking: Some ISPs (e.g. Indonesian providers) block crypto exchange domains.
 * Alternative regional domains are used where available (e.g. bybit-tr.com, kucoin.tr).
 * Set env BYBIT_WS_SPOT_URL, KUCOIN_API_BASE_URL, etc. to override.
 */
import dns from "node:dns";
import https from "node:https";
import http from "node:http";
import WebSocket from "ws";
import { resolveBinanceSymbol } from "./binanceSignalAnalysis.js";
import { resolveOkxInstId } from "./okxSignalAnalysis.js";
import {
  SIGNAL_CEX_SOURCES,
  resolveCoinbaseProduct,
  resolveBybitSymbol,
  resolveKrakenPair,
  resolveKucoinSymbol,
  resolveUpbitMarket,
  resolveCryptocomInstrument,
} from "./cexSignalAnalysis.js";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const BROWSER_LIKE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// Venue endpoints (override via env)
// ---------------------------------------------------------------------------

const BINANCE_WS_PRIMARY = env("BINANCE_WS_BASE_URL", "wss://stream.binance.com:9443");
const BINANCE_WS_DATA = env("BINANCE_WS_DATA_URL", "wss://data-stream.binance.vision");

const COINBASE_WS = env("COINBASE_WS_URL", "wss://advanced-trade-ws.coinbase.com");

const OKX_WS_ENDPOINTS = [
  env("OKX_WS_URL", "wss://ws.okx.com:8443/ws/v5/public"),
  "wss://wsaws.okx.com:8443/ws/v5/public",
];

// Bybit: regional alternatives that bypass ISP blocks in certain countries
const BYBIT_WS_ENDPOINTS = [
  env("BYBIT_WS_SPOT_URL", "wss://stream.bybit-tr.com/v5/public/spot"),
  "wss://stream.bybit.kz/v5/public/spot",
  "wss://stream.bybit.com/v5/public/spot",
];

const KRAKEN_WS = env("KRAKEN_WS_URL", "wss://ws.kraken.com/v2");

const BITGET_WS = env("BITGET_WS_URL", "wss://ws.bitget.com/v2/ws/public");

// KuCoin: .tr domain bypasses ISP blocks in certain countries
const KUCOIN_BASE = env("KUCOIN_API_BASE_URL", "https://api.kucoin.tr");

const UPBIT_WS = env("UPBIT_WS_URL", "wss://api.upbit.com/websocket/v1");

const CRYPTOCOM_WS = env("CRYPTOCOM_WS_URL", "wss://stream.crypto.com/exchange/v1/market");
const CRYPTOCOM_REST = env("CRYPTOCOM_EXCHANGE_API_URL", "https://api.crypto.com/exchange/v1");

const WS_TIMEOUT_MS = Math.min(60_000, Math.max(5000, Number(process.env.CEX_WS_TICKER_TIMEOUT_MS || 14_000)));

const TLS_REJECT = false;

function env(key, fallback) {
  return (process.env[key] || fallback).replace(/\/$/, "");
}

function commonHeaders() {
  return {
    "User-Agent": (process.env.CEX_PUBLIC_FETCH_UA || "").trim() || BROWSER_LIKE_UA,
    "Accept-Language": "en-US,en;q=0.9",
  };
}

// ---------------------------------------------------------------------------
// HTTP helpers — node:https with rejectUnauthorized + redirect following
// ---------------------------------------------------------------------------

const HTTP_TIMEOUT_MS = Math.min(30_000, WS_TIMEOUT_MS + 2000);

function _httpRequest(url, method, bodyStr) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const mod = urlObj.protocol === "https:" ? https : http;
    const headers = { ...commonHeaders(), Accept: "application/json" };
    if (bodyStr != null) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(bodyStr);
    }
    const req = mod.request(
      urlObj,
      { method, headers, rejectUnauthorized: TLS_REJECT, timeout: HTTP_TIMEOUT_MS },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      },
    );
    req.on("timeout", () => { req.destroy(); reject(new Error("HTTP request timeout — domain may be blocked by ISP")); });
    req.on("error", reject);
    if (bodyStr != null) req.write(bodyStr);
    req.end();
  });
}

async function fetchJson(url, method = "GET", body = undefined, maxRedirects = 5) {
  let currentUrl = url;
  const bodyStr = body !== undefined ? JSON.stringify(body) : null;
  for (let i = 0; i <= maxRedirects; i++) {
    const raw = await _httpRequest(currentUrl, method, bodyStr);
    if ([301, 302, 303, 307, 308].includes(raw.status) && raw.headers.location) {
      const loc = raw.headers.location;
      if (isBlockPage(loc)) {
        throw new Error("Domain blocked by ISP — use a VPN or change DNS to access this exchange");
      }
      currentUrl = new URL(loc, currentUrl).toString();
      continue;
    }
    let j = {};
    try {
      j = raw.body ? JSON.parse(raw.body) : {};
    } catch {
      j = {};
    }
    return { res: { ok: raw.status >= 200 && raw.status < 300, status: raw.status }, j };
  }
  throw new Error(`Too many redirects from ${url}`);
}

async function fetchJsonPost(url, body) {
  return fetchJson(url, "POST", body);
}

// ---------------------------------------------------------------------------
// ISP block detection
// ---------------------------------------------------------------------------

function isBlockPage(url) {
  if (!url) return false;
  const lower = String(url).toLowerCase();
  return lower.includes("blockpage") || lower.includes("internetpositif") || lower.includes("trustpositif");
}

// ---------------------------------------------------------------------------
// Price helpers
// ---------------------------------------------------------------------------

function inferQuoteUnit(instrument) {
  const u = String(instrument || "").toUpperCase();
  if (u.startsWith("KRW-")) return "KRW";
  if (u.endsWith("USDT") || u.includes("_USDT") || u.includes("/USDT")) return "USDT";
  if (u.endsWith("-USD") || u.endsWith("-USDC") || u.includes("/USD")) return "USD";
  if (u.endsWith("USD") && u.length > 3 && !u.includes("USDT")) return "USD";
  return "unknown";
}

function fmtPrice(n) {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  if (abs >= 1) return n.toFixed(abs >= 1000 ? 2 : 6);
  return n.toFixed(8);
}

/** Kraken REST pair (e.g. XBTUSDT) → v2 WS symbol (e.g. BTC/USDT). v2 uses BTC not XBT. */
function krakenPairForWsV2(restPair) {
  const r = String(restPair || "").toUpperCase();
  let pair;
  if (r.includes("/")) {
    pair = r;
  } else if (r.endsWith("USDT")) {
    pair = `${r.slice(0, -4)}/USDT`;
  } else if (r.endsWith("USD") && !r.endsWith("USDT")) {
    pair = `${r.slice(0, -3)}/USD`;
  } else {
    pair = `${r}/USDT`;
  }
  return pair.replace(/^XBT\//, "BTC/");
}

// ---------------------------------------------------------------------------
// Generic "open WS, subscribe, wait for first price" helper
// ---------------------------------------------------------------------------

function wsTickerOnce(url, onOpen, extractPrice, instrument, opts = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: commonHeaders(),
      handshakeTimeout: 6_000,
      perMessageDeflate: false,
      rejectUnauthorized: TLS_REJECT,
    });

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { ws.terminate(); } catch { /* ignore */ }
      reject(new Error("WebSocket timeout"));
    }, WS_TIMEOUT_MS);

    const finishOk = (price) => {
      if (settled) return;
      if (!Number.isFinite(price)) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* ignore */ }
      resolve({ instrument, price, formattedPrice: fmtPrice(price) });
    };

    const finishErr = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { ws.close(); } catch { /* ignore */ }
      reject(e instanceof Error ? e : new Error(String(e)));
    };

    // Detect ISP block pages that return 301 instead of WS upgrade
    ws.on("unexpected-response", (_req, res) => {
      const loc = res.headers?.location || "";
      if (isBlockPage(loc)) {
        finishErr(new Error("Domain blocked by ISP — use a VPN or change DNS to access this exchange"));
      } else {
        finishErr(new Error(`Unexpected server response: ${res.statusCode}${loc ? " → " + loc : ""}`));
      }
    });

    ws.on("open", () => {
      try { onOpen(ws); } catch (e) { finishErr(e); }
    });

    ws.on("message", (buf, isBinary) => {
      const raw = isBinary ? buf.toString("utf8") : buf.toString();
      if (raw === "ping") { ws.send("pong"); return; }

      let j;
      try { j = JSON.parse(raw); } catch { return; }

      if (opts.onRaw) {
        try { opts.onRaw(ws, raw, j); } catch { /* ignore */ }
      }
      // Generic heartbeat/ping handlers
      if (j?.ping != null) { ws.send(JSON.stringify({ pong: j.ping })); return; }
      if (j?.op === "ping") { ws.send(JSON.stringify({ op: "pong", ts: j.ts ?? Date.now() })); return; }
      if (j?.type === "ping") { ws.send(JSON.stringify({ type: "pong", id: j.id ?? Date.now() })); return; }

      try {
        const p = extractPrice(j, raw);
        if (typeof p === "number" && Number.isFinite(p)) finishOk(p);
      } catch (e) {
        finishErr(e);
      }
    });

    ws.on("error", (err) => finishErr(err));
  });
}

/** Try multiple WS URLs in order, return first success. */
async function wsTickerOnceWithFallback(urls, onOpen, extractPrice, instrument, opts) {
  let lastErr = "WS failed";
  for (const url of urls) {
    try {
      return await wsTickerOnce(url, onOpen, extractPrice, instrument, opts);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      if (lastErr.includes("blocked by ISP")) throw e;
    }
  }
  throw new Error(lastErr);
}

// ---------------------------------------------------------------------------
// Per-venue WS implementations
// ---------------------------------------------------------------------------

// === Binance ===
function binanceMiniTickerExtract(j) {
  const inner = j?.stream && j.data != null ? j.data : j;
  if (inner?.e === "24hrMiniTicker" && inner.c != null) return Number.parseFloat(String(inner.c));
  if (inner?.e === "24hrTicker" && inner.c != null) return Number.parseFloat(String(inner.c));
  return null;
}

async function binanceWs(symbol) {
  const stream = `${symbol.toLowerCase()}@miniTicker`;
  return wsTickerOnceWithFallback(
    [`${BINANCE_WS_PRIMARY}/ws/${stream}`, `${BINANCE_WS_DATA}/ws/${stream}`],
    () => {},
    (j) => binanceMiniTickerExtract(j),
    symbol,
  );
}

// === Coinbase Advanced Trade ===
// Endpoint: wss://advanced-trade-ws.coinbase.com
// Subscribe: { type: "subscribe", product_ids: [...], channel: "ticker" }
// Response: { channel: "ticker", events: [{ type: "snapshot"|"update", tickers: [{ price }] }] }
async function coinbaseWs(productId) {
  return wsTickerOnce(
    COINBASE_WS,
    (ws) => {
      ws.send(JSON.stringify({ type: "subscribe", product_ids: [productId], channel: "ticker" }));
    },
    (j) => {
      if (j?.channel === "ticker" && Array.isArray(j.events)) {
        for (const ev of j.events) {
          if (Array.isArray(ev.tickers)) {
            for (const t of ev.tickers) {
              if (t?.price != null) return Number.parseFloat(String(t.price));
            }
          }
        }
        return null;
      }
      // Legacy Exchange format fallback
      if (j?.type === "subscriptions" || j?.type === "heartbeat") return null;
      if (j?.type === "ticker" && j.price != null) return Number.parseFloat(String(j.price));
      return null;
    },
    productId,
  );
}

// === OKX v5 ===
async function okxWs(instId) {
  return wsTickerOnceWithFallback(
    OKX_WS_ENDPOINTS,
    (ws) => {
      ws.send(JSON.stringify({ op: "subscribe", args: [{ channel: "tickers", instId }] }));
    },
    (j) => {
      if (j?.event === "error") throw new Error(j?.msg || "OKX WS error");
      if (j?.event === "subscribe") return null;
      if (j?.arg?.channel === "tickers" && j.data != null) {
        const row = Array.isArray(j.data) ? j.data[0] : j.data;
        if (row?.last != null) return Number.parseFloat(String(row.last));
      }
      return null;
    },
    instId,
  );
}

// === Bybit v5 spot ===
// Uses regional fallback domains (bybit-tr.com, bybit.kz) to bypass ISP blocks
// Response: { topic: "tickers.BTCUSDT", type: "snapshot", data: { lastPrice: "..." } }
async function bybitWs(symbol) {
  const topic = `tickers.${symbol}`;
  return wsTickerOnceWithFallback(
    BYBIT_WS_ENDPOINTS,
    (ws) => {
      ws.send(JSON.stringify({ op: "subscribe", args: [topic] }));
    },
    (j) => {
      if (j?.success === true || j?.op === "subscribe") return null;
      if (j?.op === "pong" || j?.ret_msg === "pong") return null;
      if (typeof j?.topic === "string" && j.topic.startsWith("tickers.") && j.data) {
        const row = Array.isArray(j.data) ? j.data[0] : j.data;
        if (row?.lastPrice != null) return Number.parseFloat(String(row.lastPrice));
      }
      return null;
    },
    symbol,
    {
      onRaw(ws, _raw, j) {
        if (j?.op === "ping") ws.send(JSON.stringify({ op: "pong" }));
      },
    },
  );
}

// === Kraken v2 ===
// Endpoint: wss://ws.kraken.com/v2
// Subscribe: { method: "subscribe", params: { channel: "ticker", symbol: ["BTC/USDT"] } }
// Response: { channel: "ticker", type: "snapshot"|"update", data: [{ last, ... }] }
async function krakenWs(restPair) {
  const wsPair = krakenPairForWsV2(restPair);
  return wsTickerOnce(
    KRAKEN_WS,
    (ws) => {
      ws.send(JSON.stringify({ method: "subscribe", params: { channel: "ticker", symbol: [wsPair] } }));
    },
    (j) => {
      if (j?.error) throw new Error(String(j.error));
      if (j?.method === "subscribe" || j?.method === "pong") return null;
      if (j?.channel === "status") return null;
      // v2: { channel: "ticker", type: "snapshot"|"update", data: [{ last }] }
      if (j?.channel === "ticker" && Array.isArray(j.data) && j.data[0]?.last != null) {
        return Number(j.data[0].last);
      }
      // v1 fallback: [channelID, { c: [price, ...] }, "ticker", pair]
      if (Array.isArray(j) && j[2] === "ticker" && j[1]?.c?.[0] != null) {
        return Number.parseFloat(String(j[1].c[0]));
      }
      return null;
    },
    restPair,
  );
}

// === Bitget spot v2 ===
async function bitgetWs(symbol) {
  return wsTickerOnce(
    BITGET_WS,
    (ws) => {
      ws.send(JSON.stringify({ op: "subscribe", args: [{ instType: "SPOT", channel: "ticker", instId: symbol }] }));
    },
    (j) => {
      if (j?.event === "subscribe") return null;
      if (j?.arg?.channel === "ticker" && j.data != null) {
        const row = Array.isArray(j.data) ? j.data[0] : j.data;
        const x = row?.lastPr ?? row?.last;
        if (x != null) return Number.parseFloat(String(x));
      }
      if ((j?.action === "snapshot" || j?.action === "update") && j.data != null) {
        const row = Array.isArray(j.data) ? j.data[0] : j.data;
        const x = row?.lastPr ?? row?.last;
        if (x != null) return Number.parseFloat(String(x));
      }
      return null;
    },
    symbol,
    {
      onRaw(ws, raw) {
        if (raw === "ping") ws.send("pong");
      },
    },
  );
}

// === KuCoin ===
// Uses .kucoin.tr domain to bypass ISP blocks; the bullet-public response returns .kucoin.tr WS endpoints
async function kucoinWs(symbol) {
  const { res, j } = await fetchJsonPost(`${KUCOIN_BASE}/api/v1/bullet-public`, {});
  if (!res.ok) throw new Error(`KuCoin bullet ${res.status}`);
  const code = String(j?.code ?? "");
  if (code !== "200000" && j?.code !== 200000) {
    throw new Error(j?.msg || "KuCoin bullet error");
  }
  const token = j?.data?.token;
  const server = j?.data?.instanceServers?.[0];
  const endpoint = server?.endpoint;
  if (!token || !endpoint) throw new Error("KuCoin: no WS token");

  const connectId = `${Date.now()}`;
  const url = `${endpoint.replace(/\/$/, "")}?token=${encodeURIComponent(token)}&connectId=${connectId}`;
  const topic = `/market/ticker:${symbol}`;

  return wsTickerOnce(
    url,
    (ws) => {
      ws.send(JSON.stringify({ id: connectId, type: "subscribe", topic, response: true, privateChannel: false }));
    },
    (msg) => {
      if (msg?.type === "ack" || msg?.type === "welcome" || msg?.type === "pong") return null;
      if (msg?.type === "message" && msg.topic === topic && msg.data?.price != null) {
        return Number.parseFloat(String(msg.data.price));
      }
      return null;
    },
    symbol,
    {
      onRaw(ws, _raw, j) {
        if (j?.type === "ping") ws.send(JSON.stringify({ id: j.id ?? Date.now(), type: "pong" }));
      },
    },
  );
}

// === Upbit ===
async function upbitWs(market) {
  return wsTickerOnce(
    UPBIT_WS,
    (ws) => {
      ws.send(JSON.stringify([
        { ticket: `syra-${Date.now()}` },
        { type: "ticker", codes: [market], isOnlyRealtime: true },
      ]));
    },
    (j) => {
      if (j?.ty === "ticker" && j.tp != null) return Number.parseFloat(String(j.tp));
      if (j?.type === "ticker" && j.trade_price != null) return Number.parseFloat(String(j.trade_price));
      return null;
    },
    market,
  );
}

// === Crypto.com Exchange ===
// WS ticker data: result.data[{ i, a (last price), b (bid), k (ask) }]
async function cryptocomWsOrRest(instrument_name) {
  try {
    return await wsTickerOnce(
      CRYPTOCOM_WS,
      (ws) => {
        ws.send(JSON.stringify({
          id: Date.now(), nonce: Date.now(), method: "subscribe",
          params: { channels: [`ticker.${instrument_name}`] },
        }));
      },
      (j) => {
        if (j?.method === "subscribe" && !j?.result?.data) return null;
        if (j?.error) throw new Error(String(j.error));
        if (j?.code != null && Number(j.code) !== 0 && String(j.code) !== "0") {
          throw new Error(j?.message || String(j.code));
        }
        const resultData = j?.result?.data;
        if (resultData) {
          const row = Array.isArray(resultData) ? resultData[0] : resultData;
          if (row?.a != null) {
            const lp = Number.parseFloat(String(row.a));
            if (Number.isFinite(lp) && lp > 0) return lp;
          }
          const bid = Number.parseFloat(String(row?.b ?? ""));
          const ask = Number.parseFloat(String(row?.k ?? ""));
          if (Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0) return (bid + ask) / 2;
        }
        return null;
      },
      instrument_name,
    );
  } catch (wsErr) {
    // If WS was ISP-blocked or timed out at handshake, REST fallback to the same
    // domain will also fail — skip it to avoid doubling the wait time
    const wsMsg = wsErr instanceof Error ? wsErr.message : String(wsErr);
    if (wsMsg.includes("blocked by ISP") || wsMsg.includes("handshake has timed out") || wsMsg.includes("WebSocket timeout")) {
      throw wsErr;
    }
    // REST fallback
    try {
      const { res, j } = await fetchJsonPost(`${CRYPTOCOM_REST}/public/get-ticker`, {
        id: Date.now(), method: "public/get-ticker", params: { instrument_name },
      });
      if (!res.ok) throw new Error(`Crypto.com ticker ${res.status}`);
      if (j?.code != null && Number(j.code) !== 0 && String(j.code) !== "0") {
        throw new Error(j?.message || j?.msg || `Crypto.com code ${j.code}`);
      }
      const resultData = j?.result?.data;
      const row = Array.isArray(resultData) ? resultData[0] : (resultData ?? j?.result);
      if (!row || typeof row !== "object") throw new Error("Crypto.com: empty result");
      let price = Number.parseFloat(String(row?.a ?? ""));
      if (!Number.isFinite(price) || price <= 0) {
        const bid = Number.parseFloat(String(row?.b ?? ""));
        const ask = Number.parseFloat(String(row?.k ?? ""));
        if (Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0) price = (bid + ask) / 2;
      }
      if (!Number.isFinite(price) || price <= 0) {
        price = Number.parseFloat(String(row?.l ?? row?.last_price ?? ""));
      }
      if (!Number.isFinite(price)) throw new Error("Crypto.com: bad price");
      return { instrument: instrument_name, price, formattedPrice: fmtPrice(price) };
    } catch (restErr) {
      const restMsg = restErr instanceof Error ? restErr.message : String(restErr);
      const wsMsg = wsErr instanceof Error ? wsErr.message : String(wsErr);
      throw new Error(restMsg || wsMsg || "Crypto.com: WS and REST both failed");
    }
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

async function fetchOneCexTicker(source, token, instId) {
  switch (source) {
    case "binance":
      return binanceWs(resolveBinanceSymbol(token, instId));
    case "coinbase":
      return coinbaseWs(resolveCoinbaseProduct(token, instId));
    case "okx":
      return okxWs(resolveOkxInstId(token, instId));
    case "bybit":
      return bybitWs(resolveBybitSymbol(token, instId));
    case "kraken":
      return krakenWs(resolveKrakenPair(token, instId));
    case "bitget":
      return bitgetWs(resolveBybitSymbol(token, instId));
    case "kucoin":
      return kucoinWs(resolveKucoinSymbol(token, instId));
    case "upbit":
      return upbitWs(resolveUpbitMarket(token, instId));
    case "cryptocom":
      return cryptocomWsOrRest(resolveCryptocomInstrument(token, instId));
    default:
      throw new Error(`Unknown CEX: ${source}`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchAllCexRealtimePrices(token, instId) {
  const t = String(token ?? "bitcoin").trim().toLowerCase() || "bitcoin";
  const ex = instId != null && String(instId).trim() ? String(instId).trim() : undefined;

  const settled = await Promise.allSettled(
    SIGNAL_CEX_SOURCES.map((source) => fetchOneCexTicker(source, t, ex)),
  );

  const venues = SIGNAL_CEX_SOURCES.map((source, i) => {
    const r = settled[i];
    if (r.status === "fulfilled") {
      const { instrument, price, formattedPrice } = r.value;
      return {
        ok: true,
        source,
        instrument,
        quoteUnit: inferQuoteUnit(instrument),
        price,
        formattedPrice,
        anchorCloseMs: null,
      };
    }
    const msg = r.reason instanceof Error ? r.reason.message : String(r.reason ?? "Unknown error");
    return { ok: false, source, error: msg };
  });

  return {
    token: t,
    priceSource: "websocket",
    fetchedAt: new Date().toISOString(),
    venues,
  };
}
