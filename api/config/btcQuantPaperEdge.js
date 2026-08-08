/**
 * BTC quant paper-edge dossier gates (btc1 Earn lane + btc2 desk).
 * Measures whether the paper cohort still has a qualified leader after ~110 bps costs.
 * Earn Yield graduation still uses btcQuantEarnAdapter.getReadiness (real samples, btc1 only).
 *
 * @see docs/BTC_QUANT_PAPER_EDGE.md
 * @see docs/EARN_YIELD_CBBTC_EVAL.md
 */

/** Paper edge gates for the active lane cohort. */
export const BTC_QUANT_PAPER_EDGE_GATES = Object.freeze({
  /** Minimum decided paper trades (win + loss + expired) across the active cohort. */
  minDecided: 50,
  /** Champion / qualified leader must be net-positive after paper round-trip costs. */
  requireNetPositiveLeader: true,
  /** Minimum leader win rate among decided trades (aligned with real leader bar). */
  minLeaderWinRate: 0.52,
  /** Minimum decided trades on the leader strategy (aligned with pickBestBtcQuantStrategy). */
  minLeaderDecided: 8,
  /** Paper round-trip cost debit used in sim (bps). */
  paperRoundTripBpsDefault: 110,
});

/** Ordered stages. Never skip. Earn listing only via adapter readiness on btc1. */
export const BTC_QUANT_PAPER_EDGE_STAGES = Object.freeze([
  {
    id: "paper_measure",
    label: "Paper measure",
    earnListed: false,
    description: "Run dossier on btc1/btc2; learning is daily batch evolution, not per-trade ML.",
  },
  {
    id: "paper_edge",
    label: "Paper edge proven",
    earnListed: false,
    description: "≥50 decided, qualified leader (WR ≥52%, net+ after costs).",
  },
  {
    id: "real_lab",
    label: "Capped real lab",
    earnListed: false,
    description: "Jupiter cbBTC real desk enabled; cooldowns + learned gates enforced.",
  },
  {
    id: "earn_beta",
    label: "Earn Yield beta",
    earnListed: true,
    description: "btc1 adapter readiness green (btc2 stays experimental desk).",
  },
]);

/** Kill / pause signals for ops when claiming paper edge. */
export const BTC_QUANT_PAPER_EDGE_KILL_CRITERIA = Object.freeze({
  paperNetNegativeAfterCosts: "Qualified leader or cohort net PnL ≤ 0 after round-trip costs",
  decidedBelowGate: `Decided sample < ${BTC_QUANT_PAPER_EDGE_GATES.minDecided}`,
  noQualifiedLeader: `No strategy with decided ≥ ${BTC_QUANT_PAPER_EDGE_GATES.minLeaderDecided}, WR ≥ ${BTC_QUANT_PAPER_EDGE_GATES.minLeaderWinRate * 100}%, net PnL > 0`,
  realErrorRate: "Real lab error rate ≥ 10% (pause) / > 5% blocks Earn readiness",
  realSettleFail: "Solana settlement success < 95% on sample ≥ 10",
  endlessAlmost:
    "btc2 still has no qualified leader after ≥3 evolution ticks with cohort decided ≥ 50 — redesign signal, do not add more mutations",
});

/** Current ops stage for the paper dossier (Earn uses adapter readiness separately). */
export const BTC_QUANT_PAPER_EDGE_CURRENT_STAGE = "paper_measure";

/**
 * Evaluate a paper-edge snapshot against gates.
 * Paper edge pass is necessary but not sufficient for Earn Yield (needs real readiness).
 *
 * @param {{
 *   decided?: number;
 *   leaderNetPnlUsd?: number | null;
 *   leaderWinRate?: number | null;
 *   leaderDecided?: number | null;
 *   hasQualifiedLeader?: boolean;
 * }} snap
 */
export function evaluateBtcQuantPaperEdge(snap = {}) {
  const decided = Number(snap.decided) || 0;
  const leaderNetPnlUsd = snap.leaderNetPnlUsd == null ? null : Number(snap.leaderNetPnlUsd);
  const leaderWinRate = snap.leaderWinRate == null ? null : Number(snap.leaderWinRate);
  const leaderDecided = snap.leaderDecided == null ? null : Number(snap.leaderDecided);
  const hasQualifiedLeader =
    typeof snap.hasQualifiedLeader === "boolean"
      ? snap.hasQualifiedLeader
      : leaderDecided != null &&
        leaderWinRate != null &&
        leaderNetPnlUsd != null &&
        leaderDecided >= BTC_QUANT_PAPER_EDGE_GATES.minLeaderDecided &&
        leaderWinRate >= BTC_QUANT_PAPER_EDGE_GATES.minLeaderWinRate &&
        leaderNetPnlUsd > 0;

  const checks = {
    minDecided: decided >= BTC_QUANT_PAPER_EDGE_GATES.minDecided,
    netPositiveLeader:
      leaderNetPnlUsd != null &&
      Number.isFinite(leaderNetPnlUsd) &&
      leaderNetPnlUsd > 0,
    minLeaderWinRate:
      leaderWinRate != null &&
      Number.isFinite(leaderWinRate) &&
      leaderWinRate >= BTC_QUANT_PAPER_EDGE_GATES.minLeaderWinRate,
    minLeaderDecided:
      leaderDecided != null &&
      Number.isFinite(leaderDecided) &&
      leaderDecided >= BTC_QUANT_PAPER_EDGE_GATES.minLeaderDecided,
    qualifiedLeader: hasQualifiedLeader === true,
  };

  const pass = Object.values(checks).every(Boolean);
  return {
    pass,
    checks,
    gates: BTC_QUANT_PAPER_EDGE_GATES,
    /** Earn still requires real adapter readiness — paper edge alone never opens deposits. */
    earnYieldAllowed: false,
    nextBlockedUntil: pass
      ? "real_adapter_readiness"
      : "btc_quant_paper_edge",
  };
}
