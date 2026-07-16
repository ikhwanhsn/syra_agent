/**
 * Multi-post discovery aggregation smoke tests (pure logic).
 * Run: node --test api/libs/kolDiscoveryAggregation.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateContributions, scoreSubmission } from "./kolEngagementService.js";

/**
 * Simulate discovery merge: score each post, then aggregate top-N per handle.
 * @param {Array<{ tweetId: string; mode: "reply" | "quote"; metrics: object }>} posts
 * @param {number} maxN
 */
function aggregateHandlePosts(posts, maxN = 3) {
  const authorContext = { followers: 5_000, verified: false };
  const rows = posts.map((p) => {
    const { score, breakdown } = scoreSubmission(p.metrics, authorContext);
    return {
      tweetId: p.tweetId,
      tweetUrl: `https://x.com/kol/status/${p.tweetId}`,
      mode: p.mode,
      metrics: p.metrics,
      score,
      scoreBreakdown: breakdown,
    };
  });
  return aggregateContributions(rows, maxN);
}

test("discovery-style aggregation combines reply + quote for one handle", () => {
  const result = aggregateHandlePosts([
    {
      tweetId: "reply-1",
      mode: "reply",
      metrics: { likeCount: 40, retweetCount: 5, replyCount: 2, quoteCount: 1, viewCount: 2_000 },
    },
    {
      tweetId: "quote-1",
      mode: "quote",
      metrics: { likeCount: 80, retweetCount: 15, replyCount: 4, quoteCount: 3, viewCount: 8_000 },
    },
    {
      tweetId: "reply-2",
      mode: "reply",
      metrics: { likeCount: 10, retweetCount: 1, replyCount: 0, quoteCount: 0, viewCount: 400 },
    },
  ]);

  assert.ok(result);
  assert.equal(result.postCount, 3);
  assert.ok(result.totalScore > result.primary.score);
  assert.equal(result.primary.mode, "quote");
  assert.equal(result.primary.tweetId, "quote-1");
});

test("discovery-style aggregation caps at top 3 when handle spams many replies", () => {
  const posts = Array.from({ length: 8 }, (_, i) => ({
    tweetId: `r-${i}`,
    mode: /** @type {"reply"} */ ("reply"),
    metrics: {
      likeCount: i + 1,
      retweetCount: 0,
      replyCount: 0,
      quoteCount: 0,
      viewCount: (i + 1) * 50,
    },
  }));

  const result = aggregateHandlePosts(posts, 3);
  assert.ok(result);
  assert.equal(result.postCount, 3);
  assert.deepEqual(
    result.contributions.map((c) => c.tweetId),
    ["r-7", "r-6", "r-5"],
  );

  const top3Only = aggregateHandlePosts(posts.slice(-3), 3);
  assert.ok(top3Only);
  assert.equal(result.totalScore, top3Only.totalScore);
});
