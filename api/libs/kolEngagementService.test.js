/**
 * KOL fair scoring engine tests.
 * Run: node --test api/libs/kolEngagementService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggregateContributions,
  computeEngagementScore,
  computeProRataPayouts,
  hasRewardEngagement,
  meetsMinLikes,
  metricsEngagementTotal,
  metricsIncreased,
  scoreSubmission,
} from "./kolEngagementService.js";
import { MIN_LIKES_PER_POST } from "../config/kolScoringConfig.js";

test("scoreSubmission applies differentiated engagement weights", () => {
  const { score, breakdown } = scoreSubmission(
    {
      likeCount: 10,
      replyCount: 10,
      retweetCount: 10,
      quoteCount: 10,
      viewCount: 10_000,
    },
    { followers: 50_000, verified: false },
  );

  assert.ok(score > 0);
  assert.equal(breakdown.version, 2);
  assert.ok(breakdown.metrics.like.weighted > 0);
  assert.ok(breakdown.metrics.quote.weighted > breakdown.metrics.like.weighted);
  assert.ok(breakdown.metrics.retweet.weighted > breakdown.metrics.reply.weighted);
});

test("scoreSubmission clamps engagement above views (impossibility correction)", () => {
  const { breakdown } = scoreSubmission(
    {
      likeCount: 5_000,
      retweetCount: 0,
      replyCount: 0,
      quoteCount: 0,
      viewCount: 100,
    },
    { followers: 1_000_000, verified: true },
  );

  assert.equal(breakdown.metrics.like.afterImpossibility, 100);
  assert.equal(breakdown.metrics.like.afterFollowerCap, 100);
});

test("scoreSubmission caps metrics relative to follower count", () => {
  const { breakdown } = scoreSubmission(
    {
      likeCount: 10_000,
      retweetCount: 0,
      replyCount: 0,
      quoteCount: 0,
      viewCount: 50_000,
    },
    { followers: 100, verified: false },
  );

  assert.equal(breakdown.metrics.like.afterFollowerCap, 500);
  assert.ok(breakdown.metrics.like.weighted < 10_000);
});

test("scoreSubmission applies diminishing returns on high volume", () => {
  const low = scoreSubmission(
    { likeCount: 50, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 0 },
    { followers: 100_000, verified: false },
  );
  const high = scoreSubmission(
    { likeCount: 5_000, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 0 },
    { followers: 100_000, verified: false },
  );

  const lowMarginal = low.score / 50;
  const highMarginal = high.score / 5_000;
  assert.ok(highMarginal < lowMarginal);
});

test("scoreSubmission discounts implausible engagement without views", () => {
  const withViews = scoreSubmission(
    { likeCount: 500, retweetCount: 50, replyCount: 20, quoteCount: 10, viewCount: 50_000 },
    { followers: 10_000, verified: false },
  );
  const withoutViews = scoreSubmission(
    { likeCount: 500, retweetCount: 50, replyCount: 20, quoteCount: 10, viewCount: 0 },
    { followers: 10_000, verified: false },
  );

  assert.ok(withoutViews.breakdown.integrityFlags.includes("engagement_without_views"));
  assert.ok(withoutViews.score < withViews.score);
  assert.ok(withoutViews.breakdown.integrityFactor < 1);
});

test("scoreSubmission gives verified accounts a credibility bonus", () => {
  const metrics = { likeCount: 100, retweetCount: 20, replyCount: 10, quoteCount: 5, viewCount: 5_000 };
  const unverified = scoreSubmission(metrics, { followers: 5_000, verified: false });
  const verified = scoreSubmission(metrics, { followers: 5_000, verified: true });

  assert.ok(verified.score > unverified.score);
  assert.ok(verified.breakdown.credibilityMultiplier > unverified.breakdown.credibilityMultiplier);
});

test("scoreSubmission keeps a floor for micro-KOLs (soft penalties only)", () => {
  const { score, breakdown } = scoreSubmission(
    { likeCount: 30, retweetCount: 5, replyCount: 3, quoteCount: 1, viewCount: 800 },
    { followers: 50, verified: false },
  );

  assert.ok(score > 0);
  assert.ok(breakdown.credibilityMultiplier >= 0.5);
  assert.ok(breakdown.integrityFactor >= 0.6);
});

test("computeEngagementScore remains backward-compatible wrapper", () => {
  const metrics = { likeCount: 10, retweetCount: 5, replyCount: 3, quoteCount: 2, viewCount: 1_000 };
  const wrapped = computeEngagementScore(metrics, { followers: 1_000, verified: false });
  const direct = scoreSubmission(metrics, { followers: 1_000, verified: false }).score;
  assert.equal(wrapped, direct);
});

test("scoreSubmission is deterministic for fixed inputs", () => {
  const metrics = { likeCount: 42, retweetCount: 7, replyCount: 4, quoteCount: 2, viewCount: 3_500 };
  const context = { followers: 2_500, verified: true };
  const a = scoreSubmission(metrics, context);
  const b = scoreSubmission(metrics, context);
  assert.deepEqual(a, b);
});

test("metricsIncreased detects growth on any metric", () => {
  const existing = { likeCount: 10, retweetCount: 2, replyCount: 1, quoteCount: 0, viewCount: 100 };
  const sameScoreMoreLikes = { ...existing, likeCount: 15 };
  const sameScoreMoreViews = { ...existing, viewCount: 200 };
  const flat = { ...existing };

  assert.equal(metricsIncreased(existing, sameScoreMoreLikes), true);
  assert.equal(metricsIncreased(existing, sameScoreMoreViews), true);
  assert.equal(metricsIncreased(existing, flat), false);
});

test("metricsEngagementTotal sums all engagement counts", () => {
  const total = metricsEngagementTotal({
    likeCount: 10,
    retweetCount: 2,
    replyCount: 3,
    quoteCount: 1,
    viewCount: 100,
  });
  assert.equal(total, 116);
});

test("aggregateContributions sums top-N scores and ignores the rest", () => {
  const rows = [
    {
      tweetId: "1",
      tweetUrl: "https://x.com/a/status/1",
      mode: "reply",
      metrics: { likeCount: 10, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 100 },
      score: 10,
    },
    {
      tweetId: "2",
      tweetUrl: "https://x.com/a/status/2",
      mode: "quote",
      metrics: { likeCount: 20, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 200 },
      score: 20,
    },
    {
      tweetId: "3",
      tweetUrl: "https://x.com/a/status/3",
      mode: "reply",
      metrics: { likeCount: 5, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 50 },
      score: 5,
    },
    {
      tweetId: "4",
      tweetUrl: "https://x.com/a/status/4",
      mode: "reply",
      metrics: { likeCount: 1, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 10 },
      score: 1,
    },
  ];

  const result = aggregateContributions(rows, 3);
  assert.ok(result);
  assert.equal(result.postCount, 3);
  assert.equal(result.totalScore, 35);
  assert.equal(result.primary.tweetId, "2");
  assert.equal(result.primary.mode, "quote");
  assert.deepEqual(
    result.contributions.map((c) => c.tweetId),
    ["2", "1", "3"],
  );
  assert.equal(result.aggregatedMetrics.likeCount, 35);
  assert.equal(result.aggregatedMetrics.viewCount, 350);
});

test("aggregateContributions ignores spam beyond top-N cap", () => {
  const spam = Array.from({ length: 10 }, (_, i) => ({
    tweetId: `spam-${i}`,
    tweetUrl: `https://x.com/a/status/${i}`,
    mode: "reply",
    metrics: { likeCount: 1, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 10 },
    score: 1,
  }));
  const strong = {
    tweetId: "strong",
    tweetUrl: "https://x.com/a/status/strong",
    mode: "quote",
    metrics: { likeCount: 100, retweetCount: 10, replyCount: 5, quoteCount: 2, viewCount: 5_000 },
    score: 50,
  };

  const result = aggregateContributions([strong, ...spam], 3);
  assert.ok(result);
  assert.equal(result.postCount, 3);
  assert.equal(result.totalScore, 52);
  assert.equal(result.primary.tweetId, "strong");
  assert.ok(!result.contributions.some((c) => c.tweetId === "spam-9"));
});

test("aggregateContributions dedupes by tweetId keeping higher score", () => {
  const result = aggregateContributions(
    [
      {
        tweetId: "1",
        tweetUrl: "https://x.com/a/status/1",
        mode: "reply",
        metrics: { likeCount: 5, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 50 },
        score: 5,
      },
      {
        tweetId: "1",
        tweetUrl: "https://x.com/a/status/1",
        mode: "reply",
        metrics: { likeCount: 15, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 150 },
        score: 15,
      },
    ],
    3,
  );
  assert.ok(result);
  assert.equal(result.postCount, 1);
  assert.equal(result.totalScore, 15);
  assert.equal(result.aggregatedMetrics.likeCount, 15);
});

test("aggregateContributions returns null for empty input", () => {
  assert.equal(aggregateContributions([], 3), null);
  assert.equal(aggregateContributions(null, 3), null);
});

test("meetsMinLikes fails for zero likes and passes for 1+", () => {
  assert.ok(MIN_LIKES_PER_POST >= 1, "default MIN_LIKES_PER_POST should be >= 1");
  assert.equal(meetsMinLikes({ likeCount: 0 }), false);
  assert.equal(meetsMinLikes({ likeCount: null }), false);
  assert.equal(meetsMinLikes({}), false);
  assert.equal(meetsMinLikes(null), false);
  assert.equal(meetsMinLikes({ likeCount: 1 }), true);
  assert.equal(meetsMinLikes({ likeCount: 42 }), true);
});

test("hasRewardEngagement requires likes/RTs/replies/quotes — views alone do not count", () => {
  assert.equal(hasRewardEngagement(null), false);
  assert.equal(hasRewardEngagement({}), false);
  assert.equal(
    hasRewardEngagement({
      likeCount: 0,
      retweetCount: 0,
      replyCount: 0,
      quoteCount: 0,
      viewCount: 50_000,
    }),
    false,
  );
  assert.equal(hasRewardEngagement({ likeCount: 1 }), true);
  assert.equal(hasRewardEngagement({ retweetCount: 1 }), true);
  assert.equal(hasRewardEngagement({ replyCount: 1 }), true);
  assert.equal(hasRewardEngagement({ quoteCount: 1 }), true);
});

test("aggregateContributions keeps zero-engagement posts for leaderboard display", () => {
  const rows = [
    {
      tweetId: "liked",
      tweetUrl: "https://x.com/a/status/liked",
      mode: "reply",
      metrics: { likeCount: 5, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 100 },
      score: 12,
    },
    {
      tweetId: "zero-eng",
      tweetUrl: "https://x.com/a/status/zero-eng",
      mode: "reply",
      metrics: { likeCount: 0, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 50 },
      score: 0,
    },
  ];

  const result = aggregateContributions(rows, 3);
  assert.ok(result);
  assert.equal(result.postCount, 2);
  assert.equal(result.primary.tweetId, "liked");
  assert.equal(hasRewardEngagement(result.aggregatedMetrics), true);

  const zeroOnly = aggregateContributions([rows[1]], 3);
  assert.ok(zeroOnly);
  assert.equal(zeroOnly.postCount, 1);
  assert.equal(hasRewardEngagement(zeroOnly.aggregatedMetrics), false);
});

test("computeProRataPayouts skips zero-engagement submissions even with score", () => {
  const lamports = 1_000_000_000;
  const payouts = computeProRataPayouts(
    [
      {
        _id: "engaged",
        kolWallet: "WalletEngaged",
        latestScore: 10,
        latestMetrics: {
          likeCount: 5,
          retweetCount: 0,
          replyCount: 0,
          quoteCount: 0,
          viewCount: 100,
        },
      },
      {
        _id: "views-only",
        kolWallet: "WalletViews",
        latestScore: 8,
        latestMetrics: {
          likeCount: 0,
          retweetCount: 0,
          replyCount: 0,
          quoteCount: 0,
          viewCount: 50_000,
        },
      },
      {
        _id: "zero",
        kolWallet: "WalletZero",
        latestScore: 0,
        latestMetrics: {
          likeCount: 0,
          retweetCount: 0,
          replyCount: 0,
          quoteCount: 0,
          viewCount: 0,
        },
      },
    ],
    lamports,
  );

  assert.equal(payouts.length, 1);
  assert.equal(String(payouts[0].submissionId), "engaged");
  assert.equal(payouts[0].lamports, lamports);
});
