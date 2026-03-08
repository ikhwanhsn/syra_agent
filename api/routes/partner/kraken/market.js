/**
 * Kraken market data routes (no auth). x402 API with GET and POST.
 * Uses kraken-cli for ticker, orderbook, ohlc, trades, status, server-time.
 * All params have defaults so requests work without any query/body.
 *
 * GET/POST /kraken/ticker   — pair (default BTCUSD), comma-separated for multiple
 * GET/POST /kraken/orderbook — pair (default BTCUSD), count (default 25)
 * GET/POST /kraken/ohlc     — pair (default BTCUSD), interval (default 60)
 * GET/POST /kraken/trades   — pair (default BTCUSD), count (default 100)
 * GET/POST /kraken/status   — no params
 * GET/POST /kraken/server-time — no params
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_KRAKEN_USD } from "../../../config/x402Pricing.js";
import {
  getTicker,
  getOrderbook,
  getOhlc,
  getTrades,
  getStatus,
  getServerTime,
} from "../../../libs/krakenCli.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const KRAKEN_PAYMENT_BASE = {
  price: X402_API_PRICE_KRAKEN_USD,
  discoverable: true,
  inputSchema: {},
};

/** Merge GET query and POST body; for POST, body overrides query. Apply defaults per endpoint in handlers. */
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
  const pairRaw = defaultStr(p.pair, "BTCUSD");
  const pairs = pairRaw.split(",").map((s) => s.trim()).filter(Boolean);
  if (pairs.length === 0) pairs.push("BTCUSD");
  const data = await getTicker(pairs);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleOrderbook(req, res) {
  const p = params(req);
  const pair = defaultStr(p.pair, "BTCUSD");
  const count = defaultInt(p.count, 25, 1, 500);
  const data = await getOrderbook(pair, count);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleOhlc(req, res) {
  const p = params(req);
  const pair = defaultStr(p.pair, "BTCUSD");
  const interval = defaultInt(p.interval, 60, 1, 21600);
  const data = await getOhlc(pair, interval);
  res.setHeader("Cache-Control", "public, max-age=30");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleTrades(req, res) {
  const p = params(req);
  const pair = defaultStr(p.pair, "BTCUSD");
  const count = defaultInt(p.count, 100, 1, 1000);
  const data = await getTrades(pair, count);
  res.setHeader("Cache-Control", "public, max-age=5");
  await maybeSettle(res, req);
  res.json(data);
}

async function handleStatus(req, res) {
  const data = await getStatus();
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
        error: "Kraken request failed",
        message: err.message || String(err),
      });
    });
}

export async function createKrakenMarketRouter() {
  const router = express.Router();

  const tickerPayment = {
    ...KRAKEN_PAYMENT_BASE,
    description: "Kraken ticker (market data, no auth)",
    resource: "/kraken/ticker",
    inputSchema: {
      queryParams: { pair: { type: "string", description: "Pair(s), comma-separated (default BTCUSD)" } },
    },
  };
  const orderbookPayment = {
    ...KRAKEN_PAYMENT_BASE,
    description: "Kraken order book (market data, no auth)",
    resource: "/kraken/orderbook",
    inputSchema: {
      queryParams: {
        pair: { type: "string", description: "Pair (default BTCUSD)" },
        count: { type: "number", description: "Depth (default 25, max 500)" },
      },
    },
  };
  const ohlcPayment = {
    ...KRAKEN_PAYMENT_BASE,
    description: "Kraken OHLC candles (market data, no auth)",
    resource: "/kraken/ohlc",
    inputSchema: {
      queryParams: {
        pair: { type: "string", description: "Pair (default BTCUSD)" },
        interval: { type: "number", description: "Minutes (default 60)" },
      },
    },
  };
  const tradesPayment = {
    ...KRAKEN_PAYMENT_BASE,
    description: "Kraken recent trades (market data, no auth)",
    resource: "/kraken/trades",
    inputSchema: {
      queryParams: {
        pair: { type: "string", description: "Pair (default BTCUSD)" },
        count: { type: "number", description: "Number of trades (default 100, max 1000)" },
      },
    },
  };
  const statusPayment = {
    ...KRAKEN_PAYMENT_BASE,
    description: "Kraken system status (no auth)",
    resource: "/kraken/status",
  };
  const serverTimePayment = {
    ...KRAKEN_PAYMENT_BASE,
    description: "Kraken server time (no auth)",
    resource: "/kraken/server-time",
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/ticker/dev", wrap(handleTicker));
    router.post("/ticker/dev", wrap(handleTicker));
    router.get("/orderbook/dev", wrap(handleOrderbook));
    router.post("/orderbook/dev", wrap(handleOrderbook));
    router.get("/ohlc/dev", wrap(handleOhlc));
    router.post("/ohlc/dev", wrap(handleOhlc));
    router.get("/trades/dev", wrap(handleTrades));
    router.post("/trades/dev", wrap(handleTrades));
    router.get("/status/dev", wrap(handleStatus));
    router.post("/status/dev", wrap(handleStatus));
    router.get("/server-time/dev", wrap(handleServerTime));
    router.post("/server-time/dev", wrap(handleServerTime));
  }

  router.get("/ticker", requirePayment({ ...tickerPayment, method: "GET" }), wrap(handleTicker));
  router.post("/ticker", requirePayment({ ...tickerPayment, method: "POST" }), wrap(handleTicker));

  router.get("/orderbook", requirePayment({ ...orderbookPayment, method: "GET" }), wrap(handleOrderbook));
  router.post("/orderbook", requirePayment({ ...orderbookPayment, method: "POST" }), wrap(handleOrderbook));

  router.get("/ohlc", requirePayment({ ...ohlcPayment, method: "GET" }), wrap(handleOhlc));
  router.post("/ohlc", requirePayment({ ...ohlcPayment, method: "POST" }), wrap(handleOhlc));

  router.get("/trades", requirePayment({ ...tradesPayment, method: "GET" }), wrap(handleTrades));
  router.post("/trades", requirePayment({ ...tradesPayment, method: "POST" }), wrap(handleTrades));

  router.get("/status", requirePayment({ ...statusPayment, method: "GET" }), wrap(handleStatus));
  router.post("/status", requirePayment({ ...statusPayment, method: "POST" }), wrap(handleStatus));

  router.get("/server-time", requirePayment({ ...serverTimePayment, method: "GET" }), wrap(handleServerTime));
  router.post("/server-time", requirePayment({ ...serverTimePayment, method: "POST" }), wrap(handleServerTime));

  return router;
}
