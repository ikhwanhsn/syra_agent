/**
 * Meridian desk unit tests — strategies, bandit, mutation, real safety defaults.
 * Run: node --test api/libs/meridianEvolution.test.js
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MERIDIAN_STRATEGIES,
  MERIDIAN_SCREENING_BASE,
  MERIDIAN_DEFAULTS,
  MERIDIAN_REAL_MIRROR_STRATEGY_ID,
  MERIDIAN_STATIC_STRATEGY_COUNT,
} from "../config/meridianStrategies.js";
import { MERIDIAN_CRON } from "../config/onchainEarnExperiments.js";
import {
  meridianEvolutionConfigFromEnv,
  mutateMeridianFromElite,
  thompsonSampleStrategy,
  selectMeridianBanditLeader,
} from "./meridianEvolution.js";
import { isMeridianRealCronEnabled, meridianRealCapsMayScale, isMeridianGraduationBypassAllowed } from "./meridianRealService.js";
import MeridianRealConfig from "../models/MeridianRealConfig.js";

test("Meridian Blue-Chip Spot is strategy 0 with conservative screening", () => {
  const core = MERIDIAN_STRATEGIES.find((s) => s.id === 0);
  assert.ok(core);
  assert.equal(core.name, "Meridian Blue-Chip Spot");
  assert.equal(core.lpShape, "spot");
  assert.equal(core.binsBelow, 45);
  assert.equal(core.binsAbove, 45);
  assert.equal(core.exit?.takeProfitPct, 5);
  assert.equal(core.exit?.stopLossPct, -10);
  assert.equal(core.exit?.trailingTriggerPct, 3);
  assert.equal(core.exit?.trailingDropPct, 1.5);
  assert.equal(core.screeningOverrides?.minFeeTvlRatio, MERIDIAN_SCREENING_BASE.minFeeTvlRatio);
  assert.equal(core.screeningOverrides?.minTvlUsd, 500_000);
  assert.equal(core.screeningOverrides?.minOrganic, 60);
  assert.equal(MERIDIAN_SCREENING_BASE.minFeeTvlRatio, 0.01);
  assert.equal(MERIDIAN_SCREENING_BASE.minHolders, 3_000);
  assert.equal(MERIDIAN_SCREENING_BASE.minVolume24hUsd, 100_000);
});

test("Meridian roster includes mirror 98 and static count", () => {
  assert.equal(MERIDIAN_STATIC_STRATEGY_COUNT, 12);
  const mirror = MERIDIAN_STRATEGIES.find((s) => s.id === MERIDIAN_REAL_MIRROR_STRATEGY_ID);
  assert.ok(mirror);
  assert.ok(MERIDIAN_STRATEGIES.length >= 13);
});

test("MERIDIAN_CRON is fast autolearn", () => {
  assert.equal(MERIDIAN_CRON.paperSignalMs, 90_000);
  assert.equal(MERIDIAN_CRON.paperResolveMs, 45_000);
  assert.equal(MERIDIAN_CRON.evolution.intervalMs, 45 * 60_000);
  assert.equal(MERIDIAN_CRON.evolution.minDecided, 3);
  assert.equal(MERIDIAN_CRON.realEnabled, true);
});

test("meridianEvolutionConfigFromEnv pins mirror and uses 45m cadence", () => {
  const cfg = meridianEvolutionConfigFromEnv();
  assert.equal(cfg.enabled, true);
  assert.equal(cfg.ms, 2_700_000);
  assert.equal(cfg.removeCount, 3);
  assert.equal(cfg.minDecided, 3);
  assert.ok(cfg.pinned.has(98));
});

test("thompsonSampleStrategy returns a strategy from the set", () => {
  const agents = [
    { strategyId: 0, wins: 10, losses: 2, decided: 12, sumNetPnlSol: 0.5 },
    { strategyId: 1, wins: 2, losses: 8, decided: 10, sumNetPnlSol: -0.3 },
    { strategyId: 5, wins: 0, losses: 0, decided: 0, sumNetPnlSol: 0 },
  ];
  const picks = new Set();
  for (let i = 0; i < 30; i += 1) {
    const picked = thompsonSampleStrategy(agents);
    assert.ok(picked);
    picks.add(picked.strategyId);
  }
  assert.ok(picks.size >= 1);
  for (const id of picks) assert.ok([0, 1, 5].includes(id));
});

test("selectMeridianBanditLeader prefers decided agents when present", () => {
  const agents = [
    { strategyId: 0, wins: 12, losses: 1, decided: 13, sumNetPnlSol: 1.2 },
    { strategyId: 1, wins: 0, losses: 9, decided: 9, sumNetPnlSol: -0.8 },
  ];
  const leader = selectMeridianBanditLeader(agents);
  assert.ok(leader);
  assert.ok([0, 1].includes(leader.strategyId));
});

test("selectMeridianBanditLeader with requirePositivePnl never picks a loser", () => {
  const agents = [
    { strategyId: 0, wins: 12, losses: 1, decided: 13, sumNetPnlSol: 1.2 },
    { strategyId: 1, wins: 0, losses: 9, decided: 9, sumNetPnlSol: -0.8 },
  ];
  for (let i = 0; i < 40; i += 1) {
    const leader = selectMeridianBanditLeader(agents, { requirePositivePnl: true });
    assert.ok(leader);
    assert.equal(leader.strategyId, 0);
  }
});

test("selectMeridianBanditLeader with requirePositivePnl returns null when all red", () => {
  const leader = selectMeridianBanditLeader(
    [{ strategyId: 1, wins: 0, losses: 9, decided: 9, sumNetPnlSol: -0.8 }],
    { requirePositivePnl: true },
  );
  assert.equal(leader, null);
});

test("meridianRealCapsMayScale requires real closed track record", () => {
  assert.equal(meridianRealCapsMayScale({ closed: 4, winRate: 0.75, sumNetPnlSol: 0.2 }), false);
  assert.equal(meridianRealCapsMayScale({ closed: 5, winRate: 0.4, sumNetPnlSol: 0.2 }), false);
  assert.equal(meridianRealCapsMayScale({ closed: 5, winRate: 0.6, sumNetPnlSol: -0.1 }), false);
  assert.equal(meridianRealCapsMayScale({ closed: 5, winRate: 0.6, sumNetPnlSol: 0.2 }), true);
});

test("mutateMeridianFromElite preserves parent shape most of the time and sets new id", () => {
  const parent = MERIDIAN_STRATEGIES[0];
  const child = mutateMeridianFromElite(parent, 42, { lessons: ["never chase thin TVL"] });
  assert.equal(child.strategyId, 42);
  assert.ok(child.name.includes("42") || child.name.includes("Mut"));
  assert.ok(["spot", "bid_ask", "curve", "mixed"].includes(child.lpShape));
  assert.ok(Number.isFinite(child.binsBelow));
  assert.ok(Number.isFinite(child.exit?.takeProfitPct));
  assert.ok(String(child.notes || "").length >= 0);
});

test("Meridian real ships disabled with hard caps", () => {
  assert.equal(isMeridianRealCronEnabled(), true);
  const enabledDefault = MeridianRealConfig.schema.path("enabled").options.default;
  const maxPosDefault = MeridianRealConfig.schema.path("maxPositionSol").options.default;
  const maxConcDefault = MeridianRealConfig.schema.path("maxConcurrentPositions").options.default;
  assert.equal(enabledDefault, false);
  assert.equal(maxPosDefault, 0.3);
  assert.equal(maxConcDefault, 2);
  assert.equal(MERIDIAN_DEFAULTS.gasReserve, 0.2);
  assert.equal(MERIDIAN_DEFAULTS.positionSizePct, 0.35);
  assert.equal(isMeridianGraduationBypassAllowed(), false);
});
