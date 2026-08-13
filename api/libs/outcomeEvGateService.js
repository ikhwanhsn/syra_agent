/**
 * EV gate service: validates paper-sim leaders before real-capital outcome products unlock.
 */
import { OUTCOME_EV_GATE } from "../config/outcomeEvGate.js";
import { rankLpExperimentStrategiesByNetPnl } from "./lpExperimentService.js";
import LpExperimentState from "../models/LpExperimentState.js";

/**
 * @param {object} leader
 * @param {typeof OUTCOME_EV_GATE.lp_autopilot_solana} gate
 */
function passesEvGate(leader, gate) {
  if (!leader) return false;
  const decided = Number(leader.decided) || 0;
  const winRate = Number(leader.winRate) ?? 0;
  const netPnl = Number(leader.sumNetPnlUsd ?? leader.sumNetPnlSol) || 0;
  return (
    decided >= gate.minDecided &&
    winRate >= gate.minWinRate &&
    netPnl > (gate.minSumNetPnlUsd ?? gate.minSumNetPnlSol ?? 0)
  );
}

/**
 * Check EV gate for Solana LP Autopilot (Meteora real agent).
 */
export async function getSolanaLpEvGateStatus() {
  const gate = OUTCOME_EV_GATE.lp_autopilot_solana;
  let simLeader = null;
  let qualified = false;

  try {
    const state = await LpExperimentState.findById("singleton").lean();
    const experimentId = state?.activeExperimentId;
    if (experimentId) {
      const ranked = await rankLpExperimentStrategiesByNetPnl(experimentId);
      simLeader = ranked[0] ?? null;
      qualified = passesEvGate(simLeader, gate);
    }
  } catch (err) {
    return {
      productId: gate.productId,
      qualified: false,
      simLeader: null,
      gate,
      error: err instanceof Error ? err.message : String(err),
      realExecutionUnlocked: false,
    };
  }

  return {
    productId: gate.productId,
    qualified,
    simLeader: simLeader
      ? {
          strategyId: simLeader.strategyId,
          decided: simLeader.decided,
          winRate: simLeader.winRate,
          sumNetPnlSol: simLeader.sumNetPnlSol,
        }
      : null,
    gate: {
      minDecided: gate.minDecided,
      minWinRate: gate.minWinRate,
      minSumNetPnlSol: gate.minSumNetPnlSol,
    },
    realExecutionUnlocked: qualified,
  };
}

/**
 * Aggregate EV gate status for all outcome products that require it.
 */
export async function getAllEvGateStatuses() {
  const solana = await getSolanaLpEvGateStatus();
  return { lp_autopilot_solana: solana };
}

/**
 * Whether real execution is allowed for a product (EV gate + env pilot flag).
 * @param {string} productId
 */
export async function isRealExecutionUnlocked(productId) {
  if (productId === "lp_autopilot_solana") {
    const status = await getSolanaLpEvGateStatus();
    return status.qualified;
  }
  return true;
}

/**
 * Full experiment stats snapshot for EV dashboard.
 */
export async function getEvGateDashboard() {
  const gates = await getAllEvGateStatuses();
  return { gates, checkedAt: new Date().toISOString() };
}
