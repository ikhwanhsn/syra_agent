/**
 * Tests for exit discipline (no fake take-profit) and deposit clamping.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clampDepositToMaxPositionSol, evaluateRealPositionExit } from "./lpRealService.js";
import {
  computeDlmmFeeShareMultiplier,
  computeLpNetPnlPct,
  LP_MAX_FEE_SHARE_MULT,
  LP_MAX_MODELED_FEE_YIELD_PCT,
} from "./lpEconomicsModel.js";
import { passesRealTrackRecordGate } from "./lpExperimentService.js";

describe("clampDepositToMaxPositionSol", () => {
  it("enforces maxPositionSol=1 even when available capital is higher", () => {
    const capped = clampDepositToMaxPositionSol(1.96, { maxPositionSol: 1 });
    assert.ok(capped <= 1 + 1e-9);
    assert.ok(capped >= 0.25);
  });

  it("never exceeds global cap", () => {
    const capped = clampDepositToMaxPositionSol(10, { maxPositionSol: 5 });
    assert.ok(capped <= 3 + 1e-9); // LP_REAL_DEFAULT_MAX_POSITION_CAP_SOL = 3
  });
});

describe("evaluateRealPositionExit — no fake take-profit", () => {
  const basePosition = {
    entryPriceUsd: 1,
    activeBinAtOpen: 100,
    binsBelow: 45,
    binsAbove: 45,
    depositSol: 1.0,
    realFeesClaimedSol: 0,
    peakPnlPct: 97344, // CATE absurd peak
    exitRules: { stopLossPct: -15, takeProfitPct: 8, trailingTriggerPct: 5, trailingGivebackPct: 2 },
    screeningSnapshot: {
      tvlUsd: 50_000,
      volume24hUsd: 200_000,
      feeTvlRatio: 0.05,
      riskScore: 0.8,
    },
  };

  it("does not take-profit when modeled peak is absurd and real value is negative", () => {
    const detail = {
      currentPrice: 0.7,
      activeBinId: 100,
      tvlUsd: 50_000,
      volume24hUsd: 200_000,
      feeTvlRatio: 0.05,
    };
    const onChain = {
      positionValueSol: 0.7,
      unclaimedFeeSol: 0.0001,
    };
    const result = evaluateRealPositionExit(basePosition, detail, 0.1, onChain);
    assert.notEqual(result.resolution, "take_profit");
    assert.ok(result.peakPnlPct <= 200 + 1e-9, `peak should be clamped, got ${result.peakPnlPct}`);
    // Real value -30% should trigger hard stop
    assert.equal(result.shouldClose, true);
    assert.ok(
      result.resolution === "real_value_stop" || result.resolution === "stop_loss",
      `expected stop, got ${result.resolution}`,
    );
  });

  it("allows take-profit only when real on-chain value is above TP with real fees", () => {
    const pos = {
      ...basePosition,
      peakPnlPct: 5,
      realFeesClaimedSol: 0.02,
      screeningSnapshot: {
        tvlUsd: 1_000_000,
        volume24hUsd: 200_000,
        feeTvlRatio: 0.001,
        riskScore: 0.3,
      },
    };
    const detail = {
      currentPrice: 1.05,
      activeBinId: 100,
      tvlUsd: 1_000_000,
      volume24hUsd: 200_000,
      feeTvlRatio: 0.001,
    };
    const onChain = {
      positionValueSol: 1.12,
      unclaimedFeeSol: 0.01,
    };
    const result = evaluateRealPositionExit(pos, detail, 4, onChain);
    assert.equal(result.shouldClose, true);
    assert.equal(result.resolution, "take_profit");
    assert.equal(result.finalStatus, "closed_win");
  });

  it("refuses take-profit when only modeled PnL looks good (no on-chain value)", () => {
    const pos = {
      ...basePosition,
      peakPnlPct: 50,
      realFeesClaimedSol: 0.01,
    };
    const detail = {
      currentPrice: 1.2,
      activeBinId: 100,
      tvlUsd: 50_000,
      volume24hUsd: 200_000,
      feeTvlRatio: 0.05,
    };
    const result = evaluateRealPositionExit(pos, detail, 2, null);
    assert.notEqual(result.resolution, "take_profit");
  });
});

describe("lpEconomicsModel clamps", () => {
  it("caps fee-share multiplier", () => {
    const m = computeDlmmFeeShareMultiplier({
      volTvlRatio: 50,
      tvlUsd: 5_000,
      binsBelow: 2,
      binsAbove: 2,
      inRange: true,
    });
    assert.ok(m <= LP_MAX_FEE_SHARE_MULT + 1e-9);
  });

  it("never models >100% net PnL on a single hold", () => {
    const pct = computeLpNetPnlPct(50, LP_MAX_MODELED_FEE_YIELD_PCT * 10, true, 0.9);
    assert.ok(pct <= 100 + 1e-9);
    assert.ok(pct >= -100 - 1e-9);
  });
});

describe("passesRealTrackRecordGate", () => {
  it("rejects strategies with no real closes", () => {
    assert.equal(passesRealTrackRecordGate(null), false);
    assert.equal(passesRealTrackRecordGate({ closed: 0, winRate: 1, sumNetPnlSol: 1 }), false);
  });

  it("rejects strategies with negative real PnL even if win rate looks fine", () => {
    assert.equal(
      passesRealTrackRecordGate({ closed: 10, wins: 6, winRate: 0.6, sumNetPnlSol: -1 }),
      false,
    );
  });

  it("accepts strategies with enough real closes, positive PnL, and min win rate", () => {
    assert.equal(
      passesRealTrackRecordGate({ closed: 8, wins: 5, winRate: 0.625, sumNetPnlSol: 0.4 }),
      true,
    );
  });

  it("rejects CATE-style strategy (8 losses, negative PnL)", () => {
    assert.equal(
      passesRealTrackRecordGate({ closed: 8, wins: 0, winRate: 0, sumNetPnlSol: -3.236 }),
      false,
    );
  });
});
