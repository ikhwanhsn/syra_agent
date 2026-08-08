/**
 * Honest labels for Meteora LP Lab global stats.
 * Cohort sumNetPnlSol must never be presented as a single strategy or live wallet result.
 */

export const LP_LAB_COHORT_PNL_LABEL = "Paper cohort sim PnL";

export const LP_LAB_LIVE_EARNINGS_LABEL = "Your live earnings";

export const LP_LAB_PAPER_BANNER_TITLE = "Paper metrics are not wallet profit";

export const LP_LAB_PAPER_BANNER_BODY =
  "Paper cohort PnL is a fee-share simulation across many 10 SOL agents. It is not comparable to live earnings. Degen paper leaders stay sim-only; Earn deploys only strategies that pass a real track-record gate. IL, slippage, and chain costs can lose principal.";

export const LP_LAB_LIVE_EARNINGS_NOT_COMPARABLE =
  "On-chain wallet PnL only. Not comparable to paper cohort sum.";

/** Labels that must never be used for simulation.sumNetPnlSol (cohort aggregate). */
const FORBIDDEN_COHORT_LABEL_RE = /\b(best practice|top strategy|best strategy)\b/i;

export type LpLabCohortSimFields = {
  leaderStrategyId?: number | null;
  leaderSumNetPnlSol?: number | null;
  leaderAvgNetPnlSol?: number | null;
  leaderWinRate?: number | null;
  strategyCount?: number | null;
};

export function assertLpLabCohortLabelHonest(label: string): void {
  if (FORBIDDEN_COHORT_LABEL_RE.test(label)) {
    throw new Error(
      `LP Lab cohort metric label must not imply a single strategy win: "${label}"`,
    );
  }
  if (!/paper|cohort|sim/i.test(label)) {
    throw new Error(`LP Lab cohort metric label must mark paper/sim semantics: "${label}"`);
  }
}

export function formatLpLabCohortPnlSubValue(
  sim: LpLabCohortSimFields | null | undefined,
  formatSol: (n: number) => string,
): string {
  const count = sim?.strategyCount;
  const base =
    count != null && count > 0
      ? `Sum across ${count} paper agents (not one wallet)`
      : "Sum across all paper agents (not one wallet)";

  if (sim?.leaderStrategyId == null) {
    return `${base}. Strategies are competing now.`;
  }

  const parts: string[] = [`Paper leader #${sim.leaderStrategyId}`];
  if (sim.leaderSumNetPnlSol != null && Number.isFinite(sim.leaderSumNetPnlSol)) {
    const n = sim.leaderSumNetPnlSol;
    parts.push(`${n >= 0 ? "+" : ""}${formatSol(n)} SOL sim`);
  } else if (sim.leaderAvgNetPnlSol != null && Number.isFinite(sim.leaderAvgNetPnlSol)) {
    const n = sim.leaderAvgNetPnlSol;
    parts.push(`avg ${n >= 0 ? "+" : ""}${formatSol(n)} SOL/run`);
  }
  if (sim.leaderWinRate != null && Number.isFinite(sim.leaderWinRate)) {
    parts.push(`${(sim.leaderWinRate * 100).toFixed(0)}% win`);
  }

  return `${base}. ${parts.join(" · ")}. Degen lineages are sim-only.`;
}

export function getLpLabCohortStatPresentation(
  sim: LpLabCohortSimFields | null | undefined,
  formatSol: (n: number) => string,
): { label: string; valueKey: "sumNetPnlSol"; subValue: string } {
  assertLpLabCohortLabelHonest(LP_LAB_COHORT_PNL_LABEL);
  return {
    label: LP_LAB_COHORT_PNL_LABEL,
    valueKey: "sumNetPnlSol",
    subValue: formatLpLabCohortPnlSubValue(sim, formatSol),
  };
}
