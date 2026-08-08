/**
 * Robinhood LP online pool learning.
 * Run: node --test api/libs/robinhoodLpLearning.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveRobinhoodPoolScoreMultiplier } from "./robinhoodLpLearning.js";
import {
  isRobinhoodLpEliteParent,
  ROBINHOOD_LP_ELITE_MIN_DECIDED,
  ROBINHOOD_LP_ELITE_MIN_WIN_RATE,
} from "./robinhoodLpEvolution.js";

test("deriveRobinhoodPoolScoreMultiplier needs sample before moving off 1.0", () => {
  assert.equal(deriveRobinhoodPoolScoreMultiplier(1, 1), 1);
  assert.ok(deriveRobinhoodPoolScoreMultiplier(0.7, 5) > 1);
  assert.ok(deriveRobinhoodPoolScoreMultiplier(0.3, 5) < 1);
});

test("negative expectancy haircuts multiplier", () => {
  const ok = deriveRobinhoodPoolScoreMultiplier(0.55, 6, 2);
  const bad = deriveRobinhoodPoolScoreMultiplier(0.55, 6, -5);
  assert.ok(bad < ok);
});

test("elite parent requires 12 decided and 52% WR", () => {
  assert.equal(ROBINHOOD_LP_ELITE_MIN_DECIDED, 12);
  assert.equal(ROBINHOOD_LP_ELITE_MIN_WIN_RATE, 0.52);
  assert.equal(
    isRobinhoodLpEliteParent({ decided: 3, winRate: 1, sumNetPnlUsd: 10 }),
    false,
  );
  assert.equal(
    isRobinhoodLpEliteParent({ decided: 12, winRate: 0.48, sumNetPnlUsd: 10 }),
    false,
  );
  assert.equal(
    isRobinhoodLpEliteParent({ decided: 12, winRate: 0.52, sumNetPnlUsd: 0 }),
    false,
  );
  assert.equal(
    isRobinhoodLpEliteParent({ decided: 12, winRate: 0.55, sumNetPnlUsd: 1 }),
    true,
  );
});
