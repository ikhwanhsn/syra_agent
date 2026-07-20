/**
 * S3Labs Missions — sync @s3labs_ X posts and award points for verified replies.
 */
import mongoose from "mongoose";
import { isMongooseConnected } from "../config/mongoose.js";
import {
  POINTS_MISSION_SUBMISSION,
  roundPoints,
} from "../config/s3labsPointsConfig.js";
import { S3LABS_X_HANDLE } from "../config/s3labsSiteConfig.js";
import S3LabsMission from "../models/S3LabsMission.js";
import S3LabsMissionSubmission from "../models/S3LabsMissionSubmission.js";
import S3LabsPoints from "../models/S3LabsPoints.js";
import {
  normalizeWallet,
  parseHandleFromTweetUrl,
  parseTweetIdFromUrl,
} from "./kolEngagementService.js";
import { getWalletVerification } from "./kolXVerificationService.js";
import {
  getTweetById,
  getUserLastTweets,
  isTwitterApiIoConfigured,
} from "./twitterApiIoClient.js";
import { notifyNewMission } from "./emailSubscriberService.js";

function assertMongo() {
  if (!isMongooseConnected()) {
    const err = new Error("MongoDB is not connected");
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
 * @param {string} handle
 */
function normalizeHandle(handle) {
  return String(handle || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

/**
 * Lenient relation check (mirrors kolDiscoveryRelation): accept when parent id
 * matches, or when the API omitted the parent id entirely.
 * @param {{ inReplyToId?: string | null; quotedTweetId?: string | null; conversationId?: string | null }} tweet
 * @param {string} sourceTweetId
 */
function isRelatedToMission(tweet, sourceTweetId) {
  const source = String(sourceTweetId || "").trim();
  if (!source) return false;

  const replyId =
    tweet.inReplyToId != null ? String(tweet.inReplyToId).trim() : null;
  const quoteId =
    tweet.quotedTweetId != null ? String(tweet.quotedTweetId).trim() : null;
  const conversationId =
    tweet.conversationId != null ? String(tweet.conversationId).trim() : null;

  if (replyId === source || quoteId === source || conversationId === source) {
    return true;
  }

  // Reject when a present parent id clearly points elsewhere.
  if (replyId != null && replyId !== source) return false;
  if (quoteId != null && quoteId !== source) return false;

  // Both parent ids missing — API quirk; accept (same as discovery leniency).
  return replyId == null && quoteId == null;
}

/**
 * @param {Record<string, unknown>} tweet
 */
function isOriginalPost(tweet) {
  if (tweet.inReplyToId != null) return false;
  const text = String(tweet.text || "");
  if (/^RT\s+@/i.test(text.trim())) return false;
  return true;
}

/**
 * @param {import("../models/S3LabsMission.js").default | Record<string, unknown>} row
 * @param {{ submitted?: boolean; pointsAwarded?: number; replyTweetUrl?: string | null } | null} [userState]
 */
function serializeMission(row, userState = null) {
  const doc = row.toObject ? row.toObject() : row;
  return {
    id: String(doc._id),
    tweetId: doc.tweetId,
    tweetUrl: doc.tweetUrl,
    text: doc.text ?? "",
    authorHandle: doc.authorHandle,
    authorName: doc.authorName ?? null,
    mediaUrls: Array.isArray(doc.mediaUrls) ? doc.mediaUrls : [],
    likeCount: doc.likeCount ?? 0,
    replyCount: doc.replyCount ?? 0,
    tweetCreatedAt: doc.tweetCreatedAt
      ? new Date(doc.tweetCreatedAt).toISOString()
      : null,
    status: doc.status ?? "active",
    pointsReward: roundPoints(doc.pointsReward ?? POINTS_MISSION_SUBMISSION),
    submissionCount: doc.submissionCount ?? 0,
    syncedAt: doc.syncedAt ? new Date(doc.syncedAt).toISOString() : null,
    submitted: Boolean(userState?.submitted),
    pointsAwarded: roundPoints(userState?.pointsAwarded ?? 0),
    replyTweetUrl: userState?.replyTweetUrl ?? null,
  };
}

/**
 * @param {import("../models/S3LabsMissionSubmission.js").default | Record<string, unknown>} row
 */
function serializeSubmission(row) {
  const doc = row.toObject ? row.toObject() : row;
  return {
    id: String(doc._id),
    missionId: String(doc.missionId),
    missionTweetId: doc.missionTweetId,
    wallet: doc.wallet,
    xHandle: doc.xHandle ?? null,
    replyTweetId: doc.replyTweetId,
    replyTweetUrl: doc.replyTweetUrl,
    pointsAwarded: roundPoints(doc.pointsAwarded ?? 0),
    submittedAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}

/**
 * Fetch the latest original post from @s3labs_ and upsert as a mission.
 * @param {{ limit?: number }} [opts]
 */
export async function syncMissionsFromX(opts = {}) {
  assertMongo();
  assertTwitter();

  const limit = Math.min(Math.max(Number(opts.limit) || 1, 1), 50);
  const handle = S3LABS_X_HANDLE || "s3labs_";
  const now = new Date();

  /** @type {Array<Record<string, unknown>>} */
  const collected = [];
  let cursor = null;
  let pages = 0;

  while (collected.length < limit && pages < 3) {
    pages += 1;
    const page = await getUserLastTweets({
      userName: handle,
      cursor,
    });
    for (const tweet of page.tweets ?? []) {
      if (!tweet?.id) continue;
      if (!isOriginalPost(tweet)) continue;
      collected.push(tweet);
      if (collected.length >= limit) break;
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }

  let created = 0;
  let updated = 0;
  /** @type {Array<Record<string, unknown>>} */
  const createdMissions = [];

  for (const tweet of collected) {
    const tweetId = String(tweet.id);
    const authorHandle = String(tweet.author?.userName || handle).replace(
      /^@/,
      "",
    );
    const mediaUrls = Array.isArray(tweet.media)
      ? tweet.media
          .map((m) => (m && typeof m === "object" ? m.url || m.previewUrl : null))
          .filter(Boolean)
          .map(String)
      : [];

    const payload = {
      tweetUrl:
        typeof tweet.url === "string" && tweet.url
          ? tweet.url
          : `https://x.com/${encodeURIComponent(authorHandle)}/status/${tweetId}`,
      text: String(tweet.text || "").slice(0, 4000),
      authorHandle,
      authorName:
        typeof tweet.author?.name === "string" ? tweet.author.name : null,
      mediaUrls,
      likeCount: Math.max(0, Math.floor(Number(tweet.metrics?.likeCount) || 0)),
      replyCount: Math.max(
        0,
        Math.floor(Number(tweet.metrics?.replyCount) || 0),
      ),
      tweetCreatedAt: tweet.createdAt ? new Date(tweet.createdAt) : null,
      status: "active",
      pointsReward: POINTS_MISSION_SUBMISSION,
      syncedAt: now,
    };

    const existing = await S3LabsMission.findOne({ tweetId }).lean();
    if (existing) {
      await S3LabsMission.updateOne({ tweetId }, { $set: payload });
      updated += 1;
    } else {
      const createdDoc = await S3LabsMission.create({
        tweetId,
        ...payload,
        submissionCount: 0,
      });
      created += 1;
      createdMissions.push(serializeMission(createdDoc));
    }
  }

  for (const mission of createdMissions) {
    notifyNewMission(mission).catch((e) => {
      console.warn(
        "[missions] mission email notify failed:",
        e instanceof Error ? e.message : e,
      );
    });
  }

  return {
    handle,
    fetched: collected.length,
    created,
    updated,
    notified: createdMissions.length,
    syncedAt: now.toISOString(),
  };
}

/**
 * @param {{ wallet?: string | null; limit?: number }} [opts]
 */
export async function listMissions(opts = {}) {
  assertMongo();

  const limit = Math.min(Math.max(Number(opts.limit) || 50, 1), 100);
  const missions = await S3LabsMission.find({ status: "active" })
    .sort({ tweetCreatedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  let walletVerified = false;
  /** @type {string | null} */
  let xHandle = null;
  /** @type {Map<string, Record<string, unknown>>} */
  const submissionByMission = new Map();

  const wallet = normalizeWallet(opts.wallet);
  if (wallet) {
    const verification = await getWalletVerification(wallet);
    walletVerified = Boolean(verification.verified);
    xHandle = verification.xHandle ?? null;

    const missionIds = missions.map((m) => m._id);
    if (missionIds.length > 0) {
      const subs = await S3LabsMissionSubmission.find({
        walletKey: wallet.toLowerCase(),
        missionId: { $in: missionIds },
      }).lean();
      for (const sub of subs) {
        submissionByMission.set(String(sub.missionId), sub);
      }
    }
  }

  const pointsReward = POINTS_MISSION_SUBMISSION;
  const completedCount = [...submissionByMission.values()].length;

  return {
    handle: S3LABS_X_HANDLE || "s3labs_",
    pointsReward,
    walletVerified,
    xHandle,
    completedCount,
    totalMissionPoints: roundPoints(completedCount * pointsReward),
    missions: missions.map((mission) => {
      const sub = submissionByMission.get(String(mission._id));
      return serializeMission(
        mission,
        sub
          ? {
              submitted: true,
              pointsAwarded: sub.pointsAwarded,
              replyTweetUrl: sub.replyTweetUrl,
            }
          : null,
      );
    }),
  };
}

/**
 * @param {{ missionId: string; wallet: string; tweetUrl: string }} input
 */
export async function submitMissionComment(input) {
  assertMongo();
  assertTwitter();

  const missionId = String(input.missionId || "").trim();
  if (!missionId || !mongoose.Types.ObjectId.isValid(missionId)) {
    const err = new Error("Mission not found");
    err.code = "not_found";
    throw err;
  }

  const wallet = normalizeWallet(input.wallet);
  if (!wallet) {
    const err = new Error("wallet is required");
    err.code = "invalid_wallet";
    throw err;
  }

  const verification = await getWalletVerification(wallet);
  if (!verification.verified || !verification.xHandleKey) {
    const err = new Error(
      "Verify your X account before submitting a mission comment",
    );
    err.code = "x_not_verified";
    throw err;
  }

  const mission = await S3LabsMission.findById(missionId);
  if (!mission || mission.status !== "active") {
    const err = new Error("Mission not found");
    err.code = "not_found";
    throw err;
  }

  const tweetUrlRaw = String(input.tweetUrl || "").trim();
  const replyTweetId = parseTweetIdFromUrl(tweetUrlRaw);
  const parsedHandle = parseHandleFromTweetUrl(tweetUrlRaw);
  if (!replyTweetId || !parsedHandle) {
    const err = new Error(
      "Invalid X post URL — use a link like https://x.com/handle/status/123…",
    );
    err.code = "invalid_tweet_url";
    throw err;
  }

  const authorHandleKey = normalizeHandle(parsedHandle);
  if (authorHandleKey !== verification.xHandleKey) {
    const err = new Error(
      `Post must be from your verified X account @${verification.xHandle ?? verification.xHandleKey}`,
    );
    err.code = "handle_mismatch";
    throw err;
  }

  if (replyTweetId === String(mission.tweetId)) {
    const err = new Error(
      "That URL is the mission post itself, not a reply or quote",
    );
    err.code = "invalid_tweet_url";
    throw err;
  }

  const { tweet } = await getTweetById(replyTweetId, { skipCache: true });
  if (!tweet) {
    const err = new Error("Tweet not found");
    err.code = "tweet_not_found";
    throw err;
  }

  const apiAuthorKey = normalizeHandle(tweet.author?.userName);
  if (apiAuthorKey && apiAuthorKey !== verification.xHandleKey) {
    const err = new Error(
      `Post must be from your verified X account @${verification.xHandle ?? verification.xHandleKey}`,
    );
    err.code = "handle_mismatch";
    throw err;
  }

  if (!isRelatedToMission(tweet, mission.tweetId)) {
    const err = new Error(
      "Your post must be a reply or quote of the mission X post",
    );
    err.code = "submission_not_related";
    throw err;
  }

  const xHandle = String(verification.xHandle || parsedHandle).replace(
    /^@/,
    "",
  );
  const replyTweetUrl = `https://x.com/${encodeURIComponent(xHandle)}/status/${replyTweetId}`;
  const pointsAwarded = roundPoints(
    mission.pointsReward ?? POINTS_MISSION_SUBMISSION,
  );
  const walletKey = wallet.toLowerCase();
  const now = new Date();

  let submission;
  try {
    submission = await S3LabsMissionSubmission.create({
      missionId: mission._id,
      missionTweetId: mission.tweetId,
      walletKey,
      wallet,
      xHandle,
      xHandleKey: verification.xHandleKey,
      replyTweetId,
      replyTweetUrl,
      pointsAwarded,
    });
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message.includes("duplicate key") || /** @type {{ code?: number }} */ (e).code === 11000)
    ) {
      const dupByWallet = await S3LabsMissionSubmission.findOne({
        missionId: mission._id,
        walletKey,
      }).lean();
      if (dupByWallet) {
        const err = new Error("You already submitted a comment for this mission");
        err.code = "duplicate_submission";
        throw err;
      }
      const err = new Error("This post was already used for a mission submission");
      err.code = "duplicate_post";
      throw err;
    }
    throw e;
  }

  await S3LabsMission.updateOne(
    { _id: mission._id },
    { $inc: { submissionCount: 1 } },
  );

  await S3LabsPoints.findOneAndUpdate(
    { walletKey },
    {
      $setOnInsert: { wallet },
      $set: {
        lastHandle: xHandle,
        lastHandleKey: verification.xHandleKey,
        lastAwardedAt: now,
      },
      $inc: {
        totalPoints: pointsAwarded,
        missionPoints: pointsAwarded,
      },
    },
    { upsert: true },
  );

  const aggregate = await S3LabsPoints.findOne({ walletKey }).lean();

  return {
    submission: serializeSubmission(submission),
    totals: {
      totalPoints: roundPoints(aggregate?.totalPoints ?? pointsAwarded),
      missionPoints: roundPoints(aggregate?.missionPoints ?? pointsAwarded),
    },
  };
}
