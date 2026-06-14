import mongoose from "mongoose";
import { callOpenRouter } from "./openrouter.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import { isMongooseConnected } from "../config/mongoose.js";
import InternalFounderPulseSnapshot from "../models/InternalFounderPulseSnapshot.js";
import {
  SYRA_FOUNDER_DEFAULT_HANDLE,
  SYRA_FOUNDER_PULSE_ENGAGEMENT_WEIGHTS,
  SYRA_FOUNDER_PULSE_TWEET_SAMPLE,
} from "../config/syraFounderPulseConfig.js";
import { getUserInfo, getUserLastTweets, isTwitterApiIoConfigured } from "./twitterApiIoClient.js";
import { INTERNAL_TOOLS_HISTORY_MAX } from "./internalToolsHistory.js";

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

function normalizeHandle(raw) {
  const h = String(raw || SYRA_FOUNDER_DEFAULT_HANDLE || "").trim().replace(/^@/, "");
  if (!h) {
    const err = new Error("Founder X handle is required (set SYRA_FOUNDER_X_HANDLE or pass handle)");
    err.code = "invalid_handle";
    throw err;
  }
  return h;
}

function tweetEngagement(metrics) {
  const w = SYRA_FOUNDER_PULSE_ENGAGEMENT_WEIGHTS;
  return (
    (metrics?.likeCount ?? 0) * w.like +
    (metrics?.retweetCount ?? 0) * w.retweet +
    (metrics?.replyCount ?? 0) * w.reply +
    (metrics?.quoteCount ?? 0) * w.quote +
    Math.min(metrics?.viewCount ?? 0, 50_000) * w.view
  );
}

function computeAnalytics(tweets, profile) {
  const withEng = tweets.map((t) => ({
    ...t,
    engagement: tweetEngagement(t.metrics),
  }));

  const totalEng = withEng.reduce((s, t) => s + t.engagement, 0);
  const avgEngagement = withEng.length ? totalEng / withEng.length : 0;

  const topTweets = [...withEng].sort((a, b) => b.engagement - a.engagement).slice(0, 5).map((t) => ({
    id: t.id,
    text: t.text.slice(0, 280),
    url: t.url,
    createdAt: t.createdAt,
    engagement: Math.round(t.engagement * 10) / 10,
    metrics: t.metrics,
  }));

  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, engagement: 0, count: 0 }));
  const dayBuckets = Array.from({ length: 7 }, (_, d) => ({ day: d, engagement: 0, count: 0 }));

  for (const t of withEng) {
    if (!t.createdAt) continue;
    const d = new Date(t.createdAt);
    if (!Number.isFinite(d.getTime())) continue;
    const h = d.getUTCHours();
    const day = d.getUTCDay();
    hourBuckets[h].engagement += t.engagement;
    hourBuckets[h].count += 1;
    dayBuckets[day].engagement += t.engagement;
    dayBuckets[day].count += 1;
  }

  const bestHours = [...hourBuckets]
    .filter((b) => b.count > 0)
    .map((b) => ({ hour: b.hour, avgEngagement: b.engagement / b.count, count: b.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 3);

  const bestDays = [...dayBuckets]
    .filter((b) => b.count > 0)
    .map((b) => ({ day: b.day, avgEngagement: b.engagement / b.count, count: b.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 3);

  const dated = withEng.filter((t) => t.createdAt).map((t) => new Date(t.createdAt).getTime()).filter(Number.isFinite);
  let tweetsPerDay = null;
  if (dated.length >= 2) {
    const min = Math.min(...dated);
    const max = Math.max(...dated);
    const days = Math.max(1, (max - min) / (1000 * 60 * 60 * 24));
    tweetsPerDay = Math.round((withEng.length / days) * 10) / 10;
  }

  return {
    avgEngagement: Math.round(avgEngagement * 10) / 10,
    totalEngagement: Math.round(totalEng * 10) / 10,
    tweetsAnalyzed: withEng.length,
    tweetsPerDay,
    topTweets,
    bestHours,
    bestDays,
    profile: {
      userName: profile.userName,
      name: profile.name,
      followers: profile.followers,
      following: profile.following,
      tweetCount: profile.tweetCount,
      verified: profile.verified,
    },
  };
}

function mapSnapshotDoc(d) {
  return {
    id: String(d._id),
    handle: d.handle,
    followers: d.followers,
    following: d.following,
    tweetCount: d.tweetCount,
    analytics: d.analytics ?? {},
    capturedAt: d.capturedAt ? new Date(d.capturedAt).toISOString() : undefined,
    createdByWallet: d.createdByWallet ?? null,
  };
}

export async function getFounderPulse({ handle, wallet }) {
  assertMongo();
  assertTwitter();
  const clean = normalizeHandle(handle);

  const [{ user }, tweetsResult, prior] = await Promise.all([
    getUserInfo(clean),
    getUserLastTweets({ userName: clean }),
    InternalFounderPulseSnapshot.findOne({ handle: clean }).sort({ capturedAt: -1 }).lean(),
  ]);

  const tweets = tweetsResult.tweets.slice(0, SYRA_FOUNDER_PULSE_TWEET_SAMPLE);
  const analytics = computeAnalytics(tweets, user.user);

  const followerDelta = prior ? user.user.followers - (prior.followers ?? 0) : null;

  let insight = null;
  try {
    const result = await callOpenRouter(
      [
        {
          role: "system",
          content: "You are a founder growth advisor. One short paragraph (2-3 sentences) on X posting strategy based on analytics. No markdown.",
        },
        {
          role: "user",
          content: `@${clean} analytics:\n- Followers: ${user.user.followers}${followerDelta != null ? ` (${followerDelta >= 0 ? "+" : ""}${followerDelta} since last check)` : ""}\n- Avg engagement/tweet: ${analytics.avgEngagement}\n- Tweets/day: ${analytics.tweetsPerDay ?? "n/a"}\n- Top tweet engagement: ${analytics.topTweets[0]?.engagement ?? "n/a"}\n\nInsight:`,
        },
      ],
      { max_tokens: 200, temperature: 0.6, model: OPENROUTER_DEFAULT_MODEL },
    );
    insight = String(result.response || "").trim() || null;
  } catch {
    insight = null;
  }

  const doc = await InternalFounderPulseSnapshot.create({
    handle: clean,
    followers: user.user.followers,
    following: user.user.following,
    tweetCount: user.user.tweetCount,
    analytics: { ...analytics, insight, followerDelta },
    capturedAt: new Date(),
    createdByWallet: wallet ? String(wallet).trim() : null,
  });

  return {
    success: true,
    data: {
      ...mapSnapshotDoc(doc),
      followerDelta,
      insight,
    },
  };
}

export async function listRecentFounderPulseSnapshots(opts = {}) {
  assertMongo();
  const limit = Math.min(Math.max(opts.limit ?? INTERNAL_TOOLS_HISTORY_MAX, 1), INTERNAL_TOOLS_HISTORY_MAX);
  const handle = opts.handle ? normalizeHandle(opts.handle) : null;
  const query = handle ? { handle } : {};
  const docs = await InternalFounderPulseSnapshot.find(query).sort({ capturedAt: -1 }).limit(limit).lean();
  return { success: true, data: docs.map(mapSnapshotDoc), total: docs.length };
}
