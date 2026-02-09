/**
 * V2 Analytics summary: x402 paid endpoint that returns one JSON with full data
 * from all analytics-related APIs (price, volume, correlation, token risk, etc.)
 * that have no params or default params only. Price = sum of all included tools.
 * GET /v2/analytics/summary and POST /v2/analytics/summary (payment required).
 */
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_ANALYTICS_SUMMARY_USD } from "../../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import {
  fetchDexscreener,
  fetchTokenStatistic,
  fetchTrendingJupiter,
  fetchSmartMoney,
  fetchBinanceCorrelation,
  fetchMemecoinScreens,
} from "../lib/analyticsFetchers.js";

const router = express.Router();

function wrapFulfilled(value) {
  return { ok: true, data: value };
}
function wrapRejected(err) {
  return {
    ok: false,
    error: err instanceof Error ? err.message : String(err),
  };
}

const summaryPaymentOptions = {
  price: X402_API_PRICE_ANALYTICS_SUMMARY_USD,
  description:
    "Analytics summary: full data from dexscreener, token-statistic, trending-jupiter, smart-money, binance correlation, and 9 memecoin screens",
  method: "GET",
  discoverable: true,
  resource: "/v2/analytics/summary",
  outputSchema: {
    api: { type: "string", description: "API version" },
    name: { type: "string", description: "Summary name" },
    updatedAt: { type: "string", description: "ISO timestamp" },
    sections: {
      type: "object",
      description: "Price, volume, correlation, token risk, on-chain, memecoin data",
    },
  },
};

/**
 * GET /summary
 * POST /summary
 * x402 V2: payment required. Returns full data from all included tools after payment.
 * skipSettle: if true, do not call settlePaymentAndSetResponse (for /summary/dev).
 */
async function handleSummary(req, res, options = {}) {
  try {
    const [
      dexscreenerResult,
      tokenStatisticResult,
      trendingJupiterResult,
      smartMoneyResult,
      binanceCorrelationResult,
      memecoinScreensResult,
    ] = await Promise.allSettled([
      fetchDexscreener(),
      fetchTokenStatistic(),
      fetchTrendingJupiter(),
      fetchSmartMoney(),
      fetchBinanceCorrelation(),
      fetchMemecoinScreens(),
    ]);

    const dexscreener = dexscreenerResult.status === "fulfilled"
      ? wrapFulfilled(dexscreenerResult.value)
      : wrapRejected(dexscreenerResult.reason);
    const tokenStatistic = tokenStatisticResult.status === "fulfilled"
      ? wrapFulfilled(tokenStatisticResult.value)
      : wrapRejected(tokenStatisticResult.reason);
    const trendingJupiter = trendingJupiterResult.status === "fulfilled"
      ? wrapFulfilled(trendingJupiterResult.value)
      : wrapRejected(trendingJupiterResult.reason);
    const smartMoney = smartMoneyResult.status === "fulfilled"
      ? wrapFulfilled(smartMoneyResult.value)
      : wrapRejected(smartMoneyResult.reason);
    const binanceCorrelation = binanceCorrelationResult.status === "fulfilled"
      ? wrapFulfilled(binanceCorrelationResult.value)
      : wrapRejected(binanceCorrelationResult.reason);
    const memecoinScreens = memecoinScreensResult.status === "fulfilled"
      ? wrapFulfilled(memecoinScreensResult.value)
      : wrapRejected(memecoinScreensResult.reason);

    const summary = {
      api: "v2",
      name: "Analytics API Summary",
      updatedAt: new Date().toISOString(),
      sections: {
        price: {
          title: "Price & market data",
          dexscreener,
          trendingJupiter,
        },
        volume: {
          title: "Volume & liquidity",
          dexscreener,
          tokenStatistic,
        },
        correlation: {
          title: "Correlation",
          binance: binanceCorrelation,
        },
        tokenRisk: {
          title: "Token risk & safety",
          tokenStatistic,
        },
        onChain: {
          title: "On-chain & flow",
          smartMoney,
        },
        memecoin: {
          title: "Memecoin screens",
          ...(memecoinScreens.ok ? memecoinScreens.data : { error: memecoinScreens.error }),
        },
      },
    };

    if (!options.skipSettle) await settlePaymentAndSetResponse(res, req);
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

if (process.env.NODE_ENV !== "production") {
  router.get("/summary/dev", (req, res) => handleSummary(req, res, { skipSettle: true }));
}

router.get(
  "/summary",
  requirePayment({ ...summaryPaymentOptions, method: "GET" }),
  handleSummary
);
router.post(
  "/summary",
  requirePayment({ ...summaryPaymentOptions, method: "POST" }),
  handleSummary
);

export async function createAnalyticsRouter() {
  return router;
}

export default router;
