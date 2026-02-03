/**
 * KPI / analytics for grant metrics: paid API calls and agent tool usage.
 * GET /analytics/kpi - returns aggregated stats for dashboard (no auth).
 */
import express from 'express';
import PaidApiCall from '../models/PaidApiCall.js';
import Chat from '../models/agent/Chat.js';

const router = express.Router();

/** Grant KPI success threshold (e.g. 500 paid API calls). */
export const KPI_TARGET_PAID_API_CALLS = 500;
export const KPI_TARGET_AGENT_SESSIONS = 200;

/**
 * GET /analytics/kpi
 * Returns: totalPaidApiCalls, paidApiCallsLast7Days, paidApiCallsLast30Days,
 * completedPaidToolCalls (from agent chats), chatsWithPaidToolUse, daily series for charts.
 */
router.get('/kpi', async (req, res) => {
  try {
    const now = new Date();
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
      updatedAt: now.toISOString(),
    };

    res.json(payload);
  } catch (error) {
    console.error('[analytics/kpi]', error);
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
