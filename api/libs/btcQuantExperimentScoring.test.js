import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeBtcLeaderScore,
  isBtcEliteParent,
  pickWeightedElite,
  ELITE_MIN_DECIDED,
  FULL_SAMPLE_DECIDED,
} from "./btcQuantExperimentScoring.js";

describe("btcQuantExperimentScoring", () => {
  it("raises sample floors above tiny lucky streaks", () => {
    assert.ok(ELITE_MIN_DECIDED >= 8);
    assert.ok(FULL_SAMPLE_DECIDED >= 16);
  });

  it("scores well-sampled positive agents above tiny lucky winners", () => {
    const tiny = computeBtcLeaderScore({
      decided: 5,
      wins: 4,
      losses: 1,
      expired: 0,
      winRate: 0.8,
      sumDecidedPnlUsd: 40,
      avgPnlUsd: 8,
      grossWinUsd: 48,
      grossLossUsd: 8,
    });
    const solid = computeBtcLeaderScore({
      decided: 16,
      wins: 10,
      losses: 6,
      expired: 1,
      winRate: 0.625,
      sumDecidedPnlUsd: 40,
      avgPnlUsd: 2.4,
      grossWinUsd: 70,
      grossLossUsd: 30,
    });
    assert.ok(solid > tiny, `expected solid ${solid} > tiny ${tiny}`);
  });

  it("rejects negative or empty PnL", () => {
    assert.equal(computeBtcLeaderScore({ decided: 16, sumDecidedPnlUsd: -1, winRate: 0.5 }), -999);
    assert.equal(computeBtcLeaderScore({ decided: 0, sumDecidedPnlUsd: 10, winRate: 1 }), -999);
  });

  it("penalizes heavy expire rates", () => {
    const clean = computeBtcLeaderScore({
      decided: 16,
      wins: 10,
      losses: 6,
      expired: 0,
      winRate: 0.625,
      sumDecidedPnlUsd: 40,
      avgPnlUsd: 2.5,
      grossWinUsd: 70,
      grossLossUsd: 30,
    });
    const expireHeavy = computeBtcLeaderScore({
      decided: 16,
      wins: 10,
      losses: 6,
      expired: 20,
      winRate: 0.625,
      sumDecidedPnlUsd: 40,
      avgPnlUsd: 1.1,
      grossWinUsd: 70,
      grossLossUsd: 30,
    });
    assert.ok(clean > expireHeavy);
  });

  it("elite parent requires sample, net+, win rate, no open positions", () => {
    assert.equal(
      isBtcEliteParent({
        decided: 5,
        sumDecidedPnlUsd: 40,
        winRate: 0.8,
        avgPnlUsd: 8,
        openPositions: 0,
      }),
      false,
    );
    assert.equal(
      isBtcEliteParent({
        decided: 10,
        sumDecidedPnlUsd: 40,
        winRate: 0.55,
        avgPnlUsd: 4,
        openPositions: 0,
      }),
      true,
    );
    assert.equal(
      isBtcEliteParent({
        decided: 10,
        sumDecidedPnlUsd: 40,
        winRate: 0.55,
        avgPnlUsd: 4,
        openPositions: 1,
      }),
      false,
    );
  });

  it("pickWeightedElite returns from top pool", () => {
    const elites = [
      { id: "a", leaderScore: 3 },
      { id: "b", leaderScore: 2 },
      { id: "c", leaderScore: 1 },
    ];
    const pick = pickWeightedElite(elites, (r) => r.leaderScore, 2);
    assert.ok(pick && (pick.id === "a" || pick.id === "b"));
  });
});
