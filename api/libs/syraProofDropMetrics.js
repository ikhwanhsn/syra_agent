import PaidApiCall from "../models/PaidApiCall.js";
import Chat from "../models/agent/Chat.js";
import PlaygroundShare from "../models/PlaygroundShare.js";
import ApiRequestLog from "../models/ApiRequestLog.js";

function pct(n, signed = false) {
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

/**
 * Lightweight live metrics for proof-drop copy (mirrors internal dashboard KPIs).
 */
export async function gatherProofDropMetrics() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalPaidApiCalls,
    paidApiCallsLast7Days,
    paidApiCallsLast30Days,
    paidPrev30d,
    paidCurr30d,
    totalChats,
    chatsLast30d,
    uniqueUsersTotal,
    uniqueUsersLast7d,
    playgroundTotalShares,
    playgroundSharesLast7d,
    totalRequestsLast7d,
    paidRequestsLast30d,
    totalRequestsLast30d,
    engagementAgg,
  ] = await Promise.all([
    PaidApiCall.countDocuments(),
    PaidApiCall.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    PaidApiCall.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    PaidApiCall.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
    PaidApiCall.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Chat.countDocuments(),
    Chat.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Chat.distinct("anonymousId").then((ids) => ids.filter(Boolean).length),
    Chat.distinct("anonymousId", { updatedAt: { $gte: sevenDaysAgo } }).then((ids) =>
      ids.filter(Boolean).length,
    ),
    PlaygroundShare.countDocuments(),
    PlaygroundShare.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ApiRequestLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    PaidApiCall.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ApiRequestLog.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Chat.aggregate([
      { $project: { msgCount: { $size: { $ifNull: ["$messages", []] } } } },
      { $group: { _id: null, avgMessages: { $avg: "$msgCount" } } },
    ]),
  ]);

  const growthPct = paidPrev30d > 0 ? ((paidCurr30d - paidPrev30d) / paidPrev30d) * 100 : 0;
  const conversionRate =
    totalRequestsLast30d > 0 ? (paidRequestsLast30d / totalRequestsLast30d) * 100 : 0;
  const avgMessagesPerChat = engagementAgg[0]?.avgMessages ?? 0;

  return {
    totalPaidApiCalls,
    paidApiCallsLast7Days,
    paidApiCallsLast30Days,
    paidGrowth30dPct: growthPct,
    paidGrowth30dLabel: pct(growthPct, true),
    paidCurr30d,
    paidPrev30d,
    totalChats,
    chatsLast30d,
    uniqueUsersTotal,
    uniqueUsersLast7d,
    avgMessagesPerChat: Number(avgMessagesPerChat.toFixed(1)),
    playgroundTotalShares,
    playgroundSharesLast7d,
    requestsLast7d: totalRequestsLast7d,
    paidConversionRate: conversionRate,
    paidConversionLabel: pct(conversionRate),
    paidRequestsLast30d,
    updatedAt: now.toISOString(),
  };
}

export function formatMetricsForLlm(metrics) {
  return `LIVE METRICS (use these exact numbers):
- Total paid x402 calls (all time): ${metrics.totalPaidApiCalls.toLocaleString()}
- Paid calls last 7d: ${metrics.paidApiCallsLast7Days.toLocaleString()}
- Paid calls last 30d: ${metrics.paidApiCallsLast30Days.toLocaleString()}
- 30d paid growth: ${metrics.paidGrowth30dLabel} (${metrics.paidCurr30d.toLocaleString()} vs ${metrics.paidPrev30d.toLocaleString()} prior 30d)
- Unique users (all time): ${metrics.uniqueUsersTotal.toLocaleString()}
- Active users last 7d: ${metrics.uniqueUsersLast7d.toLocaleString()}
- Total agent chats: ${metrics.totalChats.toLocaleString()}
- New chats last 30d: ${metrics.chatsLast30d.toLocaleString()}
- Avg messages per chat: ${metrics.avgMessagesPerChat}
- Paid conversion (30d): ${metrics.paidConversionLabel}
- API requests last 7d: ${metrics.requestsLast7d.toLocaleString()}
- Playground shares (all time): ${metrics.playgroundTotalShares.toLocaleString()}
- Playground shares last 7d: ${metrics.playgroundSharesLast7d.toLocaleString()}
- Snapshot at: ${metrics.updatedAt}`;
}
