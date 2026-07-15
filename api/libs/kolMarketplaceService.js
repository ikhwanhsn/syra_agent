/**
 * KOL marketplace domain service — campaigns, submissions, snapshots, payouts.
 */
import mongoose from "mongoose";
import { isMongooseConnected } from "../config/mongoose.js";
import KolCampaign from "../models/KolCampaign.js";
import KolCampaignTopUp from "../models/KolCampaignTopUp.js";
import KolSubmission from "../models/KolSubmission.js";
import KolEngagementSnapshot from "../models/KolEngagementSnapshot.js";
import KolPayout from "../models/KolPayout.js";
import KolPendingPayoutBalance from "../models/KolPendingPayoutBalance.js";
import KolReputation from "../models/KolReputation.js";
import {
  computeProRataPayouts,
  fetchSourceTweet,
  normalizeWallet,
  refreshSubmissionMetrics,
  validateSubmissionTweet,
} from "./kolEngagementService.js";
import { isAdminWalletAddress } from "./adminWallet.js";
import {
  KOL_PLATFORM_FEE_SOL,
  MAX_DURATION_DAYS,
  MIN_DURATION_DAYS,
  MIN_KOL_REWARD_SOL,
  MIN_KOL_REWARD_LAMPORTS,
  MIN_KOL_PAYOUT_LAMPORTS,
  MIN_KOL_PAYOUT_SOL,
  MIN_TOPUP_KOL_REWARD_SOL,
  computeTopUpDeposit,
  getS3labsFeeWallet,
  minTotalDepositSol,
  solToLamports,
  splitRewardPool,
} from "../config/kolMarketplaceConfig.js";
import {
  getPoolWalletAddress,
  isPoolWalletConfigured,
  sendPayout,
  verifyDeposit,
} from "../services/kolPoolWallet.js";
import {
  getTweetById,
  isTwitterApiIoConfigured,
} from "./twitterApiIoClient.js";
import {
  getCachedXProfile,
  getCachedXProfiles,
  refreshAllMarketplaceXProfiles,
  seedXProfileFromAuthor,
} from "./kolXProfileCache.js";
import {
  awardCampaignCreationPoints,
  awardCampaignPoints,
} from "./s3labsPointsService.js";
import { notifyNewCampaignTelegram } from "./kolCampaignTelegramNotifier.js";
import { notifyNewCampaign } from "./emailSubscriberService.js";
import { discoverCampaignEngagements } from "./kolDiscoveryService.js";
import { startupVerbose } from "../utils/startupLog.js";
import {
  getVerifiedWalletForHandle,
  getVerifiedWalletsForHandles,
  getWalletVerification,
} from "./kolXVerificationService.js";

const AUTO_SWEEP_BATCH_LIMIT = 20;

const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * @param {string} handle
 */
function normalizeHandle(handle) {
  return String(handle || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

/**
 * Fill missing profile pictures from the DB X profile cache only.
 * Never calls twitterapi.io on page load — pictures are filled by the daily
 * refreshAllMarketplaceXProfiles job (and write-path seedXProfileFromAuthor).
 * @template {{ profilePicture?: string | null }} T
 * @param {T[]} entries
 * @param {(entry: T) => string} getHandle
 * @param {{ limit?: number }} [opts]
 */
async function enrichMissingProfilePictures(entries, getHandle, opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 12, 1), 25);
  const targets = entries
    .filter((entry) => !entry.profilePicture)
    .slice(0, limit);
  if (targets.length === 0) return entries;

  const handles = targets.map((entry) => getHandle(entry)).filter(Boolean);
  const profileMap = await getCachedXProfiles(handles);

  for (const entry of targets) {
    const handle = getHandle(entry);
    if (!handle) continue;
    const cached = profileMap.get(normalizeHandle(handle));
    if (cached?.profilePicture) {
      entry.profilePicture = cached.profilePicture;
    }
  }

  return entries;
}

/**
 * @param {{ userName?: string; name?: string; followers?: number; verified?: boolean } | null | undefined} author
 */
function authorFieldsFromTweet(author) {
  const handle = String(author?.userName || "")
    .trim()
    .replace(/^@/, "");
  if (!handle) {
    return {
      sourceAuthorHandle: null,
      sourceAuthorName: null,
      sourceAuthorFollowers: null,
      sourceAuthorVerified: false,
    };
  }
  return {
    sourceAuthorHandle: handle,
    sourceAuthorName: String(author?.name || handle).trim() || handle,
    sourceAuthorFollowers:
      author?.followers != null && Number.isFinite(Number(author.followers))
        ? Number(author.followers)
        : null,
    sourceAuthorVerified: Boolean(author?.verified),
  };
}

/**
 * @param {{ likeCount?: number; retweetCount?: number; replyCount?: number; quoteCount?: number; viewCount?: number } | null | undefined} metrics
 */
function sumEngagementMetrics(metrics) {
  return {
    likes: metrics?.likeCount ?? 0,
    retweets: metrics?.retweetCount ?? 0,
    replies: metrics?.replyCount ?? 0,
    quotes: metrics?.quoteCount ?? 0,
    views: metrics?.viewCount ?? 0,
  };
}

/**
 * @param {{ likes: number; retweets: number; replies: number; quotes: number; views: number }} totals
 */
function engagementTotal(totals) {
  return (
    totals.likes +
    totals.retweets +
    totals.replies +
    totals.quotes +
    totals.views
  );
}

/**
 * @param {{ status?: string; txSignature?: string | null } | null | undefined} payout
 */
function isPayoutSettled(payout) {
  if (!payout) return false;
  if (payout.status === "failed") return false;
  if (payout.status === "pending_minimum") return false;
  if (payout.status === "confirmed") return true;
  return Boolean(payout.txSignature);
}

/**
 * @param {string} kolWallet
 */
async function getPendingPayoutBalanceLamports(kolWallet) {
  const doc = await KolPendingPayoutBalance.findOne({ kolWallet }).lean();
  return doc?.pendingLamports ?? 0;
}

/**
 * @param {string} kolWallet
 * @param {number} pendingLamports
 */
async function setPendingPayoutBalanceLamports(kolWallet, pendingLamports) {
  const amount = Math.max(0, Math.floor(Number(pendingLamports) || 0));
  await KolPendingPayoutBalance.findOneAndUpdate(
    { kolWallet },
    { $set: { pendingLamports: amount } },
    { upsert: true, new: true },
  );
  return amount;
}

/**
 * @param {string} kolWallet
 */
async function clearPendingPayoutBalance(kolWallet) {
  await KolPendingPayoutBalance.findOneAndUpdate(
    { kolWallet },
    { $set: { pendingLamports: 0 } },
    { upsert: true },
  );
}

/**
 * @param {{ lamports: number; txSignature?: string | null; status?: string }} payout
 */
function serializePayout(payout) {
  const settled = isPayoutSettled(payout);
  return {
    lamports: payout.lamports,
    sol: payout.lamports / LAMPORTS_PER_SOL,
    txSignature: payout.txSignature ?? null,
    status: settled ? "confirmed" : (payout.status ?? "pending"),
  };
}

/**
 * @param {unknown} error
 */
function throwIfDuplicateSubmissionError(error) {
  if (
    !error ||
    typeof error !== "object" ||
    !("code" in error) ||
    error.code !== 11000
  ) {
    throw error;
  }

  const mongoErr =
    /** @type {{ keyPattern?: Record<string, unknown>; keyValue?: Record<string, unknown> }} */ (
      error
    );
  const keyPattern = mongoErr.keyPattern ?? {};

  if (keyPattern.tweetId) {
    const dup = new Error("This post was already submitted to this campaign");
    dup.code = "duplicate_post";
    throw dup;
  }
  if (keyPattern.authorHandleKey) {
    const dup = new Error(
      "This X account already submitted one post for this campaign",
    );
    dup.code = "duplicate_kol_handle";
    throw dup;
  }
  if (keyPattern.kolWallet) {
    const dup = new Error("This wallet already submitted for this campaign");
    dup.code = "duplicate_submission";
    throw dup;
  }

  const dup = new Error("This submission already exists for this campaign");
  dup.code = "duplicate_submission";
  throw dup;
}

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
  if (
    doc.kolRewardPoolLamports != null &&
    Number(doc.kolRewardPoolLamports) > 0
  ) {
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
  const kolRewardPoolLamports = getCampaignKolPoolLamports(doc);
  const platformFee = getCampaignPlatformFeeLamports(doc);
  return {
    id: String(doc._id),
    projectWallet: doc.projectWallet,
    sourceTweetId: doc.sourceTweetId,
    sourceTweetUrl: doc.sourceTweetUrl,
    sourceTweetText: doc.sourceTweetText || "",
    sourceTweetMedia: Array.isArray(doc.sourceTweetMedia)
      ? doc.sourceTweetMedia
          .map((item) => ({
            mediaType: String(item?.mediaType || "photo"),
            url: String(item?.url || ""),
            previewUrl: item?.previewUrl ? String(item.previewUrl) : null,
          }))
          .filter((item) => item.url)
      : [],
    sourceAuthorHandle: doc.sourceAuthorHandle ?? null,
    sourceAuthorName: doc.sourceAuthorName ?? null,
    sourceAuthorFollowers: doc.sourceAuthorFollowers ?? null,
    sourceAuthorVerified: Boolean(doc.sourceAuthorVerified),
    title: doc.title,
    description: doc.description || "",
    rewardLamports: doc.rewardLamports,
    rewardSol: doc.rewardLamports / LAMPORTS_PER_SOL,
    kolRewardPoolLamports,
    kolRewardPoolSol: kolRewardPoolLamports / LAMPORTS_PER_SOL,
    platformFeeLamports: platformFee,
    platformFeeSol: platformFee / LAMPORTS_PER_SOL,
    platformFeeWallet: getS3labsFeeWallet(),
    platformFeeTxSignature: doc.platformFeeTxSignature ?? null,
    platformFeeStatus: doc.platformFeeStatus ?? null,
    depositTxSignature: doc.depositTxSignature,
    status: doc.status,
    startAt: doc.startAt ? new Date(doc.startAt).toISOString() : null,
    endAt: doc.endAt ? new Date(doc.endAt).toISOString() : null,
    durationDays: doc.durationDays,
    requireCreatedOneCampaign: Boolean(doc.requireCreatedOneCampaign),
    lastSnapshotAt: doc.lastSnapshotAt
      ? new Date(doc.lastSnapshotAt).toISOString()
      : null,
    finalizedAt: doc.finalizedAt
      ? new Date(doc.finalizedAt).toISOString()
      : null,
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
    kolWallet: doc.kolWallet ?? null,
    tweetId: doc.tweetId,
    tweetUrl: doc.tweetUrl,
    mode: doc.mode,
    authorHandle: doc.authorHandle,
    authorHandleKey: doc.authorHandleKey ?? normalizeHandle(doc.authorHandle),
    authorFollowers: doc.authorFollowers ?? null,
    authorVerified: doc.authorVerified ?? false,
    verified: doc.verified,
    latestMetrics: doc.latestMetrics || {},
    latestScore: doc.latestScore ?? 0,
    scoreBreakdown: doc.scoreBreakdown ?? null,
    finalScore: doc.finalScore ?? null,
    reputationCreditedAt: doc.reputationCreditedAt
      ? new Date(doc.reputationCreditedAt).toISOString()
      : null,
    projectedLamports: doc.projectedLamports ?? 0,
    projectedSol: (doc.projectedLamports ?? 0) / LAMPORTS_PER_SOL,
    earnedLamports: doc.earnedLamports ?? 0,
    earnedSol: (doc.earnedLamports ?? 0) / LAMPORTS_PER_SOL,
    claimStatus: doc.claimStatus ?? "unearned",
    discoveredAt: doc.discoveredAt
      ? new Date(doc.discoveredAt).toISOString()
      : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

/**
 * @param {{
 *   projectWallet: string;
 *   sourceTweetUrl: string;
 *   title: string;
 *   description?: string;
 *   rewardSol: number;
 *   durationDays: number;
 *   requireCreatedOneCampaign?: boolean;
 * }} input
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

  // Participation rules are admin-only; ignore the flag for non-admin creators.
  const requireCreatedOneCampaign =
    Boolean(input.requireCreatedOneCampaign) &&
    isAdminWalletAddress(projectWallet);

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
  if (
    !Number.isFinite(durationDays) ||
    durationDays < MIN_DURATION_DAYS ||
    durationDays > MAX_DURATION_DAYS
  ) {
    const err = new Error(
      `durationDays must be between ${MIN_DURATION_DAYS} and ${MAX_DURATION_DAYS}`,
    );
    err.code = "invalid_duration";
    throw err;
  }

  const existingPendingDeposit = await KolCampaign.countDocuments({
    projectWallet,
    status: "pending_deposit",
  });
  if (existingPendingDeposit >= 1) {
    const err = new Error(
      "You already have a pending deposit campaign. Fund or wait for it to expire before creating another.",
    );
    err.code = "pending_deposit_limit";
    throw err;
  }

  const rewardLamports = solToLamports(rewardSol);
  const { kolPoolLamports, platformFeeLamports } =
    splitRewardPool(rewardLamports);
  if (kolPoolLamports < MIN_KOL_REWARD_LAMPORTS) {
    const err = new Error(
      `Minimum KOL reward is ${MIN_KOL_REWARD_SOL} SOL — deposit at least ${minTotalDepositSol()} SOL total (${MIN_KOL_REWARD_SOL} SOL reward + ${KOL_PLATFORM_FEE_SOL} SOL platform fee)`,
    );
    err.code = "reward_too_low";
    throw err;
  }

  const sourceTweet = await fetchSourceTweet(input.sourceTweetUrl);
  const authorFields = authorFieldsFromTweet(sourceTweet.author);
  await seedXProfileFromAuthor(sourceTweet.author).catch(() => {});

  const campaign = await KolCampaign.create({
    projectWallet,
    sourceTweetId: sourceTweet.id,
    sourceTweetUrl: sourceTweet.url,
    sourceTweetText: sourceTweet.text,
    sourceTweetMedia: sourceTweet.media ?? [],
    ...authorFields,
    title,
    description: String(input.description || "").trim(),
    rewardLamports,
    durationDays,
    requireCreatedOneCampaign,
    status: "pending_deposit",
  });

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
  const endAt = new Date(
    now.getTime() + campaign.durationDays * 24 * 60 * 60 * 1000,
  );

  campaign.depositTxSignature = txSignature;
  const { kolPoolLamports, platformFeeLamports } = splitRewardPool(
    campaign.rewardLamports,
  );
  campaign.kolRewardPoolLamports = kolPoolLamports;
  campaign.platformFeeLamports = platformFeeLamports;
  campaign.platformFeeStatus = "pending";
  campaign.status = "active";
  campaign.startAt = now;
  campaign.endAt = endAt;
  await campaign.save();

  await awardCampaignCreationPoints(campaign);

  // Unlocking this wallet may change projected shares on gated campaigns.
  refreshGatedCampaignProjectionsForWallet(projectWallet).catch((e) => {
    console.warn(
      `[kol] gated projection refresh after create failed wallet=${projectWallet}:`,
      e instanceof Error ? e.message : e,
    );
  });

  const serializedCampaign = serializeCampaign(campaign);

  notifyNewCampaignTelegram(serializedCampaign).catch((e) => {
    console.warn(
      "[kol] campaign Telegram notify failed:",
      e instanceof Error ? e.message : e,
    );
  });

  notifyNewCampaign(serializedCampaign).catch((e) => {
    console.warn(
      "[kol] campaign email notify failed:",
      e instanceof Error ? e.message : e,
    );
  });

  discoverCampaignEngagements(campaign._id, { force: true })
    .then(() => refreshCampaignMetrics(campaign._id, { force: true }))
    .catch((e) => {
      console.warn(
        `[kol] initial engagement snapshot failed campaign=${campaign._id}:`,
        e instanceof Error ? e.message : e,
      );
    });

  return { campaign: serializeCampaign(campaign) };
}

/**
 * Delete an unfunded campaign draft. Only the creator can delete, and only
 * while status is still pending_deposit (no deposit confirmed yet).
 *
 * @param {string} campaignId
 * @param {{ projectWallet: string }} input
 */
export async function cancelPendingCampaign(campaignId, input) {
  assertMongo();

  const id = assertObjectId(campaignId);
  const campaign = await KolCampaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }

  if (campaign.status !== "pending_deposit") {
    const err = new Error("Only unpaid draft campaigns can be deleted");
    err.code = "invalid_status";
    throw err;
  }

  const projectWallet = normalizeWallet(input.projectWallet);
  if (!projectWallet || projectWallet !== campaign.projectWallet) {
    const err = new Error("projectWallet does not match campaign");
    err.code = "wallet_mismatch";
    throw err;
  }

  const snapshot = serializeCampaign(campaign);
  await KolCampaign.deleteOne({ _id: campaign._id, status: "pending_deposit" });

  return { deleted: true, campaignId: snapshot.id, campaign: snapshot };
}

/**
 * @param {import("../models/KolCampaignTopUp.js").default | Record<string, unknown>} topUp
 */
function serializeTopUp(topUp) {
  const doc = topUp.toObject ? topUp.toObject() : topUp;
  return {
    id: String(doc._id),
    campaignId: String(doc.campaignId),
    projectWallet: doc.projectWallet,
    kolRewardLamports: doc.kolRewardLamports,
    kolRewardSol: doc.kolRewardLamports / LAMPORTS_PER_SOL,
    totalDepositLamports: doc.totalDepositLamports,
    totalDepositSol: doc.totalDepositLamports / LAMPORTS_PER_SOL,
    platformFeeLamports: doc.platformFeeLamports,
    platformFeeSol: doc.platformFeeLamports / LAMPORTS_PER_SOL,
    depositTxSignature: doc.depositTxSignature ?? null,
    platformFeeTxSignature: doc.platformFeeTxSignature ?? null,
    platformFeeStatus: doc.platformFeeStatus ?? null,
    status: doc.status,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    confirmedAt:
      doc.updatedAt && doc.status === "confirmed"
        ? new Date(doc.updatedAt).toISOString()
        : null,
  };
}

/**
 * @param {import("../models/KolCampaign.js").default} campaign
 */
function assertCampaignAcceptsTopUp(campaign) {
  if (campaign.status !== "active") {
    const err = new Error("Only active campaigns can receive reward top-ups");
    err.code = "invalid_status";
    throw err;
  }

  if (campaign.endAt && new Date() >= new Date(campaign.endAt)) {
    const err = new Error("Campaign has ended");
    err.code = "campaign_ended";
    throw err;
  }
}

/**
 * @param {string} campaignId
 * @param {{ projectWallet: string; kolRewardSol: number }} input
 */
export async function createCampaignTopUp(campaignId, input) {
  assertMongo();

  const id = assertObjectId(campaignId);
  const campaign = await KolCampaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }

  assertCampaignAcceptsTopUp(campaign);

  const projectWallet = normalizeWallet(input.projectWallet);
  if (!projectWallet) {
    const err = new Error("projectWallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  if (projectWallet !== campaign.projectWallet) {
    const err = new Error("projectWallet does not match campaign creator");
    err.code = "wallet_mismatch";
    throw err;
  }

  const kolRewardSol = Number(input.kolRewardSol);
  if (!Number.isFinite(kolRewardSol) || kolRewardSol <= 0) {
    const err = new Error("kolRewardSol must be a positive number");
    err.code = "invalid_reward";
    throw err;
  }

  if (kolRewardSol < MIN_TOPUP_KOL_REWARD_SOL) {
    const err = new Error(
      `Minimum top-up reward is ${MIN_TOPUP_KOL_REWARD_SOL} SOL`,
    );
    err.code = "reward_too_low";
    throw err;
  }

  const existingPending = await KolCampaignTopUp.findOne({
    campaignId: campaign._id,
    status: "pending_deposit",
  });
  if (existingPending) {
    const err = new Error(
      "A reward top-up is already awaiting deposit for this campaign",
    );
    err.code = "topup_pending";
    throw err;
  }

  const { kolRewardLamports, platformFeeLamports, totalDepositLamports } =
    computeTopUpDeposit(kolRewardSol);

  const topUp = await KolCampaignTopUp.create({
    campaignId: campaign._id,
    projectWallet,
    kolRewardLamports,
    totalDepositLamports,
    platformFeeLamports,
    status: "pending_deposit",
    platformFeeStatus: "pending",
  });

  return {
    topUp: serializeTopUp(topUp),
    deposit: {
      poolWalletAddress: getPoolWalletAddress(),
      rewardLamports: totalDepositLamports,
      rewardSol: totalDepositLamports / LAMPORTS_PER_SOL,
      kolRewardPoolLamports: kolRewardLamports,
      kolRewardPoolSol: kolRewardLamports / LAMPORTS_PER_SOL,
      platformFeeLamports,
      platformFeeSol: platformFeeLamports / LAMPORTS_PER_SOL,
      platformFeeWallet: getS3labsFeeWallet(),
    },
  };
}

/**
 * @param {string} campaignId
 * @param {string} topUpId
 * @param {{ txSignature: string; projectWallet: string }} input
 */
export async function confirmCampaignTopUp(campaignId, topUpId, input) {
  assertMongo();

  const campaignObjectId = assertObjectId(campaignId);
  const topUpObjectId = assertObjectId(topUpId);

  const campaign = await KolCampaign.findById(campaignObjectId);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }

  assertCampaignAcceptsTopUp(campaign);

  const topUp = await KolCampaignTopUp.findOne({
    _id: topUpObjectId,
    campaignId: campaign._id,
  });
  if (!topUp) {
    const err = new Error("Top-up not found");
    err.code = "not_found";
    throw err;
  }

  if (topUp.status !== "pending_deposit") {
    const err = new Error("Top-up is not awaiting deposit");
    err.code = "invalid_status";
    throw err;
  }

  const projectWallet = normalizeWallet(input.projectWallet);
  if (
    projectWallet !== campaign.projectWallet ||
    projectWallet !== topUp.projectWallet
  ) {
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
    expectedLamports: topUp.totalDepositLamports,
    fromWallet: projectWallet,
  });

  topUp.depositTxSignature = txSignature;
  topUp.status = "confirmed";

  campaign.rewardLamports =
    (campaign.rewardLamports ?? 0) + topUp.totalDepositLamports;
  campaign.kolRewardPoolLamports =
    (campaign.kolRewardPoolLamports ?? getCampaignKolPoolLamports(campaign)) +
    topUp.kolRewardLamports;

  if (topUp.platformFeeLamports > 0 && isPoolWalletConfigured()) {
    try {
      const feeSent = await sendPayout({
        toWallet: getS3labsFeeWallet(),
        lamports: topUp.platformFeeLamports,
      });
      topUp.platformFeeTxSignature = feeSent.txSignature;
      topUp.platformFeeStatus = "confirmed";
    } catch (e) {
      topUp.platformFeeStatus = "failed";
      console.warn(
        `[kol] top-up platform fee failed campaign=${campaignId} topUp=${topUpId}:`,
        e instanceof Error ? e.message : e,
      );
    }
  } else if (topUp.platformFeeLamports > 0) {
    topUp.platformFeeStatus = "failed";
  }

  await topUp.save();
  await campaign.save();
  await refreshCampaignProjections(campaign._id);

  return {
    topUp: serializeTopUp(topUp),
    campaign: serializeCampaign(campaign),
  };
}

/**
 * Public list never exposes other creators' unpaid drafts.
 * Own `pending_deposit` rows are included only when `wallet` matches projectWallet.
 *
 * @param {{ status?: string; limit?: number; wallet?: string }} [opts]
 */
export async function listCampaigns(opts = {}) {
  assertMongo();

  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const viewerWallet = normalizeWallet(opts.wallet);
  const status = String(opts.status || "").trim();

  /** @type {Record<string, unknown>} */
  let filter;

  if (status === "pending_deposit") {
    // Unfunded drafts are private to the creator — never list all of them.
    if (!viewerWallet) {
      return { campaigns: [] };
    }
    filter = { status: "pending_deposit", projectWallet: viewerWallet };
  } else if (status) {
    filter = { status };
  } else if (viewerWallet) {
    filter = {
      $or: [
        { status: { $in: ["active", "completed"] } },
        { status: "pending_deposit", projectWallet: viewerWallet },
      ],
    };
  } else {
    filter = { status: { $in: ["active", "completed"] } };
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
  const countMap = new Map(
    submissionCounts.map((r) => [String(r._id), r.count]),
  );

  return {
    campaigns: campaigns.map((c) => ({
      ...serializeCampaign(c),
      submissionCount: countMap.get(String(c._id)) ?? 0,
    })),
  };
}

/**
 * @param {import("../models/KolCampaign.js").default} campaignDoc
 */
async function ensureCampaignTweetMedia(campaignDoc) {
  const existing = campaignDoc.sourceTweetMedia;
  if (Array.isArray(existing) && existing.length > 0) {
    return existing
      .map((item) => ({
        mediaType: String(item?.mediaType || "photo"),
        url: String(item?.url || ""),
        previewUrl: item?.previewUrl ? String(item.previewUrl) : null,
      }))
      .filter((item) => item.url);
  }

  if (!isTwitterApiIoConfigured()) return [];

  try {
    const { tweet } = await getTweetById(campaignDoc.sourceTweetId);
    const media = tweet.media ?? [];
    if (media.length > 0) {
      await KolCampaign.updateOne(
        { _id: campaignDoc._id },
        { $set: { sourceTweetMedia: media } },
      );
      campaignDoc.sourceTweetMedia = media;
    }
    return media;
  } catch {
    return [];
  }
}

/**
 * @param {string} kolWallet
 */
async function walletHasCreatedCampaign(kolWallet) {
  const ownedCount = await KolCampaign.countDocuments({
    projectWallet: kolWallet,
    status: { $in: ["active", "completed"] },
  });
  return ownedCount >= 1;
}

/**
 * After a wallet funds its first campaign, refresh projections on gated campaigns
 * where they appear on the leaderboard so unlocked rows stop showing 0 SOL.
 * @param {string} kolWallet
 */
async function refreshGatedCampaignProjectionsForWallet(kolWallet) {
  const wallet = normalizeWallet(kolWallet);
  if (!wallet) return;

  /** @type {string[]} */
  const handleKeys = [];
  try {
    const verification = await getWalletVerification(wallet);
    if (verification?.verified && verification.xHandleKey) {
      handleKeys.push(normalizeHandle(verification.xHandleKey));
    }
  } catch {
    // Wallet may be unverified — still match submissions by kolWallet.
  }

  const orClauses = [{ kolWallet: wallet }];
  if (handleKeys.length > 0) {
    orClauses.push({ authorHandleKey: { $in: handleKeys } });
  }

  const submissionCampaignIds = await KolSubmission.distinct("campaignId", {
    $or: orClauses,
  });
  if (submissionCampaignIds.length === 0) return;

  const gatedCampaigns = await KolCampaign.find({
    _id: { $in: submissionCampaignIds },
    status: "active",
    requireCreatedOneCampaign: true,
  })
    .select("_id")
    .lean();

  await Promise.all(
    gatedCampaigns.map((c) => refreshCampaignProjections(c._id)),
  );
}

/**
 * Map X handles to project wallets for campaigns they created (source tweet author).
 * Auto-discovered leaderboard rows have no kolWallet — this links handle → creator wallet.
 * @param {string[]} handleKeys
 * @returns {Promise<Map<string, string>>}
 */
async function getCreatorWalletsBySourceHandleKeys(handleKeys) {
  const keys = [
    ...new Set(
      handleKeys
        .map((handle) => normalizeHandle(handle))
        .filter(Boolean),
    ),
  ];
  if (keys.length === 0) return new Map();

  const handleClauses = keys.map((key) => ({
    sourceAuthorHandle: new RegExp(
      `^${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    ),
  }));

  const campaigns = await KolCampaign.find({
    status: { $in: ["active", "completed", "pending_deposit"] },
    $or: handleClauses,
  })
    .select("sourceAuthorHandle projectWallet")
    .lean();

  /** @type {Map<string, string>} */
  const map = new Map();
  for (const row of campaigns) {
    const key = normalizeHandle(row.sourceAuthorHandle);
    const wallet = normalizeWallet(row.projectWallet);
    if (key && wallet && !map.has(key)) {
      map.set(key, wallet);
    }
  }
  return map;
}

/**
 * Resolve the wallet used to check campaign-creation eligibility for a submission.
 * @param {Record<string, unknown>} submission
 */
async function resolveSubmissionRewardWallet(submission) {
  const directWallet = normalizeWallet(submission.kolWallet);
  if (directWallet) return directWallet;

  const handleKey =
    submission.authorHandleKey || normalizeHandle(submission.authorHandle);
  if (!handleKey) return null;

  const verifiedWallet = await getVerifiedWalletForHandle(handleKey);
  if (verifiedWallet) return verifiedWallet;

  const creatorWallets = await getCreatorWalletsBySourceHandleKeys([handleKey]);
  return creatorWallets.get(handleKey) ?? null;
}

/**
 * @param {import("../models/KolCampaign.js").default | Record<string, unknown>} campaign
 * @param {Array<Record<string, unknown>>} submissions
 */
async function buildRewardEligibilityMap(campaign, submissions) {
  const map = new Map();
  if (!campaign.requireCreatedOneCampaign) {
    for (const submission of submissions) {
      map.set(String(submission._id), true);
    }
    return map;
  }

  const handlesNeedingLookup = new Set();
  for (const submission of submissions) {
    if (!normalizeWallet(submission.kolWallet)) {
      const handleKey =
        submission.authorHandleKey || normalizeHandle(submission.authorHandle);
      if (handleKey) handlesNeedingLookup.add(handleKey);
    }
  }

  const handleKeys = [...handlesNeedingLookup];
  const [verifiedWalletsByHandle, creatorWalletsByHandle] = await Promise.all([
    getVerifiedWalletsForHandles(handleKeys),
    getCreatorWalletsBySourceHandleKeys(handleKeys),
  ]);

  const walletCache = new Map();
  for (const submission of submissions) {
    const submissionId = String(submission._id);
    const handleKey =
      submission.authorHandleKey || normalizeHandle(submission.authorHandle);

    let wallet = normalizeWallet(submission.kolWallet);
    if (!wallet && handleKey) {
      wallet =
        verifiedWalletsByHandle.get(handleKey) ??
        creatorWalletsByHandle.get(handleKey) ??
        null;
    }

    if (!wallet) {
      map.set(submissionId, false);
      continue;
    }
    if (!walletCache.has(wallet)) {
      walletCache.set(wallet, await walletHasCreatedCampaign(wallet));
    }
    map.set(submissionId, walletCache.get(wallet) === true);
  }
  return map;
}

/**
 * @param {import("../models/KolCampaign.js").default | Record<string, unknown>} campaign
 * @param {Array<Record<string, unknown>>} submissions
 */
async function filterRewardEligibleSubmissions(campaign, submissions) {
  const scored = submissions.filter((s) => (s.latestScore ?? 0) > 0);
  if (!campaign.requireCreatedOneCampaign) return scored;

  const eligibilityMap = await buildRewardEligibilityMap(campaign, scored);
  return scored.filter((s) => eligibilityMap.get(String(s._id)) === true);
}

/**
 * @param {import("../models/KolCampaign.js").default | Record<string, unknown>} campaign
 * @param {string | null | undefined} wallet
 */
async function buildViewerClaimEligibility(campaign, wallet) {
  const kolWallet = normalizeWallet(wallet);
  if (!kolWallet || !campaign.requireCreatedOneCampaign) {
    return null;
  }

  const hasCreatedCampaign = await walletHasCreatedCampaign(kolWallet);
  return {
    requireCreatedOneCampaign: true,
    hasCreatedCampaign,
    canClaim: hasCreatedCampaign,
    message: hasCreatedCampaign
      ? null
      : "Create and fund one campaign before this ends — otherwise your reward is forfeited.",
  };
}

/**
 * @param {string} campaignId
 * @param {{ wallet?: string }} [opts]
 */
export async function getCampaignDetail(campaignId, opts = {}) {
  assertMongo();

  const id = assertObjectId(campaignId);
  let campaign = await KolCampaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }

  // Unfunded drafts are only visible to the creator (pool address stays private to others).
  if (campaign.status === "pending_deposit") {
    const viewerWallet = normalizeWallet(opts.wallet);
    if (!viewerWallet || viewerWallet !== campaign.projectWallet) {
      const err = new Error("Campaign not found");
      err.code = "not_found";
      throw err;
    }
  }

  if (campaign.status === "active" && isCampaignPastEnd(campaign)) {
    try {
      await finalizeCampaign(campaign._id);
      campaign = await KolCampaign.findById(id);
      if (!campaign) {
        const err = new Error("Campaign not found");
        err.code = "not_found";
        throw err;
      }
    } catch (e) {
      console.warn(
        `[kol] auto-finalize failed campaign=${id}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  await ensureCampaignTweetMedia(campaign);

  const submissions = await KolSubmission.find({ campaignId: campaign._id })
    .sort({ latestScore: -1, createdAt: 1 })
    .lean();

  const payouts = await KolPayout.find({ campaignId: campaign._id }).lean();
  const payoutMap = new Map(payouts.map((p) => [String(p.submissionId), p]));

  const viewerClaimEligibility = await buildViewerClaimEligibility(
    campaign,
    opts.wallet,
  );
  const rewardEligibilityMap = await buildRewardEligibilityMap(
    campaign,
    submissions,
  );
  const kolPool = getCampaignKolPoolLamports(campaign);
  const scoredSubmissions = submissions.filter((s) => (s.latestScore ?? 0) > 0);
  const potentialPayouts = computeProRataPayouts(scoredSubmissions, kolPool);
  const potentialPayoutMap = new Map(
    potentialPayouts.map((p) => [String(p.submissionId), p.lamports]),
  );

  // Live eligible-pool projections — stored projectedLamports can be stale until the
  // next snapshot after someone unlocks by creating a campaign.
  let liveProjectedMap = new Map(
    scoredSubmissions.map((s) => [String(s._id), s.projectedLamports ?? 0]),
  );
  if (campaign.requireCreatedOneCampaign) {
    const eligibleSubmissions = scoredSubmissions.filter(
      (s) => rewardEligibilityMap.get(String(s._id)) === true,
    );
    const eligiblePayouts = computeProRataPayouts(eligibleSubmissions, kolPool);
    liveProjectedMap = new Map(
      eligiblePayouts.map((p) => [String(p.submissionId), p.lamports]),
    );

    const projectionsStale = submissions.some((s) => {
      const live = liveProjectedMap.get(String(s._id)) ?? 0;
      return (s.projectedLamports ?? 0) !== live;
    });
    if (projectionsStale && campaign.status === "active") {
      refreshCampaignProjections(campaign._id).catch((e) => {
        console.warn(
          `[kol] projection refresh after eligibility change failed campaign=${campaign._id}:`,
          e instanceof Error ? e.message : e,
        );
      });
    }
  }

  return {
    campaign: serializeCampaign(campaign),
    leaderboard: submissions.map((s) => {
      const submissionId = String(s._id);
      const liveProjectedLamports = campaign.requireCreatedOneCampaign
        ? (liveProjectedMap.get(submissionId) ?? 0)
        : (s.projectedLamports ?? 0);
      return {
        ...serializeSubmission(s),
        projectedLamports: liveProjectedLamports,
        projectedSol: liveProjectedLamports / LAMPORTS_PER_SOL,
        rewardEligible: campaign.requireCreatedOneCampaign
          ? rewardEligibilityMap.get(submissionId) === true
          : null,
        potentialProjectedSol: campaign.requireCreatedOneCampaign
          ? (potentialPayoutMap.get(submissionId) ?? 0) / LAMPORTS_PER_SOL
          : null,
        payout: payoutMap.has(submissionId)
          ? {
              lamports: payoutMap.get(submissionId).lamports,
              sol: payoutMap.get(submissionId).lamports / LAMPORTS_PER_SOL,
              txSignature: payoutMap.get(submissionId).txSignature,
              status: payoutMap.get(submissionId).status,
            }
          : null,
      };
    }),
    viewerClaimEligibility,
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

  if (campaign.requireCreatedOneCampaign) {
    const hasCreatedCampaign = await walletHasCreatedCampaign(kolWallet);
    if (!hasCreatedCampaign) {
      const err = new Error(
        "Create and fund one campaign first to participate",
      );
      err.code = "require_created_campaign";
      throw err;
    }
  }

  const validated = await validateSubmissionTweet(
    campaign.sourceTweetId,
    input.tweetUrl,
  );
  const authorHandle = validated.authorHandle;
  const authorHandleKey = normalizeHandle(authorHandle);
  const tweetId = validated.tweetId;

  const existingByTweet = await KolSubmission.findOne({
    campaignId: campaign._id,
    tweetId,
  });
  if (existingByTweet) {
    const err = new Error("This post was already submitted to this campaign");
    err.code = "duplicate_post";
    throw err;
  }

  const handleRegex = new RegExp(
    `^${authorHandleKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i",
  );
  const existingByHandle = await KolSubmission.findOne({
    campaignId: campaign._id,
    $or: [{ authorHandleKey }, { authorHandle: handleRegex }],
  });
  if (existingByHandle) {
    const err = new Error(
      "This X account already submitted one post for this campaign",
    );
    err.code = "duplicate_kol_handle";
    throw err;
  }

  const existingWallet = await KolSubmission.findOne({
    campaignId: campaign._id,
    kolWallet,
  });
  if (existingWallet) {
    const err = new Error("This wallet already submitted for this campaign");
    err.code = "duplicate_submission";
    throw err;
  }

  let submission;
  try {
    submission = await KolSubmission.create({
      campaignId: campaign._id,
      kolWallet,
      tweetId,
      tweetUrl: validated.tweetUrl,
      mode: validated.mode,
      authorHandle,
      authorHandleKey,
      authorFollowers: validated.authorFollowers ?? null,
      authorVerified: validated.authorVerified ?? false,
      verified: true,
      latestMetrics: validated.metrics,
      latestScore: validated.score,
      scoreBreakdown: validated.scoreBreakdown ?? null,
      projectedLamports: 0,
    });
  } catch (e) {
    throwIfDuplicateSubmissionError(e);
  }

  await seedXProfileFromAuthor({
    userName: authorHandle,
    verified: true,
  }).catch(() => {});
  await refreshCampaignProjections(campaign._id);

  return { submission: serializeSubmission(submission) };
}

/**
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 */
export async function refreshCampaignProjections(campaignId) {
  const campaign = await KolCampaign.findById(campaignId);
  if (!campaign) return;

  const submissions = await KolSubmission.find({
    campaignId: campaign._id,
  }).lean();
  const kolPool = getCampaignKolPoolLamports(campaign);
  const eligibleSubmissions = await filterRewardEligibleSubmissions(
    campaign,
    submissions,
  );
  const payouts = computeProRataPayouts(eligibleSubmissions, kolPool);
  const payoutMap = new Map(
    payouts.map((p) => [String(p.submissionId), p.lamports]),
  );

  await Promise.all(
    submissions.map((s) =>
      KolSubmission.updateOne(
        { _id: s._id },
        {
          $set: {
            projectedLamports: payoutMap.get(String(s._id)) ?? 0,
          },
        },
      ),
    ),
  );
}

/** Skip discovery/metric refresh when campaign was snapshotted recently (default 6h). */
const METRICS_FRESH_MS = (() => {
  const n = Number.parseInt(String(process.env.KOL_METRICS_FRESH_MS ?? "").trim(), 10);
  return Number.isFinite(n) && n >= 60_000 ? n : 6 * 60 * 60 * 1000;
})();

/**
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 * @param {{ force?: boolean }} [opts]
 */
export async function refreshCampaignMetrics(campaignId, opts = {}) {
  const campaign = await KolCampaign.findById(campaignId);
  if (!campaign || campaign.status !== "active") {
    return { refreshed: 0 };
  }

  if (
    !opts.force &&
    campaign.lastSnapshotAt &&
    Date.now() - new Date(campaign.lastSnapshotAt).getTime() < METRICS_FRESH_MS
  ) {
    return { refreshed: 0, skipped: true, reason: "fresh" };
  }

  const submissions = await KolSubmission.find({ campaignId: campaign._id });
  const capturedAt = new Date();
  let refreshed = 0;

  let failed = 0;

  for (const submission of submissions) {
    try {
      const metrics = await refreshSubmissionMetrics(submission.tweetId);
      submission.latestMetrics = metrics.metrics;
      submission.latestScore = metrics.score;
      submission.scoreBreakdown = metrics.scoreBreakdown ?? null;
      submission.authorHandle = metrics.authorHandle;
      submission.authorHandleKey = normalizeHandle(metrics.authorHandle);
      submission.authorFollowers = metrics.authorFollowers ?? null;
      submission.authorVerified = metrics.authorVerified ?? false;
      await submission.save();

      await KolEngagementSnapshot.create({
        campaignId: campaign._id,
        submissionId: submission._id,
        capturedAt,
        metrics: metrics.metrics,
        score: metrics.score,
        scoreBreakdown: metrics.scoreBreakdown ?? null,
      });
      refreshed += 1;
    } catch (e) {
      failed += 1;
      console.warn(
        `[kol] metric refresh failed submission=${submission._id}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  const totalSubmissions = submissions.length;
  const snapshotComplete =
    totalSubmissions === 0 || refreshed === totalSubmissions;

  if (snapshotComplete) {
    campaign.lastSnapshotAt = capturedAt;
    await campaign.save();
  } else {
    console.warn(
      `[kol] partial metric refresh campaign=${campaign._id} refreshed=${refreshed}/${totalSubmissions} failed=${failed}, lastSnapshotAt unchanged — will retry next tick`,
    );
  }

  if (refreshed > 0) {
    await refreshCampaignProjections(campaign._id);
  }

  return {
    refreshed,
    failed,
    totalSubmissions,
    snapshotComplete,
    capturedAt: snapshotComplete ? capturedAt.toISOString() : null,
  };
}

/**
 * Credit final engagement scores to KOL reputation when a campaign completes.
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 * @param {Array<import("../models/KolSubmission.js").default | Record<string, unknown>>} submissions
 */
async function creditKolReputationsForCampaign(campaignId, submissions) {
  const credited = [];

  for (const row of submissions) {
    const submission = await KolSubmission.findById(row._id);
    if (!submission || submission.reputationCreditedAt) continue;

    const handleKey =
      submission.authorHandleKey || normalizeHandle(submission.authorHandle);
    const finalScore = submission.latestScore ?? 0;

    await KolReputation.findOneAndUpdate(
      { handleKey },
      {
        $setOnInsert: { handle: submission.authorHandle },
        $inc: { reputationScore: finalScore, campaignsCompleted: 1 },
        $set: { lastScoreAt: new Date() },
      },
      { upsert: true },
    );

    submission.finalScore = finalScore;
    submission.reputationCreditedAt = new Date();
    await submission.save();

    credited.push({
      submissionId: String(submission._id),
      handle: submission.authorHandle,
      finalScore,
    });
  }

  return { campaignId: String(campaignId), credited };
}

/**
 * @param {import("../models/KolCampaign.js").default | Record<string, unknown>} campaign
 */
function isCampaignPastEnd(campaign) {
  return Boolean(campaign.endAt && new Date() >= new Date(campaign.endAt));
}

/**
 * Finalize active campaigns whose endAt has passed (rewards, reputation, points).
 * @param {{ limit?: number }} [opts]
 */
export async function finalizeEndedActiveCampaigns(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 10, 1), 25);
  const now = new Date();
  const ended = await KolCampaign.find({
    status: "active",
    endAt: { $lte: now },
  })
    .sort({ endAt: 1 })
    .limit(limit)
    .select("_id")
    .lean();

  const results = [];
  for (const row of ended) {
    try {
      const result = await finalizeCampaign(row._id);
      results.push({ campaignId: String(row._id), ...result });
    } catch (e) {
      console.warn(
        `[kol] auto-finalize failed campaign=${row._id}:`,
        e instanceof Error ? e.message : e,
      );
      results.push({
        campaignId: String(row._id),
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return results;
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

  await discoverCampaignEngagements(campaign._id, { force: true });
  await refreshCampaignMetrics(campaign._id, { force: true });

  const submissions = await KolSubmission.find({
    campaignId: campaign._id,
  }).lean();
  const reputationResults = await creditKolReputationsForCampaign(
    campaign._id,
    submissions,
  );
  const pointsResults = await awardCampaignPoints(campaign._id, submissions);
  const kolPool = getCampaignKolPoolLamports(campaign);
  const eligibleSubmissions = await filterRewardEligibleSubmissions(
    campaign,
    submissions,
  );
  const payoutRows = computeProRataPayouts(eligibleSubmissions, kolPool);
  const platformFeeLamports = getCampaignPlatformFeeLamports(campaign);

  if (!isPoolWalletConfigured()) {
    const err = new Error("KOL_POOL_WALLET_PRIVATE_KEY is not configured");
    err.code = "pool_wallet_unconfigured";
    throw err;
  }

  const results = [];

  if (platformFeeLamports > 0 && campaign.platformFeeStatus !== "confirmed") {
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

  const payoutMap = new Map(
    payoutRows.map((row) => [String(row.submissionId), row.lamports]),
  );

  for (const submission of submissions) {
    const earnedLamports = payoutMap.get(String(submission._id)) ?? 0;
    await KolSubmission.updateOne(
      { _id: submission._id },
      {
        $set: {
          earnedLamports,
          projectedLamports: earnedLamports,
          claimStatus: earnedLamports > 0 ? "claimable" : "unearned",
        },
      },
    );
    results.push({
      type: "kol",
      submissionId: String(submission._id),
      authorHandle: submission.authorHandle,
      status: earnedLamports > 0 ? "claimable" : "unearned",
      lamports: earnedLamports,
    });
  }

  campaign.status = "completed";
  campaign.finalizedAt = new Date();
  await campaign.save();

  const claimableSubmissions = await KolSubmission.find({
    campaignId: campaign._id,
    claimStatus: "claimable",
    earnedLamports: { $gt: 0 },
  }).lean();

  let autoDistributed = [];
  try {
    autoDistributed = await autoDistributeForCampaign(
      campaign,
      claimableSubmissions,
    );
  } catch (e) {
    console.warn(
      `[kol] auto-distribute failed campaign=${campaign._id}:`,
      e instanceof Error ? e.message : e,
    );
  }

  return {
    success: true,
    claimable: results.filter((r) => r.type === "kol" && r.status === "claimable"),
    payouts: results,
    reputation: reputationResults,
    points: pointsResults,
    autoDistributed,
  };
}

/**
 * Core payout logic shared by manual claim and auto-distribute paths.
 * @param {{
 *   campaign: import("../models/KolCampaign.js").default | Record<string, unknown>;
 *   submission: import("../models/KolSubmission.js").default | Record<string, unknown>;
 *   kolWallet: string;
 *   source?: "claim" | "finalize" | "verify" | "sweep";
 *   enforceCampaignGate?: boolean;
 * }}
 */
async function distributeSubmissionReward({
  campaign,
  submission,
  kolWallet,
  source = "claim",
  enforceCampaignGate = false,
}) {
  if (campaign.requireCreatedOneCampaign) {
    const hasCreatedCampaign = await walletHasCreatedCampaign(kolWallet);
    if (!hasCreatedCampaign) {
      if (enforceCampaignGate) {
        const err = new Error(
          "Create and fund one campaign first to claim your reward",
        );
        err.code = "require_created_campaign";
        throw err;
      }
      return {
        status: "skipped",
        reason: "require_created_campaign",
        submissionId: String(submission._id),
        source,
      };
    }
  }

  const existingPayout = await KolPayout.findOne({
    campaignId: campaign._id,
    submissionId: submission._id,
    status: "confirmed",
  });
  if (existingPayout) {
    if (enforceCampaignGate) {
      const err = new Error("Reward already claimed for this campaign");
      err.code = "already_claimed";
      throw err;
    }
    return {
      status: "skipped",
      reason: "already_claimed",
      submissionId: String(submission._id),
      source,
      payout: serializePayout(existingPayout),
    };
  }

  const freshSubmission = await KolSubmission.findById(submission._id);
  if (
    !freshSubmission ||
    freshSubmission.claimStatus !== "claimable" ||
    (freshSubmission.earnedLamports ?? 0) <= 0
  ) {
    if (enforceCampaignGate) {
      const err = new Error("No claimable reward found for your verified X account");
      err.code = "not_found";
      throw err;
    }
    return {
      status: "skipped",
      reason: "not_claimable",
      submissionId: String(submission._id),
      source,
    };
  }

  const earnedLamports = freshSubmission.earnedLamports ?? 0;
  const previousPendingLamports =
    await getPendingPayoutBalanceLamports(kolWallet);
  const totalSendLamports = previousPendingLamports + earnedLamports;

  let payoutDoc = await KolPayout.findOne({
    campaignId: campaign._id,
    submissionId: freshSubmission._id,
  });

  if (!payoutDoc) {
    payoutDoc = await KolPayout.create({
      campaignId: campaign._id,
      submissionId: freshSubmission._id,
      kolWallet,
      lamports: earnedLamports,
      status: "pending",
    });
  }

  if (totalSendLamports < MIN_KOL_PAYOUT_LAMPORTS) {
    payoutDoc.status = "pending_minimum";
    payoutDoc.kolWallet = kolWallet;
    payoutDoc.error = null;
    await payoutDoc.save();
    await setPendingPayoutBalanceLamports(kolWallet, totalSendLamports);
    freshSubmission.kolWallet = kolWallet;
    await freshSubmission.save();

    return {
      status: "pending_minimum",
      lamports: earnedLamports,
      pendingBalanceLamports: totalSendLamports,
      minPayoutLamports: MIN_KOL_PAYOUT_LAMPORTS,
      minPayoutSol: MIN_KOL_PAYOUT_SOL,
      submission: serializeSubmission(freshSubmission),
      payout: serializePayout(payoutDoc),
      source,
    };
  }

  try {
    const sent = await sendPayout({
      toWallet: kolWallet,
      lamports: totalSendLamports,
    });

    payoutDoc.txSignature = sent.txSignature;
    payoutDoc.status = "confirmed";
    payoutDoc.kolWallet = kolWallet;
    payoutDoc.error = null;
    await payoutDoc.save();

    freshSubmission.claimStatus = "claimed";
    freshSubmission.kolWallet = kolWallet;
    await freshSubmission.save();

    await KolPayout.updateMany(
      {
        kolWallet,
        status: "pending_minimum",
        _id: { $ne: payoutDoc._id },
      },
      {
        $set: {
          status: "confirmed",
          txSignature: sent.txSignature,
          error: null,
        },
      },
    );
    await clearPendingPayoutBalance(kolWallet);

    return {
      status: "confirmed",
      txSignature: sent.txSignature,
      lamports: earnedLamports,
      sentLamports: totalSendLamports,
      rolledFromPendingLamports: previousPendingLamports,
      submission: serializeSubmission(freshSubmission),
      payout: serializePayout(payoutDoc),
      source,
    };
  } catch (e) {
    payoutDoc.status = "failed";
    payoutDoc.error = e instanceof Error ? e.message : String(e);
    await payoutDoc.save();
    await setPendingPayoutBalanceLamports(kolWallet, totalSendLamports);
    if (enforceCampaignGate) {
      throw e;
    }
    return {
      status: "failed",
      error: e instanceof Error ? e.message : String(e),
      submissionId: String(freshSubmission._id),
      source,
    };
  }
}

/**
 * Auto-distribute claimable rewards for submissions on a just-finalized campaign.
 * @param {import("../models/KolCampaign.js").default | Record<string, unknown>} campaign
 * @param {Array<Record<string, unknown>>} submissions
 */
async function autoDistributeForCampaign(campaign, submissions) {
  const results = [];

  for (const submission of submissions) {
    const earnedLamports = submission.earnedLamports ?? 0;
    if (earnedLamports <= 0) continue;

    const handleKey =
      submission.authorHandleKey || normalizeHandle(submission.authorHandle);
    if (!handleKey) continue;

    const kolWallet = await resolveSubmissionRewardWallet(submission);
    if (!kolWallet) {
      results.push({
        submissionId: String(submission._id),
        authorHandle: submission.authorHandle,
        status: "skipped",
        reason: "wallet_not_verified",
      });
      continue;
    }

    try {
      const freshSubmission = await KolSubmission.findById(submission._id);
      if (!freshSubmission) continue;
      const result = await distributeSubmissionReward({
        campaign,
        submission: freshSubmission,
        kolWallet,
        source: "finalize",
      });
      results.push({
        submissionId: String(submission._id),
        authorHandle: submission.authorHandle,
        wallet: kolWallet,
        ...result,
      });
    } catch (e) {
      results.push({
        submissionId: String(submission._id),
        authorHandle: submission.authorHandle,
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return results;
}

/**
 * Auto-distribute all claimable rewards for a verified X handle.
 * @param {string} xHandleKey
 * @param {string} wallet
 */
export async function autoDistributeClaimableForHandle(xHandleKey, wallet) {
  assertMongo();

  if (!isPoolWalletConfigured()) {
    return { distributed: [], skipped: true, reason: "pool_wallet_unconfigured" };
  }

  const kolWallet = normalizeWallet(wallet);
  const handleKey = normalizeHandle(xHandleKey);
  if (!kolWallet || !handleKey) {
    return { distributed: [], skipped: true, reason: "invalid_input" };
  }

  const submissions = await KolSubmission.find({
    authorHandleKey: handleKey,
    claimStatus: "claimable",
    earnedLamports: { $gt: 0 },
  }).lean();

  const distributed = [];
  for (const submission of submissions) {
    const campaign = await KolCampaign.findById(submission.campaignId);
    if (!campaign || campaign.status !== "completed") continue;

    try {
      const freshSubmission = await KolSubmission.findById(submission._id);
      if (!freshSubmission) continue;
      const result = await distributeSubmissionReward({
        campaign,
        submission: freshSubmission,
        kolWallet,
        source: "verify",
      });
      distributed.push({
        campaignId: String(campaign._id),
        submissionId: String(submission._id),
        ...result,
      });
    } catch (e) {
      distributed.push({
        campaignId: String(submission.campaignId),
        submissionId: String(submission._id),
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { distributed };
}

/**
 * Sweep claimable submissions that have verified wallets but were not yet paid.
 * @param {{ limit?: number }} [opts]
 */
export async function sweepClaimableVerifiedSubmissions(opts = {}) {
  if (!isPoolWalletConfigured()) {
    return { swept: [], skipped: true, reason: "pool_wallet_unconfigured" };
  }

  const limit = Math.min(
    Math.max(Number(opts.limit) || AUTO_SWEEP_BATCH_LIMIT, 1),
    50,
  );

  const submissions = await KolSubmission.find({
    claimStatus: "claimable",
    earnedLamports: { $gt: 0 },
  })
    .sort({ updatedAt: 1 })
    .limit(limit)
    .lean();

  const swept = [];
  for (const submission of submissions) {
    const handleKey =
      submission.authorHandleKey || normalizeHandle(submission.authorHandle);
    if (!handleKey) continue;

    const kolWallet = await resolveSubmissionRewardWallet(submission);
    if (!kolWallet) continue;

    const campaign = await KolCampaign.findById(submission.campaignId);
    if (!campaign || campaign.status !== "completed") continue;

    try {
      const freshSubmission = await KolSubmission.findById(submission._id);
      if (!freshSubmission || freshSubmission.claimStatus !== "claimable") {
        continue;
      }
      const result = await distributeSubmissionReward({
        campaign,
        submission: freshSubmission,
        kolWallet,
        source: "sweep",
      });
      if (result.status === "skipped" && result.reason === "not_claimable") {
        continue;
      }
      swept.push({
        submissionId: String(submission._id),
        campaignId: String(campaign._id),
        wallet: kolWallet,
        ...result,
      });
    } catch (e) {
      swept.push({
        submissionId: String(submission._id),
        campaignId: String(submission.campaignId),
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { swept };
}

/**
 * @param {string} campaignId
 * @param {{ wallet: string }} input
 */
export async function claimCampaignReward(campaignId, input) {
  assertMongo();

  if (!isPoolWalletConfigured()) {
    const err = new Error("KOL_POOL_WALLET_PRIVATE_KEY is not configured");
    err.code = "pool_wallet_unconfigured";
    throw err;
  }

  const id = assertObjectId(campaignId);
  const kolWallet = normalizeWallet(input.wallet);
  if (!kolWallet) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const verification = await getWalletVerification(kolWallet);
  if (!verification.verified || !verification.xHandleKey) {
    const err = new Error("Verify your X account before claiming rewards");
    err.code = "x_not_verified";
    throw err;
  }

  const campaign = await KolCampaign.findById(id);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }

  if (campaign.status !== "completed") {
    const err = new Error("Campaign is not ready for claims yet");
    err.code = "invalid_status";
    throw err;
  }

  const submission = await KolSubmission.findOne({
    campaignId: campaign._id,
    authorHandleKey: verification.xHandleKey,
    claimStatus: "claimable",
    earnedLamports: { $gt: 0 },
  });

  if (!submission) {
    const err = new Error("No claimable reward found for your verified X account");
    err.code = "not_found";
    throw err;
  }

  return distributeSubmissionReward({
    campaign,
    submission,
    kolWallet,
    source: "claim",
    enforceCampaignGate: true,
  });
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

  const verification = await getWalletVerification(kolWallet);
  const handleKey = verification.xHandleKey ?? null;

  const submissionQuery =
    handleKey != null
      ? {
          $or: [{ kolWallet }, { authorHandleKey: handleKey }],
        }
      : { kolWallet };

  const submissions = await KolSubmission.find(submissionQuery)
    .sort({ createdAt: -1 })
    .lean();

  const submissionIds = submissions.map((s) => s._id);
  const payoutQuery =
    submissionIds.length > 0
      ? { $or: [{ kolWallet }, { submissionId: { $in: submissionIds } }] }
      : { kolWallet };

  const payouts = await KolPayout.find(payoutQuery).lean();

  const stalePendingIds = payouts
    .filter((p) => p.txSignature && p.status === "pending")
    .map((p) => p._id);
  if (stalePendingIds.length > 0) {
    await KolPayout.updateMany(
      { _id: { $in: stalePendingIds } },
      { $set: { status: "confirmed", error: null } },
    );
    for (const p of payouts) {
      if (p.txSignature && p.status === "pending") {
        p.status = "confirmed";
        p.error = null;
      }
    }
  }

  const payoutMap = new Map(payouts.map((p) => [String(p.submissionId), p]));

  const campaignIdSet = new Set(submissions.map((s) => String(s.campaignId)));
  for (const p of payouts) {
    campaignIdSet.add(String(p.campaignId));
  }

  const campaigns =
    campaignIdSet.size > 0
      ? await KolCampaign.find({ _id: { $in: [...campaignIdSet] } }).lean()
      : [];
  const campaignMap = new Map(campaigns.map((c) => [String(c._id), c]));

  const active = [];
  const claimable = [];
  const paid = [];
  const pendingMinimum = [];
  const seenPaidSubmissionIds = new Set();
  const seenPendingMinimumSubmissionIds = new Set();
  const seenClaimableSubmissionIds = new Set();
  let totalProjectedLamports = 0;
  let totalClaimableLamports = 0;
  let totalPaidLamports = 0;
  let totalPendingMinimumLamports = 0;

  for (const s of submissions) {
    const campaign = campaignMap.get(String(s.campaignId));
    if (!campaign) continue;

    const payout = payoutMap.get(String(s._id));
    if (isPayoutSettled(payout)) {
      const settled = /** @type {NonNullable<typeof payout>} */ (payout);
      totalPaidLamports += settled.lamports;
      paid.push({
        submission: serializeSubmission(s),
        campaign: serializeCampaign(campaign),
        payout: serializePayout(settled),
      });
      seenPaidSubmissionIds.add(String(s._id));
    } else if (payout?.status === "pending_minimum") {
      totalPendingMinimumLamports += payout.lamports;
      pendingMinimum.push({
        submission: serializeSubmission(s),
        campaign: serializeCampaign(campaign),
        payout: serializePayout(payout),
      });
      seenPendingMinimumSubmissionIds.add(String(s._id));
    } else if (
      campaign.status === "completed" &&
      s.claimStatus === "claimable" &&
      (s.earnedLamports ?? 0) > 0
    ) {
      totalClaimableLamports += s.earnedLamports ?? 0;
      claimable.push({
        submission: serializeSubmission(s),
        campaign: serializeCampaign(campaign),
        payout: null,
      });
      seenClaimableSubmissionIds.add(String(s._id));
    } else if (campaign.status === "active") {
      totalProjectedLamports += s.projectedLamports ?? 0;
      active.push({
        submission: serializeSubmission(s),
        campaign: serializeCampaign(campaign),
        payout: null,
      });
    }
  }

  const orphanSubmissionIds = payouts
    .filter(
      (p) =>
        isPayoutSettled(p) &&
        !seenPaidSubmissionIds.has(String(p.submissionId)),
    )
    .map((p) => p.submissionId);

  if (orphanSubmissionIds.length > 0) {
    const orphanSubs = await KolSubmission.find({
      _id: { $in: orphanSubmissionIds },
    }).lean();
    const orphanSubMap = new Map(orphanSubs.map((s) => [String(s._id), s]));

    for (const payout of payouts) {
      if (
        !isPayoutSettled(payout) ||
        seenPaidSubmissionIds.has(String(payout.submissionId))
      ) {
        continue;
      }

      totalPaidLamports += payout.lamports;
      seenPaidSubmissionIds.add(String(payout.submissionId));

      const submission = orphanSubMap.get(String(payout.submissionId));
      const campaign = campaignMap.get(String(payout.campaignId));
      if (!submission || !campaign) continue;

      paid.push({
        submission: serializeSubmission(submission),
        campaign: serializeCampaign(campaign),
        payout: serializePayout(payout),
      });
    }
  }

  for (const payout of payouts) {
    if (payout.status !== "pending_minimum") continue;
    if (seenPendingMinimumSubmissionIds.has(String(payout.submissionId)))
      continue;

    const submission = submissions.find(
      (s) => String(s._id) === String(payout.submissionId),
    );
    const campaign = campaignMap.get(String(payout.campaignId));
    if (!submission || !campaign) continue;

    totalPendingMinimumLamports += payout.lamports;
    seenPendingMinimumSubmissionIds.add(String(payout.submissionId));
    pendingMinimum.push({
      submission: serializeSubmission(submission),
      campaign: serializeCampaign(campaign),
      payout: serializePayout(payout),
    });
  }

  const pendingBalanceDoc = await KolPendingPayoutBalance.findOne({
    kolWallet,
  }).lean();
  const pendingBalanceLamports = pendingBalanceDoc?.pendingLamports ?? 0;
  const hasCreatedCampaign = await walletHasCreatedCampaign(kolWallet);

  return {
    wallet: kolWallet,
    xVerification: verification,
    claimEligibility: {
      hasCreatedCampaign,
    },
    active,
    claimable,
    paid,
    pendingMinimum,
    totals: {
      projectedLamports: totalProjectedLamports,
      projectedSol: totalProjectedLamports / LAMPORTS_PER_SOL,
      claimableLamports: totalClaimableLamports,
      claimableSol: totalClaimableLamports / LAMPORTS_PER_SOL,
      paidLamports: totalPaidLamports,
      paidSol: totalPaidLamports / LAMPORTS_PER_SOL,
      pendingMinimumLamports: totalPendingMinimumLamports,
      pendingMinimumSol: totalPendingMinimumLamports / LAMPORTS_PER_SOL,
      pendingBalanceLamports,
      pendingBalanceSol: pendingBalanceLamports / LAMPORTS_PER_SOL,
      minPayoutSol: MIN_KOL_PAYOUT_SOL,
      minPayoutLamports: MIN_KOL_PAYOUT_LAMPORTS,
    },
    payoutPolicy: {
      minPayoutSol: MIN_KOL_PAYOUT_SOL,
      summary:
        "Verify your X account to receive rewards automatically when a campaign ends. On-chain payouts require at least 0.01 SOL; smaller balances stay in the pool until the minimum is reached. You can also claim manually if auto-send did not run.",
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
      const discoveryResult = await discoverCampaignEngagements(campaign._id);
      const refreshResult = await refreshCampaignMetrics(campaign._id);
      refreshed.push({
        campaignId: String(campaign._id),
        discovery: discoveryResult,
        ...refreshResult,
      });

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

  let profiles = { refreshed: 0, failed: 0, skipped: true };
  try {
    profiles = await refreshAllMarketplaceXProfiles();
  } catch (e) {
    console.warn(
      "[kol] daily X profile refresh failed:",
      e instanceof Error ? e.message : e,
    );
  }

  let sweep = { swept: [] };
  try {
    sweep = await sweepClaimableVerifiedSubmissions({
      limit: AUTO_SWEEP_BATCH_LIMIT,
    });
    if (sweep.swept?.length > 0) {
      startupVerbose(
        `[kol] auto-sweep distributed=${sweep.swept.filter((r) => r.status === "confirmed").length} attempted=${sweep.swept.length}`,
      );
    }
  } catch (e) {
    console.warn(
      "[kol] claimable sweep failed:",
      e instanceof Error ? e.message : e,
    );
    sweep = {
      swept: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }

  return { success: true, refreshed, finalized, profiles, sweep };
}

/**
 * Backfill source tweet author fields for legacy campaigns.
 * @param {{ limit?: number }} [opts]
 */
export async function enrichMissingCampaignAuthors(opts = {}) {
  assertMongo();
  if (!isTwitterApiIoConfigured()) {
    return { enriched: 0, skipped: true, reason: "twitterapi_unavailable" };
  }

  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 200);
  const campaigns = await KolCampaign.find({
    $or: [{ sourceAuthorHandle: null }, { sourceAuthorHandle: "" }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  let enriched = 0;
  for (const campaign of campaigns) {
    try {
      const { tweet } = await getTweetById(campaign.sourceTweetId);
      const fields = authorFieldsFromTweet(tweet.author);
      if (!fields.sourceAuthorHandle) continue;
      await seedXProfileFromAuthor(tweet.author).catch(() => {});
      const patch = { ...fields };
      if ((tweet.media ?? []).length > 0) {
        patch.sourceTweetMedia = tweet.media;
      }
      await KolCampaign.updateOne({ _id: campaign._id }, { $set: patch });
      enriched += 1;
    } catch (e) {
      console.warn(
        `[kol] author backfill failed campaign=${campaign._id}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return { enriched, attempted: campaigns.length };
}

/**
 * Backfill authorHandleKey on legacy submissions (required for one-KOL-per-campaign index).
 * @param {{ limit?: number }} [opts]
 */
export async function backfillSubmissionAuthorKeys(opts = {}) {
  assertMongo();

  const limit = Math.min(Math.max(Number(opts.limit) || 200, 1), 500);
  const submissions = await KolSubmission.find({
    $or: [
      { authorHandleKey: null },
      { authorHandleKey: "" },
      { authorHandleKey: { $exists: false } },
    ],
  })
    .limit(limit)
    .lean();

  let updated = 0;
  for (const submission of submissions) {
    const authorHandleKey = normalizeHandle(submission.authorHandle);
    if (!authorHandleKey) continue;
    await KolSubmission.updateOne(
      { _id: submission._id },
      { $set: { authorHandleKey } },
    );
    updated += 1;
  }

  return { updated, attempted: submissions.length };
}

/**
 * Credit reputation for completed campaigns that were finalized before reputation tracking.
 * @param {{ limit?: number }} [opts]
 */
export async function backfillKolReputations(opts = {}) {
  assertMongo();

  const limit = Math.min(Math.max(Number(opts.limit) || 20, 1), 50);
  const campaigns = await KolCampaign.find({ status: "completed" })
    .sort({ finalizedAt: -1 })
    .limit(limit)
    .lean();

  const results = [];
  for (const campaign of campaigns) {
    const submissions = await KolSubmission.find({
      campaignId: campaign._id,
    }).lean();
    const credited = await creditKolReputationsForCampaign(
      campaign._id,
      submissions,
    );
    if (credited.credited.length > 0) results.push(credited);
  }

  return { campaignsProcessed: campaigns.length, credited: results };
}

/**
 * Marketplace-wide aggregate statistics.
 */
/** @type {{ data: Awaited<ReturnType<typeof getMarketplaceStats>> | null; at: number }} */
const marketplaceStatsCache = { data: null, at: 0 };
const MARKETPLACE_STATS_CACHE_MS = 60_000;

export async function getMarketplaceStats() {
  assertMongo();

  const now = Date.now();
  if (
    marketplaceStatsCache.data &&
    now - marketplaceStatsCache.at < MARKETPLACE_STATS_CACHE_MS
  ) {
    return marketplaceStatsCache.data;
  }

  const [
    campaignStatusCounts,
    uniqueKols,
    uniqueProjects,
    rewardAgg,
    paidAgg,
    submissionCount,
    engagementAgg,
  ] = await Promise.all([
    KolCampaign.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    KolSubmission.distinct("authorHandle"),
    KolCampaign.distinct("sourceAuthorHandle", {
      sourceAuthorHandle: { $nin: [null, ""] },
    }),
    KolCampaign.aggregate([
      { $match: { status: { $in: ["active", "completed"] } } },
      {
        $group: {
          _id: null,
          totalRewardLamports: { $sum: "$rewardLamports" },
          totalKolPoolLamports: {
            $sum: {
              $cond: [
                { $gt: ["$kolRewardPoolLamports", 0] },
                "$kolRewardPoolLamports",
                { $multiply: ["$rewardLamports", 0.8] },
              ],
            },
          },
        },
      },
    ]),
    KolPayout.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: null, totalPaidLamports: { $sum: "$lamports" } } },
    ]),
    KolSubmission.countDocuments(),
    KolSubmission.aggregate([
      {
        $group: {
          _id: null,
          likes: { $sum: { $ifNull: ["$latestMetrics.likeCount", 0] } },
          retweets: { $sum: { $ifNull: ["$latestMetrics.retweetCount", 0] } },
          replies: { $sum: { $ifNull: ["$latestMetrics.replyCount", 0] } },
          quotes: { $sum: { $ifNull: ["$latestMetrics.quoteCount", 0] } },
          views: { $sum: { $ifNull: ["$latestMetrics.viewCount", 0] } },
        },
      },
    ]),
  ]);

  const statusMap = new Map(campaignStatusCounts.map((r) => [r._id, r.count]));
  const totalCampaigns = [...statusMap.values()].reduce((a, b) => a + b, 0);
  const totalRewardLamports = rewardAgg[0]?.totalRewardLamports ?? 0;
  const totalKolPoolLamports = Math.floor(
    rewardAgg[0]?.totalKolPoolLamports ?? 0,
  );
  const totalPaidLamports = paidAgg[0]?.totalPaidLamports ?? 0;
  const engagement = engagementAgg[0] ?? {
    likes: 0,
    retweets: 0,
    replies: 0,
    quotes: 0,
    views: 0,
  };

  const result = {
    totalCampaigns,
    activeCampaigns: statusMap.get("active") ?? 0,
    completedCampaigns: statusMap.get("completed") ?? 0,
    pendingDepositCampaigns: statusMap.get("pending_deposit") ?? 0,
    uniqueKols: uniqueKols.filter(Boolean).length,
    uniqueProjects: uniqueProjects.filter(Boolean).length,
    totalSubmissions: submissionCount,
    totalRewardLamports,
    totalRewardSol: totalRewardLamports / LAMPORTS_PER_SOL,
    totalKolPoolLamports,
    totalKolPoolSol: totalKolPoolLamports / LAMPORTS_PER_SOL,
    totalPaidLamports,
    totalPaidSol: totalPaidLamports / LAMPORTS_PER_SOL,
    engagement: {
      likes: engagement.likes,
      retweets: engagement.retweets,
      replies: engagement.replies,
      quotes: engagement.quotes,
      views: engagement.views,
      total: engagementTotal(engagement),
    },
  };

  marketplaceStatsCache.data = result;
  marketplaceStatsCache.at = now;
  return result;
}

/**
 * @param {{ limit?: number; sort?: string }} [opts]
 */
export async function listProjects(opts = {}) {
  assertMongo();

  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const sortKey = String(opts.sort || "funded").trim();

  const projectAgg = await KolCampaign.aggregate([
    { $match: { sourceAuthorHandle: { $nin: [null, ""] } } },
    {
      $group: {
        _id: { $toLower: "$sourceAuthorHandle" },
        handle: { $first: "$sourceAuthorHandle" },
        name: { $first: "$sourceAuthorName" },
        followers: { $first: "$sourceAuthorFollowers" },
        verified: { $first: "$sourceAuthorVerified" },
        campaignCount: { $sum: 1 },
        activeCampaignCount: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
        completedCampaignCount: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        totalFundedLamports: {
          $sum: {
            $cond: [
              { $in: ["$status", ["active", "completed"]] },
              "$rewardLamports",
              0,
            ],
          },
        },
        totalKolPoolLamports: {
          $sum: {
            $cond: [
              { $in: ["$status", ["active", "completed"]] },
              {
                $cond: [
                  { $gt: ["$kolRewardPoolLamports", 0] },
                  "$kolRewardPoolLamports",
                  { $multiply: ["$rewardLamports", 0.8] },
                ],
              },
              0,
            ],
          },
        },
        lastActivityAt: { $max: "$updatedAt" },
        campaignIds: { $push: "$_id" },
      },
    },
  ]);

  const allCampaignIds = projectAgg.flatMap((p) => p.campaignIds);
  const kolReachAgg =
    allCampaignIds.length > 0
      ? await KolSubmission.aggregate([
          { $match: { campaignId: { $in: allCampaignIds } } },
          {
            $group: {
              _id: "$campaignId",
              kols: { $addToSet: "$authorHandle" },
            },
          },
        ])
      : [];

  const kolsByCampaign = new Map(
    kolReachAgg.map((r) => [String(r._id), r.kols.length]),
  );

  let projects = projectAgg.map((p) => {
    const kolsReached = p.campaignIds.reduce(
      (sum, id) => sum + (kolsByCampaign.get(String(id)) ?? 0),
      0,
    );
    return {
      handle: p.handle,
      name: p.name || p.handle,
      followers: p.followers ?? null,
      verified: Boolean(p.verified),
      campaignCount: p.campaignCount,
      activeCampaignCount: p.activeCampaignCount,
      completedCampaignCount: p.completedCampaignCount,
      totalFundedLamports: p.totalFundedLamports,
      totalFundedSol: p.totalFundedLamports / LAMPORTS_PER_SOL,
      totalKolPoolLamports: Math.floor(p.totalKolPoolLamports),
      totalKolPoolSol: Math.floor(p.totalKolPoolLamports) / LAMPORTS_PER_SOL,
      kolsReached,
      lastActivityAt: p.lastActivityAt
        ? new Date(p.lastActivityAt).toISOString()
        : null,
    };
  });

  const sortFns = {
    funded: (a, b) => b.totalFundedLamports - a.totalFundedLamports,
    campaigns: (a, b) => b.campaignCount - a.campaignCount,
    kols: (a, b) => b.kolsReached - a.kolsReached,
    recent: (a, b) =>
      new Date(b.lastActivityAt || 0).getTime() -
      new Date(a.lastActivityAt || 0).getTime(),
  };
  projects.sort(sortFns[sortKey] ?? sortFns.funded);
  projects = projects.slice(0, limit);

  const profileMap = await getCachedXProfiles(projects.map((p) => p.handle));
  projects = projects.map((p) => {
    const cached = profileMap.get(normalizeHandle(p.handle));
    if (!cached) return p;
    return {
      ...p,
      name: cached.name ?? p.name,
      followers: cached.followers ?? p.followers,
      verified: cached.verified ?? p.verified,
      profilePicture: cached.profilePicture ?? null,
    };
  });

  await enrichMissingProfilePictures(projects, (p) => p.handle);

  return { projects };
}

/**
 * @param {{ limit?: number; sort?: string }} [opts]
 */
export async function listKols(opts = {}) {
  assertMongo();

  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const sortKey = String(opts.sort || "earned").trim();

  const kolAgg = await KolSubmission.aggregate([
    {
      $lookup: {
        from: "kolcampaigns",
        localField: "campaignId",
        foreignField: "_id",
        as: "campaignDoc",
      },
    },
    {
      $addFields: {
        campaignStatus: { $arrayElemAt: ["$campaignDoc.status", 0] },
      },
    },
    {
      $group: {
        _id: { $toLower: "$authorHandle" },
        handle: { $first: "$authorHandle" },
        submissionCount: { $sum: 1 },
        campaignIds: { $addToSet: "$campaignId" },
        activeScore: {
          $sum: {
            $cond: [
              { $eq: ["$campaignStatus", "active"] },
              { $ifNull: ["$latestScore", 0] },
              0,
            ],
          },
        },
        likes: { $sum: { $ifNull: ["$latestMetrics.likeCount", 0] } },
        retweets: { $sum: { $ifNull: ["$latestMetrics.retweetCount", 0] } },
        replies: { $sum: { $ifNull: ["$latestMetrics.replyCount", 0] } },
        quotes: { $sum: { $ifNull: ["$latestMetrics.quoteCount", 0] } },
        views: { $sum: { $ifNull: ["$latestMetrics.viewCount", 0] } },
        projectedLamports: { $sum: { $ifNull: ["$projectedLamports", 0] } },
        submissionIds: { $push: "$_id" },
        lastActivityAt: { $max: "$updatedAt" },
      },
    },
  ]);

  const allSubmissionIds = kolAgg.flatMap((k) => k.submissionIds);
  const paidAgg =
    allSubmissionIds.length > 0
      ? await KolPayout.aggregate([
          {
            $match: {
              submissionId: { $in: allSubmissionIds },
              status: "confirmed",
            },
          },
          {
            $group: {
              _id: "$submissionId",
              lamports: { $first: "$lamports" },
            },
          },
        ])
      : [];
  const paidBySubmission = new Map(
    paidAgg.map((p) => [String(p._id), p.lamports]),
  );

  const handleKeys = kolAgg.map((k) => normalizeHandle(k.handle));
  const reputations = await KolReputation.find({
    handleKey: { $in: handleKeys },
  }).lean();
  const repMap = new Map(reputations.map((r) => [r.handleKey, r]));

  let kols = kolAgg.map((k) => {
    const earnedLamports = k.submissionIds.reduce(
      (sum, id) => sum + (paidBySubmission.get(String(id)) ?? 0),
      0,
    );
    const engagement = {
      likes: k.likes,
      retweets: k.retweets,
      replies: k.replies,
      quotes: k.quotes,
      views: k.views,
    };
    const handleKey = normalizeHandle(k.handle);
    const reputation = repMap.get(handleKey);
    const reputationScore = reputation?.reputationScore ?? 0;
    const activeScore = k.activeScore ?? 0;
    return {
      handle: k.handle,
      campaignCount: k.campaignIds.length,
      submissionCount: k.submissionCount,
      reputationScore: Math.round(reputationScore * 10) / 10,
      activeScore: Math.round(activeScore * 10) / 10,
      totalScore: Math.round((reputationScore + activeScore) * 10) / 10,
      campaignsCompleted: reputation?.campaignsCompleted ?? 0,
      engagement: { ...engagement, total: engagementTotal(engagement) },
      projectedLamports: k.projectedLamports,
      projectedSol: k.projectedLamports / LAMPORTS_PER_SOL,
      earnedLamports,
      earnedSol: earnedLamports / LAMPORTS_PER_SOL,
      lastActivityAt: k.lastActivityAt
        ? new Date(k.lastActivityAt).toISOString()
        : null,
    };
  });

  const sortFns = {
    earned: (a, b) =>
      b.earnedLamports - a.earnedLamports || b.totalScore - a.totalScore,
    score: (a, b) =>
      b.totalScore - a.totalScore || b.reputationScore - a.reputationScore,
    engagement: (a, b) => b.engagement.total - a.engagement.total,
    campaigns: (a, b) => b.campaignCount - a.campaignCount,
    recent: (a, b) =>
      new Date(b.lastActivityAt || 0).getTime() -
      new Date(a.lastActivityAt || 0).getTime(),
  };
  kols.sort(sortFns[sortKey] ?? sortFns.earned);
  kols = kols.slice(0, limit);

  const profileMap = await getCachedXProfiles(kols.map((k) => k.handle));

  return {
    kols: kols.map((k) => {
      const cached = profileMap.get(normalizeHandle(k.handle));
      return {
        ...k,
        name: cached?.name ?? k.handle,
        verified: cached?.verified ?? false,
        profilePicture: cached?.profilePicture ?? null,
      };
    }),
  };
}

/**
 * Unified profile by X username (project + KOL roles).
 * @param {string} username
 */
export async function getProfile(username) {
  assertMongo();

  const handle = normalizeHandle(username);
  if (!handle) {
    const err = new Error("username is required");
    err.code = "invalid_handle";
    throw err;
  }

  const handleRegex = new RegExp(
    `^${handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i",
  );

  const [campaignsRaw, submissions, reputation] = await Promise.all([
    KolCampaign.find({ sourceAuthorHandle: handleRegex })
      .sort({ createdAt: -1 })
      .lean(),
    KolSubmission.find({ authorHandle: handleRegex })
      .sort({ createdAt: -1 })
      .lean(),
    KolReputation.findOne({ handleKey: handle }).lean(),
  ]);

  // Keep unfunded drafts off public profiles — payment is creator-only.
  const campaigns = campaignsRaw.filter(
    (c) => c.status === "active" || c.status === "completed",
  );

  if (campaigns.length === 0 && submissions.length === 0) {
    const err = new Error("Profile not found");
    err.code = "not_found";
    throw err;
  }

  const submissionIds = submissions.map((s) => s._id);
  const campaignIds = [
    ...new Set(submissions.map((s) => String(s.campaignId))),
  ];
  const relatedCampaigns =
    campaignIds.length > 0
      ? await KolCampaign.find({ _id: { $in: campaignIds } }).lean()
      : [];
  const campaignMap = new Map(relatedCampaigns.map((c) => [String(c._id), c]));

  const payouts =
    submissionIds.length > 0
      ? await KolPayout.find({
          submissionId: { $in: submissionIds },
          status: "confirmed",
        }).lean()
      : [];
  const payoutMap = new Map(payouts.map((p) => [String(p.submissionId), p]));

  const projectFundedLamports = campaigns
    .filter((c) => c.status === "active" || c.status === "completed")
    .reduce((sum, c) => sum + (c.rewardLamports ?? 0), 0);

  const projectKolPoolLamports = campaigns
    .filter((c) => c.status === "active" || c.status === "completed")
    .reduce((sum, c) => sum + getCampaignKolPoolLamports(c), 0);

  let kolEngagement = {
    likes: 0,
    retweets: 0,
    replies: 0,
    quotes: 0,
    views: 0,
  };
  let kolActiveScore = 0;
  let kolEarnedLamports = 0;
  let kolProjectedLamports = 0;

  const engagementRows = submissions.map((s) => {
    const m = sumEngagementMetrics(s.latestMetrics);
    kolEngagement.likes += m.likes;
    kolEngagement.retweets += m.retweets;
    kolEngagement.replies += m.replies;
    kolEngagement.quotes += m.quotes;
    kolEngagement.views += m.views;

    const payout = payoutMap.get(String(s._id));
    const campaign = campaignMap.get(String(s.campaignId));
    if (campaign?.status === "active") {
      kolActiveScore += s.latestScore ?? 0;
    }

    if (payout) {
      kolEarnedLamports += payout.lamports;
    } else if (campaign?.status === "active") {
      kolProjectedLamports += s.projectedLamports ?? 0;
    }

    return {
      submission: serializeSubmission(s),
      campaign: campaign ? serializeCampaign(campaign) : null,
      payout: payout
        ? {
            lamports: payout.lamports,
            sol: payout.lamports / LAMPORTS_PER_SOL,
            txSignature: payout.txSignature,
            status: payout.status,
          }
        : null,
    };
  });

  const displayHandle =
    campaigns[0]?.sourceAuthorHandle ?? submissions[0]?.authorHandle ?? handle;
  const displayName = campaigns[0]?.sourceAuthorName ?? displayHandle;

  const cachedProfile = await getCachedXProfile(displayHandle);

  const reputationScore = reputation?.reputationScore ?? 0;
  const activeScore = Math.round(kolActiveScore * 10) / 10;

  const roles = [];
  if (campaigns.length > 0) roles.push("project");
  if (submissions.length > 0) roles.push("kol");

  return {
    handle: displayHandle,
    name: cachedProfile?.name ?? displayName,
    followers:
      cachedProfile?.followers ?? campaigns[0]?.sourceAuthorFollowers ?? null,
    verified:
      cachedProfile?.verified ?? Boolean(campaigns[0]?.sourceAuthorVerified),
    description: cachedProfile?.description ?? null,
    profilePicture: cachedProfile?.profilePicture ?? null,
    xProfileRefreshedAt: cachedProfile?.refreshedAt ?? null,
    roles,
    asProject: {
      campaignCount: campaigns.length,
      activeCampaignCount: campaigns.filter((c) => c.status === "active")
        .length,
      completedCampaignCount: campaigns.filter((c) => c.status === "completed")
        .length,
      totalFundedLamports: projectFundedLamports,
      totalFundedSol: projectFundedLamports / LAMPORTS_PER_SOL,
      totalKolPoolLamports: projectKolPoolLamports,
      totalKolPoolSol: projectKolPoolLamports / LAMPORTS_PER_SOL,
      campaigns: campaigns.map((c) => serializeCampaign(c)),
    },
    asKol: {
      campaignCount: new Set(submissions.map((s) => String(s.campaignId))).size,
      submissionCount: submissions.length,
      reputationScore: Math.round(reputationScore * 10) / 10,
      activeScore,
      totalScore: Math.round((reputationScore + activeScore) * 10) / 10,
      campaignsCompleted: reputation?.campaignsCompleted ?? 0,
      engagement: { ...kolEngagement, total: engagementTotal(kolEngagement) },
      earnedLamports: kolEarnedLamports,
      earnedSol: kolEarnedLamports / LAMPORTS_PER_SOL,
      projectedLamports: kolProjectedLamports,
      projectedSol: kolProjectedLamports / LAMPORTS_PER_SOL,
      engagements: engagementRows,
    },
  };
}

/**
 * Public earnings lookup by X handle — no wallet required.
 * @param {string} username
 */
export async function getEarningsByHandle(username) {
  assertMongo();

  const handle = normalizeHandle(username);
  if (!handle) {
    const err = new Error("username is required");
    err.code = "invalid_handle";
    throw err;
  }

  const handleRegex = new RegExp(
    `^${handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
    "i",
  );

  const submissions = await KolSubmission.find({
    $or: [{ authorHandleKey: handle }, { authorHandle: handleRegex }],
  })
    .sort({ createdAt: -1 })
    .lean();

  if (submissions.length === 0) {
    const err = new Error("No campaign participation found for this X account");
    err.code = "not_found";
    throw err;
  }

  const submissionIds = submissions.map((s) => s._id);
  const campaignIds = [
    ...new Set(submissions.map((s) => String(s.campaignId))),
  ];

  const [campaigns, payouts, cachedProfile, reputation] = await Promise.all([
    KolCampaign.find({ _id: { $in: campaignIds } }).lean(),
    KolPayout.find({ submissionId: { $in: submissionIds } }).lean(),
    getCachedXProfile(handle),
    KolReputation.findOne({ handleKey: handle }).lean(),
  ]);

  const campaignMap = new Map(campaigns.map((c) => [String(c._id), c]));
  const payoutMap = new Map(payouts.map((p) => [String(p.submissionId), p]));

  let paidLamports = 0;
  let heldLamports = 0;
  let projectedLamports = 0;
  let claimableLamports = 0;

  const rows = submissions.map((s) => {
    const campaign = campaignMap.get(String(s.campaignId)) ?? null;
    const payout = payoutMap.get(String(s._id)) ?? null;
    const payoutStatus = payout?.status ?? null;

    let amountLamports = 0;
    /** @type {"paid" | "held" | "claimable" | "projected" | "none"} */
    let amountKind = "none";

    if (payoutStatus === "confirmed") {
      amountLamports = payout.lamports ?? 0;
      paidLamports += amountLamports;
      amountKind = "paid";
    } else if (payoutStatus === "pending_minimum") {
      amountLamports = payout.lamports ?? 0;
      heldLamports += amountLamports;
      amountKind = "held";
    } else if (
      payoutStatus === "pending" ||
      s.claimStatus === "claimable"
    ) {
      amountLamports =
        payout?.lamports ?? s.earnedLamports ?? s.projectedLamports ?? 0;
      claimableLamports += amountLamports;
      amountKind = "claimable";
    } else if (campaign?.status === "active") {
      amountLamports = s.projectedLamports ?? 0;
      projectedLamports += amountLamports;
      amountKind = "projected";
    }

    return {
      submission: serializeSubmission(s),
      campaign: campaign ? serializeCampaign(campaign) : null,
      payout: payout
        ? {
            lamports: payout.lamports ?? 0,
            sol: (payout.lamports ?? 0) / LAMPORTS_PER_SOL,
            txSignature: payout.txSignature ?? null,
            status: payout.status,
          }
        : null,
      amountLamports,
      amountSol: amountLamports / LAMPORTS_PER_SOL,
      amountKind,
    };
  });

  const displayHandle =
    cachedProfile?.handle ??
    submissions[0]?.authorHandle ??
    handle;

  return {
    handle: displayHandle,
    name: cachedProfile?.name ?? displayHandle,
    verified: Boolean(cachedProfile?.verified ?? submissions[0]?.authorVerified),
    profilePicture: cachedProfile?.profilePicture ?? null,
    followers: cachedProfile?.followers ?? submissions[0]?.authorFollowers ?? null,
    totals: {
      paidLamports,
      paidSol: paidLamports / LAMPORTS_PER_SOL,
      heldLamports,
      heldSol: heldLamports / LAMPORTS_PER_SOL,
      claimableLamports,
      claimableSol: claimableLamports / LAMPORTS_PER_SOL,
      projectedLamports,
      projectedSol: projectedLamports / LAMPORTS_PER_SOL,
      totalEarnedLamports: paidLamports + heldLamports + claimableLamports,
      totalEarnedSol:
        (paidLamports + heldLamports + claimableLamports) / LAMPORTS_PER_SOL,
    },
    campaignCount: campaignIds.length,
    submissionCount: submissions.length,
    campaignsCompleted: reputation?.campaignsCompleted ?? 0,
    reputationScore: Math.round((reputation?.reputationScore ?? 0) * 10) / 10,
    rows,
  };
}
