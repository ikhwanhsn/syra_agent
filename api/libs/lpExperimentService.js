import LpExperimentRun from "../models/LpExperimentRun.js";
import { LP_AGENT_EXPERIMENT_DEFAULTS } from "../config/lpAgentExperimentStrategies.js";
import { resolveLpExperimentStrategies, resolveLpStrategyById } from "./lpExperimentStrategyResolve.js";
import { fetchMeteoraPoolDetail, fetchMeteoraPools } from "./meteoraDlmmClient.js";
import { scorePool } from "./lpExperimentScoring.js";

const OPEN_POSITION_COOLDOWN_MS = 90 * 60 * 1000;
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

let cachedSolPrice = { value: 150, ts: 0 };

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

async function fetchSolPriceUsd() {
  const now = Date.now();
  if (now - cachedSolPrice.ts <= 20_000 && Number.isFinite(cachedSolPrice.value)) {
    return cachedSolPrice.value;
  }
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const body = await res.json().catch(() => ({}));
    const v = toNum(body?.solana?.usd, 0);
    if (v > 0) {
      cachedSolPrice = { value: v, ts: now };
      return v;
    }
  } catch {
    // fallback
  }
  return cachedSolPrice.value || 150;
}

function deriveSyntheticSignals(pool) {
  const volatilityScore = Math.max(
    0,
    Math.min(1, toNum(pool.feeTvlRatio) * 8 + Math.random() * 0.12),
  );
  return {
    organicScore: Math.max(0, Math.min(100, 50 + toNum(pool.feeTvlRatio) * 320 + Math.random() * 25)),
    holderCount: Math.floor(500 + toNum(pool.tvlUsd) / 250 + Math.random() * 1500),
    mcapUsd: Math.floor(Math.max(150_000, toNum(pool.tvlUsd) * (6 + Math.random() * 12))),
    smartWalletsPresent: toNum(pool.feeTvlRatio) > 0.045 || toNum(pool.volume24hUsd) > 140_000,
    narrativeScore: Math.max(1, Math.min(10, 4.5 + Math.random() * 4.5)),
    studyWinRate: Math.max(0.35, Math.min(0.8, 0.42 + toNum(pool.feeTvlRatio) * 2 + Math.random() * 0.2)),
    hiveConsensus: Math.max(0.2, Math.min(1, 0.3 + Math.random() * 0.6)),
    volatilityScore,
    priceVsAthPct: Math.max(20, Math.min(100, 35 + volatilityScore * 55 + Math.random() * 20)),
  };
}

function computePriceDriftPct(entry, current) {
  if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(current) || current <= 0) return 0;
  return ((current / entry) - 1) * 100;
}

function computeFeeYieldPct(feeTvlRatio, hoursElapsed) {
  const f = toNum(feeTvlRatio, 0);
  if (f <= 0 || hoursElapsed <= 0) return 0;
  return f * (hoursElapsed / 24) * 100;
}

function shouldCloseByOor(run, detail, strategyExit, hoursElapsed) {
  const activeNow = toNum(detail.activeBinId, run.activeBinAtOpen);
  const activeAtOpen = toNum(run.activeBinAtOpen, activeNow);
  const delta = activeNow - activeAtOpen;
  const overBelow = Math.abs(Math.min(0, delta)) > toNum(run.binsBelow);
  const overAbove = Math.max(0, delta) > toNum(run.binsAbove);
  if (!overBelow && !overAbove) return false;
  return hoursElapsed * 60 >= toNum(strategyExit.oorWaitMin, 30);
}

async function hasRecentPosition(strategyId, poolAddress) {
  const open = await LpExperimentRun.findOne({
    strategyId,
    poolAddress,
    status: "open",
  })
    .sort({ createdAt: -1 })
    .lean();
  if (open) return true;
  const latest = await LpExperimentRun.findOne({ strategyId, poolAddress })
    .sort({ createdAt: -1 })
    .lean();
  if (!latest?.createdAt) return false;
  return Date.now() - new Date(latest.createdAt).getTime() < OPEN_POSITION_COOLDOWN_MS;
}

export async function getLpCandidatePools() {
  const strategies = await resolveLpExperimentStrategies();
  const pools = await fetchMeteoraPools({
    page: 1,
    limit: Math.max(30, LP_AGENT_EXPERIMENT_DEFAULTS.minCandidateCount),
    sortKey: "fee",
    order: "desc",
    hideLowTvl: true,
  });
  const candidates = [];
  for (const strategy of strategies) {
    const scored = pools.map((pool) => {
      const synthetic = deriveSyntheticSignals(pool);
      const scoredRow = scorePool(strategy, { ...pool, ...synthetic });
      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        poolAddress: pool.poolAddress,
        poolName: pool.poolName,
        baseSymbol: pool.baseSymbol,
        quoteSymbol: pool.quoteSymbol,
        score: scoredRow.score,
        gatePassed: scoredRow.gatePassed,
        gateReasons: scoredRow.gateReasons,
        signalSnapshot: scoredRow.signalSnapshot,
        tvlUsd: pool.tvlUsd,
        volume24hUsd: pool.volume24hUsd,
        feeTvlRatio: pool.feeTvlRatio,
      };
    });
    const top = scored
      .filter((x) => x.gatePassed)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    candidates.push(...top);
  }
  return candidates.sort((a, b) => b.score - a.score);
}

export async function runLpExperimentSignalCycle() {
  const strategies = await resolveLpExperimentStrategies();
  const pools = await fetchMeteoraPools({
    page: 1,
    limit: Math.max(30, LP_AGENT_EXPERIMENT_DEFAULTS.minCandidateCount),
    sortKey: "fee",
    order: "desc",
    hideLowTvl: true,
  });
  const solPrice = await fetchSolPriceUsd();
  const opened = [];
  const skipped = [];
  const errors = [];
  for (const strategy of strategies) {
    try {
      const scored = pools
        .map((pool) => {
          const synthetic = deriveSyntheticSignals(pool);
          const scoredRow = scorePool(strategy, { ...pool, ...synthetic });
          return { pool, synthetic, ...scoredRow };
        })
        .filter((x) => x.gatePassed)
        .sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (!best) {
        skipped.push({ strategyId: strategy.id, reason: "no_candidate" });
        continue;
      }
      const recent = await hasRecentPosition(strategy.id, best.pool.poolAddress);
      if (recent) {
        skipped.push({ strategyId: strategy.id, reason: "cooldown_or_open" });
        continue;
      }
      const depositSol = LP_AGENT_EXPERIMENT_DEFAULTS.depositSol;
      const depositUsd = depositSol * solPrice;
      const created = await LpExperimentRun.create({
        strategyId: strategy.id,
        strategyName: strategy.name,
        lpShape: strategy.lpShape,
        poolAddress: best.pool.poolAddress,
        poolName: best.pool.poolName,
        baseSymbol: best.pool.baseSymbol,
        quoteSymbol: best.pool.quoteSymbol,
        binStep: best.pool.binStep,
        tvlUsd: best.pool.tvlUsd,
        volume24hUsd: best.pool.volume24hUsd,
        organicScore: best.synthetic.organicScore,
        holderCount: best.synthetic.holderCount,
        mcapUsd: best.synthetic.mcapUsd,
        feeTvlRatio: best.pool.feeTvlRatio,
        binsBelow: strategy.binsBelow,
        binsAbove: strategy.binsAbove,
        activeBinAtOpen: best.pool.activeBinId,
        entryPriceUsd: best.pool.currentPrice,
        depositSol,
        depositUsd,
        signalSnapshot: best.signalSnapshot,
        screeningSnapshot: { ...best.synthetic, score: best.score },
        status: "open",
        openedAt: new Date(),
      });
      opened.push({
        runId: String(created._id),
        strategyId: strategy.id,
        strategyName: strategy.name,
        poolAddress: created.poolAddress,
        poolName: created.poolName,
      });
    } catch (err) {
      errors.push(`strategy:${strategy.id}:${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    opened: opened.length,
    skipped: skipped.length,
    errors,
    openedRuns: opened,
    skippedRows: skipped,
  };
}

export async function resolveOpenLpRuns() {
  const openRuns = await LpExperimentRun.find({ status: "open" }).sort({ createdAt: 1 }).lean();
  const resolvedRows = [];
  const errors = [];

  for (const run of openRuns) {
    try {
      const strategy = await resolveLpStrategyById(run.strategyId);
      if (!strategy) {
        await LpExperimentRun.updateOne(
          { _id: run._id },
          {
            $set: {
              status: "error",
              resolution: "strategy_missing",
              errorMessage: "Strategy not found",
              resolvedAt: new Date(),
              lastEvaluatedAt: new Date(),
            },
          },
        );
        continue;
      }
      const detail = await fetchMeteoraPoolDetail(run.poolAddress);
      const now = Date.now();
      const openedAt = new Date(run.openedAt || run.createdAt || Date.now()).getTime();
      const hoursElapsed = Math.max(0, (now - openedAt) / 3_600_000);
      const priceDriftPct = computePriceDriftPct(toNum(run.entryPriceUsd), toNum(detail.currentPrice));
      const feeYieldPct = computeFeeYieldPct(toNum(detail.feeTvlRatio, run.feeTvlRatio), hoursElapsed);
      const netPnlPct = priceDriftPct + feeYieldPct;
      const simFeesEarnedSol = toNum(run.depositSol) * (feeYieldPct / 100);

      const exit = strategy.exit || {};
      let status = "open";
      let resolution = null;
      if (priceDriftPct <= toNum(exit.stopLossPct, -15)) {
        status = "loss";
        resolution = "stop_loss";
      } else if (netPnlPct >= toNum(exit.takeProfitPct, 10)) {
        status = "win";
        resolution = "take_profit";
      } else if (shouldCloseByOor(run, detail, exit, hoursElapsed)) {
        status = netPnlPct >= LP_AGENT_EXPERIMENT_DEFAULTS.winThresholdPct ? "win" : "loss";
        resolution = "oor";
      } else if (hoursElapsed >= LP_AGENT_EXPERIMENT_DEFAULTS.maxRunAgeHours) {
        status = netPnlPct >= LP_AGENT_EXPERIMENT_DEFAULTS.winThresholdPct ? "win" : "expired";
        resolution = "time_expiry";
      }

      await LpExperimentRun.updateOne(
        { _id: run._id },
        {
          $set: {
            status,
            resolution,
            tvlUsd: detail.tvlUsd,
            volume24hUsd: detail.volume24hUsd,
            feeTvlRatio: detail.feeTvlRatio,
            simFeesEarnedSol,
            simPriceDriftPct: priceDriftPct,
            simPnlPct: netPnlPct,
            simPnlUsd: toNum(run.depositUsd) * (netPnlPct / 100),
            lastEvaluatedAt: new Date(),
            ...(status !== "open" ? { resolvedAt: new Date() } : {}),
          },
        },
      );

      if (status !== "open") {
        resolvedRows.push({ runId: String(run._id), status, resolution, strategyId: run.strategyId });
      }
    } catch (err) {
      errors.push(`run:${String(run._id)}:${err instanceof Error ? err.message : String(err)}`);
      await LpExperimentRun.updateOne(
        { _id: run._id },
        { $set: { status: "error", resolution: "resolve_error", errorMessage: String(err), resolvedAt: new Date() } },
      );
    }
  }

  return {
    resolved: resolvedRows.length,
    openChecked: openRuns.length,
    errors,
    rows: resolvedRows,
  };
}

export async function getLpExperimentStats() {
  const strategies = await resolveLpExperimentStrategies();
  const [statsRows, openRows] = await Promise.all([
    LpExperimentRun.aggregate([
      {
        $group: {
          _id: "$strategyId",
          strategyName: { $last: "$strategyName" },
          lpShape: { $last: "$lpShape" },
          wins: { $sum: { $cond: [{ $eq: ["$status", "win"] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ["$status", "loss"] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
          openPositions: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
          avgPnlPct: { $avg: "$simPnlPct" },
          avgFeesSol: { $avg: "$simFeesEarnedSol" },
        },
      },
    ]),
    LpExperimentRun.find({ status: "open" }).select({ strategyId: 1 }).lean(),
  ]);
  const openMap = openRows.reduce((acc, row) => {
    const key = Number(row.strategyId);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const merged = strategies.map((strategy) => {
    const row = statsRows.find((s) => Number(s._id) === strategy.id);
    const wins = toNum(row?.wins);
    const losses = toNum(row?.losses);
    const expired = toNum(row?.expired);
    const decided = wins + losses + expired;
    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      lpShape: strategy.lpShape,
      wins,
      losses,
      expired,
      decided,
      winRate: decided > 0 ? wins / decided : null,
      winRatePct: decided > 0 ? (wins / decided) * 100 : null,
      openPositions: toNum(openMap[strategy.id], toNum(row?.openPositions)),
      avgPnlPct: toNum(row?.avgPnlPct, 0),
      avgFeesSol: toNum(row?.avgFeesSol, 0),
    };
  });
  return {
    agents: merged.sort((a, b) => {
      const ar = a.winRate ?? -1;
      const br = b.winRate ?? -1;
      if (br !== ar) return br - ar;
      return b.wins - a.wins;
    }),
  };
}

export async function listLpExperimentRuns({
  limit = DEFAULT_LIST_LIMIT,
  offset = 0,
  strategyId,
  status,
  symbol,
} = {}) {
  const q = {};
  if (strategyId != null && Number.isInteger(Number(strategyId))) {
    q.strategyId = Number(strategyId);
  }
  if (typeof status === "string" && status.trim()) {
    q.status = status.trim();
  }
  if (typeof symbol === "string" && symbol.trim()) {
    q.$or = [
      { baseSymbol: new RegExp(symbol.trim(), "i") },
      { quoteSymbol: new RegExp(symbol.trim(), "i") },
      { poolName: new RegExp(symbol.trim(), "i") },
    ];
  }
  const safeLimit = normalizeLimit(limit);
  const safeOffset = Math.max(0, Number(offset) || 0);
  const [runs, total] = await Promise.all([
    LpExperimentRun.find(q).sort({ createdAt: -1 }).skip(safeOffset).limit(safeLimit).lean(),
    LpExperimentRun.countDocuments(q),
  ]);
  return { runs, total };
}
