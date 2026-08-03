/**
 * Unit tests for LP Real loss circuit breaker (consecutive losses + session drawdown + absolute kill).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countConsecutiveLosses,
  computeSessionDrawdownPct,
  evaluateLossBreaker,
  sumRealizedNetPnlSol,
} from "./lpRealLossBreaker.js";

describe("lpRealLossBreaker", () => {
  describe("countConsecutiveLosses", () => {
    it("counts trailing closed_loss from newest first", () => {
      assert.equal(
        countConsecutiveLosses([
          { status: "closed_loss" },
          { status: "closed_loss" },
          { status: "closed_loss" },
          { status: "closed_win" },
          { status: "closed_loss" },
        ]),
        3,
      );
    });

    it("stops at expired the same as a win", () => {
      assert.equal(
        countConsecutiveLosses([
          { status: "closed_loss" },
          { status: "expired" },
          { status: "closed_loss" },
        ]),
        1,
      );
    });

    it("skips error/claim_only without breaking the streak", () => {
      assert.equal(
        countConsecutiveLosses([
          { status: "closed_loss" },
          { status: "error" },
          { status: "claim_only" },
          { status: "closed_loss" },
          { status: "closed_win" },
        ]),
        2,
      );
    });

    it("returns 0 for empty or win-first", () => {
      assert.equal(countConsecutiveLosses([]), 0);
      assert.equal(countConsecutiveLosses([{ status: "closed_win" }]), 0);
    });

    it("counts 4 consecutive losses (CATE post-mortem threshold)", () => {
      assert.equal(
        countConsecutiveLosses([
          { status: "closed_loss" },
          { status: "closed_loss" },
          { status: "closed_loss" },
          { status: "closed_loss" },
        ]),
        4,
      );
    });
  });

  describe("computeSessionDrawdownPct", () => {
    it("returns 0 when PnL is non-negative or baseline invalid", () => {
      assert.equal(computeSessionDrawdownPct(0.5, 3), 0);
      assert.equal(computeSessionDrawdownPct(0, 3), 0);
      assert.equal(computeSessionDrawdownPct(-1, 0), 0);
      assert.equal(computeSessionDrawdownPct(-1, NaN), 0);
    });

    it("computes drawdown as % of baseline", () => {
      assert.equal(computeSessionDrawdownPct(-0.75, 3), 25);
      assert.ok(Math.abs(computeSessionDrawdownPct(-3.236, 3.9) - 82.974) < 0.01);
    });

    it("caps at 100", () => {
      assert.equal(computeSessionDrawdownPct(-10, 3), 100);
    });
  });

  describe("sumRealizedNetPnlSol", () => {
    it("sums finite realNetPnlSol only", () => {
      assert.equal(
        sumRealizedNetPnlSol([
          { realNetPnlSol: -0.38 },
          { realNetPnlSol: -0.38 },
          { realNetPnlSol: null },
          { realNetPnlSol: -0.35 },
        ]).toFixed(2),
        "-1.11",
      );
    });
  });

  describe("evaluateLossBreaker", () => {
    it("trips stopped_after_losses at default consecutive threshold (4) with forceClose", () => {
      const d = evaluateLossBreaker({
        consecutiveLosses: 4,
        realizedNetPnlSol: -0.5,
        capitalBaselineSol: 3,
        maxConsecutiveLosses: 4,
        maxDrawdownPct: 25,
        absoluteKillPct: 50,
      });
      assert.equal(d.shouldPause, true);
      assert.equal(d.forceClose, true);
      assert.equal(d.reason, "stopped_after_losses");
    });

    it("does not trip below consecutive threshold when drawdown is under cap", () => {
      const d = evaluateLossBreaker({
        consecutiveLosses: 3,
        realizedNetPnlSol: -0.5,
        capitalBaselineSol: 3,
        maxConsecutiveLosses: 4,
        maxDrawdownPct: 25,
        absoluteKillPct: 50,
      });
      assert.equal(d.shouldPause, false);
      assert.equal(d.forceClose, false);
      assert.equal(d.reason, null);
    });

    it("trips drawdown_stop when session drawdown >= threshold", () => {
      const d = evaluateLossBreaker({
        consecutiveLosses: 2,
        realizedNetPnlSol: -1.0,
        capitalBaselineSol: 3,
        maxConsecutiveLosses: 4,
        maxDrawdownPct: 25,
        absoluteKillPct: 50,
      });
      assert.equal(d.shouldPause, true);
      assert.equal(d.forceClose, true);
      assert.equal(d.reason, "drawdown_stop");
    });

    it("prefers absolute_kill when drawdown hits hard floor", () => {
      // CATE: -3.236 on 4.37 baseline ≈ 74%; absolute kill at 20% fires first.
      const d = evaluateLossBreaker({
        consecutiveLosses: 8,
        realizedNetPnlSol: -3.236,
        capitalBaselineSol: 4.37,
        maxConsecutiveLosses: 4,
        maxDrawdownPct: 25,
        absoluteKillPct: 20,
      });
      assert.equal(d.shouldPause, true);
      assert.equal(d.forceClose, true);
      assert.equal(d.reason, "absolute_kill");
    });

    it("trips absolute_kill at exactly -20% even with 1 loss", () => {
      const d = evaluateLossBreaker({
        consecutiveLosses: 1,
        realizedNetPnlSol: -0.6,
        capitalBaselineSol: 3,
        maxConsecutiveLosses: 4,
        maxDrawdownPct: 25,
        absoluteKillPct: 20,
      });
      assert.equal(d.shouldPause, true);
      assert.equal(d.reason, "absolute_kill");
      assert.equal(d.forceClose, true);
    });

    it("respects custom thresholds", () => {
      const d = evaluateLossBreaker({
        consecutiveLosses: 2,
        realizedNetPnlSol: -0.1,
        capitalBaselineSol: 10,
        maxConsecutiveLosses: 2,
        maxDrawdownPct: 50,
        absoluteKillPct: 90,
      });
      assert.equal(d.shouldPause, true);
      assert.equal(d.reason, "stopped_after_losses");
      assert.equal(d.forceClose, true);
    });
  });
});
