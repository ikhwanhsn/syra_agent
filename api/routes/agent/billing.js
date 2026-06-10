/**
 * Self-serve billing + spend summary for agent wallet operators.
 * GET /agent/wallet/billing/summary
 */
import express from 'express';
import AgentWallet from '../../models/agent/AgentWallet.js';
import SignAudit from '../../models/agent/SignAudit.js';
import AgentChatLeaderboard from '../../models/agent/AgentChatLeaderboard.js';
import { requireSession } from '../../utils/requireSession.js';

const router = express.Router();

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function spendSummaryForAnonymousId(anonymousId, since) {
  const match = {
    anonymousId,
    status: 'ok',
    action: 'x402_pay',
    ts: { $gte: since },
  };

  const [totals, byTool, daily] = await Promise.all([
    SignAudit.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalUsd: { $sum: { $ifNull: ['$amountUsd', 0] } },
          callCount: { $sum: 1 },
        },
      },
    ]),
    SignAudit.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$toolId',
          totalUsd: { $sum: { $ifNull: ['$amountUsd', 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalUsd: -1 } },
      { $limit: 15 },
    ]),
    SignAudit.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$ts' } },
          totalUsd: { $sum: { $ifNull: ['$amountUsd', 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const row = totals[0] || { totalUsd: 0, callCount: 0 };
  return {
    totalUsd: row.totalUsd ?? 0,
    callCount: row.callCount ?? 0,
    byTool: byTool.map((t) => ({
      toolId: t._id || 'unknown',
      totalUsd: t.totalUsd ?? 0,
      count: t.count ?? 0,
    })),
    daily: daily.map((d) => ({
      date: d._id,
      totalUsd: d.totalUsd ?? 0,
      count: d.count ?? 0,
    })),
  };
}

router.get('/summary', requireSession({ allowGuest: true }), async (req, res) => {
  try {
    const anonymousId = req.user?.anonymousId;
    if (!anonymousId) {
      return res.status(401).json({ success: false, error: 'auth_required' });
    }

    const chatWallet = await AgentWallet.findOne({
      anonymousId,
      purpose: 'chat',
      status: { $ne: 'retired' },
    }).lean();

    const [last7d, last30d, leaderboard] = await Promise.all([
      spendSummaryForAnonymousId(anonymousId, daysAgo(7)),
      spendSummaryForAnonymousId(anonymousId, daysAgo(30)),
      AgentChatLeaderboard.findOne({ anonymousId }).lean(),
    ]);

    const policy = chatWallet
      ? {
          dailySpendCapUsd: chatWallet.dailySpendCapUsd ?? 250,
          hourlySpendCapUsd: chatWallet.hourlySpendCapUsd ?? 100,
          perTxCapUsd: chatWallet.perTxCapUsd ?? 50,
          allowedToolsCount: Array.isArray(chatWallet.allowedTools)
            ? chatWallet.allowedTools.length
            : 0,
          status: chatWallet.status ?? 'active',
        }
      : null;

    return res.json({
      success: true,
      data: {
        anonymousId,
        agentAddress: chatWallet?.agentAddress ?? null,
        policy,
        spend: { last7d, last30d },
        lifetime: {
          x402VolumeUsd: leaderboard?.x402VolumeUsd ?? last30d.totalUsd,
          totalToolCalls: leaderboard?.totalToolCalls ?? last30d.callCount,
          totalMessages: leaderboard?.totalMessages ?? 0,
          totalChats: leaderboard?.totalChats ?? 0,
        },
        takeRateNote:
          'Syra rail take-rate is embedded in per-route x402 pricing; spend below is agent wallet outflow.',
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[agent/wallet/billing] summary error:', error?.message ?? String(error));
    return res.status(500).json({
      success: false,
      error: error?.message || 'billing_summary_failed',
    });
  }
});

export async function createAgentBillingRouter() {
  return router;
}

export default router;
