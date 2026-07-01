/**
 * KOL fair scoring engine tests.
 * Run: node --test api/libs/kolEngagementService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeEngagementScore, scoreSubmission } from "./kolEngagementService.js";

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
