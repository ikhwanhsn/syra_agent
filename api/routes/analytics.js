/**
 * Analytics: KPI dashboard (grant metrics) + V2 summary (x402 paid).
 * GET /analytics/kpi, /analytics/errors – dashboard (no payment).
 * GET/POST /analytics/summary – x402 paid, full data from dexscreener, token-statistic, etc.
 */
import express from "express";
import PaidApiCall from "../models/PaidApiCall.js";
import Chat from "../models/agent/Chat.js";
import ApiRequestLog from "../models/ApiRequestLog.js";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_ANALYTICS_SUMMARY_USD } from "../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import {
  fetchDexscreener,
  fetchTokenStatistic,
  fetchTrendingJupiter,
  fetchSmartMoney,
  fetchBinanceCorrelation,
} from "../libs/analyticsFetchers.js";

const router = express.Router();

/** Grant KPI success threshold (e.g. 500 paid API calls). */
export const KPI_TARGET_PAID_API_CALLS = 500;
export const KPI_TARGET_AGENT_SESSIONS = 200;

/**
 * GET /analytics/kpi – returns paid KPIs, agent stats, request volume/errors/latency.
 */
router.get("/kpi", async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalPaidApiCalls, paidApiCallsLast7Days, paidApiCallsLast30Days, byPath] = await Promise.all([
      PaidApiCall.countDocuments(),
      PaidApiCall.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      PaidApiCall.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      PaidApiCall.aggregate([
        { $group: { _id: "$path", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    const dailyPaidCalls = await PaidApiCall.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const agentAgg = await Chat.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.toolUsage": { $exists: true },
          "messages.toolUsage.status": "complete",
        },
      },
      {
        $group: {
          _id: null,
          completedPaidToolCalls: { $sum: 1 },
          uniqueChats: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          completedPaidToolCalls: 1,
          chatsWithPaidToolUse: { $size: "$uniqueChats" },
        },
      },
    ]);

    const agentStats = agentAgg[0] || { completedPaidToolCalls: 0, chatsWithPaidToolUse: 0 };

    let insights = {
      totalRequestsLast24h: 0,
      totalRequestsLast7d: 0,
      totalRequestsLast30d: 0,
      errorCountLast7d: 0,
      errorCountLast30d: 0,
      requestsByPath: [],
      dailyRequests: [],
    };
    try {
      const [
        totalRequestsLast24h,
        totalRequestsLast7d,
        totalRequestsLast30d,
        errorCountLast7d,
        errorCountLast30d,
        requestsByPathAgg,
        dailyRequestsAgg,
      ] = await Promise.all([
        ApiRequestLog.countDocuments({ createdAt: { $gte: oneDayAgo } }),
        ApiRequestLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        ApiRequestLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        ApiRequestLog.countDocuments({ createdAt: { $gte: sevenDaysAgo }, statusCode: { $gte: 400 } }),
        ApiRequestLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, statusCode: { $gte: 400 } }),
        ApiRequestLog.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: "$path", count: { $sum: 1 }, avgDurationMs: { $avg: "$durationMs" } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ]),
        ApiRequestLog.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);
      insights = {
        totalRequestsLast24h,
        totalRequestsLast7d,
        totalRequestsLast30d,
        errorCountLast7d,
        errorCountLast30d,
        requestsByPath: requestsByPathAgg.map((p) => ({ path: p._id, count: p.count, avgDurationMs: Math.round(p.avgDurationMs || 0) })),
        dailyRequests: dailyRequestsAgg.map((d) => ({ date: d._id, count: d.count })),
      };
    } catch {
      // ApiRequestLog may be missing or empty
    }

    res.json({
      totalPaidApiCalls,
      paidApiCallsLast7Days,
      paidApiCallsLast30Days,
      completedPaidToolCalls: agentStats.completedPaidToolCalls,
      chatsWithPaidToolUse: agentStats.chatsWithPaidToolUse,
      byPath: byPath.map((p) => ({ path: p._id, count: p.count })),
      dailyPaidCalls: dailyPaidCalls.map((d) => ({ date: d._id, count: d.count })),
      kpiTargets: { paidApiCalls: KPI_TARGET_PAID_API_CALLS, agentSessions: KPI_TARGET_AGENT_SESSIONS },
      insights,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", message: error?.message || "Unknown error" });
  }
});

/**
 * GET /analytics/errors – list of API requests with statusCode >= 400.
 */
router.get("/errors", async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await ApiRequestLog.find(
      { createdAt: { $gte: since }, statusCode: { $gte: 400 } },
      { path: 1, method: 1, statusCode: 1, durationMs: 1, createdAt: 1, source: 1, paid: 1 },
      { sort: { createdAt: -1 }, limit: 500 }
    ).lean();
    res.json({
      errors: logs.map((doc) => ({
        path: doc.path,
        method: doc.method,
        statusCode: doc.statusCode,
        durationMs: doc.durationMs ?? 0,
        createdAt: doc.createdAt,
        source: doc.source,
        paid: !!doc.paid,
      })),
      since: since.toISOString(),
      days,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", message: error?.message || "Unknown error" });
  }
});

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
    "Analytics summary: full data from dexscreener, token-statistic, trending-jupiter, smart-money, binance correlation",
  method: "GET",
  discoverable: true,
  resource: "/analytics/summary",
  outputSchema: {
    api: { type: "string", description: "API version" },
    name: { type: "string", description: "Summary name" },
    updatedAt: { type: "string", description: "ISO timestamp" },
    sections: {
      type: "object",
      description: "Price, volume, correlation, token risk, on-chain data",
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
    ] = await Promise.allSettled([
      fetchDexscreener(),
      fetchTokenStatistic(),
      fetchTrendingJupiter(),
      fetchSmartMoney(),
      fetchBinanceCorrelation(),
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
