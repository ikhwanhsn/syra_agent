/**
 * Analytics: KPI dashboard (grant metrics) + V2 summary (x402 paid).
 * GET /analytics/kpi, /analytics/errors – dashboard (no payment).
 * GET/POST /analytics/summary – x402 paid: trending Jupiter, smart money, Binance correlation
 */
import express from "express";
import PaidApiCall from "../models/PaidApiCall.js";
import Chat from "../models/agent/Chat.js";
import ApiRequestLog from "../models/ApiRequestLog.js";
import PlaygroundShare from "../models/PlaygroundShare.js";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_ANALYTICS_SUMMARY_USD } from "../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import {
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
 * GET /analytics/kpi-extended – extended KPI data for internal dashboard.
 * Returns revenue, users, engagement, playground, and system health metrics.
 */
router.get("/kpi-extended", async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Revenue: paid calls by source (api vs agent), by day, by path with amounts
    const [
      paidBySourceAgg,
      dailyPaidBySource,
      paidByPathAndSource,
      hourlyPaidToday,
    ] = await Promise.all([
      PaidApiCall.aggregate([
        { $group: { _id: "$source", count: { $sum: 1 } } },
      ]),
      PaidApiCall.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              source: { $ifNull: ["$source", "api"] },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
      PaidApiCall.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { path: "$path", source: { $ifNull: ["$source", "api"] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]),
      PaidApiCall.aggregate([
        { $match: { createdAt: { $gte: oneDayAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%dT%H:00:00", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Previous 30d paid calls for comparison
    const paidPrev30d = await PaidApiCall.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
    });
    const paidCurr30d = await PaidApiCall.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Users & Engagement from Chat model
    const [
      totalChats,
      chatsLast7d,
      chatsLast30d,
      uniqueUsersTotal,
      uniqueUsersLast7d,
      uniqueUsersLast30d,
      chatEngagementAgg,
      dailyNewChats,
      dailyActiveUsers,
      topAgents,
    ] = await Promise.all([
      Chat.countDocuments(),
      Chat.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Chat.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Chat.distinct("anonymousId").then((ids) => ids.filter(Boolean).length),
      Chat.distinct("anonymousId", { updatedAt: { $gte: sevenDaysAgo } }).then((ids) => ids.filter(Boolean).length),
      Chat.distinct("anonymousId", { updatedAt: { $gte: thirtyDaysAgo } }).then((ids) => ids.filter(Boolean).length),
      Chat.aggregate([
        { $project: { msgCount: { $size: { $ifNull: ["$messages", []] } } } },
        { $group: { _id: null, avgMessages: { $avg: "$msgCount" }, totalMessages: { $sum: "$msgCount" }, maxMessages: { $max: "$msgCount" } } },
      ]),
      Chat.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Chat.aggregate([
        { $match: { updatedAt: { $gte: thirtyDaysAgo }, anonymousId: { $ne: null } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } }, users: { $addToSet: "$anonymousId" } } },
        { $project: { _id: 1, count: { $size: "$users" } } },
        { $sort: { _id: 1 } },
      ]),
      Chat.aggregate([
        { $match: { agentId: { $ne: "" }, agentId: { $exists: true } } },
        { $group: { _id: "$agentId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const engagementStats = chatEngagementAgg[0] || { avgMessages: 0, totalMessages: 0, maxMessages: 0 };

    // Tool usage from chats
    const toolUsageAgg = await Chat.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.toolUsage": { $exists: true } } },
      {
        $group: {
          _id: "$messages.toolUsage.name",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$messages.toolUsage.status", "complete"] }, 1, 0] } },
          errors: { $sum: { $cond: [{ $eq: ["$messages.toolUsage.status", "error"] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 20 },
    ]);

    // Playground: shares metrics
    const [
      totalShares,
      sharesLast7d,
      sharesLast30d,
      sharesByChain,
      dailyShares,
    ] = await Promise.all([
      PlaygroundShare.countDocuments(),
      PlaygroundShare.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      PlaygroundShare.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      PlaygroundShare.aggregate([
        { $group: { _id: { $ifNull: ["$sharedByChain", "unknown"] }, count: { $sum: 1 } } },
      ]),
      PlaygroundShare.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // System Health: latency percentiles, error rates by endpoint
    let health = {
      avgLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      errorRateByEndpoint: [],
      statusCodeDistribution: [],
      dailyErrorRate: [],
      slowestEndpoints: [],
    };
    try {
      const [
        latencyAgg,
        errorRateByEndpointAgg,
        statusDistAgg,
        dailyErrorRateAgg,
        slowestEndpointsAgg,
      ] = await Promise.all([
        ApiRequestLog.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo }, durationMs: { $gt: 0 } } },
          { $sort: { durationMs: 1 } },
          {
            $group: {
              _id: null,
              avg: { $avg: "$durationMs" },
              values: { $push: "$durationMs" },
              count: { $sum: 1 },
            },
          },
        ]),
        ApiRequestLog.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: "$path",
              total: { $sum: 1 },
              errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
              avgDuration: { $avg: "$durationMs" },
            },
          },
          { $match: { errors: { $gt: 0 } } },
          { $project: { _id: 1, total: 1, errors: 1, errorRate: { $multiply: [{ $divide: ["$errors", "$total"] }, 100] }, avgDuration: 1 } },
          { $sort: { errors: -1 } },
          { $limit: 15 },
        ]),
        ApiRequestLog.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: {
                $switch: {
                  branches: [
                    { case: { $lt: ["$statusCode", 300] }, then: "2xx" },
                    { case: { $lt: ["$statusCode", 400] }, then: "3xx" },
                    { case: { $lt: ["$statusCode", 500] }, then: "4xx" },
                  ],
                  default: "5xx",
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        ApiRequestLog.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              total: { $sum: 1 },
              errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
            },
          },
          { $project: { _id: 1, total: 1, errors: 1, errorRate: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$errors", "$total"] }, 100] }, 0] } } },
          { $sort: { _id: 1 } },
        ]),
        ApiRequestLog.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo }, durationMs: { $gt: 0 } } },
          {
            $group: {
              _id: "$path",
              avgDuration: { $avg: "$durationMs" },
              maxDuration: { $max: "$durationMs" },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gte: 5 } } },
          { $sort: { avgDuration: -1 } },
          { $limit: 10 },
        ]),
      ]);

      let p95 = 0;
      let p99 = 0;
      let avg = 0;
      if (latencyAgg[0]) {
        const vals = latencyAgg[0].values;
        avg = Math.round(latencyAgg[0].avg);
        const p95Idx = Math.floor(vals.length * 0.95);
        const p99Idx = Math.floor(vals.length * 0.99);
        p95 = vals[p95Idx] || 0;
        p99 = vals[p99Idx] || 0;
      }

      health = {
        avgLatency: avg,
        p95Latency: Math.round(p95),
        p99Latency: Math.round(p99),
        errorRateByEndpoint: errorRateByEndpointAgg.map((e) => ({
          path: e._id,
          total: e.total,
          errors: e.errors,
          errorRate: Math.round(e.errorRate * 10) / 10,
          avgDuration: Math.round(e.avgDuration || 0),
        })),
        statusCodeDistribution: statusDistAgg.map((s) => ({ status: s._id, count: s.count })),
        dailyErrorRate: dailyErrorRateAgg.map((d) => ({
          date: d._id,
          total: d.total,
          errors: d.errors,
          errorRate: Math.round(d.errorRate * 10) / 10,
        })),
        slowestEndpoints: slowestEndpointsAgg.map((e) => ({
          path: e._id,
          avgDuration: Math.round(e.avgDuration),
          maxDuration: Math.round(e.maxDuration),
          count: e.count,
        })),
      };
    } catch {
      // ApiRequestLog may not exist
    }

    // Conversion: requests -> paid requests ratio
    let conversion = { totalRequests30d: 0, paidRequests30d: 0, conversionRate: 0 };
    try {
      const [totalReqs, paidReqs] = await Promise.all([
        ApiRequestLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        ApiRequestLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo }, paid: true }),
      ]);
      conversion = {
        totalRequests30d: totalReqs,
        paidRequests30d: paidReqs,
        conversionRate: totalReqs > 0 ? Math.round((paidReqs / totalReqs) * 10000) / 100 : 0,
      };
    } catch { /* ignore */ }

    res.json({
      revenue: {
        bySource: paidBySourceAgg.map((s) => ({ source: s._id || "api", count: s.count })),
        dailyBySource: dailyPaidBySource.map((d) => ({ date: d._id.date, source: d._id.source, count: d.count })),
        byPathAndSource: paidByPathAndSource.map((p) => ({ path: p._id.path, source: p._id.source, count: p.count })),
        hourlyToday: hourlyPaidToday.map((h) => ({ hour: h._id, count: h.count })),
        paidPrev30d,
        paidCurr30d,
        growthPct: paidPrev30d > 0 ? Math.round(((paidCurr30d - paidPrev30d) / paidPrev30d) * 10000) / 100 : 0,
      },
      users: {
        totalChats,
        chatsLast7d,
        chatsLast30d,
        uniqueUsersTotal,
        uniqueUsersLast7d,
        uniqueUsersLast30d,
        avgMessagesPerChat: Math.round((engagementStats.avgMessages || 0) * 10) / 10,
        totalMessages: engagementStats.totalMessages || 0,
        maxMessagesInChat: engagementStats.maxMessages || 0,
        dailyNewChats: dailyNewChats.map((d) => ({ date: d._id, count: d.count })),
        dailyActiveUsers: dailyActiveUsers.map((d) => ({ date: d._id, count: d.count })),
        topAgents: topAgents.map((a) => ({ agentId: a._id, count: a.count })),
        toolUsage: toolUsageAgg.map((t) => ({
          name: t._id || "unknown",
          total: t.total,
          completed: t.completed,
          errors: t.errors,
          successRate: t.total > 0 ? Math.round((t.completed / t.total) * 10000) / 100 : 0,
        })),
      },
      playground: {
        totalShares,
        sharesLast7d,
        sharesLast30d,
        byChain: sharesByChain.map((c) => ({ chain: c._id, count: c.count })),
        dailyShares: dailyShares.map((d) => ({ date: d._id, count: d.count })),
      },
      health,
      conversion,
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
    "Analytics summary: trending-jupiter, smart-money (Nansen), Binance correlation",
  method: "GET",
  discoverable: true,
  resource: "/analytics/summary",
  outputSchema: {
    api: { type: "string", description: "API version" },
    name: { type: "string", description: "Summary name" },
    updatedAt: { type: "string", description: "ISO timestamp" },
    sections: {
      type: "object",
      description: "Trending tokens, correlation, smart money flows",
    },
  },
};

/**
 * GET /summary
 * POST /summary
 * x402 V2: payment required. Bundles trending Jupiter, Nansen smart money, Binance correlation.
 * skipSettle: if true, do not call settlePaymentAndSetResponse (for /summary/dev).
 */
async function handleSummary(req, res, options = {}) {
  try {
    /** Run upstream fetches and x402 settle in parallel — payment is already verified in middleware. */
    const fetchWork = Promise.allSettled([
      fetchTrendingJupiter(),
      fetchSmartMoney(),
      fetchBinanceCorrelation(),
    ]);
    const settleWork = options.skipSettle ? Promise.resolve(null) : settlePaymentAndSetResponse(res, req);
    const [fetchSettled] = await Promise.all([fetchWork, settleWork]);
    const [trendingJupiterResult, smartMoneyResult, binanceCorrelationResult] = fetchSettled;

    const trendingJupiter =
      trendingJupiterResult.status === "fulfilled"
        ? wrapFulfilled(trendingJupiterResult.value)
        : wrapRejected(trendingJupiterResult.reason);
    const smartMoney =
      smartMoneyResult.status === "fulfilled"
        ? wrapFulfilled(smartMoneyResult.value)
        : wrapRejected(smartMoneyResult.reason);
    const binanceCorrelation =
      binanceCorrelationResult.status === "fulfilled"
        ? wrapFulfilled(binanceCorrelationResult.value)
        : wrapRejected(binanceCorrelationResult.reason);

    const summary = {
      api: "v2",
      name: "Analytics API Summary",
      updatedAt: new Date().toISOString(),
      sections: {
        price: {
          title: "Trending & momentum",
          trendingJupiter,
        },
        correlation: {
          title: "Correlation",
          binance: binanceCorrelation,
        },
        onChain: {
          title: "On-chain & flow",
          smartMoney,
        },
      },
    };

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
