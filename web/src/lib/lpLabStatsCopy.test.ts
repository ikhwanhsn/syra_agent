import { describe, expect, it } from "vitest";
import {
  LP_LAB_COHORT_PNL_LABEL,
  assertLpLabCohortLabelHonest,
  formatLpLabCohortPnlSubValue,
  getLpLabCohortStatPresentation,
} from "./lpLabStatsCopy";

const formatSol = (n: number) => n.toFixed(2);

describe("lpLabStatsCopy cohort metric honesty", () => {
  it("exports a paper/cohort label and rejects best-practice / top-strategy aliases", () => {
    expect(() => assertLpLabCohortLabelHonest(LP_LAB_COHORT_PNL_LABEL)).not.toThrow();
    expect(() => assertLpLabCohortLabelHonest("Best practice result")).toThrow(/single strategy/i);
    expect(() => assertLpLabCohortLabelHonest("Top strategy PnL")).toThrow(/single strategy/i);
    expect(() => assertLpLabCohortLabelHonest("Net PnL")).toThrow(/paper\/sim/i);
  });

  it("binds the hero cohort tile to sumNetPnlSol, not a leader-only label", () => {
    const tile = getLpLabCohortStatPresentation(
      {
        strategyCount: 40,
        leaderStrategyId: 38,
        leaderSumNetPnlSol: 12.5,
        leaderWinRate: 0.61,
      },
      formatSol,
    );
    expect(tile.label).toBe(LP_LAB_COHORT_PNL_LABEL);
    expect(tile.valueKey).toBe("sumNetPnlSol");
    expect(tile.label).not.toMatch(/best practice|top strategy|best strategy/i);
    expect(tile.subValue).toMatch(/Sum across 40 paper agents/i);
    expect(tile.subValue).toMatch(/Paper leader #38/);
    expect(tile.subValue).toMatch(/\+12\.50 SOL sim/);
    expect(tile.subValue).toMatch(/sim-only/i);
  });

  it("formats a competing-now subvalue when there is no leader", () => {
    expect(formatLpLabCohortPnlSubValue({}, formatSol)).toMatch(/competing now/i);
  });
});
