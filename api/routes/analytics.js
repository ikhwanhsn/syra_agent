/**
 * KPI / analytics for grant metrics: paid API calls, agent tool usage, and request insights.
 * GET /analytics/kpi - returns aggregated stats for dashboard (volume, errors, latency, paid KPIs).
 */
import express from 'express';
import PaidApiCall from '../models/PaidApiCall.js';
import Chat from '../models/agent/Chat.js';
import ApiRequestLog from '../models/ApiRequestLog.js';

const router = express.Router();

/** Grant KPI success threshold (e.g. 500 paid API calls). */
export const KPI_TARGET_PAID_API_CALLS = 500;
export const KPI_TARGET_AGENT_SESSIONS = 200;

/**
 * GET /analytics/kpi
 * Returns: paid KPIs, agent stats, request volume/errors/latency by path, daily series.
 */
router.get('/kpi', async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Paid API calls (from PaidApiCall collection)
    const [totalPaidApiCalls, paidApiCallsLast7Days, paidApiCallsLast30Days, byPath] = await Promise.all([
      PaidApiCall.countDocuments(),
      PaidApiCall.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      PaidApiCall.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      PaidApiCall.aggregate([
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    // Daily series for last 30 days (for chart)
    const dailyPaidCalls = await PaidApiCall.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Agent: completed paid tool calls (messages with toolUsage.status === 'complete')
    const agentAgg = await Chat.aggregate([
      { $unwind: '$messages' },
      {
        $match: {
          'messages.toolUsage': { $exists: true },
          'messages.toolUsage.status': 'complete',
        },
      },
      {
        $group: {
          _id: null,
          completedPaidToolCalls: { $sum: 1 },
          uniqueChats: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          completedPaidToolCalls: 1,
          chatsWithPaidToolUse: { $size: '$uniqueChats' },
        },
      },
    ]);

    const agentStats = agentAgg[0] || {
      completedPaidToolCalls: 0,
      chatsWithPaidToolUse: 0,
    };

    // Request insights (volume, errors, latency) from ApiRequestLog
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
          {
            $group: {
              _id: '$path',
              count: { $sum: 1 },
              avgDurationMs: { $avg: '$durationMs' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ]),
        ApiRequestLog.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);
      insights = {
        totalRequestsLast24h,
        totalRequestsLast7d,
        totalRequestsLast30d,
        errorCountLast7d,
        errorCountLast30d,
        requestsByPath: requestsByPathAgg.map((p) => ({
          path: p._id,
          count: p.count,
          avgDurationMs: Math.round(p.avgDurationMs || 0),
        })),
        dailyRequests: dailyRequestsAgg.map((d) => ({ date: d._id, count: d.count })),
      };
    } catch {
      // ApiRequestLog may be missing or empty (e.g. fresh deploy)
    }

    const payload = {
      totalPaidApiCalls,
      paidApiCallsLast7Days,
      paidApiCallsLast30Days,
      completedPaidToolCalls: agentStats.completedPaidToolCalls,
      chatsWithPaidToolUse: agentStats.chatsWithPaidToolUse,
      byPath: byPath.map((p) => ({ path: p._id, count: p.count })),
      dailyPaidCalls: dailyPaidCalls.map((d) => ({ date: d._id, count: d.count })),
      kpiTargets: {
        paidApiCalls: KPI_TARGET_PAID_API_CALLS,
        agentSessions: KPI_TARGET_AGENT_SESSIONS,
      },
      insights,
      updatedAt: now.toISOString(),
    };

    res.json(payload);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    });
  }
});

/**
 * GET /analytics/errors
 * Query: days=7|30 (default 30)
 * Returns: list of API requests that returned statusCode >= 400 (path, method, statusCode, durationMs, createdAt).
 */
router.get('/errors', async (req, res) => {
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
    res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
    });
  }
});

export async function createAnalyticsRouter() {
  return router;
}

export default router;
