/**
 * KOL marketplace domain service — campaigns, submissions, snapshots, payouts.
 */
import mongoose from "mongoose";
import { isMongooseConnected } from "../config/mongoose.js";
import KolCampaign from "../models/KolCampaign.js";
import KolSubmission from "../models/KolSubmission.js";
import KolEngagementSnapshot from "../models/KolEngagementSnapshot.js";
import KolPayout from "../models/KolPayout.js";
import {
  computeProRataPayouts,
  fetchSourceTweet,
  normalizeWallet,
  refreshSubmissionMetrics,
  validateSubmissionTweet,
} from "./kolEngagementService.js";
import {
  KOL_PLATFORM_FEE_BPS,
  KOL_USER_REWARD_BPS,
  getS3labsFeeWallet,
  splitRewardPool,
} from "../config/kolMarketplaceConfig.js";
import {
  getPoolWalletAddress,
  isPoolWalletConfigured,
  sendPayout,
  verifyDeposit,
} from "../services/kolPoolWallet.js";
import { isTwitterApiIoConfigured } from "./twitterApiIoClient.js";

const LAMPORTS_PER_SOL = 1_000_000_000;
const MIN_REWARD_LAMPORTS = 10_000_000; // 0.01 SOL

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("mongodb_not_connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

function assertTwitter() {
  if (!isTwitterApiIoConfigured()) {
    const err = new Error("TWITTER_API_KEY is not configured");
    err.code = "twitterapi_unavailable";
    throw err;
  }
}

/**
 * @param {unknown} id
 */
function assertObjectId(id) {
  const s = String(id || "").trim();
  if (!mongoose.Types.ObjectId.isValid(s)) {
    const err = new Error("Invalid campaign id");
    err.code = "invalid_id";
    throw err;
  }
  return s;
}

/**
 * @param {import("../models/KolCampaign.js").default | Record<string, unknown>} campaign
 */
function getCampaignKolPoolLamports(campaign) {
  const doc = campaign;
  if (doc.kolRewardPoolLamports != null && Number(doc.kolRewardPoolLamports) > 0) {
    return Number(doc.kolRewardPoolLamports);
  }
  return splitRewardPool(doc.rewardLamports).kolPoolLamports;
}

/**
 * @param {import("../models/KolCampaign.js").default | Record<string, unknown>} campaign
 */
function getCampaignPlatformFeeLamports(campaign) {
  const doc = campaign;
  if (doc.platformFeeLamports != null && Number(doc.platformFeeLamports) >= 0) {
    return Number(doc.platformFeeLamports);
  }
  return splitRewardPool(doc.rewardLamports).platformFeeLamports;
}

/**
 * @param {import("../models/KolCampaign.js").default} campaign
 */
function serializeCampaign(campaign) {
  const doc = campaign.toObject ? campaign.toObject() : campaign;
  const { kolPoolLamports, platformFeeLamports } = splitRewardPool(doc.rewardLamports);
  const kolRewardPoolLamports = doc.kolRewardPoolLamports ?? kolPoolLamports;
  const platformFee = doc.platformFeeLamports ?? platformFeeLamports;
  return {
    id: String(doc._id),
    projectWallet: doc.projectWallet,
    sourceTweetId: doc.sourceTweetId,
    sourceTweetUrl: doc.sourceTweetUrl,
    sourceTweetText: doc.sourceTweetText || "",
    title: doc.title,
    description: doc.description || "",
    rewardLamports: doc.rewardLamports,
    rewardSol: doc.rewardLamports / LAMPORTS_PER_SOL,
    kolRewardPoolLamports,
    kolRewardPoolSol: kolRewardPoolLamports / LAMPORTS_PER_SOL,
    platformFeeLamports: platformFee,
    platformFeeSol: platformFee / LAMPORTS_PER_SOL,
    kolRewardPercent: KOL_USER_REWARD_BPS / 100,
    platformFeePercent: KOL_PLATFORM_FEE_BPS / 100,
    platformFeeWallet: getS3labsFeeWallet(),
    platformFeeTxSignature: doc.platformFeeTxSignature ?? null,
    platformFeeStatus: doc.platformFeeStatus ?? null,
    depositTxSignature: doc.depositTxSignature,
    status: doc.status,
    startAt: doc.startAt ? new Date(doc.startAt).toISOString() : null,
    endAt: doc.endAt ? new Date(doc.endAt).toISOString() : null,
    durationDays: doc.durationDays,
    lastSnapshotAt: doc.lastSnapshotAt ? new Date(doc.lastSnapshotAt).toISOString() : null,
    finalizedAt: doc.finalizedAt ? new Date(doc.finalizedAt).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    poolWalletAddress: getPoolWalletAddress(),
  };
}

/**
 * @param {import("../models/KolSubmission.js").default} submission
 */
function serializeSubmission(submission) {
  const doc = submission.toObject ? submission.toObject() : submission;
  return {
    id: String(doc._id),
    campaignId: String(doc.campaignId),
    kolWallet: doc.kolWallet,
    tweetId: doc.tweetId,
    tweetUrl: doc.tweetUrl,
    mode: doc.mode,
    authorHandle: doc.authorHandle,
    verified: doc.verified,
    latestMetrics: doc.latestMetrics || {},
    latestScore: doc.latestScore ?? 0,
    projectedLamports: doc.projectedLamports ?? 0,
    projectedSol: (doc.projectedLamports ?? 0) / LAMPORTS_PER_SOL,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

/**
 * @param {{ projectWallet: string; sourceTweetUrl: string; title: string; description?: string; rewardSol: number; durationDays: number }} input
 */
export async function createCampaign(input) {
  assertMongo();
  assertTwitter();

  const projectWallet = normalizeWallet(input.projectWallet);
  if (!projectWallet) {
    const err = new Error("projectWallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const title = String(input.title || "").trim();
  if (!title) {
    const err = new Error("title is required");
    err.code = "invalid_title";
    throw err;
  }

  const rewardSol = Number(input.rewardSol);
  if (!Number.isFinite(rewardSol) || rewardSol <= 0) {
    const err = new Error("rewardSol must be a positive number");
    err.code = "invalid_reward";
    throw err;
  }

  const durationDays = Math.floor(Number(input.durationDays));
  if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 90) {
    const err = new Error("durationDays must be between 1 and 90");
    err.code = "invalid_duration";
    throw err;
  }

  const rewardLamports = Math.floor(rewardSol * LAMPORTS_PER_SOL);
  if (rewardLamports < MIN_REWARD_LAMPORTS) {
    const err = new Error(`Minimum reward is ${MIN_REWARD_LAMPORTS / LAMPORTS_PER_SOL} SOL`);
    err.code = "reward_too_low";
    throw err;
  }

  const sourceTweet = await fetchSourceTweet(input.sourceTweetUrl);

  const campaign = await KolCampaign.create({
    projectWallet,
    sourceTweetId: sourceTweet.id,
    sourceTweetUrl: sourceTweet.url,
    sourceTweetText: sourceTweet.text,
    title,
    description: String(input.description || "").trim(),
    rewardLamports,
    durationDays,
    status: "pending_deposit",
  });

  const { kolPoolLamports, platformFeeLamports } = splitRewardPool(rewardLamports);

  return {
    campaign: serializeCampaign(campaign),
    deposit: {
      poolWalletAddress: getPoolWalletAddress(),
      rewardLamports,
      rewardSol: rewardLamports / LAMPORTS_PER_SOL,
      kolRewardPoolLamports: kolPoolLamports,
      kolRewardPoolSol: kolPoolLamports / LAMPORTS_PER_SOL,
      platformFeeLamports,
      platformFeeSol: platformFeeLamports / LAMPORTS_PER_SOL,
      kolRewardPercent: KOL_USER_REWARD_BPS / 100,
      platformFeePercent: KOL_PLATFORM_FEE_BPS / 100,
      platformFeeWallet: getS3labsFeeWallet(),
    },
  };
}

/**
 * @param {string} campaignId
 * @param {{ txSignature: string; projectWallet: string }} input
 */
export async function confirmCampaignDeposit(campaignId, input) {
  assertMongo();

  const id = assertObjectId(campaignId);
  const campaign = await KolCampaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }

  if (campaign.status !== "pending_deposit") {
    const err = new Error("Campaign is not awaiting deposit");
    err.code = "invalid_status";
    throw err;
  }

  const projectWallet = normalizeWallet(input.projectWallet);
  if (projectWallet !== campaign.projectWallet) {
    const err = new Error("projectWallet does not match campaign");
    err.code = "wallet_mismatch";
    throw err;
  }

  const txSignature = String(input.txSignature || "").trim();
  if (!txSignature) {
    const err = new Error("txSignature is required");
    err.code = "invalid_tx";
    throw err;
  }

  await verifyDeposit({
    txSignature,
    expectedLamports: campaign.rewardLamports,
    fromWallet: projectWallet,
  });

  const now = new Date();
  const endAt = new Date(now.getTime() + campaign.durationDays * 24 * 60 * 60 * 1000);

  campaign.depositTxSignature = txSignature;
  const { kolPoolLamports, platformFeeLamports } = splitRewardPool(campaign.rewardLamports);
  campaign.kolRewardPoolLamports = kolPoolLamports;
  campaign.platformFeeLamports = platformFeeLamports;
  campaign.platformFeeStatus = "pending";
  campaign.status = "active";
  campaign.startAt = now;
  campaign.endAt = endAt;
  await campaign.save();

  return { campaign: serializeCampaign(campaign) };
}

/**
 * @param {{ status?: string; limit?: number }} [opts]
 */
export async function listCampaigns(opts = {}) {
  assertMongo();

  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const filter = {};

  const status = String(opts.status || "").trim();
  if (status) {
    filter.status = status;
  } else {
    filter.status = { $in: ["active", "completed", "pending_deposit"] };
  }

  const campaigns = await KolCampaign.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const ids = campaigns.map((c) => c._id);
  const submissionCounts = await KolSubmission.aggregate([
    { $match: { campaignId: { $in: ids } } },
    { $group: { _id: "$campaignId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(submissionCounts.map((r) => [String(r._id), r.count]));

  return {
    campaigns: campaigns.map((c) => ({
      ...serializeCampaign(c),
      submissionCount: countMap.get(String(c._id)) ?? 0,
    })),
  };
}

/**
 * @param {string} campaignId
 */
export async function getCampaignDetail(campaignId) {
  assertMongo();

  const id = assertObjectId(campaignId);
  const campaign = await KolCampaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }

  const submissions = await KolSubmission.find({ campaignId: campaign._id })
    .sort({ latestScore: -1, createdAt: 1 })
    .lean();

  const payouts = await KolPayout.find({ campaignId: campaign._id }).lean();
  const payoutMap = new Map(payouts.map((p) => [String(p.submissionId), p]));

  return {
    campaign: serializeCampaign(campaign),
    leaderboard: submissions.map((s) => ({
      ...serializeSubmission(s),
      payout: payoutMap.has(String(s._id))
        ? {
            lamports: payoutMap.get(String(s._id)).lamports,
            sol: payoutMap.get(String(s._id)).lamports / LAMPORTS_PER_SOL,
            txSignature: payoutMap.get(String(s._id)).txSignature,
            status: payoutMap.get(String(s._id)).status,
          }
        : null,
    })),
  };
}

/**
 * @param {string} campaignId
 * @param {{ kolWallet: string; tweetUrl: string }} input
 */
export async function createSubmission(campaignId, input) {
  assertMongo();
  assertTwitter();

  const id = assertObjectId(campaignId);
  const campaign = await KolCampaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }

  if (campaign.status !== "active") {
    const err = new Error("Campaign is not active");
    err.code = "invalid_status";
    throw err;
  }

  if (campaign.endAt && new Date() > new Date(campaign.endAt)) {
    const err = new Error("Campaign has ended");
    err.code = "campaign_ended";
    throw err;
  }

  const kolWallet = normalizeWallet(input.kolWallet);
  if (!kolWallet) {
    const err = new Error("kolWallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const validated = await validateSubmissionTweet(campaign.sourceTweetId, input.tweetUrl);

  const existingWallet = await KolSubmission.findOne({
    campaignId: campaign._id,
    kolWallet,
  });
  if (existingWallet) {
    const err = new Error("You already submitted for this campaign");
    err.code = "duplicate_submission";
    throw err;
  }

  const submission = await KolSubmission.create({
    campaignId: campaign._id,
    kolWallet,
    tweetId: validated.tweetId,
    tweetUrl: validated.tweetUrl,
    mode: validated.mode,
    authorHandle: validated.authorHandle,
    verified: true,
    latestMetrics: validated.metrics,
    latestScore: validated.score,
    projectedLamports: 0,
  });

  await refreshCampaignProjections(campaign._id);

  return { submission: serializeSubmission(submission) };
}

/**
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 */
export async function refreshCampaignProjections(campaignId) {
  const campaign = await KolCampaign.findById(campaignId);
  if (!campaign) return;

  const submissions = await KolSubmission.find({ campaignId: campaign._id }).lean();
  const kolPool = getCampaignKolPoolLamports(campaign);
  const payouts = computeProRataPayouts(submissions, kolPool);
  const payoutMap = new Map(payouts.map((p) => [String(p.submissionId), p.lamports]));

  await Promise.all(
    submissions.map((s) =>
      KolSubmission.updateOne(
        { _id: s._id },
        { $set: { projectedLamports: payoutMap.get(String(s._id)) ?? 0 } },
      ),
    ),
  );
}

/**
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 */
export async function refreshCampaignMetrics(campaignId) {
  const campaign = await KolCampaign.findById(campaignId);
  if (!campaign || campaign.status !== "active") {
    return { refreshed: 0 };
  }

  const submissions = await KolSubmission.find({ campaignId: campaign._id });
  const capturedAt = new Date();
  let refreshed = 0;

  for (const submission of submissions) {
    try {
      const metrics = await refreshSubmissionMetrics(submission.tweetId);
      submission.latestMetrics = metrics.metrics;
      submission.latestScore = metrics.score;
      submission.authorHandle = metrics.authorHandle;
      await submission.save();

      await KolEngagementSnapshot.create({
        campaignId: campaign._id,
        submissionId: submission._id,
        capturedAt,
        metrics: metrics.metrics,
        score: metrics.score,
      });
      refreshed += 1;
    } catch (e) {
      console.warn(
        `[kol] metric refresh failed submission=${submission._id}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  campaign.lastSnapshotAt = capturedAt;
  await campaign.save();
  await refreshCampaignProjections(campaign._id);

  return { refreshed, capturedAt: capturedAt.toISOString() };
}

/**
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 */
export async function finalizeCampaign(campaignId) {
  const campaign = await KolCampaign.findById(campaignId);
  if (!campaign) {
    return { success: false, error: "not_found" };
  }

  if (campaign.status === "completed") {
    return { success: true, alreadyFinalized: true };
  }

  if (campaign.status !== "active") {
    return { success: false, error: "invalid_status" };
  }

  await refreshCampaignMetrics(campaign._id);

  const submissions = await KolSubmission.find({ campaignId: campaign._id }).lean();
  const kolPool = getCampaignKolPoolLamports(campaign);
  const payoutRows = computeProRataPayouts(submissions, kolPool);
  const platformFeeLamports = getCampaignPlatformFeeLamports(campaign);

  if (!isPoolWalletConfigured()) {
    const err = new Error("KOL_POOL_WALLET_PRIVATE_KEY is not configured");
    err.code = "pool_wallet_unconfigured";
    throw err;
  }

  const results = [];

  if (
    platformFeeLamports > 0 &&
    campaign.platformFeeStatus !== "confirmed"
  ) {
    try {
      const feeSent = await sendPayout({
        toWallet: getS3labsFeeWallet(),
        lamports: platformFeeLamports,
      });
      campaign.platformFeeTxSignature = feeSent.txSignature;
      campaign.platformFeeStatus = "confirmed";
      await campaign.save();
      results.push({
        type: "platform_fee",
        status: "confirmed",
        txSignature: feeSent.txSignature,
        lamports: platformFeeLamports,
        toWallet: getS3labsFeeWallet(),
      });
    } catch (e) {
      campaign.platformFeeStatus = "failed";
      await campaign.save();
      results.push({
        type: "platform_fee",
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
        lamports: platformFeeLamports,
      });
    }
  } else if (campaign.platformFeeStatus === "confirmed") {
    results.push({ type: "platform_fee", status: "confirmed", skipped: true });
  }

  for (const row of payoutRows) {
    const existing = await KolPayout.findOne({
      campaignId: campaign._id,
      submissionId: row.submissionId,
    });
    if (existing?.status === "confirmed") {
      results.push({ submissionId: row.submissionId, status: "confirmed", skipped: true });
      continue;
    }

    const payoutDoc =
      existing ??
      (await KolPayout.create({
        campaignId: campaign._id,
        submissionId: row.submissionId,
        kolWallet: row.kolWallet,
        lamports: row.lamports,
        status: "pending",
      }));

    try {
      const sent = await sendPayout({ toWallet: row.kolWallet, lamports: row.lamports });
      payoutDoc.txSignature = sent.txSignature;
      payoutDoc.status = "confirmed";
      payoutDoc.error = null;
      await payoutDoc.save();
      results.push({
        type: "kol",
        submissionId: row.submissionId,
        status: "confirmed",
        txSignature: sent.txSignature,
        lamports: row.lamports,
      });
    } catch (e) {
      payoutDoc.status = "failed";
      payoutDoc.error = e instanceof Error ? e.message : String(e);
      await payoutDoc.save();
      results.push({
        type: "kol",
        submissionId: row.submissionId,
        status: "failed",
        error: payoutDoc.error,
      });
    }
  }

  campaign.status = "completed";
  campaign.finalizedAt = new Date();
  await campaign.save();

  return { success: true, payouts: results };
}

/**
 * @param {string} wallet
 */
export async function getWalletEarnings(wallet) {
  assertMongo();

  const kolWallet = normalizeWallet(wallet);
  if (!kolWallet) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const submissions = await KolSubmission.find({ kolWallet })
    .sort({ createdAt: -1 })
    .lean();

  const campaignIds = [...new Set(submissions.map((s) => String(s.campaignId)))];
  const campaigns = await KolCampaign.find({ _id: { $in: campaignIds } }).lean();
  const campaignMap = new Map(campaigns.map((c) => [String(c._id), c]));

  const payouts = await KolPayout.find({ kolWallet }).lean();
  const payoutMap = new Map(payouts.map((p) => [String(p.submissionId), p]));

  const active = [];
  const paid = [];
  let totalProjectedLamports = 0;
  let totalPaidLamports = 0;

  for (const s of submissions) {
    const campaign = campaignMap.get(String(s.campaignId));
    if (!campaign) continue;

    const row = {
      submission: serializeSubmission(s),
      campaign: serializeCampaign(campaign),
      payout: null,
    };

    const payout = payoutMap.get(String(s._id));
    if (payout?.status === "confirmed") {
      row.payout = {
        lamports: payout.lamports,
        sol: payout.lamports / LAMPORTS_PER_SOL,
        txSignature: payout.txSignature,
        status: payout.status,
      };
      totalPaidLamports += payout.lamports;
      paid.push(row);
    } else if (campaign.status === "active") {
      totalProjectedLamports += s.projectedLamports ?? 0;
      active.push(row);
    }
  }

  return {
    wallet: kolWallet,
    active,
    paid,
    totals: {
      projectedLamports: totalProjectedLamports,
      projectedSol: totalProjectedLamports / LAMPORTS_PER_SOL,
      paidLamports: totalPaidLamports,
      paidSol: totalPaidLamports / LAMPORTS_PER_SOL,
    },
  };
}

/**
 * Process all active campaigns — refresh metrics and finalize ended ones.
 */
export async function runKolDailyTick() {
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }

  const now = new Date();
  const activeCampaigns = await KolCampaign.find({ status: "active" }).lean();
  const refreshed = [];
  const finalized = [];

  for (const campaign of activeCampaigns) {
    try {
      const refreshResult = await refreshCampaignMetrics(campaign._id);
      refreshed.push({ campaignId: String(campaign._id), ...refreshResult });

      if (campaign.endAt && now >= new Date(campaign.endAt)) {
        const result = await finalizeCampaign(campaign._id);
        finalized.push({ campaignId: String(campaign._id), ...result });
      }
    } catch (e) {
      console.warn(
        `[kol] daily tick failed campaign=${campaign._id}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return { success: true, refreshed, finalized };
}
