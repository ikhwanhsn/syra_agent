import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SCALPER_DEFAULTS } from "../../config/scalperConfig.js";
import { passesSelectivityGate } from "./scalperSignalEngine.js";
import {
  computeDeskPauseDecision,
  computeUnderperformanceOverrides,
  shouldDisableIdleRelaxation,
} from "./scalperLearningService.js";

describe("shouldDisableIdleRelaxation", () => {
  it("blocks idle relaxation when avg PnL is negative", () => {
    assert.equal(shouldDisableIdleRelaxation({ winRate: 0.6, avgPnlPct: -0.2 }), true);
  });

  it("blocks idle relaxation when win rate is weak", () => {
    assert.equal(shouldDisableIdleRelaxation({ winRate: 0.4, avgPnlPct: 0.1 }), true);
  });

  it("allows idle relaxation when expectancy is healthy", () => {
    assert.equal(shouldDisableIdleRelaxation({ winRate: 0.55, avgPnlPct: 0.2 }), false);
  });

  it("honors explicit override flag", () => {
    assert.equal(
      shouldDisableIdleRelaxation({ winRate: 0.7, avgPnlPct: 0.5 }, { disableIdleRelaxation: true }),
      true,
    );
  });
});

describe("computeDeskPauseDecision", () => {
  const now = Date.parse("2026-08-08T00:00:00.000Z");

  it("pauses on negative expectancy", () => {
    const out = computeDeskPauseDecision(
      { decided: 7, winRate: 0, avgPnlPct: -2 },
      5,
      null,
      now,
      12,
    );
    assert.equal(out.paused, true);
    assert.ok(out.until instanceof Date);
    assert.equal(out.until.getTime(), now + 18 * 60 * 60_000);
    assert.match(out.reason, /negative_expectancy/);
  });

  it("keeps an active pause without extending", () => {
    const existing = new Date(now + 4 * 60 * 60_000);
    const out = computeDeskPauseDecision(
      { decided: 7, winRate: 0, avgPnlPct: -2 },
      5,
      existing,
      now,
      12,
    );
    assert.equal(out.paused, true);
    assert.equal(out.until.getTime(), existing.getTime());
    assert.equal(out.reason, "existing_pause");
  });

  it("clears pause when expectancy recovers", () => {
    const existing = new Date(now + 4 * 60 * 60_000);
    const out = computeDeskPauseDecision(
      { decided: 10, winRate: 0.6, avgPnlPct: 0.3 },
      5,
      existing,
      now,
      12,
    );
    assert.equal(out.paused, false);
    assert.equal(out.until, null);
    assert.equal(out.cleared, true);
  });

  it("does not pause with insufficient samples", () => {
    const out = computeDeskPauseDecision(
      { decided: 3, winRate: 0, avgPnlPct: -1 },
      5,
      null,
      now,
      12,
    );
    assert.equal(out.paused, false);
  });
});

describe("computeUnderperformanceOverrides", () => {
  it("raises score ceiling and enables confluence-only", () => {
    const out = computeUnderperformanceOverrides(SCALPER_DEFAULTS, {
      decided: 7,
      winRate: 0,
      avgPnlPct: -1.99,
    });
    assert.equal(out.underperforming, true);
    assert.equal(out.thresholdOverrides.confluenceOnly, true);
    assert.equal(out.thresholdOverrides.disableIdleRelaxation, true);
    assert.ok(out.thresholdOverrides.minOpportunityScore <= SCALPER_DEFAULTS.underperfMinScoreCeiling);
    assert.ok(out.thresholdOverrides.minOpportunityScore >= 0.66);
    assert.equal(
      out.thresholdOverrides.minSoloMomentumScore,
      SCALPER_DEFAULTS.underperfMinSoloMomentumScore,
    );
  });

  it("is a no-op when healthy", () => {
    const out = computeUnderperformanceOverrides(SCALPER_DEFAULTS, {
      decided: 20,
      winRate: 0.6,
      avgPnlPct: 0.5,
    });
    assert.equal(out.underperforming, false);
    assert.deepEqual(out.thresholdOverrides, {});
  });
});

describe("passesSelectivityGate expectancy options", () => {
  it("blocks solo entries in confluence-only mode", () => {
    assert.equal(
      passesSelectivityGate(0.9, "momentum", 1, 0.55, { confluenceOnly: true }),
      false,
    );
    assert.equal(
      passesSelectivityGate(0.9, "momentum", 2, 0.55, { confluenceOnly: true }),
      true,
    );
  });

  it("honors raised solo momentum floor", () => {
    assert.equal(
      passesSelectivityGate(0.65, "momentum", 1, 0.55, { minSoloMomentumScore: 0.72 }),
      false,
    );
    assert.equal(
      passesSelectivityGate(0.75, "momentum", 1, 0.55, { minSoloMomentumScore: 0.72 }),
      true,
    );
  });
});
