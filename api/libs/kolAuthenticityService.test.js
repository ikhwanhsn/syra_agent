/**
 * KOL authenticity (Tier-2) unit tests.
 * Run: node --test api/libs/kolAuthenticityService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AUTHENTICITY_FLOOR,
  AUTHENTICITY_HOLD_THRESHOLD,
} from "../config/kolScoringConfig.js";
import {
  computeAuthenticityFromSample,
  looksLikeSpamComment,
  normalizeCommentText,
  resolveClaimStatusAfterAudit,
  scoreEngagerAccount,
} from "./kolAuthenticityService.js";

test("scoreEngagerAccount penalizes young low-follower accounts", () => {
  const now = Date.now();
  const bad = scoreEngagerAccount(
    {
      followers: 2,
      following: 3_000,
      profilePicture: null,
      description: "",
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { now },
  );
  const good = scoreEngagerAccount(
    {
      followers: 5_000,
      following: 800,
      profilePicture: "https://pbs.twimg.com/profile_images/abc.jpg",
      description: "Builder in crypto",
      createdAt: new Date(now - 400 * 24 * 60 * 60 * 1000).toISOString(),
      verified: true,
    },
    { now },
  );

  assert.ok(bad.score < 0.5);
  assert.ok(bad.reasons.includes("young_account"));
  assert.ok(bad.reasons.includes("low_followers"));
  assert.ok(good.score > bad.score);
  assert.ok(good.score >= 0.9);
});

test("scoreEngagerAccount boosts s3labs-verified engagers", () => {
  const now = Date.now();
  const base = {
    followers: 40,
    following: 100,
    profilePicture: "https://pbs.twimg.com/profile_images/abc.jpg",
    description: "gm",
    createdAt: new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const unverified = scoreEngagerAccount(base, { now });
  const verified = scoreEngagerAccount(base, { now, isS3Verified: true });
  assert.ok(verified.score >= unverified.score);
  assert.ok(verified.reasons.includes("s3labs_verified"));
});

test("normalizeCommentText collapses noise for duplicate detection", () => {
  assert.equal(
    normalizeCommentText("Great project!!! @alice https://x.com/a #crypto"),
    "great project",
  );
});

test("looksLikeSpamComment catches generic buy-farm replies", () => {
  assert.equal(looksLikeSpamComment("Nice!"), true);
  assert.equal(looksLikeSpamComment("gm"), true);
  assert.equal(looksLikeSpamComment("Check this free airdrop now"), true);
  assert.equal(
    looksLikeSpamComment("Loved the product breakdown on liquidity routing"),
    false,
  );
});

test("computeAuthenticityFromSample discounts bot farms with duplicate spam", () => {
  const now = Date.now();
  const weekAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

  const farm = Array.from({ length: 12 }, (_, i) => ({
    text: "Nice!",
    author: {
      userName: `bot${i}`,
      followers: 3,
      following: 2500,
      profilePicture: null,
      description: "",
      createdAt: weekAgo,
    },
  }));

  const genuine = Array.from({ length: 8 }, (_, i) => ({
    text: `Thoughtful take on the ${i}th point about market structure`,
    author: {
      userName: `human${i}`,
      followers: 2_000 + i * 10,
      following: 400,
      profilePicture: "https://pbs.twimg.com/profile_images/x.jpg",
      description: "Researcher",
      createdAt: new Date(now - (200 + i) * 24 * 60 * 60 * 1000).toISOString(),
    },
  }));

  const farmResult = computeAuthenticityFromSample(farm, { now });
  const genuineResult = computeAuthenticityFromSample(genuine, { now });

  assert.ok(farmResult.multiplier < AUTHENTICITY_HOLD_THRESHOLD);
  assert.ok(farmResult.reasons.includes("duplicate_comments") || farmResult.reasons.includes("spam_comments"));
  assert.ok(genuineResult.multiplier > farmResult.multiplier);
  assert.ok(genuineResult.multiplier >= 0.7);
  assert.ok(farmResult.multiplier >= AUTHENTICITY_FLOOR);
});

test("computeAuthenticityFromSample stays neutral with empty sample", () => {
  const result = computeAuthenticityFromSample([], {});
  assert.equal(result.multiplier, 1);
  assert.ok(result.reasons.includes("no_sample"));
});

test("resolveClaimStatusAfterAudit holds low authenticity or spiked engagement", () => {
  assert.equal(
    resolveClaimStatusAfterAudit({ earnedLamports: 0, authenticityMultiplier: 0.2 }),
    "unearned",
  );
  assert.equal(
    resolveClaimStatusAfterAudit({
      earnedLamports: 1_000_000,
      authenticityMultiplier: 0.9,
      integrityFlags: [],
    }),
    "claimable",
  );
  assert.equal(
    resolveClaimStatusAfterAudit({
      earnedLamports: 1_000_000,
      authenticityMultiplier: 0.3,
      integrityFlags: [],
    }),
    "held_review",
  );
  assert.equal(
    resolveClaimStatusAfterAudit({
      earnedLamports: 1_000_000,
      authenticityMultiplier: 0.6,
      integrityFlags: ["engagement_spike"],
    }),
    "held_review",
  );
  assert.equal(
    resolveClaimStatusAfterAudit({
      earnedLamports: 1_000_000,
      authenticityMultiplier: 0.9,
      integrityFlags: ["engagement_spike"],
      holdRecommended: true,
    }),
    "held_review",
  );
});
