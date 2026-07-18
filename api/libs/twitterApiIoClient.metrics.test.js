/**
 * Tweet metric normalization — ensures public_metrics.like_count is counted.
 * Run: node --test api/libs/twitterApiIoClient.metrics.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractTweetMetrics } from "./twitterApiIoClient.js";
import { meetsMinLikes } from "./kolEngagementService.js";

test("extractTweetMetrics reads public_metrics.like_count (X API v2)", () => {
  const metrics = extractTweetMetrics({
    id: "1",
    public_metrics: {
      like_count: 7,
      retweet_count: 2,
      reply_count: 1,
      quote_count: 0,
      impression_count: 900,
    },
  });

  assert.equal(metrics.likeCount, 7);
  assert.equal(metrics.retweetCount, 2);
  assert.equal(metrics.replyCount, 1);
  assert.equal(metrics.quoteCount, 0);
  assert.equal(metrics.viewCount, 900);
  assert.equal(meetsMinLikes(metrics), true);
});

test("extractTweetMetrics reads top-level likeCount (twitterapi.io)", () => {
  const metrics = extractTweetMetrics({
    likeCount: 3,
    retweetCount: 1,
    replyCount: 0,
    quoteCount: 0,
    viewCount: 120,
  });

  assert.equal(metrics.likeCount, 3);
  assert.equal(meetsMinLikes(metrics), true);
});

test("extractTweetMetrics prefers public_metrics over top-level", () => {
  const metrics = extractTweetMetrics({
    likeCount: 99,
    public_metrics: { like_count: 4, retweet_count: 0 },
  });
  assert.equal(metrics.likeCount, 4);
});

test("extractTweetMetrics does not treat liked posts as zero (regression)", () => {
  // Previous bug: only likeCount/favorite_count were read; like_count → 0 → filtered out.
  const metrics = extractTweetMetrics({
    public_metrics: { like_count: 1 },
  });
  assert.equal(metrics.likeCount, 1);
  assert.equal(meetsMinLikes(metrics), true);
});

test("extractTweetMetrics keeps true zero likes as zero", () => {
  const metrics = extractTweetMetrics({
    public_metrics: { like_count: 0, retweet_count: 5 },
  });
  assert.equal(metrics.likeCount, 0);
  assert.equal(metrics.retweetCount, 5);
  // RTs still count as reward engagement even with 0 likes.
  assert.equal(meetsMinLikes(metrics), false);
});
