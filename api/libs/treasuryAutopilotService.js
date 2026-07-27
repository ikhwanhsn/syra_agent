/**
 * Treasury Autopilot: manage agent treasury (idle stables, de-risk, rebalance).
 * Pilot implementation: policy evaluation + recommendation execution scaffold.
 */
import { getOutcomeMandate } from "./outcomeMandateService.js";

/**
 * @param {import('./outcomeJobRuntime.js').RuntimeContext} ctx
 */
export async function runTreasuryAutopilotTick(ctx) {
  const { mandate, input } = ctx;
  const policy = mandate.policy ?? {};
  const targetStablePct = Number(policy.targetStablePct) || 70;
  const maxSingleAssetPct = Number(policy.maxSingleAssetPct) || 40;
  const rebalanceThresholdPct = Number(policy.rebalanceThresholdPct) || 10;

  const portfolio = input.portfolio ?? {
    totalUsd: 0,
    holdings: [],
  };

  const decisions = [];
  let rebalanceNeeded = false;

  if (portfolio.totalUsd > 0 && Array.isArray(portfolio.holdings)) {
    const stableUsd = portfolio.holdings
      .filter((h) => ["USDC", "USDT", "USDG"].includes(String(h.symbol || "").toUpperCase()))
      .reduce((s, h) => s + (Number(h.usdValue) || 0), 0);
    const stablePct = (stableUsd / portfolio.totalUsd) * 100;

    if (stablePct < targetStablePct - rebalanceThresholdPct) {
      rebalanceNeeded = true;
      decisions.push({
        action: "increase_stable_allocation",
        currentStablePct: stablePct,
        targetStablePct,
        suggestedSwapUsd: ((targetStablePct - stablePct) / 100) * portfolio.totalUsd,
      });
    }

    for (const holding of portfolio.holdings) {
      const pct = ((Number(holding.usdValue) || 0) / portfolio.totalUsd) * 100;
      if (pct > maxSingleAssetPct) {
        rebalanceNeeded = true;
        decisions.push({
          action: "trim_concentration",
          symbol: holding.symbol,
          currentPct: pct,
          maxSingleAssetPct,
        });
      }
    }
  }

  const dryRun = input.dryRun !== false;
  const executed = dryRun ? [] : decisions;

  return {
    decision: {
      rebalanceNeeded,
      decisions,
      policy: { targetStablePct, maxSingleAssetPct, rebalanceThresholdPct },
    },
    execution: {
      dryRun,
      executed,
      skipped: dryRun ? decisions.length : 0,
    },
    realizedPnlUsd: 0,
    summary: rebalanceNeeded
      ? `Treasury Autopilot: ${decisions.length} rebalance action(s) ${dryRun ? "recommended (dry-run)" : "executed"}.`
      : "Treasury Autopilot: portfolio within policy bounds, no action required.",
    metrics: {
      managedCapitalUsd: portfolio.totalUsd ?? 0,
      realizedPnlUsd: 0,
      positionsOpened: 0,
      positionsClosed: 0,
    },
    txProofs: [],
  };
}

/**
 * Evaluate treasury policy for a mandate without running a full job.
 * @param {string} mandateId
 * @param {Object} portfolio
 */
export async function evaluateTreasuryPolicy(mandateId, portfolio) {
  const mandate = await getOutcomeMandate(mandateId);
  if (!mandate) throw new Error(`Mandate not found: ${mandateId}`);
  return runTreasuryAutopilotTick({
    job: {},
    mandate,
    product: { id: "treasury_autopilot" },
    input: { portfolio, dryRun: true },
  });
}
