/**
 * KuCoin spot market data routes (no auth). x402 API with GET and POST.
 * Uses KuCoin REST (https://api.kucoin.com). All params have defaults.
 *
 * GET/POST /kucoin/ticker       — symbol (optional; default all tickers, or e.g. BTC-USDT for single)
 * GET/POST /kucoin/stats       — symbol (default BTC-USDT) 24h stats
 * GET/POST /kucoin/orderbook   — symbol (default BTC-USDT), level (level2_20, level2_100)
 * GET/POST /kucoin/trades     — symbol (default BTC-USDT)
 * GET/POST /kucoin/candles     — symbol (default BTC-USDT), type (1min, 1hour, 1day, etc.), pageSize (default 100)
 * GET/POST /kucoin/symbols     — no params
 * GET/POST /kucoin/currencies  — no params
 * GET/POST /kucoin/server-time — no params
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_KUCOIN_USD } from "../../../config/x402Pricing.js";
import {
  getTicker,
  getStats,
  getOrderbook,
  getTrades,
  getCandles,
  getSymbols,
  getCurrencies,
  getServerTime,
} from "../../../libs/kucoinClient.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const KUCOIN_PAYMENT_BASE = {
  price: X402_API_PRICE_KUCOIN_USD,
  discoverable: true,
  inputSchema: {},
};

function params(req) {
  return { ...req.query, ...(req.body && typeof req.body === "object" ? req.body : {}) };
}

function defaultStr(value, def) {
  if (value != null && String(value).trim() !== "") return String(value).trim();
  return def;
}

function defaultInt(value, def, min, max) {
  const n = parseInt(value, 10);
  if (!Number.isNaN(n)) {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  }
  return def;
}

async function maybeSettle(res, req) {
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
}

async function handleTicker(req, res) {
  const p = params(req);
  const symbol = defaultStr(p.symbol, "");
  const data = await getTicker(symbol || undefined);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleStats(req, res) {
  const p = params(req);
  const symbol = defaultStr(p.symbol, "BTC-USDT");
  const data = await getStats(symbol);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleOrderbook(req, res) {
  const p = params(req);
  const symbol = defaultStr(p.symbol, "BTC-USDT");
  const level = defaultStr(p.level, "level2_20");
  const data = await getOrderbook(symbol, level);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleTrades(req, res) {
  const p = params(req);
  const symbol = defaultStr(p.symbol, "BTC-USDT");
  const data = await getTrades(symbol);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleCandles(req, res) {
  const p = params(req);
  const symbol = defaultStr(p.symbol, "BTC-USDT");
  const type = defaultStr(p.type, "1min");
  const pageSize = defaultInt(p.pageSize, 100, 1, 1500);
  const data = await getCandles(symbol, type, pageSize);
  res.setHeader("Cache-Control", "public, max-age=30");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleSymbols(req, res) {
  const data = await getSymbols();
  res.setHeader("Cache-Control", "public, max-age=60");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleCurrencies(req, res) {
  const data = await getCurrencies();
  res.setHeader("Cache-Control", "public, max-age=60");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleServerTime(req, res) {
  const data = await getServerTime();
  res.setHeader("Cache-Control", "public, max-age=1");
  await maybeSettle(res, req);
  res.json(data);
}

function wrap(handler) {
  return (req, res, next) =>
    handler(req, res).catch((err) => {
      res.status(502).json({
        error: "KuCoin request failed",
        message: err.message || String(err),
      });
    });
}

export async function createKucoinMarketRouter() {
  const router = express.Router();

  // Root path so GET /kucoin returns 200 (verifies router is mounted)
  router.get("/", (req, res) => {
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json({ service: "kucoin", ok: true, endpoints: ["ticker", "stats", "orderbook", "trades", "candles", "symbols", "currencies", "server-time"] });
  });

  const tickerPayment = {
    ...KUCOIN_PAYMENT_BASE,
    description: "KuCoin spot ticker (all or single symbol)",
    resource: "/kucoin/ticker",
    inputSchema: {
      queryParams: { symbol: { type: "string", description: "Optional symbol (e.g. BTC-USDT); omit for all tickers" } },
    },
  };
  const statsPayment = {
    ...KUCOIN_PAYMENT_BASE,
    description: "KuCoin 24h stats for a symbol",
    resource: "/kucoin/stats",
    inputSchema: {
      queryParams: { symbol: { type: "string", description: "Symbol (default BTC-USDT)" } },
    },
  };
  const orderbookPayment = {
    ...KUCOIN_PAYMENT_BASE,
    description: "KuCoin order book",
    resource: "/kucoin/orderbook",
    inputSchema: {
      queryParams: {
        symbol: { type: "string", description: "Symbol (default BTC-USDT)" },
        level: { type: "string", description: "level2_20 or level2_100 (default level2_20)" },
      },
    },
  };
  const tradesPayment = {
    ...KUCOIN_PAYMENT_BASE,
    description: "KuCoin recent trades",
    resource: "/kucoin/trades",
    inputSchema: {
      queryParams: { symbol: { type: "string", description: "Symbol (default BTC-USDT)" } },
    },
  };
  const candlesPayment = {
    ...KUCOIN_PAYMENT_BASE,
    description: "KuCoin klines/candles",
    resource: "/kucoin/candles",
    inputSchema: {
      queryParams: {
        symbol: { type: "string", description: "Symbol (default BTC-USDT)" },
        type: { type: "string", description: "1min, 1hour, 1day, etc. (default 1min)" },
        pageSize: { type: "number", description: "Candles to return (default 100, max 1500)" },
      },
    },
  };
  const symbolsPayment = {
    ...KUCOIN_PAYMENT_BASE,
    description: "KuCoin symbol list",
    resource: "/kucoin/symbols",
  };
  const currenciesPayment = {
    ...KUCOIN_PAYMENT_BASE,
    description: "KuCoin currencies list",
    resource: "/kucoin/currencies",
  };
  const serverTimePayment = {
    ...KUCOIN_PAYMENT_BASE,
    description: "KuCoin server time",
    resource: "/kucoin/server-time",
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/ticker/dev", wrap(handleTicker));
    router.post("/ticker/dev", wrap(handleTicker));
    router.get("/stats/dev", wrap(handleStats));
    router.post("/stats/dev", wrap(handleStats));
    router.get("/orderbook/dev", wrap(handleOrderbook));
    router.post("/orderbook/dev", wrap(handleOrderbook));
    router.get("/trades/dev", wrap(handleTrades));
    router.post("/trades/dev", wrap(handleTrades));
    router.get("/candles/dev", wrap(handleCandles));
    router.post("/candles/dev", wrap(handleCandles));
    router.get("/symbols/dev", wrap(handleSymbols));
    router.post("/symbols/dev", wrap(handleSymbols));
    router.get("/currencies/dev", wrap(handleCurrencies));
    router.post("/currencies/dev", wrap(handleCurrencies));
    router.get("/server-time/dev", wrap(handleServerTime));
    router.post("/server-time/dev", wrap(handleServerTime));
  }

  router.get("/ticker", requirePayment({ ...tickerPayment, method: "GET" }), wrap(handleTicker));
  router.post("/ticker", requirePayment({ ...tickerPayment, method: "POST" }), wrap(handleTicker));

  router.get("/stats", requirePayment({ ...statsPayment, method: "GET" }), wrap(handleStats));
  router.post("/stats", requirePayment({ ...statsPayment, method: "POST" }), wrap(handleStats));

  router.get("/orderbook", requirePayment({ ...orderbookPayment, method: "GET" }), wrap(handleOrderbook));
  router.post("/orderbook", requirePayment({ ...orderbookPayment, method: "POST" }), wrap(handleOrderbook));

  router.get("/trades", requirePayment({ ...tradesPayment, method: "GET" }), wrap(handleTrades));
  router.post("/trades", requirePayment({ ...tradesPayment, method: "POST" }), wrap(handleTrades));

  router.get("/candles", requirePayment({ ...candlesPayment, method: "GET" }), wrap(handleCandles));
  router.post("/candles", requirePayment({ ...candlesPayment, method: "POST" }), wrap(handleCandles));

  router.get("/symbols", requirePayment({ ...symbolsPayment, method: "GET" }), wrap(handleSymbols));
  router.post("/symbols", requirePayment({ ...symbolsPayment, method: "POST" }), wrap(handleSymbols));

  router.get("/currencies", requirePayment({ ...currenciesPayment, method: "GET" }), wrap(handleCurrencies));
  router.post("/currencies", requirePayment({ ...currenciesPayment, method: "POST" }), wrap(handleCurrencies));

  router.get("/server-time", requirePayment({ ...serverTimePayment, method: "GET" }), wrap(handleServerTime));
  router.post("/server-time", requirePayment({ ...serverTimePayment, method: "POST" }), wrap(handleServerTime));

  return router;
}
