/**
 * EV gate service: validates paper-sim leaders before real-capital outcome products unlock.
 */
import { OUTCOME_EV_GATE } from "../config/outcomeEvGate.js";
import {
  ensureRobinhoodLpExperimentBootstrapped,
  rankRobinhoodLpStrategiesByNetPnl,
  getRobinhoodLpExperimentStats,
} from "./robinhoodLpExperimentService.js";
import { fetchRobinhoodUniswapPoolPages, deriveFeeTvlRatio } from "./robinhoodUniswapClient.js";
import { passesRobinhoodSimPoolScreen } from "./robinhoodLpExperimentService.js";
import RobinhoodLpExperimentState from "../models/RobinhoodLpExperimentState.js";
import { rankLpExperimentStrategiesByNetPnl } from "./lpExperimentService.js";
import LpExperimentState from "../models/LpExperimentState.js";

/**
 * @param {string} gateProductId
 * @param {object} leader
 * @param {typeof OUTCOME_EV_GATE.robinhood_lp_autopilot} gate
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
 * Quick pool-universe check without MongoDB.
 */
export async function validateRobinhoodPoolUniverse() {
  const pools = await fetchRobinhoodUniswapPoolPages({ pages: 2, limit: 60, sortKey: "volume" });
  const eligible = pools.filter((p) => passesRobinhoodSimPoolScreen(p));
  if (eligible.length === 0) {
    return { ok: false, reason: "no_eligible_pools", poolCount: pools.length, eligibleCount: 0 };
  }
  const top = [...eligible].sort((a, b) => b.feeTvlRatio - a.feeTvlRatio)[0];
  const derived = deriveFeeTvlRatio({
    volume24hUsd: top.volume24hUsd,
    tvlUsd: top.tvlUsd,
    feeTier: top.feeTier,
  });
  if (derived <= 0 || !Number.isFinite(derived)) {
    return { ok: false, reason: "invalid_fee_tvl", poolCount: pools.length, eligibleCount: eligible.length };
  }
  return {
    ok: true,
    poolCount: pools.length,
    eligibleCount: eligible.length,
    topPool: { name: top.poolName, feeTvlRatio: derived, tvlUsd: top.tvlUsd },
  };
}

/**
 * Check EV gate status for Robinhood LP Autopilot.
 */
export async function getRobinhoodLpEvGateStatus() {
  const gate = OUTCOME_EV_GATE.robinhood_lp_autopilot;
  const poolCheck = await validateRobinhoodPoolUniverse();

  let simLeader = null;
  let qualified = false;

  try {
    await ensureRobinhoodLpExperimentBootstrapped();
    const state = await RobinhoodLpExperimentState.findById("singleton").lean();
    const experimentId = state?.activeExperimentId;
    if (experimentId) {
      const ranked = await rankRobinhoodLpStrategiesByNetPnl(experimentId);
      simLeader = ranked[0] ?? null;
      qualified = poolCheck.ok && passesEvGate(simLeader, gate);
    }
  } catch (err) {
    return {
      productId: gate.productId,
      qualified: false,
      poolCheck,
      simLeader: null,
      gate,
      error: err instanceof Error ? err.message : String(err),
      realExecutionUnlocked: false,
    };
  }

  return {
    productId: gate.productId,
    qualified,
    poolCheck,
    simLeader: simLeader
      ? {
          strategyId: simLeader.strategyId,
          decided: simLeader.decided,
          winRate: simLeader.winRate,
          sumNetPnlUsd: simLeader.sumNetPnlUsd,
        }
      : null,
    gate: {
      minDecided: gate.minDecided,
      minWinRate: gate.minWinRate,
      minSumNetPnlUsd: gate.minSumNetPnlUsd,
    },
    realExecutionUnlocked: qualified,
  };
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
  const [robinhood, solana] = await Promise.all([
    getRobinhoodLpEvGateStatus(),
    getSolanaLpEvGateStatus(),
  ]);
  return { robinhood_lp_autopilot: robinhood, lp_autopilot_solana: solana };
}

/**
 * Whether real execution is allowed for a product (EV gate + env pilot flag).
 * @param {string} productId
 */
export async function isRealExecutionUnlocked(productId) {
  if (productId === "robinhood_lp_autopilot") {
    const status = await getRobinhoodLpEvGateStatus();
    return status.qualified;
  }
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
  let stats = null;
  try {
    stats = await getRobinhoodLpExperimentStats();
  } catch {
    stats = null;
  }
  return { gates, robinhoodStats: stats, checkedAt: new Date().toISOString() };
}
