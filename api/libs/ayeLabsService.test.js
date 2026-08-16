/**
 * AyeLabs paper EV gate, exit labeling, and graduation floors.
 * Run: node --test api/libs/ayeLabsService.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AYE_LABS_DEFAULTS,
  AYE_LABS_EV_HOLD_HOURS,
  AYE_LABS_MIN_FEE_TO_COST_RATIO,
  AYE_LABS_STRATEGIES,
} from "../config/ayeLabsStrategies.js";
import {
  evaluateAyeLabsOpenEv,
  evaluateAyeLabsRunResolution,
} from "./ayeLabsService.js";
import { evaluateAyeLabsPaperGraduation } from "./ayeLabsRealService.js";
import { mutateAyeLabsFromElite, selectAyeLabsBanditLeader } from "./ayeLabsEvolution.js";

const HOT_POOL = {
  depositSol: 1,
  tvlUsd: 25_000,
  volume24hUsd: 3_000_000,
  feeTvlRatio: 0.2,
  volatilityScore: 0.55,
  binsBelow: 36,
  binsAbove: 36,
};

const DEAD_POOL = {
  depositSol: 1,
  tvlUsd: 3_100_000,
  volume24hUsd: 36_000_000,
  feeTvlRatio: 0.0045,
  volatilityScore: 0.35,
  binsBelow: 40,
  binsAbove: 40,
};

test("static AyeLabs strategies are two-sided fee-farm ranges", () => {
  assert.equal(AYE_LABS_DEFAULTS.maxRunAgeHours, 12);
  assert.equal(AYE_LABS_EV_HOLD_HOURS, 12);
  assert.equal(AYE_LABS_MIN_FEE_TO_COST_RATIO, 1);
  for (const s of AYE_LABS_STRATEGIES) {
    assert.ok(s.binsBelow >= 12, `strategy ${s.id} binsBelow`);
    assert.ok(s.binsAbove >= 12, `strategy ${s.id} binsAbove`);
  }
});

test("evaluateAyeLabsOpenEv rejects low-fee pools after the paper haircut", () => {
  const ev = evaluateAyeLabsOpenEv(DEAD_POOL);
  assert.equal(ev.pass, false);
  assert.equal(ev.reason, "fees_below_chain_costs");
  assert.ok(ev.expectedFeeSol < ev.roundTripCostSol * ev.minFeeToCostRatio);
});

test("evaluateAyeLabsOpenEv accepts a hot fee pool that covers calibrated costs", () => {
  const ev = evaluateAyeLabsOpenEv(HOT_POOL);
  assert.equal(ev.pass, true);
  assert.equal(ev.reason, null);
  assert.ok(ev.expectedFeeSol >= ev.roundTripCostSol * ev.minFeeToCostRatio);
  assert.equal(ev.needsSidecar, false);
});

test("evaluateAyeLabsOpenEv charges more for single-sided sidecar opens", () => {
  const twoSided = evaluateAyeLabsOpenEv(HOT_POOL);
  const single = evaluateAyeLabsOpenEv({ ...HOT_POOL, binsBelow: 60, binsAbove: 0 });
  assert.equal(single.needsSidecar, true);
  assert.ok(single.roundTripCostSol > twoSided.roundTripCostSol);
});

test("stop-loss and take-profit both use net PnL, not raw price drift", () => {
  const run = {
    depositSol: 1,
    depositUsd: 150,
    entryPriceUsd: 1,
    binsBelow: 40,
    binsAbove: 40,
    activeBinAtOpen: 100,
    simOpenFeeSol: 0.0052,
    screeningSnapshot: { riskScore: 0.4, volatilityScore: 0.5, peakPnlPct: 0 },
    tvlUsd: 40_000,
    volume24hUsd: 2_000_000,
    feeTvlRatio: 0.15,
  };
  const exit = {
    stopLossPct: -10,
    takeProfitPct: 6,
    minHoldMin: 30,
    oorWaitMin: 30,
    trailingTriggerPct: 4,
    trailingDropPct: 2,
  };

  const sl = evaluateAyeLabsRunResolution(
    run,
    {
      currentPrice: 0.7,
      activeBinId: 40,
      tvlUsd: run.tvlUsd,
      volume24hUsd: run.volume24hUsd,
      feeTvlRatio: run.feeTvlRatio,
    },
    exit,
    2,
    AYE_LABS_DEFAULTS,
  );
  assert.equal(sl.resolution, "stop_loss");
  assert.ok(sl.simPnlPct <= -10);

  const hold = evaluateAyeLabsRunResolution(
    run,
    {
      currentPrice: 1,
      activeBinId: 100,
      tvlUsd: run.tvlUsd,
      volume24hUsd: run.volume24hUsd,
      feeTvlRatio: 0.2,
    },
    exit,
    12,
    AYE_LABS_DEFAULTS,
  );
  // Symmetric: TP also keys off net PnL. 12h of 20%/day fees should not stop-loss.
  assert.notEqual(hold.resolution, "stop_loss");
  assert.ok(hold.simPnlPct > -10);
});

test("wins that are net-negative after tx costs are relabeled as losses", () => {
  const fields = evaluateAyeLabsRunResolution(
    {
      depositSol: 1,
      depositUsd: 150,
      entryPriceUsd: 1,
      binsBelow: 40,
      binsAbove: 40,
      activeBinAtOpen: 100,
      simOpenFeeSol: 0.0052,
      screeningSnapshot: { riskScore: 0.3, volatilityScore: 0.3, peakPnlPct: 0 },
      tvlUsd: 3_100_000,
      volume24hUsd: 36_000_000,
      feeTvlRatio: 0.0045,
    },
    {
      currentPrice: 1.002,
      activeBinId: 100,
      tvlUsd: 3_100_000,
      volume24hUsd: 36_000_000,
      feeTvlRatio: 0.0045,
    },
    { stopLossPct: -10, takeProfitPct: 6, minHoldMin: 5, oorWaitMin: 15 },
    12,
    { ...AYE_LABS_DEFAULTS, maxRunAgeHours: 12, winThresholdPct: 0.01 },
  );
  assert.ok(["loss", "expired"].includes(fields.status));
  assert.ok(fields.simNetPnlSol <= 0);
  if (fields.status === "win") {
    assert.fail("net-negative close must not stay a win");
  }
});

test("evaluateAyeLabsPaperGraduation requires sample, positive avg, and win rate", () => {
  const failSample = evaluateAyeLabsPaperGraduation({
    agents: [{ strategyId: 0, decided: 10, wins: 8, sumNetPnlSol: 0.5 }],
  });
  assert.equal(failSample.pass, false);

  const failPnl = evaluateAyeLabsPaperGraduation({
    agents: [{ strategyId: 0, decided: 20, wins: 12, sumNetPnlSol: -0.2 }],
  });
  assert.equal(failPnl.pass, false);
  assert.equal(failPnl.reason, "need_positive_avg_net_pnl");

  const failWr = evaluateAyeLabsPaperGraduation({
    agents: [{ strategyId: 0, decided: 20, wins: 4, sumNetPnlSol: 0.4 }],
  });
  assert.equal(failWr.pass, false);
  assert.match(failWr.reason, /need_win_rate_/);

  const pass = evaluateAyeLabsPaperGraduation({
    agents: [
      { strategyId: 0, decided: 12, wins: 7, sumNetPnlSol: 0.3 },
      { strategyId: 1, decided: 10, wins: 5, sumNetPnlSol: 0.2 },
      { strategyId: 98, decided: 40, wins: 40, sumNetPnlSol: 9 },
    ],
  });
  assert.equal(pass.pass, true);
  assert.equal(pass.decided, 22);
  assert.ok(pass.winRate >= 0.45);
});

test("selectAyeLabsBanditLeader never returns a negative-net leader", () => {
  const none = selectAyeLabsBanditLeader([
    { strategyId: 0, decided: 12, wins: 8, losses: 4, expired: 0, sumNetPnlSol: -0.8 },
    { strategyId: 98, decided: 20, wins: 20, losses: 0, expired: 0, sumNetPnlSol: 4 },
  ]);
  assert.equal(none, null);

  const leader = selectAyeLabsBanditLeader([
    { strategyId: 0, decided: 12, wins: 8, losses: 4, expired: 0, sumNetPnlSol: -0.8 },
    { strategyId: 3, decided: 10, wins: 6, losses: 4, expired: 0, sumNetPnlSol: 0.25 },
  ]);
  assert.equal(leader?.strategyId, 3);
});

test("mutateAyeLabsFromElite keeps two-sided bins and a 12h max hold", () => {
  const mutated = mutateAyeLabsFromElite(
    { lpShape: "spot", binsBelow: 40, binsAbove: 40, exit: { minHoldMin: 30, maxHoldMin: 720 } },
    12,
    { parentStrategyId: 0, parentNetPnlSol: 0.2 },
  );
  assert.ok(mutated.binsBelow >= 12);
  assert.ok(mutated.binsAbove >= 12);
  assert.equal(mutated.exit.maxHoldMin, 720);
});
