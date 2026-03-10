/**
 * OKX market data routes (no auth). x402 API with GET and POST.
 * Uses OKX API v5 public endpoints: ticker, tickers, books, candles, trades, funding-rate, open-interest, index, mark-price, instruments, time.
 *
 * GET/POST /okx/ticker        — instId (default BTC-USDT)
 * GET/POST /okx/tickers      — instType (default SPOT)
 * GET/POST /okx/books        — instId (default BTC-USDT), sz (default 20)
 * GET/POST /okx/candles      — instId, bar (default 1H), limit (default 100), after, before
 * GET/POST /okx/history-candles — instId, bar, limit, after, before
 * GET/POST /okx/trades       — instId, limit (default 100)
 * GET/POST /okx/history-trades — instId, limit, after, before
 * GET/POST /okx/index-tickers — instId (optional)
 * GET/POST /okx/funding-rate — instId (default BTC-USDT-SWAP)
 * GET/POST /okx/funding-rate-history — instId, limit, after, before
 * GET/POST /okx/open-interest — instId (default BTC-USDT-SWAP)
 * GET/POST /okx/history-open-interest — instId, period (1H), limit, after, before
 * GET/POST /okx/mark-price   — instId (default BTC-USDT-SWAP)
 * GET/POST /okx/instruments  — instType, instFamily, instId (optional)
 * GET/POST /okx/time         — no params
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_OKX_USD } from "../../../config/x402Pricing.js";
import {
  getTicker,
  getTickers,
  getBooks,
  getCandles,
  getHistoryCandles,
  getTrades,
  getHistoryTrades,
  getIndexTickers,
  getFundingRate,
  getFundingRateHistory,
  getOpenInterest,
  getHistoryOpenInterest,
  getMarkPrice,
  getInstruments,
  getTime,
} from "../../../libs/okxMarketData.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const OKX_PAYMENT_BASE = {
  price: X402_API_PRICE_OKX_USD,
  discoverable: true,
  inputSchema: {},
};

/** Merge GET query and POST body; for POST, body overrides query. */
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
  const instId = defaultStr(p.instId, "BTC-USDT");
  const data = await getTicker(instId);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleTickers(req, res) {
  const p = params(req);
  const instType = defaultStr(p.instType, "SPOT");
  const data = await getTickers(instType);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleBooks(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT");
  const sz = defaultInt(p.sz, 20, 1, 400);
  const data = await getBooks(instId, sz);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleCandles(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT");
  const bar = defaultStr(p.bar, "1H");
  const limit = defaultInt(p.limit, 100, 1, 300);
  const data = await getCandles(instId, bar, limit, p.after, p.before);
  res.setHeader("Cache-Control", "public, max-age=30");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleHistoryCandles(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT");
  const bar = defaultStr(p.bar, "1H");
  const limit = defaultInt(p.limit, 100, 1, 300);
  const data = await getHistoryCandles(instId, bar, p.after, p.before, limit);
  res.setHeader("Cache-Control", "public, max-age=30");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleTrades(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT");
  const limit = defaultInt(p.limit, 100, 1, 500);
  const data = await getTrades(instId, limit);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleHistoryTrades(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT");
  const limit = defaultInt(p.limit, 100, 1, 100);
  const data = await getHistoryTrades(instId, p.after, p.before, limit);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleIndexTickers(req, res) {
  const p = params(req);
  const instId = p.instId ? defaultStr(p.instId, "") : undefined;
  const data = await getIndexTickers(instId);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleFundingRate(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT-SWAP");
  const data = await getFundingRate(instId);
  res.setHeader("Cache-Control", "public, max-age=60");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleFundingRateHistory(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT-SWAP");
  const limit = defaultInt(p.limit, 100, 1, 100);
  const data = await getFundingRateHistory(instId, p.after, p.before, limit);
  res.setHeader("Cache-Control", "public, max-age=60");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleOpenInterest(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT-SWAP");
  const data = await getOpenInterest(instId);
  res.setHeader("Cache-Control", "public, max-age=60");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleHistoryOpenInterest(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT-SWAP");
  const period = defaultStr(p.period, "1H");
  const limit = defaultInt(p.limit, 100, 1, 100);
  const data = await getHistoryOpenInterest(instId, period, p.after, p.before, limit);
  res.setHeader("Cache-Control", "public, max-age=60");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleMarkPrice(req, res) {
  const p = params(req);
  const instId = defaultStr(p.instId, "BTC-USDT-SWAP");
  const data = await getMarkPrice(instId);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleInstruments(req, res) {
  const p = params(req);
  const instType = p.instType ? defaultStr(p.instType, "") : undefined;
  const instFamily = p.instFamily ? defaultStr(p.instFamily, "") : undefined;
  const instId = p.instId ? defaultStr(p.instId, "") : undefined;
  const data = await getInstruments(instType, instFamily, instId);
  res.setHeader("Cache-Control", "public, max-age=300");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleTime(req, res) {
  const data = await getTime();
  res.setHeader("Cache-Control", "public, max-age=1");
  await maybeSettle(res, req);
  res.json(data);
}

function wrap(handler) {
  return (req, res, next) =>
    handler(req, res).catch((err) => {
      res.status(502).json({
        error: "OKX request failed",
        message: err.message || String(err),
      });
    });
}

function paymentOpt(opts) {
  return { ...OKX_PAYMENT_BASE, ...opts };
}

export async function createOkxMarketRouter() {
  const router = express.Router();

  const endpoints = [
    { path: "/ticker", handler: handleTicker, desc: "OKX single ticker", schema: { instId: "string" } },
    { path: "/tickers", handler: handleTickers, desc: "OKX all tickers by type", schema: { instType: "string" } },
    { path: "/books", handler: handleBooks, desc: "OKX order book", schema: { instId: "string", sz: "number" } },
    {
      path: "/candles",
      handler: handleCandles,
      desc: "OKX OHLC candles",
      schema: { instId: "string", bar: "string", limit: "number", after: "string", before: "string" },
    },
    {
      path: "/history-candles",
      handler: handleHistoryCandles,
      desc: "OKX historical candles",
      schema: { instId: "string", bar: "string", limit: "number", after: "string", before: "string" },
    },
    { path: "/trades", handler: handleTrades, desc: "OKX recent trades", schema: { instId: "string", limit: "number" } },
    {
      path: "/history-trades",
      handler: handleHistoryTrades,
      desc: "OKX historical trades",
      schema: { instId: "string", limit: "number", after: "string", before: "string" },
    },
    {
      path: "/index-tickers",
      handler: handleIndexTickers,
      desc: "OKX index tickers",
      schema: { instId: "string (optional)" },
    },
    {
      path: "/funding-rate",
      handler: handleFundingRate,
      desc: "OKX funding rate",
      schema: { instId: "string" },
    },
    {
      path: "/funding-rate-history",
      handler: handleFundingRateHistory,
      desc: "OKX funding rate history",
      schema: { instId: "string", limit: "number", after: "string", before: "string" },
    },
    {
      path: "/open-interest",
      handler: handleOpenInterest,
      desc: "OKX open interest",
      schema: { instId: "string" },
    },
    {
      path: "/history-open-interest",
      handler: handleHistoryOpenInterest,
      desc: "OKX historical open interest",
      schema: { instId: "string", period: "string", limit: "number", after: "string", before: "string" },
    },
    { path: "/mark-price", handler: handleMarkPrice, desc: "OKX mark price", schema: { instId: "string" } },
    {
      path: "/instruments",
      handler: handleInstruments,
      desc: "OKX instruments config",
      schema: { instType: "string", instFamily: "string", instId: "string (all optional)" },
    },
    { path: "/time", handler: handleTime, desc: "OKX server time" },
  ];

  const paymentConfig = {
    ticker: paymentOpt({ resource: "/okx/ticker", inputSchema: { queryParams: { instId: { type: "string" } } } }),
    tickers: paymentOpt({ resource: "/okx/tickers", inputSchema: { queryParams: { instType: { type: "string" } } } }),
    books: paymentOpt({
      resource: "/okx/books",
      inputSchema: { queryParams: { instId: { type: "string" }, sz: { type: "number" } } },
    }),
    candles: paymentOpt({
      resource: "/okx/candles",
      inputSchema: {
        queryParams: {
          instId: { type: "string" },
          bar: { type: "string" },
          limit: { type: "number" },
          after: { type: "string" },
          before: { type: "string" },
        },
      },
    }),
    "history-candles": paymentOpt({
      resource: "/okx/history-candles",
      inputSchema: {
        queryParams: {
          instId: { type: "string" },
          bar: { type: "string" },
          limit: { type: "number" },
          after: { type: "string" },
          before: { type: "string" },
        },
      },
    }),
    trades: paymentOpt({
      resource: "/okx/trades",
      inputSchema: { queryParams: { instId: { type: "string" }, limit: { type: "number" } } },
    }),
    "history-trades": paymentOpt({
      resource: "/okx/history-trades",
      inputSchema: {
        queryParams: { instId: { type: "string" }, limit: { type: "number" }, after: { type: "string" }, before: { type: "string" } },
      },
    }),
    "index-tickers": paymentOpt({
      resource: "/okx/index-tickers",
      inputSchema: { queryParams: { instId: { type: "string" } } },
    }),
    "funding-rate": paymentOpt({
      resource: "/okx/funding-rate",
      inputSchema: { queryParams: { instId: { type: "string" } } },
    }),
    "funding-rate-history": paymentOpt({
      resource: "/okx/funding-rate-history",
      inputSchema: {
        queryParams: { instId: { type: "string" }, limit: { type: "number" }, after: { type: "string" }, before: { type: "string" } },
      },
    }),
    "open-interest": paymentOpt({
      resource: "/okx/open-interest",
      inputSchema: { queryParams: { instId: { type: "string" } } },
    }),
    "history-open-interest": paymentOpt({
      resource: "/okx/history-open-interest",
      inputSchema: {
        queryParams: {
          instId: { type: "string" },
          period: { type: "string" },
          limit: { type: "number" },
          after: { type: "string" },
          before: { type: "string" },
        },
      },
    }),
    "mark-price": paymentOpt({
      resource: "/okx/mark-price",
      inputSchema: { queryParams: { instId: { type: "string" } } },
    }),
    instruments: paymentOpt({
      resource: "/okx/instruments",
      inputSchema: {
        queryParams: { instType: { type: "string" }, instFamily: { type: "string" }, instId: { type: "string" } },
      },
    }),
    time: paymentOpt({ resource: "/okx/time" }),
  };

  for (const { path, handler } of endpoints) {
    const key = path.slice(1);
    const config = paymentConfig[key] || paymentOpt({ resource: `/okx${path}` });

    if (process.env.NODE_ENV !== "production") {
      router.get(`${path}/dev`, wrap(handler));
      router.post(`${path}/dev`, wrap(handler));
    }

    router.get(path, requirePayment({ ...config, method: "GET" }), wrap(handler));
    router.post(path, requirePayment({ ...config, method: "POST" }), wrap(handler));
  }

  return router;
}
