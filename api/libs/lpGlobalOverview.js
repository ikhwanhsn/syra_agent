/**
 * Platform-wide LP experiment + real agent metrics for the experiment page header.
 */
import LpRealConfig from "../models/LpRealConfig.js";
import LpRealPosition from "../models/LpRealPosition.js";
import LpExperimentRun from "../models/LpExperimentRun.js";
import { fetchMeteoraPools } from "./meteoraDlmmClient.js";
import {
  ensureLpExperimentBootstrapped,
  fetchSolPriceUsd,
  getLpCandidatePools,
  getLpExperimentLabState,
  getLpExperimentStats,
  rankLpExperimentStrategiesByNetPnl,
} from "./lpExperimentService.js";

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sumUniqueCandidateTvl(candidates) {
  const byPool = new Map();
  for (const row of candidates || []) {
    const addr = row.poolAddress;
    if (!addr) continue;
    const tvl = toNum(row.tvlUsd, 0);
    byPool.set(addr, Math.max(byPool.get(addr) || 0, tvl));
  }
  let total = 0;
  for (const tvl of byPool.values()) total += tvl;
  return { poolCount: byPool.size, totalTvlUsd: total };
}

async function aggregateRealAgentGlobal() {
  const [enabledAgents, totals, openAgg] = await Promise.all([
    LpRealConfig.countDocuments({ enabled: true }),
    LpRealPosition.aggregate([
      {
        $group: {
          _id: null,
          totalPositions: { $sum: 1 },
          realizedNetPnlSol: {
            $sum: {
              $cond: [
                { $in: ["$status", ["closed_win", "closed_loss", "expired"]] },
                { $ifNull: ["$realNetPnlSol", 0] },
                0,
              ],
            },
          },
          realWins: { $sum: { $cond: [{ $eq: ["$status", "closed_win"] }, 1, 0] } },
          realLosses: {
            $sum: {
              $cond: [{ $in: ["$status", ["closed_loss", "expired", "error"]] }, 1, 0],
            },
          },
          totalFeesClaimedSol: { $sum: { $ifNull: ["$realFeesClaimedSol", 0] } },
        },
      },
    ]),
    LpRealPosition.aggregate([
      { $match: { status: { $in: ["open", "opening", "closing"] } } },
      {
        $group: {
          _id: null,
          openCount: { $sum: 1 },
          deployedSol: { $sum: { $ifNull: ["$depositSol", 0] } },
        },
      },
    ]),
  ]);

  const row = totals[0] || {};
  const openRow = openAgg[0] || {};
  const decided = toNum(row.realWins) + toNum(row.realLosses);
  return {
    enabledAgents,
    openPositions: toNum(openRow.openCount),
    deployedSol: toNum(openRow.deployedSol),
    realizedNetPnlSol: toNum(row.realizedNetPnlSol),
    realWinRate: decided > 0 ? toNum(row.realWins) / decided : null,
    realWins: toNum(row.realWins),
    realLosses: toNum(row.realLosses),
    totalFeesClaimedSol: toNum(row.totalFeesClaimedSol),
    totalPositions: toNum(row.totalPositions),
  };
}

async function aggregateSimCohortGlobal(experimentId, agents, statsAgents) {
  const [settledCount, openCount] = await Promise.all([
    LpExperimentRun.countDocuments({
      experimentId,
      status: { $in: ["win", "loss", "expired"] },
    }),
    LpExperimentRun.countDocuments({ experimentId, status: "open" }),
  ]);

  const sumNetPnlSol = (statsAgents || []).reduce((s, a) => s + toNum(a.sumNetPnlSol, 0), 0);
  const sumEquitySol = (agents || []).reduce((s, a) => s + toNum(a.equitySol, 0), 0);
  const sumDeployedSol = (agents || []).reduce((s, a) => s + toNum(a.deployedSol, 0), 0);
  const openFromStats = (statsAgents || []).reduce((s, a) => s + toNum(a.openPositions, 0), 0);

  const ranked = experimentId ? await rankLpExperimentStrategiesByNetPnl(experimentId) : [];
  const leader = ranked[0] || null;

  return {
    settledRuns: settledCount,
    openPositions: openCount || openFromStats,
    sumNetPnlSol,
    sumEquitySol,
    sumDeployedSol,
    leaderStrategyId: leader?.strategyId ?? null,
    leaderAvgNetPnlSol: leader?.avgDecidedNetPnlSol ?? null,
    leaderWinRate: leader?.winRate ?? null,
  };
}

export async function getLpGlobalOverview() {
  await ensureLpExperimentBootstrapped();

  const [labState, stats, candidates, real, meteoraPools, solPriceUsd] = await Promise.all([
    getLpExperimentLabState(),
    getLpExperimentStats(),
    getLpCandidatePools(),
    aggregateRealAgentGlobal(),
    fetchMeteoraPools({ page: 1, limit: 40, sortKey: "tvl", order: "desc", hideLowTvl: true }).catch(
      () => [],
    ),
    fetchSolPriceUsd(),
  ]);

  const candidateTvl = sumUniqueCandidateTvl(candidates);
  const meteoraScanTvlUsd = (meteoraPools || []).reduce((s, p) => s + toNum(p.tvlUsd, 0), 0);
  const meteoraScanVol24hUsd = (meteoraPools || []).reduce((s, p) => s + toNum(p.volume24hUsd, 0), 0);

  const statsAgents = stats?.agents || [];
  const sim = await aggregateSimCohortGlobal(
    labState?.activeExperimentId,
    labState?.agents,
    statsAgents,
  );

  const bestByWinRate = [...statsAgents]
    .filter((a) => (a.decided ?? 0) >= 3)
    .sort((a, b) => (b.winRatePct ?? -1) - (a.winRatePct ?? -1))[0];

  return {
    solPriceUsd,
    meteora: {
      poolsScanned: meteoraPools?.length ?? 0,
      scanTvlUsd: meteoraScanTvlUsd,
      scanVolume24hUsd: meteoraScanVol24hUsd,
    },
    candidates: {
      poolCount: candidateTvl.poolCount,
      trackedTvlUsd: candidateTvl.totalTvlUsd,
    },
    simulation: {
      activeExperimentId: labState?.activeExperimentId ?? null,
      strategyCount: statsAgents.length,
      ...sim,
      topWinRateStrategyId: bestByWinRate?.strategyId ?? null,
      topWinRatePct: bestByWinRate?.winRatePct ?? null,
    },
    realAgent: real,
  };
}
