/**
 * Stocks News Lab → Earn Yield graduation gates.
 * Config-only until a real executor exists. Do not register in earnProducts.js.
 *
 * @see docs/STOCKS_NEWS_PAPER_EDGE.md
 * @see docs/EARN_YIELD_GRADUATION.md
 */

/** Paper edge gates before any real executor work. */
export const STOCKS_PAPER_EDGE_GATES = Object.freeze({
  /** Minimum decided paper trades (win + loss + expired) across the active cohort. */
  minDecided: 50,
  /** Champion strategy must be net-positive after paper round-trip costs. */
  requireNetPositiveChampion: true,
  /** Minimum champion win rate among decided trades. */
  minChampionWinRate: 0.48,
  /** Soft max drawdown from peak paper equity (fraction). Document in dossier; hard-fail if worse. */
  maxDrawdownFrac: 0.25,
  /** Paper round-trip cost debit used in sim (bps). */
  paperRoundTripBpsDefault: 110,
});

/** Hard prerequisites before Earn Yield registry work. */
export const STOCKS_EARN_PREREQUISITES = Object.freeze([
  "paper_edge_dossier_pass",
  "equity_token_compliance_review",
  "real_jupiter_executor",
  "stocks_real_config_lab_only",
  "real_cron_enabled",
  "earn_adapter_readiness",
  "kill_monitor_wired",
]);

/** Ordered stages. Never skip. */
export const STOCKS_EARN_GRADUATION_STAGES = Object.freeze([
  {
    id: "paper_watch",
    label: "Admin paper watch",
    earnListed: false,
    description:
      "Admin-only /stocks desk on a realistic paper sim. No public nav, no deposits, no real executor until paper_edge passes.",
  },
  {
    id: "paper_edge",
    label: "Paper edge proven",
    earnListed: false,
    description: "≥50 decided, net-positive champion after costs, drawdown documented.",
  },
  {
    id: "compliance",
    label: "Compliance review",
    earnListed: false,
    description: "Equity-like xStocks legal/reputational review cleared.",
  },
  {
    id: "real_lab",
    label: "Capped real lab",
    earnListed: false,
    description: "Jupiter + walletBroker executor, publicEarnListed=false, small notional.",
  },
  {
    id: "earn_beta",
    label: "Earn Yield beta",
    earnListed: true,
    description: "Adapter readiness green, allowlist/capped deposits, kill monitor live.",
  },
]);

/** Current stage — paper watch only. Bump only when prior stage evidence exists. */
export const STOCKS_EARN_CURRENT_STAGE = "paper_watch";

/**
 * Kill criteria: stop graduation / pause lab if any trip after paper edge claim.
 */
export const STOCKS_EARN_KILL_CRITERIA = Object.freeze({
  paperNetNegativeAfterCosts: "Champion or cohort net PnL ≤ 0 after round-trip costs",
  decidedBelowGate: `Decided sample < ${STOCKS_PAPER_EDGE_GATES.minDecided}`,
  drawdownBreach: `Max drawdown > ${STOCKS_PAPER_EDGE_GATES.maxDrawdownFrac * 100}% from peak equity`,
  realErrorRate: "Real lab error rate ≥ 10% (pause) / > 5% blocks Earn readiness",
  realSettleFail: "Solana settlement success < 95% on sample ≥ 10",
  complianceBlock: "Compliance review fails or is revoked for equity-like tokens",
});

/**
 * Evaluate a paper-edge snapshot against gates.
 * @param {{
 *   decided?: number;
 *   championNetPnlUsd?: number | null;
 *   championWinRate?: number | null;
 *   maxDrawdownFrac?: number | null;
 *   complianceCleared?: boolean;
 * }} snap
 */
export function evaluateStocksPaperEdge(snap = {}) {
  const decided = Number(snap.decided) || 0;
  const championNetPnlUsd = snap.championNetPnlUsd == null ? null : Number(snap.championNetPnlUsd);
  const championWinRate = snap.championWinRate == null ? null : Number(snap.championWinRate);
  const maxDrawdownFrac = snap.maxDrawdownFrac == null ? null : Number(snap.maxDrawdownFrac);

  const checks = {
    minDecided: decided >= STOCKS_PAPER_EDGE_GATES.minDecided,
    netPositiveChampion:
      championNetPnlUsd != null &&
      Number.isFinite(championNetPnlUsd) &&
      championNetPnlUsd > 0,
    minWinRate:
      championWinRate != null &&
      Number.isFinite(championWinRate) &&
      championWinRate >= STOCKS_PAPER_EDGE_GATES.minChampionWinRate,
    drawdownOk:
      maxDrawdownFrac == null ||
      (Number.isFinite(maxDrawdownFrac) &&
        maxDrawdownFrac <= STOCKS_PAPER_EDGE_GATES.maxDrawdownFrac),
  };

  const pass = Object.values(checks).every(Boolean);
  return {
    pass,
    checks,
    gates: STOCKS_PAPER_EDGE_GATES,
    nextBlockedUntil: pass
      ? "compliance_review_then_real_executor"
      : "paper_edge_dossier_pass",
    earnYieldAllowed: false,
    note: "Earn Yield listing remains forbidden until compliance + real lab readiness. Never register stocks_* in earnProducts.js from this gate alone.",
  };
}
