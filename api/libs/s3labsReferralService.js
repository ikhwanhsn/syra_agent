/**
 * S3Labs referral codes, attribution, and referral point awards.
 */
import { isMongooseConnected } from "../config/mongoose.js";
import {
  POINTS_REFERRAL_CREATION,
  POINTS_REFERRAL_PARTICIPATION,
  POINTS_REFERRAL_PODIUM,
  roundPoints,
} from "../config/s3labsPointsConfig.js";
import KolReferralAttribution from "../models/KolReferralAttribution.js";
import KolReferralCode from "../models/KolReferralCode.js";
import S3LabsPoints from "../models/S3LabsPoints.js";
import S3LabsReferralLedger from "../models/S3LabsReferralLedger.js";
import { normalizeWallet } from "./kolEngagementService.js";

const CODE_RE = /^[a-z0-9][a-z0-9_-]{2,19}$/;

const RESERVED_CODES = new Set([
  "profile",
  "kol",
  "admin",
  "referral",
  "referrals",
  "points",
  "api",
  "r",
  "home",
  "about",
  "jobs",
  "events",
  "hackathon",
  "community",
  "campaign",
  "contest",
  "internal",
  "s3labs",
  "null",
  "undefined",
]);

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("MongoDB is not connected");
    err.code = "mongodb_not_connected";
    throw err;
  }
}

/**
 * @param {string} raw
 * @returns {string}
 */
export function normalizeReferralCode(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
}

/**
 * @param {string} code
 * @returns {boolean}
 */
export function isValidReferralCodeFormat(code) {
  return CODE_RE.test(code) && !RESERVED_CODES.has(code);
}

/**
 * @param {{ wallet: string; code: string }} input
 */
export async function createReferralCode(input) {
  assertMongo();

  const wallet = normalizeWallet(input.wallet);
  if (!wallet) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const code = normalizeReferralCode(input.code);
  if (!isValidReferralCodeFormat(code)) {
    const err = new Error(
      "Referral name must be 3–20 characters: letters, numbers, _ or - (cannot start with _/-)",
    );
    err.code = "invalid_code";
    throw err;
  }

  const walletKey = wallet.toLowerCase();
  const existing = await KolReferralCode.findOne({ walletKey }).lean();
  if (existing) {
    const err = new Error("You already created a referral name — it cannot be changed");
    err.code = "already_set";
    throw err;
  }

  try {
    const doc = await KolReferralCode.create({
      walletKey,
      wallet,
      code,
    });
    return {
      code: doc.code,
      wallet: doc.wallet,
      sharePath: `/r/${doc.code}`,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    };
  } catch (e) {
    if (e && typeof e === "object" && /** @type {{ code?: number }} */ (e).code === 11000) {
      const takenByWallet = await KolReferralCode.findOne({ walletKey }).lean();
      if (takenByWallet) {
        const err = new Error("You already created a referral name — it cannot be changed");
        err.code = "already_set";
        throw err;
      }
      const err = new Error("That referral name is already taken");
      err.code = "code_taken";
      throw err;
    }
    throw e;
  }
}

/**
 * @param {string} wallet
 */
export async function getReferralProfile(wallet) {
  assertMongo();

  const normalized = normalizeWallet(wallet);
  if (!normalized) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const walletKey = normalized.toLowerCase();
  const codeDoc = await KolReferralCode.findOne({ walletKey }).lean();

  const inviteeCount = await KolReferralAttribution.countDocuments({
    referrerWalletKey: walletKey,
  });

  const [eventTotals, ledgerRows, pointsAgg] = await Promise.all([
    S3LabsReferralLedger.aggregate([
      { $match: { referrerWalletKey: walletKey } },
      {
        $group: {
          _id: "$eventType",
          points: { $sum: "$points" },
        },
      },
    ]),
    S3LabsReferralLedger.find({ referrerWalletKey: walletKey })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    S3LabsPoints.findOne({ walletKey }).select("referralPoints").lean(),
  ]);

  /** @type {Record<string, number>} */
  const totalsByEvent = {
    participation: 0,
    podium: 0,
    creation: 0,
  };
  for (const row of eventTotals) {
    if (row._id && totalsByEvent[row._id] != null) {
      totalsByEvent[row._id] = roundPoints(row.points ?? 0);
    }
  }

  const referralPointsTotal = roundPoints(
    pointsAgg?.referralPoints ??
      Object.values(totalsByEvent).reduce((a, b) => a + b, 0),
  );

  return {
    wallet: normalized,
    code: codeDoc?.code ?? null,
    sharePath: codeDoc?.code ? `/r/${codeDoc.code}` : null,
    createdAt: codeDoc?.createdAt
      ? new Date(codeDoc.createdAt).toISOString()
      : null,
    canCreate: !codeDoc,
    inviteeCount,
    referralPoints: referralPointsTotal,
    totalsByEvent,
    recent: ledgerRows.map((row) => ({
      id: String(row._id),
      eventType: row.eventType,
      inviteeWallet: row.inviteeWallet,
      campaignId: row.campaignId ? String(row.campaignId) : null,
      points: roundPoints(row.points ?? 0),
      awardedAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    })),
  };
}

/**
 * Bind invitee wallet to a referrer code (once).
 * @param {{ inviteeWallet: string; code: string }} input
 */
export async function claimReferralAttribution(input) {
  assertMongo();

  const inviteeWallet = normalizeWallet(input.inviteeWallet);
  if (!inviteeWallet) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const code = normalizeReferralCode(input.code);
  if (!code) {
    const err = new Error("Referral code is required");
    err.code = "invalid_code";
    throw err;
  }

  const inviteeWalletKey = inviteeWallet.toLowerCase();

  const existing = await KolReferralAttribution.findOne({
    inviteeWalletKey,
  }).lean();
  if (existing) {
    return {
      attributed: true,
      alreadyAttributed: true,
      code: existing.code,
      referrerWallet: existing.referrerWallet,
    };
  }

  const codeDoc = await KolReferralCode.findOne({ code }).lean();
  if (!codeDoc) {
    const err = new Error("Referral code not found");
    err.code = "not_found";
    throw err;
  }

  if (codeDoc.walletKey === inviteeWalletKey) {
    const err = new Error("You cannot use your own referral link");
    err.code = "self_referral";
    throw err;
  }

  try {
    const doc = await KolReferralAttribution.create({
      inviteeWalletKey,
      inviteeWallet,
      referrerWalletKey: codeDoc.walletKey,
      referrerWallet: codeDoc.wallet,
      code: codeDoc.code,
      claimedAt: new Date(),
    });
    return {
      attributed: true,
      alreadyAttributed: false,
      code: doc.code,
      referrerWallet: doc.referrerWallet,
    };
  } catch (e) {
    if (e && typeof e === "object" && /** @type {{ code?: number }} */ (e).code === 11000) {
      const again = await KolReferralAttribution.findOne({
        inviteeWalletKey,
      }).lean();
      return {
        attributed: true,
        alreadyAttributed: true,
        code: again?.code ?? code,
        referrerWallet: again?.referrerWallet ?? null,
      };
    }
    throw e;
  }
}

/**
 * @param {{
 *   referrerWallet: string;
 *   referrerWalletKey: string;
 *   inviteeWallet: string;
 *   inviteeWalletKey: string;
 *   eventType: "participation" | "podium" | "creation";
 *   campaignId: import("mongoose").Types.ObjectId | string | null;
 *   points: number;
 * }} opts
 */
async function creditReferralAward(opts) {
  const points = roundPoints(opts.points);
  if (points <= 0) return { awarded: false, reason: "zero_points" };

  const campaignId = opts.campaignId ?? null;

  try {
    await S3LabsReferralLedger.create({
      referrerWalletKey: opts.referrerWalletKey,
      referrerWallet: opts.referrerWallet,
      inviteeWalletKey: opts.inviteeWalletKey,
      inviteeWallet: opts.inviteeWallet,
      eventType: opts.eventType,
      campaignId,
      points,
    });
  } catch (e) {
    if (e && typeof e === "object" && /** @type {{ code?: number }} */ (e).code === 11000) {
      return { awarded: false, reason: "already_awarded" };
    }
    throw e;
  }

  const now = new Date();
  await S3LabsPoints.findOneAndUpdate(
    { walletKey: opts.referrerWalletKey },
    {
      $setOnInsert: { wallet: opts.referrerWallet },
      $set: { lastAwardedAt: now },
      $inc: {
        totalPoints: points,
        referralPoints: points,
      },
    },
    { upsert: true },
  );

  return { awarded: true, points };
}

/**
 * Award referral points when a campaign finalizes.
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 * @param {Array<Record<string, unknown>>} submissions
 */
export async function awardReferralOnCampaignFinalize(campaignId, submissions) {
  if (!isMongooseConnected()) {
    return { awarded: [], skipped: true, reason: "mongodb_not_connected" };
  }

  const rows = Array.isArray(submissions) ? submissions : [];
  /** @type {Array<{ inviteeWallet: string; score: number; walletKey: string }>} */
  const withWallet = [];
  for (const submission of rows) {
    const wallet = normalizeWallet(submission.kolWallet);
    if (!wallet) continue;
    withWallet.push({
      inviteeWallet: wallet,
      walletKey: wallet.toLowerCase(),
      score: Number(submission.latestScore) || 0,
    });
  }

  if (withWallet.length === 0) {
    return { awarded: [], skipped: false };
  }

  // Score rank for podium (1 = highest score)
  const byScore = [...withWallet].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.walletKey.localeCompare(b.walletKey);
  });
  /** @type {Map<string, number>} */
  const scoreRankByWallet = new Map();
  byScore.forEach((row, index) => {
    scoreRankByWallet.set(row.walletKey, index + 1);
  });

  const attributions = await KolReferralAttribution.find({
    inviteeWalletKey: { $in: withWallet.map((r) => r.walletKey) },
  }).lean();
  /** @type {Map<string, typeof attributions[0]>} */
  const attrByInvitee = new Map(
    attributions.map((a) => [a.inviteeWalletKey, a]),
  );

  const awarded = [];
  for (const row of withWallet) {
    const attr = attrByInvitee.get(row.walletKey);
    if (!attr) continue;

    const participation = await creditReferralAward({
      referrerWallet: attr.referrerWallet,
      referrerWalletKey: attr.referrerWalletKey,
      inviteeWallet: row.inviteeWallet,
      inviteeWalletKey: row.walletKey,
      eventType: "participation",
      campaignId,
      points: POINTS_REFERRAL_PARTICIPATION,
    });
    if (participation.awarded) {
      awarded.push({
        eventType: "participation",
        inviteeWallet: row.inviteeWallet,
        referrerWallet: attr.referrerWallet,
        points: POINTS_REFERRAL_PARTICIPATION,
      });
    }

    const scoreRank = scoreRankByWallet.get(row.walletKey) ?? 999;
    if (scoreRank <= 3) {
      const podium = await creditReferralAward({
        referrerWallet: attr.referrerWallet,
        referrerWalletKey: attr.referrerWalletKey,
        inviteeWallet: row.inviteeWallet,
        inviteeWalletKey: row.walletKey,
        eventType: "podium",
        campaignId,
        points: POINTS_REFERRAL_PODIUM,
      });
      if (podium.awarded) {
        awarded.push({
          eventType: "podium",
          inviteeWallet: row.inviteeWallet,
          referrerWallet: attr.referrerWallet,
          points: POINTS_REFERRAL_PODIUM,
          scoreRank,
        });
      }
    }
  }

  return { awarded, skipped: false };
}

/**
 * Award referral points when an invitee’s campaign goes live.
 * @param {{ projectWallet?: string; _id?: unknown }} campaign
 */
export async function awardReferralOnCampaignCreation(campaign) {
  if (!isMongooseConnected()) {
    return { awarded: false, skipped: true, reason: "mongodb_not_connected" };
  }

  const inviteeWallet = normalizeWallet(campaign?.projectWallet);
  if (!inviteeWallet) {
    return { awarded: false, skipped: true, reason: "no_wallet" };
  }

  const inviteeWalletKey = inviteeWallet.toLowerCase();
  const attr = await KolReferralAttribution.findOne({
    inviteeWalletKey,
  }).lean();
  if (!attr) {
    return { awarded: false, skipped: true, reason: "no_attribution" };
  }

  const campaignId = campaign?._id ?? null;
  const result = await creditReferralAward({
    referrerWallet: attr.referrerWallet,
    referrerWalletKey: attr.referrerWalletKey,
    inviteeWallet,
    inviteeWalletKey,
    eventType: "creation",
    campaignId,
    points: POINTS_REFERRAL_CREATION,
  });

  return {
    awarded: result.awarded === true,
    reason: result.reason,
    points: POINTS_REFERRAL_CREATION,
    referrerWallet: attr.referrerWallet,
  };
}
