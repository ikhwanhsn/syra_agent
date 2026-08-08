/**
 * SYRA MM paper-edge gates — config only until a real two-sided executor exists.
 * Do not register mm / syra_mm in earnProducts.js.
 *
 * @see docs/MM_PAPER_EDGE.md
 * @see docs/EARN_YIELD_GRADUATION.md
 */

/** Paper edge gates before any real MM executor work. */
export const MM_PAPER_EDGE_GATES = Object.freeze({
  /** Minimum closed honest (non mid_fallback) round trips. */
  minHonestRoundTrips: 50,
  /** Promoted strategy must be net-positive on honest fills. */
  requireNetPositivePromoted: true,
  /** Max share of closed fills that used mid_fallback (legacy poison). */
  maxMidFallbackFrac: 0.05,
  /** Soft max inventory drift as fraction of maxInventoryUsd. */
  maxInventoryDriftFrac: 0.85,
  /** Min consecutive evolutions with same promoted strategy (stability). */
  minPromotionStability: 3,
});

/** Ordered stages. Never skip. */
export const MM_EARN_GRADUATION_STAGES = Object.freeze([
  {
    id: "paper_lab",
    label: "Paper MM lab",
    earnListed: false,
    description: "Admin /mm Jupiter-quote paper fills. No deposits.",
  },
  {
    id: "paper_edge",
    label: "Paper edge proven",
    earnListed: false,
    description: "≥50 honest trips, net+ promoted, low mid_fallback, stable promotion.",
  },
  {
    id: "real_executor",
    label: "Real two-sided executor",
    earnListed: false,
    description: "Live inventory + risk limits + walletBroker / venue adapter.",
  },
  {
    id: "earn_beta",
    label: "Earn Yield beta",
    earnListed: true,
    description: "Adapter readiness green, capped deposits, kill monitor live.",
  },
]);

/** Current stage — paper lab only. */
export const MM_EARN_CURRENT_STAGE = "paper_lab";

export const MM_EARN_KILL_CRITERIA = Object.freeze({
  paperNetNegative: "Promoted or cohort honest PnL ≤ 0",
  honestSampleBelowGate: `Honest round trips < ${MM_PAPER_EDGE_GATES.minHonestRoundTrips}`,
  midFallbackPoison: `mid_fallback fill share > ${MM_PAPER_EDGE_GATES.maxMidFallbackFrac * 100}%`,
  inventoryDriftBreach: `Inventory drift > ${MM_PAPER_EDGE_GATES.maxInventoryDriftFrac * 100}% of max inventory`,
  promotionChurn: `Promoted strategy unstable (< ${MM_PAPER_EDGE_GATES.minPromotionStability} consecutive)`,
  realExecutorMissing: "executeRealMmFill still throws / not wired",
});

/**
 * Evaluate a paper-edge snapshot against gates.
 * @param {{
 *   honestRoundTrips?: number;
 *   promotedNetPnlUsd?: number | null;
 *   midFallbackFrac?: number | null;
 *   inventoryDriftFrac?: number | null;
 *   promotionStability?: number | null;
 * }} snap
 */
export function evaluateMmPaperEdge(snap = {}) {
  const honestRoundTrips = Number(snap.honestRoundTrips) || 0;
  const promotedNetPnlUsd =
    snap.promotedNetPnlUsd == null ? null : Number(snap.promotedNetPnlUsd);
  const midFallbackFrac =
    snap.midFallbackFrac == null ? null : Number(snap.midFallbackFrac);
  const inventoryDriftFrac =
    snap.inventoryDriftFrac == null ? null : Number(snap.inventoryDriftFrac);
  const promotionStability =
    snap.promotionStability == null ? null : Number(snap.promotionStability);

  const checks = {
    minHonestRoundTrips: honestRoundTrips >= MM_PAPER_EDGE_GATES.minHonestRoundTrips,
    netPositivePromoted:
      promotedNetPnlUsd != null &&
      Number.isFinite(promotedNetPnlUsd) &&
      promotedNetPnlUsd > 0,
    midFallbackOk:
      midFallbackFrac == null ||
      (Number.isFinite(midFallbackFrac) &&
        midFallbackFrac <= MM_PAPER_EDGE_GATES.maxMidFallbackFrac),
    inventoryDriftOk:
      inventoryDriftFrac == null ||
      (Number.isFinite(inventoryDriftFrac) &&
        inventoryDriftFrac <= MM_PAPER_EDGE_GATES.maxInventoryDriftFrac),
    promotionStable:
      promotionStability != null &&
      Number.isFinite(promotionStability) &&
      promotionStability >= MM_PAPER_EDGE_GATES.minPromotionStability,
  };

  const pass = Object.values(checks).every(Boolean);
  return {
    pass,
    checks,
    gates: MM_PAPER_EDGE_GATES,
    currentStage: MM_EARN_CURRENT_STAGE,
    nextBlockedUntil: pass ? "real_two_sided_executor" : "paper_edge_dossier_pass",
    earnYieldAllowed: false,
    note: "Earn Yield listing remains forbidden until a real MM executor + risk limits exist. Never register mm / syra_mm in earnProducts.js from this gate alone.",
  };
}
