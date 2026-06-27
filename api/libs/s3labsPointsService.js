/**
 * S3 Labs Points — wallet-keyed participation + early-bird rewards at campaign end.
 */
import mongoose from "mongoose";
import { isMongooseConnected } from "../config/mongoose.js";
import {
  POINTS_EARLY_POOL,
  POINTS_PARTICIPATION,
  computeEarlyPoints,
  roundPoints,
} from "../config/s3labsPointsConfig.js";
import KolCampaign from "../models/KolCampaign.js";
import S3LabsPoints from "../models/S3LabsPoints.js";
import S3LabsPointsLedger from "../models/S3LabsPointsLedger.js";
import { normalizeWallet } from "./kolEngagementService.js";

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("MongoDB is not connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

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
 * @param {import("../models/S3LabsPoints.js").default | Record<string, unknown>} doc
 */
function serializePointsAggregate(doc) {
  if (!doc) {
    return {
      wallet: "",
      walletKey: "",
      totalPoints: 0,
      participationPoints: 0,
      earlyPoints: 0,
      campaignsParticipated: 0,
      lastHandle: null,
      lastAwardedAt: null,
    };
  }
  const row = doc.toObject ? doc.toObject() : doc;
  return {
    wallet: row.wallet,
    walletKey: row.walletKey,
    totalPoints: roundPoints(row.totalPoints ?? 0),
    participationPoints: roundPoints(row.participationPoints ?? 0),
    earlyPoints: roundPoints(row.earlyPoints ?? 0),
    campaignsParticipated: row.campaignsParticipated ?? 0,
    lastHandle: row.lastHandle ?? null,
    lastAwardedAt: row.lastAwardedAt ? new Date(row.lastAwardedAt).toISOString() : null,
  };
}

/**
 * @param {import("../models/S3LabsPointsLedger.js").default | Record<string, unknown>} row
 * @param {import("../models/KolCampaign.js").default | Record<string, unknown> | null | undefined} campaign
 */
function serializeLedgerEntry(row, campaign) {
  const doc = row.toObject ? row.toObject() : row;
  const camp = campaign?.toObject ? campaign.toObject() : campaign;
  return {
    id: String(doc._id),
    campaignId: String(doc.campaignId),
    campaignTitle: camp?.title ?? null,
    campaignStatus: camp?.status ?? null,
    submissionId: String(doc.submissionId),
    handle: doc.handle ?? null,
    rank: doc.rank,
    participationPoints: roundPoints(doc.participationPoints),
    earlyPoints: roundPoints(doc.earlyPoints),
    totalPoints: roundPoints(doc.totalPoints),
    awardedAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

/**
 * Award S3Labs Points to all participants when a campaign finalizes.
 * Idempotent via unique ledger index on (campaignId, walletKey).
 *
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 * @param {Array<Record<string, unknown>>} submissions
 */
export async function awardCampaignPoints(campaignId, submissions) {
  if (!isMongooseConnected()) {
    return { campaignId: String(campaignId), awarded: [], skipped: true };
  }

  const rows = [...(submissions ?? [])].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (aTime !== bTime) return aTime - bTime;
    return String(a._id).localeCompare(String(b._id));
  });

  const n = rows.length;
  const earlyByRank = computeEarlyPoints(n);
  const awarded = [];
  const now = new Date();

  for (let i = 0; i < rows.length; i += 1) {
    const submission = rows[i];
    const wallet = normalizeWallet(submission.kolWallet);
    if (!wallet) continue;

    const walletKey = wallet.toLowerCase();
    const handle = String(submission.authorHandle || "").trim() || null;
    const handleKey = normalizeHandle(handle);
    const rank = i + 1;
    const participationPoints = POINTS_PARTICIPATION;
    const earlyPoints = roundPoints(earlyByRank[i] ?? 0);
    const totalPoints = roundPoints(participationPoints + earlyPoints);

    try {
      const ledger = await S3LabsPointsLedger.create({
        campaignId,
        walletKey,
        wallet,
        submissionId: submission._id,
        handle,
        rank,
        participationPoints,
        earlyPoints,
        totalPoints,
      });

      await S3LabsPoints.findOneAndUpdate(
        { walletKey },
        {
          $setOnInsert: { wallet },
          $set: {
            lastHandle: handle,
            lastHandleKey: handleKey || null,
            lastAwardedAt: now,
          },
          $inc: {
            totalPoints,
            participationPoints,
            earlyPoints,
            campaignsParticipated: 1,
          },
        },
        { upsert: true },
      );

      awarded.push({
        submissionId: String(submission._id),
        wallet,
        handle,
        rank,
        participationPoints,
        earlyPoints,
        totalPoints,
        ledgerId: String(ledger._id),
      });
    } catch (e) {
      if (e instanceof Error && (e.message.includes("duplicate key") || e.code === 11000)) {
        continue;
      }
      console.warn(
        `[s3labs-points] award failed campaign=${campaignId} submission=${submission._id}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return {
    campaignId: String(campaignId),
    participantCount: n,
    earlyPoolTotal: POINTS_EARLY_POOL,
    awarded,
  };
}

/**
 * @param {string} wallet
 */
export async function getWalletPoints(wallet) {
  assertMongo();

  const normalized = normalizeWallet(wallet);
  if (!normalized) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const walletKey = normalized.toLowerCase();
  const aggregate = await S3LabsPoints.findOne({ walletKey }).lean();
  const ledgerRows = await S3LabsPointsLedger.find({ walletKey })
    .sort({ createdAt: -1 })
    .lean();

  const campaignIds = [...new Set(ledgerRows.map((r) => String(r.campaignId)))];
  const campaigns =
    campaignIds.length > 0
      ? await KolCampaign.find({ _id: { $in: campaignIds } }).lean()
      : [];
  const campaignMap = new Map(campaigns.map((c) => [String(c._id), c]));

  const entries = ledgerRows.map((row) =>
    serializeLedgerEntry(row, campaignMap.get(String(row.campaignId))),
  );

  const totals = aggregate
    ? serializePointsAggregate(aggregate)
    : {
        wallet: normalized,
        walletKey,
        totalPoints: 0,
        participationPoints: 0,
        earlyPoints: 0,
        campaignsParticipated: 0,
        lastHandle: null,
        lastAwardedAt: null,
      };

  return {
    wallet: normalized,
    ...totals,
    entries,
  };
}

/**
 * @param {{ limit?: number }} [opts]
 */
export async function getPointsLeaderboard(opts = {}) {
  assertMongo();

  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const rows = await S3LabsPoints.find({ totalPoints: { $gt: 0 } })
    .sort({ totalPoints: -1, lastAwardedAt: -1 })
    .limit(limit)
    .lean();

  return {
    leaderboard: rows.map((row, index) => ({
      rank: index + 1,
      wallet: row.wallet,
      handle: row.lastHandle ?? null,
      totalPoints: roundPoints(row.totalPoints),
      participationPoints: roundPoints(row.participationPoints),
      earlyPoints: roundPoints(row.earlyPoints),
      campaignsParticipated: row.campaignsParticipated ?? 0,
      lastAwardedAt: row.lastAwardedAt ? new Date(row.lastAwardedAt).toISOString() : null,
    })),
  };
}

/**
 * Backfill points for completed campaigns (admin).
 * @param {{ limit?: number }} [opts]
 */
export async function backfillCampaignPoints(opts = {}) {
  assertMongo();

  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 200);
  const completed = await KolCampaign.find({ status: "completed" })
    .sort({ finalizedAt: -1 })
    .limit(limit)
    .lean();

  const results = [];
  for (const campaign of completed) {
    const existing = await S3LabsPointsLedger.findOne({ campaignId: campaign._id }).lean();
    if (existing) {
      results.push({ campaignId: String(campaign._id), skipped: true });
      continue;
    }

    const KolSubmission = mongoose.models.KolSubmission;
    if (!KolSubmission) {
      results.push({ campaignId: String(campaign._id), skipped: true, error: "no_submission_model" });
      continue;
    }

    const submissions = await KolSubmission.find({ campaignId: campaign._id }).lean();
    const result = await awardCampaignPoints(campaign._id, submissions);
    results.push({ campaignId: String(campaign._id), ...result });
  }

  return { processed: results.length, results };
}
