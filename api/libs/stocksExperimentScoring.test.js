import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeStocksLeaderScore,
  isStocksEliteParent,
  pickWeightedElite,
  MIN_DECIDED_FOR_LEADER,
  ELITE_MIN_DECIDED,
} from "./stocksExperimentScoring.js";

describe("stocksExperimentScoring", () => {
  it("raises leader / elite sample floors above lucky streaks", () => {
    assert.ok(MIN_DECIDED_FOR_LEADER >= 12);
    assert.ok(ELITE_MIN_DECIDED >= 12);
  });

  it("scores well-sampled positive agents above tiny lucky winners", () => {
    const tiny = computeStocksLeaderScore({
      decided: 5,
      wins: 4,
      losses: 1,
      expired: 0,
      winRate: 0.8,
      sumPnlUsd: 120,
      avgPnlUsd: 24,
      grossWinUsd: 140,
      grossLossUsd: 20,
    });
    const solid = computeStocksLeaderScore({
      decided: 20,
      wins: 12,
      losses: 8,
      expired: 2,
      winRate: 0.6,
      sumPnlUsd: 120,
      avgPnlUsd: 5.5,
      grossWinUsd: 200,
      grossLossUsd: 80,
    });
    assert.ok(solid > tiny, `expected solid ${solid} > tiny ${tiny}`);
  });

  it("rejects negative or empty PnL", () => {
    assert.equal(computeStocksLeaderScore({ decided: 20, sumPnlUsd: -1, winRate: 0.5 }), -999);
    assert.equal(computeStocksLeaderScore({ decided: 0, sumPnlUsd: 10, winRate: 1 }), -999);
  });

  it("penalizes heavy expire rates", () => {
    const clean = computeStocksLeaderScore({
      decided: 16,
      wins: 10,
      losses: 6,
      expired: 0,
      winRate: 0.625,
      sumPnlUsd: 80,
      avgPnlUsd: 5,
      grossWinUsd: 120,
      grossLossUsd: 40,
    });
    const expireHeavy = computeStocksLeaderScore({
      decided: 16,
      wins: 10,
      losses: 6,
      expired: 20,
      winRate: 0.625,
      sumPnlUsd: 80,
      avgPnlUsd: 2.2,
      grossWinUsd: 120,
      grossLossUsd: 40,
    });
    assert.ok(clean > expireHeavy);
  });

  it("elite parent requires sample, net+, win rate, no open positions", () => {
    assert.equal(
      isStocksEliteParent({
        decided: 7,
        sumPnlUsd: 138,
        winRate: 0.57,
        avgPnlUsd: 19,
        openPositions: 0,
      }),
      false,
    );
    assert.equal(
      isStocksEliteParent({
        decided: 14,
        sumPnlUsd: 80,
        winRate: 0.55,
        avgPnlUsd: 5,
        openPositions: 0,
        wins: 8,
        losses: 6,
        expired: 1,
      }),
      true,
    );
  });

  it("weighted elite pick returns from the pool", () => {
    const pool = [
      { strategyId: 1, leaderScore: 2 },
      { strategyId: 2, leaderScore: 1 },
      { strategyId: 3, leaderScore: 0.5 },
    ];
    const picked = pickWeightedElite(pool, (r) => r.leaderScore, 3);
    assert.ok(picked && [1, 2, 3].includes(picked.strategyId));
    assert.equal(pickWeightedElite([], (r) => r.leaderScore), null);
  });
});
