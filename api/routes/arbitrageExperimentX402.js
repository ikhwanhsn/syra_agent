/**
 * x402: Cross-venue arbitrage experiment bundle — same data shape as the ai-agent
 * Arbitrage Experiment page (CMC top + per-asset CEX snapshots + ranked best routes).
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_ARBITRAGE_EXPERIMENT_USD } from "../config/x402Pricing.js";
import {
  fetchArbitrageExperimentAggregate,
  clampArbitrageExperimentLimit,
} from "../libs/arbitrageExperimentAggregate.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const LIMIT_PARAM = {
  type: "integer",
  required: false,
  description: "How many top (non-stable) CMC assets to scan; gross spread ranking uses USDT venues only (default 10, max 25).",
};

const paymentOptionsBase = {
  price: X402_API_PRICE_ARBITRAGE_EXPERIMENT_USD,
  description:
    "Arbitrage experiment — CoinMarketCap-style top tradable assets plus live cross-CEX USDT spot snapshots and ranked best buy/sell routes (gross spread before fees; not financial advice).",
  discoverable: true,
  resource: "/arbitrage",
  outputSchema: {
    aggregatedAt: { type: "string", description: "ISO time when the bundle was assembled" },
    cmcTop: { type: "object", description: "source, fetchedAt, assets[]" },
    snapshots: { type: "array", description: "Per-asset { asset, snapshot } with venues and strategy" },
    ranked: { type: "array", description: "Sorted opportunities with rank, spreadPct, buyAt, sellAt" },
    best: { type: "object", description: "Top-ranked opportunity or null" },
    runnerUp: { type: "array", description: "Next up to three ranked opportunities" },
  },
};

function resolveLimitFromReq(req) {
  const q = req.query?.limit;
  const b = req.body && typeof req.body === "object" ? req.body.limit : undefined;
  const raw = q !== undefined && String(q).trim() !== "" ? q : b;
  return clampArbitrageExperimentLimit(raw, 10);
}

function attachLimitOr400(req, res, next) {
  try {
    req.arbitrageExperimentLimit = resolveLimitFromReq(req);
    next();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(400).json({ success: false, error: msg });
  }
}

export async function createArbitrageExperimentX402Router() {
  const router = express.Router();

  const getPayment = {
    ...paymentOptionsBase,
    method: "GET",
    inputSchema: {
      queryParams: {
        limit: LIMIT_PARAM,
      },
    },
  };

  const postPayment = {
    ...paymentOptionsBase,
    method: "POST",
    inputSchema: {
      bodyType: "json",
      bodyFields: {
        limit: LIMIT_PARAM,
      },
    },
  };

  router.get("/", attachLimitOr400, requirePayment(getPayment), async (req, res) => {
    try {
      const data = await fetchArbitrageExperimentAggregate({ limit: req.arbitrageExperimentLimit });
      await settlePaymentAndSetResponse(res, req);
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = /CoinMarketCap/i.test(msg) ? 502 : 500;
      res.status(status).json({ success: false, error: msg });
    }
  });

  router.post("/", attachLimitOr400, requirePayment(postPayment), async (req, res) => {
    try {
      const data = await fetchArbitrageExperimentAggregate({ limit: req.arbitrageExperimentLimit });
      await settlePaymentAndSetResponse(res, req);
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = /CoinMarketCap/i.test(msg) ? 502 : 500;
      res.status(status).json({ success: false, error: msg });
    }
  });

  return router;
}
