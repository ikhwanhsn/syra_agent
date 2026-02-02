// routes/event.js – cache + parallel settle for fast response
import express from "express";
import {
  requirePayment,
  getX402ResourceServer,
  encodePaymentResponseHeader,
} from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";
import { resolveTickerFromCoingecko } from "../../utils/coingeckoAPI.js";

const CACHE_TTL_MS = 90 * 1000;
const eventCache = new Map();

function getCacheKey(ticker) {
  return String(ticker || "general").trim().toLowerCase() || "general";
}

function getCached(ticker) {
  const key = getCacheKey(ticker);
  const entry = eventCache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function setCached(ticker, data) {
  eventCache.set(getCacheKey(ticker), { data, expires: Date.now() + CACHE_TTL_MS });
}

export async function createEventRouter() {
  const router = express.Router();

  const fetchGeneralEvent = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/events?&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerEvent = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/events?&tickers=${ticker}&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  async function getDataForTicker(ticker) {
    let cached = getCached(ticker);
    if (cached !== null) return cached;
    let result;
    if (ticker !== "general") {
      const tickerEvent = await fetchTickerEvent(ticker);
      result = Object.keys(tickerEvent).map((date) => ({
        date,
        ticker: tickerEvent[date],
      }));
    } else {
      const generalEvent = await fetchGeneralEvent();
      result = Object.keys(generalEvent).map((date) => ({
        date,
        general: generalEvent[date],
      }));
    }
    if (Array.isArray(result) && result.length > 0) setCached(ticker, result);
    return result;
  }

  function setPaymentResponseAndSend(res, data, settle) {
    if (!settle?.success) throw new Error(settle?.errorReason || "Settlement failed");
    res.setHeader("Payment-Response", encodePaymentResponseHeader(settle));
    res.json({ event: data });
  }

  router.get(
    "/",
    requirePayment({
      description: "Get upcoming and recent crypto events, conferences, and launches",
      method: "GET",
      discoverable: true,
      resource: "/v2/event",
      inputSchema: {
        queryParams: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all events",
          },
        },
      },
      outputSchema: {
        event: {
          type: "array",
          description: "Array of crypto events with date, title, description, and related tokens",
        },
      },
    }),
    async (req, res) => {
      let ticker = req.query.ticker || "general";
      if (ticker !== "general" && ticker) {
        const resolved = await resolveTickerFromCoingecko(ticker);
        ticker = resolved ? resolved.symbol.toUpperCase() : "general";
      }
      const { resourceServer } = getX402ResourceServer();
      const { payload, accepted } = req.x402Payment;
      const [event, settle] = await Promise.all([
        getDataForTicker(ticker),
        resourceServer.settlePayment(payload, accepted),
      ]);
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (event.length === 0) return res.status(500).json({ error: "Failed to fetch event" });
      setPaymentResponseAndSend(res, event, settle);
    }
  );

  router.post(
    "/",
    requirePayment({
      description: "Get upcoming and recent crypto events, conferences, and launches",
      method: "POST",
      discoverable: true,
      resource: "/v2/event",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all events",
          },
        },
      },
      outputSchema: {
        event: {
          type: "array",
          description: "Array of crypto events with date, title, description, and related tokens",
        },
      },
    }),
    async (req, res) => {
      let ticker = req.body.ticker || "general";
      if (ticker !== "general" && ticker) {
        const resolved = await resolveTickerFromCoingecko(ticker);
        ticker = resolved ? resolved.symbol.toUpperCase() : "general";
      }
      const { resourceServer } = getX402ResourceServer();
      const { payload, accepted } = req.x402Payment;
      const [event, settle] = await Promise.all([
        getDataForTicker(ticker),
        resourceServer.settlePayment(payload, accepted),
      ]);
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (event.length === 0) return res.status(500).json({ error: "Failed to fetch event" });
      setPaymentResponseAndSend(res, event, settle);
    }
  );

  return router;
}
