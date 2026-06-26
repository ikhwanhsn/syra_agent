/**
 * S3Labs growth metrics — aggregated funnel data for the internal admin dashboard.
 */
import { isMongooseConnected } from "../../config/mongoose.js";
import { EVENT_SCOUT_DB_ID } from "../../config/eventScoutConfig.js";
import { HACKATHON_SCOUT_DB_ID } from "../../config/hackathonScoutConfig.js";
import { S3LABS_JOB_AGENT } from "../../config/s3labsAgentsConfig.js";
import {
  applyJobFreshness,
  applyEventFreshness,
  applyHackathonFreshness,
  daysAgo,
} from "../discoveryFreshness.js";
import { getMarketplaceStats } from "../kolMarketplaceService.js";
import S3labsJob from "../../models/S3labsJob.js";
import Event from "../../models/Event.js";
import Hackathon from "../../models/Hackathon.js";
import AgentWallet from "../../models/agent/AgentWallet.js";
import StreamflowStakingWallet from "../../models/StreamflowStakingWallet.js";
import DashboardResearch from "../../models/DashboardResearch.js";
import KolCampaign from "../../models/KolCampaign.js";
import KolPayout from "../../models/KolPayout.js";

const LAMPORTS_PER_SOL = 1_000_000_000;
const TREND_DAYS = 30;

function assertMongo() {
  if (!isMongooseConnected()) {
    throw new Error("MongoDB not connected");
  }
}

/**
 * @param {Array<{ _id: string | null; count: number }>} rows
 * @param {string} [allKey]
 * @returns {Record<string, number>}
 */
function groupCountsToRecord(rows, allKey = "all") {
  const out = { [allKey]: 0 };
  for (const row of rows) {
    const key = row._id == null ? "unknown" : String(row._id);
    out[key] = row.count;
    out[allKey] += row.count;
  }
  return out;
}

/**
 * @param {import('mongoose').Model} Model
 * @param {string} dateField
 * @param {Date} since
 * @returns {Promise<Array<{ date: string; count: number }>>}
 */
async function dailyDiscoveryTrend(Model, dateField, since) {
  const rows = await Model.aggregate([
    { $match: { [dateField]: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => ({ date: r._id, count: r.count }));
}

/**
 * @param {string} dbId
 * @returns {Promise<{ savedAt: string | null; ranAt: string | null; totalNew: number | null; totalUpdated: number | null }>}
 */
async function loadScoutRunMeta(dbId) {
  const doc = await DashboardResearch.findOne({ id: dbId }).lean();
  if (!doc) {
    return { savedAt: null, ranAt: null, totalNew: null, totalUpdated: null };
  }
  const payload = doc.payload && typeof doc.payload === "object" ? doc.payload : {};
  const ranAt =
    typeof payload.ranAt === "string"
      ? payload.ranAt
      : doc.savedAt
        ? new Date(doc.savedAt).toISOString()
        : null;
  return {
    savedAt: doc.savedAt ? new Date(doc.savedAt).toISOString() : null,
    ranAt,
    totalNew: typeof payload.totalNew === "number" ? payload.totalNew : null,
    totalUpdated: typeof payload.totalUpdated === "number" ? payload.totalUpdated : null,
  };
}

async function getKolExtendedMetrics() {
  const base = await getMarketplaceStats();

  const [platformFeeAgg, payoutStatusRows, campaignsPerDay] = await Promise.all([
    KolCampaign.aggregate([
      { $match: { status: { $in: ["active", "completed"] } } },
      {
        $group: {
          _id: null,
          totalPlatformFeeLamports: {
            $sum: {
              $cond: [
                { $gt: [{ $ifNull: ["$platformFeeLamports", 0] }, 0] },
                "$platformFeeLamports",
                { $multiply: ["$rewardLamports", 0.2] },
              ],
            },
          },
          confirmedPlatformFeeLamports: {
            $sum: {
              $cond: [
                { $eq: ["$platformFeeStatus", "confirmed"] },
                { $ifNull: ["$platformFeeLamports", 0] },
                0,
              ],
            },
          },
        },
      },
    ]),
    KolPayout.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    KolCampaign.aggregate([
      { $match: { createdAt: { $gte: daysAgo(TREND_DAYS) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const payoutByStatus = groupCountsToRecord(payoutStatusRows);
  const confirmedPayouts = payoutByStatus.confirmed ?? 0;
  const failedPayouts = payoutByStatus.failed ?? 0;
  const payoutAttempts = confirmedPayouts + failedPayouts + (payoutByStatus.pending ?? 0);
  const payoutSuccessRate =
    payoutAttempts > 0 ? Math.round((confirmedPayouts / payoutAttempts) * 1000) / 10 : null;

  const platformFeeLamports = platformFeeAgg[0]?.totalPlatformFeeLamports ?? 0;
  const confirmedPlatformFeeLamports = platformFeeAgg[0]?.confirmedPlatformFeeLamports ?? 0;

  return {
    ...base,
    cancelledCampaigns: base.totalCampaigns - base.activeCampaigns - base.completedCampaigns - base.pendingDepositCampaigns,
    platformFeesSol: platformFeeLamports / LAMPORTS_PER_SOL,
    confirmedPlatformFeesSol: confirmedPlatformFeeLamports / LAMPORTS_PER_SOL,
    payoutSuccessRate,
    payoutByStatus,
    campaignsPerDay: campaignsPerDay.map((r) => ({ date: r._id, count: r.count })),
  };
}

async function getJobsMetrics(now) {
  const since = daysAgo(TREND_DAYS, now);
  const freshFilter = applyJobFreshness({}, { now });

  const [
    totalAllTime,
    totalFresh,
    remoteCount,
    postedToTelegram,
    byCategory,
    bySource,
    newPerDay,
  ] = await Promise.all([
    S3labsJob.countDocuments(),
    S3labsJob.countDocuments(freshFilter),
    S3labsJob.countDocuments({ ...freshFilter, remote: true }),
    S3labsJob.countDocuments({ postedToTelegram: true }),
    S3labsJob.aggregate([
      { $match: freshFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    S3labsJob.aggregate([
      { $match: freshFilter },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    dailyDiscoveryTrend(S3labsJob, "firstSeenAt", since),
  ]);

  const remotePercent =
    totalFresh > 0 ? Math.round((remoteCount / totalFresh) * 1000) / 10 : 0;

  return {
    totalAllTime,
    totalFresh,
    remoteCount,
    remotePercent,
    postedToTelegram,
    byCategory: groupCountsToRecord(byCategory),
    bySource: groupCountsToRecord(bySource),
    newPerDay,
  };
}

async function getEventsMetrics(now) {
  const since = daysAgo(TREND_DAYS, now);
  const upcomingFilter = applyEventFreshness({}, { now });

  const [
    totalAllTime,
    totalUpcoming,
    indonesiaUpcoming,
    globalUpcoming,
    byStatus,
    bySource,
    byCategory,
    discoveriesPerDay,
  ] = await Promise.all([
    Event.countDocuments(),
    Event.countDocuments(upcomingFilter),
    Event.countDocuments({ ...upcomingFilter, isIndonesia: true }),
    Event.countDocuments({ ...upcomingFilter, isIndonesia: false }),
    Event.aggregate([
      { $match: upcomingFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Event.aggregate([
      { $match: upcomingFilter },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]),
    Event.aggregate([
      { $match: upcomingFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    dailyDiscoveryTrend(Event, "discoveredAt", since),
  ]);

  return {
    totalAllTime,
    totalUpcoming,
    indonesiaUpcoming,
    globalUpcoming,
    byStatus: groupCountsToRecord(byStatus),
    bySource: groupCountsToRecord(bySource),
    byCategory: groupCountsToRecord(byCategory),
    discoveriesPerDay,
  };
}

async function getHackathonsMetrics(now) {
  const since = daysAgo(TREND_DAYS, now);
  const freshFilter = applyHackathonFreshness({}, { now });

  const [
    totalAllTime,
    totalFresh,
    indonesiaFresh,
    byStatus,
    byOpenState,
    bySource,
    prizeAgg,
    discoveriesPerDay,
  ] = await Promise.all([
    Hackathon.countDocuments(),
    Hackathon.countDocuments(freshFilter),
    Hackathon.countDocuments({ ...freshFilter, isIndonesia: true }),
    Hackathon.aggregate([
      { $match: freshFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Hackathon.aggregate([
      { $match: freshFilter },
      { $group: { _id: "$openState", count: { $sum: 1 } } },
    ]),
    Hackathon.aggregate([
      { $match: freshFilter },
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]),
    Hackathon.aggregate([
      { $match: { ...freshFilter, prizeAmountUsd: { $ne: null, $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalPrizeUsd: { $sum: "$prizeAmountUsd" },
          avgPrizeUsd: { $avg: "$prizeAmountUsd" },
          totalRegistrations: { $sum: { $ifNull: ["$registrationsCount", 0] } },
        },
      },
    ]),
    dailyDiscoveryTrend(Hackathon, "discoveredAt", since),
  ]);

  return {
    totalAllTime,
    totalFresh,
    indonesiaFresh,
    byStatus: groupCountsToRecord(byStatus),
    byOpenState: groupCountsToRecord(byOpenState),
    bySource: groupCountsToRecord(bySource),
    totalPrizeUsd: prizeAgg[0]?.totalPrizeUsd ?? 0,
    avgPrizeUsd: Math.round((prizeAgg[0]?.avgPrizeUsd ?? 0) * 100) / 100,
    totalRegistrations: prizeAgg[0]?.totalRegistrations ?? 0,
    discoveriesPerDay,
  };
}

async function getWalletsMetrics() {
  const [connectedWallets, stakerAgg] = await Promise.all([
    AgentWallet.countDocuments({
      walletAddress: { $exists: true, $nin: [null, ""] },
    }),
    StreamflowStakingWallet.aggregate([
      { $match: { activeLockCount: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          stakerCount: { $sum: 1 },
          totalStakedRaw: {
            $sum: {
              $convert: {
                input: "$activeStakedAmountRaw",
                to: "double",
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
      },
    ]),
  ]);

  const stakerCount = stakerAgg[0]?.stakerCount ?? 0;
  const totalStakedRaw = stakerAgg[0]?.totalStakedRaw ?? 0;

  return {
    connectedWallets,
    stakerCount,
    totalStakedRaw: String(Math.floor(totalStakedRaw)),
  };
}

async function getRunsMetrics() {
  const [events, hackathons, jobs] = await Promise.all([
    loadScoutRunMeta(EVENT_SCOUT_DB_ID),
    loadScoutRunMeta(HACKATHON_SCOUT_DB_ID),
    loadScoutRunMeta(S3LABS_JOB_AGENT.dbId),
  ]);

  return { events, hackathons, jobs };
}

/**
 * Full growth metrics payload for the internal dashboard.
 */
export async function getGrowthMetrics() {
  assertMongo();
  const now = new Date();

  const [kol, jobs, events, hackathons, wallets, runs] = await Promise.all([
    getKolExtendedMetrics(),
    getJobsMetrics(now),
    getEventsMetrics(now),
    getHackathonsMetrics(now),
    getWalletsMetrics(),
    getRunsMetrics(),
  ]);

  const funnel = {
    acquisition: {
      connectedWallets: wallets.connectedWallets,
      discoveryReach:
        jobs.totalFresh + events.totalUpcoming + hackathons.totalFresh,
      uniqueKols: kol.uniqueKols,
      uniqueProjects: kol.uniqueProjects,
    },
    activation: {
      totalCampaigns: kol.totalCampaigns,
      activeCampaigns: kol.activeCampaigns,
      pendingDepositCampaigns: kol.pendingDepositCampaigns,
      eventsInterested:
        (events.byStatus.interested ?? 0) + (events.byStatus.registered ?? 0),
      hackathonsJoined:
        (hackathons.byStatus.joined ?? 0) +
        (hackathons.byStatus.in_progress ?? 0) +
        (hackathons.byStatus.submitted ?? 0),
    },
    engagement: {
      totalSubmissions: kol.totalSubmissions,
      engagementTotal: kol.engagement.total,
      eventsAttended: events.byStatus.attended ?? 0,
      hackathonsSubmitted: hackathons.byStatus.submitted ?? 0,
      stakerCount: wallets.stakerCount,
    },
    monetization: {
      totalFundedSol: kol.totalRewardSol,
      totalPaidSol: kol.totalPaidSol,
      platformFeesSol: kol.platformFeesSol,
      confirmedPlatformFeesSol: kol.confirmedPlatformFeesSol,
    },
  };

  return {
    generatedAt: now.toISOString(),
    trendDays: TREND_DAYS,
    kol,
    jobs,
    events,
    hackathons,
    wallets,
    runs,
    funnel,
  };
}
