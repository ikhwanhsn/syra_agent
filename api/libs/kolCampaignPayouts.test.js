/**
 * Campaign payout controls — top-N split, creator bonus scoring, leftovers.
 * Run: node --test api/libs/kolCampaignPayouts.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeCampaignPayouts,
  computeProRataPayouts,
} from "./kolEngagementService.js";
import {
  CREATOR_SCORE_BONUS,
  getCreatePlatformFeeLamports,
  KOL_PLATFORM_FEE_LAMPORTS,
  splitRewardPool,
} from "../config/kolMarketplaceConfig.js";

const eng = { likeCount: 5, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 100 };
const none = { likeCount: 0, retweetCount: 0, replyCount: 0, quoteCount: 0, viewCount: 50 };

test("first campaign fee is waived; second pays full fee", () => {
  assert.equal(getCreatePlatformFeeLamports(true), 0);
  assert.equal(getCreatePlatformFeeLamports(false), KOL_PLATFORM_FEE_LAMPORTS);
});

test("splitRewardPool respects waived fee", () => {
  const total = 15_000_000; // 0.015 SOL
  const waived = splitRewardPool(total, 0);
  assert.equal(waived.platformFeeLamports, 0);
  assert.equal(waived.kolPoolLamports, total);

  const normal = splitRewardPool(total, KOL_PLATFORM_FEE_LAMPORTS);
  assert.equal(normal.platformFeeLamports, KOL_PLATFORM_FEE_LAMPORTS);
  assert.equal(normal.kolPoolLamports, total - KOL_PLATFORM_FEE_LAMPORTS);
});

test("computeCampaignPayouts top-N 100% leaves rest unallocated", () => {
  const pool = 1_000_000;
  const rows = [
    { _id: "a", kolWallet: "A", latestScore: 30, payoutScore: 30, latestMetrics: eng },
    { _id: "b", kolWallet: "B", latestScore: 20, payoutScore: 20, latestMetrics: eng },
    { _id: "c", kolWallet: "C", latestScore: 10, payoutScore: 10, latestMetrics: eng },
  ];
  const payouts = computeCampaignPayouts(rows, pool, {
    topN: 2,
    topNShareBps: 10_000,
  });
  const ids = new Set(payouts.map((p) => String(p.submissionId)));
  assert.ok(ids.has("a"));
  assert.ok(ids.has("b"));
  assert.equal(ids.has("c"), false);
  const sum = payouts.reduce((s, p) => s + p.lamports, 0);
  assert.equal(sum, pool);
});

test("computeCampaignPayouts 70/30 split funds rest bucket", () => {
  const pool = 10_000;
  const rows = [
    { _id: "a", kolWallet: "A", latestScore: 50, payoutScore: 50, latestMetrics: eng },
    { _id: "b", kolWallet: "B", latestScore: 30, payoutScore: 30, latestMetrics: eng },
    { _id: "c", kolWallet: "C", latestScore: 20, payoutScore: 20, latestMetrics: eng },
  ];
  const payouts = computeCampaignPayouts(rows, pool, {
    topN: 1,
    topNShareBps: 7000,
  });
  const byId = new Map(payouts.map((p) => [String(p.submissionId), p.lamports]));
  assert.ok(byId.has("a"));
  assert.ok(byId.has("b") || byId.has("c"));
  const sum = payouts.reduce((s, p) => s + p.lamports, 0);
  assert.equal(sum, pool);
  assert.ok(byId.get("a") >= 7000);
});

test("computeCampaignPayouts uses payoutScore for creator bonus ranking", () => {
  const pool = 1000;
  const rows = [
    {
      _id: "creator",
      kolWallet: "C",
      latestScore: 10,
      payoutScore: 10 * CREATOR_SCORE_BONUS,
      latestMetrics: eng,
    },
    {
      _id: "other",
      kolWallet: "O",
      latestScore: 11,
      payoutScore: 11,
      latestMetrics: eng,
    },
  ];
  const payouts = computeCampaignPayouts(rows, pool, { topN: 1, topNShareBps: 10_000 });
  assert.equal(payouts.length, 1);
  assert.equal(String(payouts[0].submissionId), "creator");
});

test("zero-engagement leftover = full pool unallocated", () => {
  const pool = 5000;
  const payouts = computeProRataPayouts(
    [
      {
        _id: "z",
        kolWallet: "Z",
        latestScore: 0,
        latestMetrics: none,
      },
    ],
    pool,
  );
  assert.equal(payouts.length, 0);
  // finalize refunds pool - allocated (= full pool)
});
