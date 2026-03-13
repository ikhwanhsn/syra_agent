/**
 * Binance Spot API proxy: market data (public) and account/order (signed).
 * x402 paid routes. Signed endpoints use BINANCE_API_KEY + BINANCE_API_SECRET from env,
 * or apiKey + apiSecret in request body (e.g. API playground); never log secret.
 *
 * GET /binance/spot/ticker/24hr   — optional symbol (default all)
 * GET /binance/spot/depth         — symbol (required), limit optional (default 100)
 * GET /binance/spot/exchange-info — optional symbol, symbols
 * GET /binance/spot/account      — signed: spot balances
 * POST /binance/spot/order       — signed: place order (symbol, side, type, quantity, etc.)
 * DELETE /binance/spot/order     — signed: cancel order (symbol, orderId or origClientOrderId)
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_USD } from "../../../config/x402Pricing.js";
import {
  fetchBinanceSpotPublic,
  getBinanceSpotSigned,
  postBinanceSpotSigned,
  deleteBinanceSpotSigned,
} from "../../../libs/binanceSpotClient.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const BINANCE_SPOT_PRICE = X402_API_PRICE_USD;

/** Get API key/secret: env first, then request body (for playground). Never log secret. */
function getBinanceCredentials(req) {
  const fromEnv =
    process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET
      ? {
          apiKey: process.env.BINANCE_API_KEY.trim(),
          secret: process.env.BINANCE_API_SECRET.trim(),
        }
      : null;
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const fromBody =
    body.apiKey && body.apiSecret
      ? { apiKey: String(body.apiKey).trim(), secret: String(body.apiSecret).trim() }
      : null;
  return fromBody || fromEnv;
}

async function maybeSettle(res, req) {
  if (req.x402Payment) await settlePaymentAndSetResponse(res, req);
}

/** Merge GET query and POST body; stringify values for Binance. */
function params(req) {
  const raw = { ...req.query, ...(req.body && typeof req.body === "object" ? req.body : {}) };
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v != null && v !== "") out[k] = typeof v === "string" ? v.trim() : String(v);
  }
  return out;
}

export async function createBinanceSpotRouter() {
  const router = express.Router();

  // ----- Public market data -----

  router.get(
    "/ticker/24hr",
    requirePayment({ price: BINANCE_SPOT_PRICE, discoverable: true, inputSchema: {} }),
    async (req, res) => {
      try {
        const p = params(req);
        const symbol = p.symbol || "";
        const data = await fetchBinanceSpotPublic("ticker/24hr", symbol ? { symbol } : {});
        res.setHeader("Cache-Control", "public, max-age=10");
        await maybeSettle(res, req);
        res.json(data);
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err.message || "Binance ticker/24hr failed",
        });
      }
    }
  );

  router.get(
    "/depth",
    requirePayment({ price: BINANCE_SPOT_PRICE, discoverable: true, inputSchema: {} }),
    async (req, res) => {
      try {
        const p = params(req);
        const symbol = (p.symbol || "BTCUSDT").toUpperCase();
        const validLimits = [5, 10, 20, 50, 100, 500, 1000];
const requestedLimit = parseInt(p.limit, 10) || 100;
const limit = validLimits.includes(requestedLimit)
  ? requestedLimit
  : validLimits.reduce((best, l) => (l <= requestedLimit ? l : best), 5);
        const data = await fetchBinanceSpotPublic("depth", { symbol, limit: String(limit) });
        res.setHeader("Cache-Control", "public, max-age=5");
        await maybeSettle(res, req);
        res.json(data);
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err.message || "Binance depth failed",
        });
      }
    }
  );

  router.get(
    "/exchange-info",
    requirePayment({ price: BINANCE_SPOT_PRICE, discoverable: true, inputSchema: {} }),
    async (req, res) => {
      try {
        const p = params(req);
        const query = {};
        if (p.symbol) query.symbol = p.symbol.toUpperCase();
        if (p.symbols) query.symbols = p.symbols; // JSON array string or single symbol
        const data = await fetchBinanceSpotPublic("exchangeInfo", query);
        res.setHeader("Cache-Control", "public, max-age=60");
        await maybeSettle(res, req);
        res.json(data);
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err.message || "Binance exchangeInfo failed",
        });
      }
    }
  );

  // ----- Signed: account -----

  router.get(
    "/account",
    requirePayment({ price: BINANCE_SPOT_PRICE, discoverable: true, inputSchema: {} }),
    async (req, res) => {
      try {
        const creds = getBinanceCredentials(req);
        if (!creds) {
          return res.status(400).json({
            success: false,
            error:
              "Binance API key required. Set BINANCE_API_KEY and BINANCE_API_SECRET in env, or send apiKey and apiSecret in request body.",
          });
        }
        const data = await getBinanceSpotSigned(creds.apiKey, creds.secret, "account", {});
        await maybeSettle(res, req);
        res.json(data);
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err.message || "Binance account failed",
        });
      }
    }
  );

  // ----- Signed: place order (POST) -----

  router.post(
    "/order",
    requirePayment({ price: BINANCE_SPOT_PRICE, discoverable: true, inputSchema: {} }),
    async (req, res) => {
      try {
        const creds = getBinanceCredentials(req);
        if (!creds) {
          return res.status(400).json({
            success: false,
            error:
              "Binance API key required. Set BINANCE_API_KEY and BINANCE_API_SECRET in env, or send apiKey and apiSecret in body.",
          });
        }
        const p = params(req);
        const symbol = (p.symbol || "").toUpperCase();
        if (!symbol) {
          return res.status(400).json({
            success: false,
            error: "symbol is required (e.g. BTCUSDT)",
          });
        }
        const body = {
          symbol,
          side: (p.side || "BUY").toUpperCase(),
          type: (p.type || "MARKET").toUpperCase(),
        };
        if (p.quantity != null && p.quantity !== "") body.quantity = p.quantity;
        if (p.quoteOrderQty != null && p.quoteOrderQty !== "") body.quoteOrderQty = p.quoteOrderQty;
        if (p.price != null && p.price !== "") body.price = p.price;
        if (p.timeInForce != null && p.timeInForce !== "") body.timeInForce = p.timeInForce;
        if (p.newClientOrderId != null && p.newClientOrderId !== "")
          body.newClientOrderId = p.newClientOrderId;
        if (p.stopPrice != null && p.stopPrice !== "") body.stopPrice = p.stopPrice;
        if (p.icebergQty != null && p.icebergQty !== "") body.icebergQty = p.icebergQty;
        const data = await postBinanceSpotSigned(creds.apiKey, creds.secret, "order", body);
        await maybeSettle(res, req);
        res.json(data);
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err.message || "Binance place order failed",
        });
      }
    }
  );

  // ----- Signed: cancel order (DELETE) -----

  router.delete(
    "/order",
    requirePayment({ price: BINANCE_SPOT_PRICE, discoverable: true, inputSchema: {} }),
    async (req, res) => {
      try {
        const creds = getBinanceCredentials(req);
        if (!creds) {
          return res.status(400).json({
            success: false,
            error:
              "Binance API key required. Set BINANCE_API_KEY and BINANCE_API_SECRET in env, or send apiKey and apiSecret in body.",
          });
        }
        const p = params(req);
        const symbol = (p.symbol || "").toUpperCase();
        if (!symbol) {
          return res.status(400).json({
            success: false,
            error: "symbol is required (e.g. BTCUSDT)",
          });
        }
        const body = { symbol };
        if (p.orderId != null && p.orderId !== "") body.orderId = p.orderId;
        if (p.origClientOrderId != null && p.origClientOrderId !== "")
          body.origClientOrderId = p.origClientOrderId;
        if (!body.orderId && !body.origClientOrderId) {
          return res.status(400).json({
            success: false,
            error: "Either orderId or origClientOrderId is required",
          });
        }
        const data = await deleteBinanceSpotSigned(creds.apiKey, creds.secret, "order", body);
        await maybeSettle(res, req);
        res.json(data);
      } catch (err) {
        res.status(502).json({
          success: false,
          error: err.message || "Binance cancel order failed",
        });
      }
    }
  );

  return router;
}
