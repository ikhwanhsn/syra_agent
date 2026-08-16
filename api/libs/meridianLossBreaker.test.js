/**
 * Unit tests for Meridian real loss breaker (daily cap + consecutive + drawdown).
 * Run: node --test api/libs/meridianLossBreaker.test.js
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateMeridianDailyLoss,
  evaluateMeridianLossDecision,
  MERIDIAN_DEFAULT_DAILY_MAX_LOSS_SOL,
  MERIDIAN_MAX_CONSECUTIVE_LOSSES,
} from "./meridianLossBreaker.js";

describe("evaluateMeridianDailyLoss", () => {
  it("trips at the default 0.5 SOL daily cap", () => {
    const d = evaluateMeridianDailyLoss({
      todayPnlSol: -0.5,
      dailyMaxLossSol: MERIDIAN_DEFAULT_DAILY_MAX_LOSS_SOL,
    });
    assert.equal(d.shouldPause, true);
    assert.equal(d.forceClose, true);
    assert.equal(d.reason, "daily_loss_cap");
  });

  it("does not trip when daily PnL is above the cap", () => {
    const d = evaluateMeridianDailyLoss({
      todayPnlSol: -0.2,
      dailyMaxLossSol: 0.5,
    });
    assert.equal(d.shouldPause, false);
    assert.equal(d.reason, null);
  });

  it("does not trip on a daily win", () => {
    const d = evaluateMeridianDailyLoss({ todayPnlSol: 0.1, dailyMaxLossSol: 0.5 });
    assert.equal(d.shouldPause, false);
  });
});

describe("evaluateMeridianLossDecision", () => {
  it("prefers daily_loss_cap over consecutive losses", () => {
    const d = evaluateMeridianLossDecision({
      consecutiveLosses: 3,
      realizedNetPnlSol: -0.2,
      capitalBaselineSol: 1,
      todayPnlSol: -0.5,
      dailyMaxLossSol: 0.5,
      maxConsecutiveLosses: MERIDIAN_MAX_CONSECUTIVE_LOSSES,
      maxDrawdownPct: 20,
      absoluteKillPct: 15,
    });
    assert.equal(d.reason, "daily_loss_cap");
    assert.equal(d.forceClose, true);
  });

  it("trips consecutive losses at 3", () => {
    const d = evaluateMeridianLossDecision({
      consecutiveLosses: 3,
      realizedNetPnlSol: -0.1,
      capitalBaselineSol: 1,
      todayPnlSol: -0.1,
      dailyMaxLossSol: 0.5,
    });
    assert.equal(d.shouldPause, true);
    assert.equal(d.reason, "stopped_after_losses");
    assert.equal(d.forceClose, true);
  });

  it("trips absolute_kill at 15% drawdown", () => {
    const d = evaluateMeridianLossDecision({
      consecutiveLosses: 1,
      realizedNetPnlSol: -0.15,
      capitalBaselineSol: 1,
      todayPnlSol: -0.05,
      dailyMaxLossSol: 0.5,
    });
    assert.equal(d.shouldPause, true);
    assert.equal(d.reason, "absolute_kill");
    assert.equal(d.forceClose, true);
  });

  it("stays quiet on a small single loss", () => {
    const d = evaluateMeridianLossDecision({
      consecutiveLosses: 1,
      realizedNetPnlSol: -0.05,
      capitalBaselineSol: 1,
      todayPnlSol: -0.05,
      dailyMaxLossSol: 0.5,
    });
    assert.equal(d.shouldPause, false);
    assert.equal(d.reason, null);
  });
});
