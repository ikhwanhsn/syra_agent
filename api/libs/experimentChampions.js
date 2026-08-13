/**
 * Nightly champion promotion — pick the best risk-adjusted strategy per desk
 * and persist it for overview / featured-agent surfaces.
 */
import ExperimentChampionState from "../models/ExperimentChampionState.js";
import { computeRiskAdjustedLeaderScore, toNum } from "./earnExperimentKit.js";

/**
 * @param {string} deskId
 * @param {Array<{
 *   strategyId: number|string,
 *   strategyName?: string,
 *   sumPnl?: number,
 *   sumPnlUsd?: number,
 *   sumNetPnlUsd?: number,
 *   sumNetPnlSol?: number,
 *   winRate?: number|null,
 *   decided?: number,
 *   wins?: number,
 *   losses?: number,
 *   expired?: number,
 * }>} agents
 * @param {{ minDecided?: number, metric?: string }} [opts]
 */
export async function promoteDeskChampion(deskId, agents, opts = {}) {
  const minDecided = opts.minDecided ?? 5;
  const metric = opts.metric || "usd";
  const scored = (Array.isArray(agents) ? agents : [])
    .map((a) => {
      const sumPnl =
        metric === "sol"
          ? toNum(a.sumNetPnlSol ?? a.sumPnl)
          : toNum(a.sumNetPnlUsd ?? a.sumPnlUsd ?? a.sumPnl);
      const decided = toNum(a.decided);
      const score = computeRiskAdjustedLeaderScore({
        sumPnl,
        winRate: a.winRate,
        decided,
        wins: a.wins,
        losses: a.losses,
        expired: a.expired,
      });
      return { ...a, sumPnl, score };
    })
    .filter((a) => a.decided >= minDecided && a.sumPnl > 0)
    .sort((a, b) => b.score - a.score);

  const champ = scored[0] || null;
  const payload = {
    deskId,
    strategyId: champ?.strategyId ?? null,
    strategyName: champ?.strategyName ?? null,
    sumPnl: champ?.sumPnl ?? 0,
    winRate: champ?.winRate ?? null,
    decided: champ?.decided ?? 0,
    leaderScore: champ?.score ?? null,
    promotedAt: new Date(),
    metric,
  };

  await ExperimentChampionState.findOneAndUpdate(
    { deskId },
    { $set: payload },
    { upsert: true, new: true },
  );
  return payload;
}

export async function getDeskChampion(deskId) {
  const doc = await ExperimentChampionState.findOne({ deskId }).lean();
  if (!doc) return null;
  return {
    deskId: doc.deskId,
    strategyId: doc.strategyId,
    strategyName: doc.strategyName,
    sumPnl: doc.sumPnl,
    winRate: doc.winRate,
    decided: doc.decided,
    leaderScore: doc.leaderScore,
    promotedAt: doc.promotedAt?.toISOString?.() ?? null,
    metric: doc.metric,
  };
}

export async function listDeskChampions() {
  const rows = await ExperimentChampionState.find({}).lean();
  return rows.map((doc) => ({
    deskId: doc.deskId,
    strategyId: doc.strategyId,
    strategyName: doc.strategyName,
    sumPnl: doc.sumPnl,
    winRate: doc.winRate,
    decided: doc.decided,
    leaderScore: doc.leaderScore,
    promotedAt: doc.promotedAt?.toISOString?.() ?? null,
    metric: doc.metric,
  }));
}

/**
 * Run promotion across all wired desks. Safe to call nightly.
 */
export async function promoteAllExperimentChampions() {
  const results = {};

  try {
    const { getLpExperimentStats } = await import("./lpExperimentService.js");
    const lp = await getLpExperimentStats();
    results.lp_meteora = await promoteDeskChampion(
      "lp_meteora",
      (lp.agents || []).map((a) => ({
        ...a,
        sumNetPnlSol: a.sumNetPnlSol,
      })),
      { metric: "sol", minDecided: 8 },
    );
  } catch (e) {
    results.lp_meteora = { error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const { getStocksStats } = await import("./stocksExperimentService.js");
    const stocks = await getStocksStats();
    results.stocks = await promoteDeskChampion("stocks", stocks.agents || [], {
      metric: "usd",
      minDecided: 5,
    });
  } catch (e) {
    results.stocks = { error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const { getMomentumStats } = await import("./momentumRotatorService.js");
    const mom = await getMomentumStats();
    results.momentum = await promoteDeskChampion("momentum", mom.agents || [], {
      metric: "usd",
      minDecided: 3,
    });
  } catch (e) {
    results.momentum = { error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const { getLstLoopStats } = await import("./lstLoopService.js");
    const lst = await getLstLoopStats();
    results.lst_loop = await promoteDeskChampion("lst_loop", lst.agents || [], {
      metric: "usd",
      minDecided: 3,
    });
  } catch (e) {
    results.lst_loop = { error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const { getSniperStats } = await import("./sniperService.js");
    const snp = await getSniperStats();
    results.sniper = await promoteDeskChampion("sniper", snp.agents || [], {
      metric: "usd",
      minDecided: 3,
    });
  } catch (e) {
    results.sniper = { error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const { getMeridianStats } = await import("./meridianService.js");
    const mer = await getMeridianStats();
    results.meridian = await promoteDeskChampion("meridian", mer.agents || [], {
      metric: "sol",
      minDecided: 3,
    });
  } catch (e) {
    results.meridian = { error: e instanceof Error ? e.message : String(e) };
  }

  return results;
}
