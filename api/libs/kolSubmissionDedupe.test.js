/**
 * Duplicate-handle leaderboard dedupe tests.
 * Run: node --test api/libs/kolSubmissionDedupe.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { dedupeSubmissionsByHandle } from "./kolMarketplaceService.js";

test("dedupeSubmissionsByHandle collapses two replies from the same KOL", () => {
  const rows = [
    {
      _id: "a",
      authorHandle: "matchaalinaa",
      authorHandleKey: "matchaalinaa",
      tweetId: "t1",
      tweetUrl: "https://x.com/matchaalinaa/status/t1",
      mode: "reply",
      latestScore: 0.9,
      latestMetrics: {
        likeCount: 1,
        retweetCount: 0,
        replyCount: 0,
        quoteCount: 0,
        viewCount: 36,
      },
      contributions: [],
      createdAt: new Date("2026-07-01T00:00:00Z"),
    },
    {
      _id: "b",
      authorHandle: "matchaalinaa",
      authorHandleKey: "matchaalinaa",
      tweetId: "t2",
      tweetUrl: "https://x.com/matchaalinaa/status/t2",
      mode: "reply",
      latestScore: 0.9,
      latestMetrics: {
        likeCount: 1,
        retweetCount: 0,
        replyCount: 0,
        quoteCount: 0,
        viewCount: 31,
      },
      contributions: [],
      createdAt: new Date("2026-07-01T01:00:00Z"),
    },
    {
      _id: "c",
      authorHandle: "otherkol",
      authorHandleKey: "otherkol",
      tweetId: "t3",
      tweetUrl: "https://x.com/otherkol/status/t3",
      mode: "quote",
      latestScore: 2.5,
      latestMetrics: {
        likeCount: 10,
        retweetCount: 1,
        replyCount: 0,
        quoteCount: 0,
        viewCount: 500,
      },
      contributions: [],
      createdAt: new Date("2026-07-01T02:00:00Z"),
    },
  ];

  const deduped = dedupeSubmissionsByHandle(rows);
  assert.equal(deduped.length, 2);

  const matcha = deduped.find((r) => r.authorHandleKey === "matchaalinaa");
  assert.ok(matcha);
  assert.equal(matcha.postCount ?? matcha.contributions?.length, 2);
  assert.ok(matcha.latestScore > 0.9);
  assert.equal(matcha.latestMetrics.viewCount, 67);
  assert.equal(matcha.latestMetrics.likeCount, 2);
  assert.equal(matcha._id, "a"); // older keeper when scores tie
});

test("dedupeSubmissionsByHandle prefers wallet-linked row as keeper", () => {
  const rows = [
    {
      _id: "discovered",
      authorHandle: "kol",
      authorHandleKey: "kol",
      kolWallet: null,
      tweetId: "t1",
      tweetUrl: "https://x.com/kol/status/t1",
      mode: "reply",
      latestScore: 5,
      latestMetrics: { likeCount: 5, viewCount: 100 },
      contributions: [],
      createdAt: new Date("2026-07-01T00:00:00Z"),
    },
    {
      _id: "manual",
      authorHandle: "kol",
      authorHandleKey: "kol",
      kolWallet: "Wallet111",
      tweetId: "t2",
      tweetUrl: "https://x.com/kol/status/t2",
      mode: "quote",
      latestScore: 3,
      latestMetrics: { likeCount: 3, viewCount: 50 },
      contributions: [],
      createdAt: new Date("2026-07-01T01:00:00Z"),
    },
  ];

  const deduped = dedupeSubmissionsByHandle(rows);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0]._id, "manual");
  assert.equal(deduped[0].kolWallet, "Wallet111");
  assert.ok(deduped[0].latestScore >= 5);
});

test("dedupeSubmissionsByHandle treats case-variant keys as the same handle", () => {
  const rows = [
    {
      _id: "1",
      authorHandle: "MatchaAlinaa",
      authorHandleKey: "MatchaAlinaa",
      tweetId: "t1",
      tweetUrl: "https://x.com/MatchaAlinaa/status/t1",
      mode: "reply",
      latestScore: 1,
      latestMetrics: { likeCount: 1, viewCount: 10 },
      contributions: [],
      createdAt: new Date("2026-07-01T00:00:00Z"),
    },
    {
      _id: "2",
      authorHandle: "matchaalinaa",
      authorHandleKey: "matchaalinaa",
      tweetId: "t2",
      tweetUrl: "https://x.com/matchaalinaa/status/t2",
      mode: "reply",
      latestScore: 1,
      latestMetrics: { likeCount: 1, viewCount: 20 },
      contributions: [],
      createdAt: new Date("2026-07-01T01:00:00Z"),
    },
  ];

  const deduped = dedupeSubmissionsByHandle(rows);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].authorHandleKey, "matchaalinaa");
  assert.equal(deduped[0].latestMetrics.viewCount, 30);
});
