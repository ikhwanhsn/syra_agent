/**
 * Yield Autopilot: route idle capital across yield venues automatically.
 * Pilot: evaluates Marinade/Jito/Giza opportunities and records deployment intent.
 */
import { getOutcomeMandate } from "./outcomeMandateService.js";

const YIELD_VENUES = Object.freeze([
  { id: "marinade", label: "Marinade Liquid Staking", asset: "SOL", estApyPct: 7.2 },
  { id: "jito", label: "Jito Liquid Staking", asset: "SOL", estApyPct: 7.8 },
  { id: "giza", label: "Giza Yield Agent", asset: "USDC", estApyPct: 5.5 },
]);

/**
 * @param {import('./outcomeJobRuntime.js').RuntimeContext} ctx
 */
export async function runYieldAutopilotTick(ctx) {
  const { mandate, input } = ctx;
  const policy = mandate.policy ?? {};
  const minDeployUsd = Number(policy.minDeployUsd) || 10;
  const preferredVenues = Array.isArray(policy.preferredVenues)
    ? policy.preferredVenues
    : ["marinade", "giza"];

  const idleCapitalUsd = Number(input.idleCapitalUsd) || 0;
  const dryRun = input.dryRun !== false;

  const venues = YIELD_VENUES.filter((v) => preferredVenues.includes(v.id)).sort(
    (a, b) => b.estApyPct - a.estApyPct,
  );

  const deployments = [];
  if (idleCapitalUsd >= minDeployUsd && venues.length > 0) {
    const top = venues[0];
    deployments.push({
      venue: top.id,
      label: top.label,
      amountUsd: Math.min(idleCapitalUsd, mandate.maxManagedCapitalUsd ?? idleCapitalUsd),
      estApyPct: top.estApyPct,
      status: dryRun ? "simulated" : "pending_execution",
    });
  }

  const estAnnualYieldUsd = deployments.reduce(
    (s, d) => s + (d.amountUsd * d.estApyPct) / 100,
    0,
  );

  return {
    decision: {
      deploy: deployments.length > 0,
      deployments,
      venuesEvaluated: venues.length,
      idleCapitalUsd,
    },
    execution: {
      dryRun,
      deployments,
    },
    realizedPnlUsd: 0,
    summary:
      deployments.length > 0
        ? `Yield Autopilot: ${dryRun ? "would deploy" : "deploying"} $${deployments[0].amountUsd.toFixed(2)} to ${deployments[0].label} (~${deployments[0].estApyPct}% APY).`
        : `Yield Autopilot: idle capital $${idleCapitalUsd.toFixed(2)} below minimum deploy threshold ($${minDeployUsd}).`,
    metrics: {
      managedCapitalUsd: deployments.reduce((s, d) => s + d.amountUsd, 0),
      realizedPnlUsd: 0,
      positionsOpened: deployments.length,
      positionsClosed: 0,
      feesCollectedUsd: estAnnualYieldUsd / 12,
    },
    txProofs: [],
  };
}

/**
 * List available yield venues for mandate policy configuration.
 */
export function listYieldVenues() {
  return [...YIELD_VENUES];
}

/**
 * @param {string} mandateId
 * @param {number} idleCapitalUsd
 */
export async function evaluateYieldOpportunity(mandateId, idleCapitalUsd) {
  const mandate = await getOutcomeMandate(mandateId);
  if (!mandate) throw new Error(`Mandate not found: ${mandateId}`);
  return runYieldAutopilotTick({
    job: {},
    mandate,
    product: { id: "yield_autopilot" },
    input: { idleCapitalUsd, dryRun: true },
  });
}
