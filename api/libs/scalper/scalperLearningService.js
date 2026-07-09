/**
 * Scalper agent — learn from closed paper scalps and tune thresholds / source weights.
 */
import ScalperLearningState from "../../models/ScalperLearningState.js";
import ScalperRun from "../../models/ScalperRun.js";
import {
  SCALPER_DEFAULTS,
  estimateRoundTripCostPct,
} from "../../config/scalperConfig.js";

const GLOBAL_ID = "singleton";

/**
 * @typedef {Object} ScalperSourceStat
 * @property {number} decided
 * @property {number} wins
 * @property {number} losses
 * @property {number} winRate
 * @property {number} avgPnlPct
 * @property {number} scoreMultiplier
 */

/**
 * @typedef {Object} ScalperSymbolStat
 * @property {number} decided
 * @property {number} wins
 * @property {number} losses
 * @property {number} winRate
 * @property {number} avgPnlPct
 */

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

async function getLearningDoc() {
  let doc = await ScalperLearningState.findById(GLOBAL_ID).lean();
  if (!doc) {
    await ScalperLearningState.create({
      _id: GLOBAL_ID,
      lessons: [],
      thresholdOverrides: {},
      sourceStats: {},
      symbolStats: {},
      sourceCooldowns: [],
      symbolCooldowns: [],
    });
    doc = await ScalperLearningState.findById(GLOBAL_ID).lean();
  }
  return doc;
}

/**
 * @param {Array<{ status: string; simPnlPct?: number | null }>} runs
 */
function computeWinRateStats(runs) {
  const decided = runs.filter((r) => r.status === "win" || r.status === "loss");
  const wins = decided.filter((r) => r.status === "win").length;
  const losses = decided.filter((r) => r.status === "loss").length;
  const winRate = decided.length > 0 ? wins / decided.length : 0;
  const pnlPcts = decided
    .map((r) => toNum(r.simPnlPct))
    .filter((v) => Number.isFinite(v));
  const avgPnlPct = pnlPcts.length
    ? pnlPcts.reduce((a, b) => a + b, 0) / pnlPcts.length
    : 0;
  return { decided: decided.length, wins, losses, winRate, avgPnlPct };
}

/**
 * Derive score multiplier from source win rate (0.5–1.25).
 * @param {number} winRate
 * @param {number} sampleSize
 */
function deriveScoreMultiplier(winRate, sampleSize) {
  if (sampleSize < 2) return 1;
  if (winRate >= 0.62) return clamp(1.05 + (winRate - 0.5) * 0.6, 1.05, 1.3);
  if (winRate >= 0.55) return clamp(1 + (winRate - 0.5) * 0.4, 1, 1.15);
  if (winRate < 0.38) return clamp(0.45 + winRate, 0.45, 0.75);
  if (winRate < 0.45) return clamp(0.75 + (winRate - 0.38) * 2, 0.75, 0.9);
  return 1;
}

/**
 * @param {Record<string, unknown>} baseCfg
 */
export async function getEffectiveScalperConfig(baseCfg) {
  const doc = await getLearningDoc();
  const overrides = doc?.thresholdOverrides ?? {};

  return {
    ...baseCfg,
    takeProfitPct: toNum(overrides.takeProfitPct, baseCfg.takeProfitPct),
    stopLossPct: toNum(overrides.stopLossPct, baseCfg.stopLossPct),
    maxHoldMinutes: toNum(overrides.maxHoldMinutes, baseCfg.maxHoldMinutes),
    minOpportunityScore: toNum(overrides.minOpportunityScore, baseCfg.minOpportunityScore),
    notionalSlicePct: toNum(overrides.notionalSlicePct, baseCfg.notionalSlicePct),
    minEdgeBufferPct: toNum(
      overrides.minEdgeBufferPct,
      baseCfg.minEdgeBufferPct ?? SCALPER_DEFAULTS.minEdgeBufferPct,
    ),
  };
}

/**
 * @returns {Promise<{
 *   sourceStats: Record<string, ScalperSourceStat>;
 *   sourceCooldowns: Array<{ source: string; reason: string | null; until: string }>;
 *   symbolCooldowns: Array<{ symbol: string; reason: string | null; until: string }>;
 * }>}
 */
export async function getSourceAdjustments() {
  const doc = await getLearningDoc();
  const now = Date.now();

  const activeSourceCooldowns = (doc?.sourceCooldowns ?? []).filter(
    (c) => c.until && new Date(c.until).getTime() > now,
  );
  const activeSymbolCooldowns = (doc?.symbolCooldowns ?? []).filter(
    (c) => c.until && new Date(c.until).getTime() > now,
  );

  return {
    sourceStats: doc?.sourceStats ?? {},
    sourceCooldowns: activeSourceCooldowns.map((c) => ({
      source: c.source,
      reason: c.reason ?? null,
      until: new Date(c.until).toISOString(),
    })),
    symbolCooldowns: activeSymbolCooldowns.map((c) => ({
      symbol: c.symbol,
      reason: c.reason ?? null,
      until: new Date(c.until).toISOString(),
    })),
  };
}

/**
 * @param {Record<string, unknown>} baseCfg
 */
export async function getScalperLearningSnapshot(baseCfg) {
  const doc = await getLearningDoc();
  const adjustments = await getSourceAdjustments();
  const effectiveConfig = await getEffectiveScalperConfig(baseCfg);

  return {
    lessons: doc?.lessons ?? [],
    thresholdOverrides: doc?.thresholdOverrides ?? {},
    sourceStats: adjustments.sourceStats,
    symbolStats: doc?.symbolStats ?? {},
    sourceCooldowns: adjustments.sourceCooldowns,
    symbolCooldowns: adjustments.symbolCooldowns,
    lastEvolutionAt: doc?.lastEvolutionAt?.toISOString?.() ?? doc?.lastEvolutionAt ?? null,
    lastEvolutionSummary: doc?.lastEvolutionSummary ?? null,
    runsAnalyzed: doc?.runsAnalyzed ?? 0,
    baseConfig: {
      takeProfitPct: baseCfg.takeProfitPct,
      stopLossPct: baseCfg.stopLossPct,
      minOpportunityScore: baseCfg.minOpportunityScore,
      notionalSlicePct: baseCfg.notionalSlicePct,
      maxHoldMinutes: baseCfg.maxHoldMinutes,
      minEdgeBufferPct: baseCfg.minEdgeBufferPct ?? SCALPER_DEFAULTS.minEdgeBufferPct,
    },
    effectiveConfig: {
      takeProfitPct: effectiveConfig.takeProfitPct,
      stopLossPct: effectiveConfig.stopLossPct,
      minOpportunityScore: effectiveConfig.minOpportunityScore,
      notionalSlicePct: effectiveConfig.notionalSlicePct,
      maxHoldMinutes: effectiveConfig.maxHoldMinutes,
      minEdgeBufferPct: effectiveConfig.minEdgeBufferPct,
    },
  };
}

/**
 * Check if a source or symbol is on learned cooldown.
 * @param {string} source
 * @param {string} symbol
 */
export async function isOnLearnedCooldown(source, symbol) {
  const { sourceCooldowns, symbolCooldowns } = await getSourceAdjustments();
  if (sourceCooldowns.some((c) => c.source === source)) return "source_cooldown";
  if (symbolCooldowns.some((c) => c.symbol === symbol)) return "symbol_cooldown";
  return null;
}

/**
 * Apply learned source score multiplier.
 * @param {string} source
 * @param {number} rawScore
 */
export async function applySourceScoreMultiplier(source, rawScore) {
  const doc = await getLearningDoc();
  const stat = doc?.sourceStats?.[source];
  const multiplier = stat?.scoreMultiplier ?? 1;
  return clamp(rawScore * multiplier, 0, 0.99);
}

/**
 * Compute conviction-based notional slice fraction.
 * @param {object} params
 * @param {number} params.score
 * @param {number} params.minScore
 * @param {string} params.source
 * @param {number} params.notionalSlicePct
 * @param {number} params.minNotionalSlicePct
 */
export async function computeConvictionNotionalSlice({
  score,
  minScore,
  source,
  notionalSlicePct,
  minNotionalSlicePct,
  confluenceCount = 1,
}) {
  const doc = await getLearningDoc();
  const sourceWinRate = doc?.sourceStats?.[source]?.winRate ?? 0.5;
  const scoreRange = Math.max(0.01, 1 - minScore);
  const scoreFactor = clamp((score - minScore) / scoreRange, 0, 1);
  const sourceFactor = clamp(0.7 + sourceWinRate * 0.6, 0.5, 1.3);
  const confluenceFactor = confluenceCount >= 2 ? 1.15 : confluenceCount >= 3 ? 1.25 : 1;
  const slice = minNotionalSlicePct + (notionalSlicePct - minNotionalSlicePct) * scoreFactor;
  return clamp(slice * sourceFactor * confluenceFactor, minNotionalSlicePct, notionalSlicePct * 1.1);
}

/**
 * Whether expected TP edge clears estimated round-trip cost + buffer.
 * @param {object} cfg
 * @param {number} score
 */
export function passesCostAwareEdgeGate(cfg, score) {
  const roundTripCost = estimateRoundTripCostPct(cfg.quoteSlippageBps ?? SCALPER_DEFAULTS.quoteSlippageBps);
  const minEdge = toNum(cfg.minEdgeBufferPct, SCALPER_DEFAULTS.minEdgeBufferPct);
  const scoreFactor = clamp((score - 0.5) / 0.45, 0.6, 1);
  const expectedEdge = toNum(cfg.takeProfitPct) * scoreFactor;
  return expectedEdge >= roundTripCost + minEdge;
}

/**
 * Analyze closed scalper runs and derive lessons + threshold nudges.
 */
export async function runScalperLearning() {
  const minRuns = Number(process.env.SCALPER_LEARNING_MIN_RUNS || 5);

  const closed = await ScalperRun.find({
    status: { $in: ["win", "loss", "expired"] },
    resolvedAt: { $ne: null },
  })
    .sort({ resolvedAt: -1 })
    .limit(200)
    .lean();

  const decided = closed.filter((r) => r.status === "win" || r.status === "loss");
  if (decided.length < minRuns) {
    return {
      skipped: true,
      reason: "insufficient_runs",
      decidedCount: decided.length,
      minRuns,
    };
  }

  const baseCfg = { ...SCALPER_DEFAULTS };
  const lessons = [];
  const thresholdOverrides = {};
  /** @type {Record<string, ScalperSourceStat>} */
  const sourceStats = {};
  /** @type {Record<string, ScalperSymbolStat>} */
  const symbolStats = {};
  /** @type {Array<{ source: string; reason: string; until: Date }>} */
  const sourceCooldowns = [];
  /** @type {Array<{ symbol: string; reason: string; until: Date }>} */
  const symbolCooldowns = [];

  const overall = computeWinRateStats(decided);
  const pnlUsd = decided.map((r) => toNum(r.simPnlUsd)).filter((v) => Number.isFinite(v));
  const avgPnlUsd = pnlUsd.length ? pnlUsd.reduce((a, b) => a + b, 0) / pnlUsd.length : 0;

  const sources = [...new Set(decided.map((r) => r.source).filter(Boolean))];
  for (const source of sources) {
    const sourceRuns = decided.filter((r) => r.source === source);
    const stats = computeWinRateStats(sourceRuns);
    sourceStats[source] = {
      ...stats,
      scoreMultiplier: deriveScoreMultiplier(stats.winRate, stats.decided),
    };
  }

  const symbols = [...new Set(decided.map((r) => r.symbol).filter(Boolean))];
  for (const symbol of symbols) {
    const symbolRuns = decided.filter((r) => r.symbol === symbol);
    symbolStats[symbol] = computeWinRateStats(symbolRuns);
  }

  const expiredRecent = closed.filter((r) => r.status === "expired").slice(0, 20);
  const expiredLossRate =
    expiredRecent.length > 0
      ? expiredRecent.filter((r) => toNum(r.simPnlUsd) < 0).length / expiredRecent.length
      : 0;

  const confluenceRuns = decided.filter((r) => toNum(r.confluenceCount) >= 2);
  if (confluenceRuns.length >= 4) {
    const confStats = computeWinRateStats(confluenceRuns);
    if (confStats.winRate >= 0.58) {
      lessons.push(
        `Confluence entries working (${(confStats.winRate * 100).toFixed(0)}% WR) — favoring multi-source setups.`,
      );
      thresholdOverrides.minOpportunityScore = Math.max(
        baseCfg.minOpportunityScore - 0.03,
        0.52,
      );
    }
  }

  const momentumOnly = decided.filter(
    (r) => r.source === "momentum" && toNum(r.confluenceCount) < 2,
  );
  if (momentumOnly.length >= 5) {
    const momStats = computeWinRateStats(momentumOnly);
    if (momStats.winRate < 0.4) {
      lessons.push(
        `Solo momentum scalps underperforming (${(momStats.winRate * 100).toFixed(0)}% WR) — requiring higher scores.`,
      );
      thresholdOverrides.minOpportunityScore = Math.max(
        thresholdOverrides.minOpportunityScore ?? baseCfg.minOpportunityScore,
        0.62,
      );
    }
  }

  if (overall.winRate < 0.42 || overall.avgPnlPct < 0) {
    lessons.push(
      `Recent scalps underperformed (win rate ${(overall.winRate * 100).toFixed(0)}%, avg PnL ${overall.avgPnlPct.toFixed(2)}%) — raising entry bar.`,
    );
    thresholdOverrides.minOpportunityScore = Math.min(
      baseCfg.minOpportunityScore + 0.08,
      0.75,
    );
    thresholdOverrides.minEdgeBufferPct = Math.min(
      (baseCfg.minEdgeBufferPct ?? 0.25) + 0.1,
      0.6,
    );
  } else if (overall.winRate >= 0.58 && overall.avgPnlPct > 0.35) {
    lessons.push(
      `Scalper is profitable (win rate ${(overall.winRate * 100).toFixed(0)}%, avg PnL ${overall.avgPnlPct.toFixed(2)}%) — slightly increasing size on strong signals.`,
    );
    thresholdOverrides.notionalSlicePct = Math.min(
      baseCfg.notionalSlicePct * 1.1,
      0.35,
    );
  } else if (overall.winRate >= 0.55 && overall.avgPnlPct > 0.3) {
    lessons.push(
      `Scalper is profitable (win rate ${(overall.winRate * 100).toFixed(0)}%, avg PnL ${overall.avgPnlPct.toFixed(2)}%) — current policy is working.`,
    );
  }

  if (expiredRecent.length >= 5 && expiredLossRate >= 0.6) {
    lessons.push(
      `${expiredRecent.length} max-hold exits were mostly losers — extending hold window slightly.`,
    );
    thresholdOverrides.maxHoldMinutes = Math.min(baseCfg.maxHoldMinutes + 10, 75);
  }

  const lowScoreLosses = decided.filter(
    (r) => toNum(r.opportunityScore) < 0.55 && r.status === "loss",
  );
  if (lowScoreLosses.length >= 4) {
    lessons.push(
      `${lowScoreLosses.length} losses came from sub-0.55 score entries — tightening min score.`,
    );
    thresholdOverrides.minOpportunityScore = Math.max(
      thresholdOverrides.minOpportunityScore ?? baseCfg.minOpportunityScore,
      0.58,
    );
  }

  const highImpactLosses = decided.filter(
    (r) => r.status === "loss" && toNum(r.entryImpactBps) > 60,
  );
  if (highImpactLosses.length >= 3) {
    lessons.push(
      `${highImpactLosses.length} losses had high entry impact (>60 bps) — reducing position size.`,
    );
    thresholdOverrides.notionalSlicePct = Math.max(
      baseCfg.notionalSlicePct * 0.8,
      0.12,
    );
  }

  if (overall.winRate < 0.38) {
    thresholdOverrides.takeProfitPct = Math.min(baseCfg.takeProfitPct + 0.2, 2.2);
    thresholdOverrides.stopLossPct = Math.max(baseCfg.stopLossPct - 0.1, 0.5);
    lessons.push("Win rate very low — widening TP and tightening SL for better R:R.");
  }

  for (const [source, stats] of Object.entries(sourceStats)) {
    if (stats.decided >= 4 && stats.winRate < 0.3) {
      lessons.push(
        `Source "${source}" win rate ${(stats.winRate * 100).toFixed(0)}% — on 12h cooldown.`,
      );
      sourceCooldowns.push({
        source,
        reason: `repeated_losses:wr_${(stats.winRate * 100).toFixed(0)}`,
        until: new Date(Date.now() + 12 * 60 * 60_000),
      });
    }
  }

  for (const [symbol, stats] of Object.entries(symbolStats)) {
    if (stats.decided >= 3 && stats.losses >= 3 && stats.winRate < 0.25) {
      lessons.push(
        `Symbol ${symbol} win rate ${(stats.winRate * 100).toFixed(0)}% — on 6h cooldown.`,
      );
      symbolCooldowns.push({
        symbol,
        reason: `repeated_symbol_losses:${stats.losses}`,
        until: new Date(Date.now() + 6 * 60 * 60_000),
      });
    }
  }

  const summary = `Analyzed ${decided.length} decided scalps — win rate ${(overall.winRate * 100).toFixed(0)}%, avg PnL $${avgPnlUsd.toFixed(2)}, ${sourceCooldowns.length} source cooldowns, ${symbolCooldowns.length} symbol cooldowns.`;

  await ScalperLearningState.updateOne(
    { _id: GLOBAL_ID },
    {
      $set: {
        lessons: lessons.slice(0, 30),
        thresholdOverrides,
        sourceStats,
        symbolStats,
        sourceCooldowns,
        symbolCooldowns,
        lastEvolutionAt: new Date(),
        lastEvolutionSummary: summary,
        runsAnalyzed: decided.length,
      },
    },
    { upsert: true },
  );

  return {
    skipped: false,
    decidedCount: decided.length,
    overall,
    lessons,
    thresholdOverrides,
    sourceStats,
    symbolStats,
    sourceCooldowns: sourceCooldowns.length,
    symbolCooldowns: symbolCooldowns.length,
    summary,
  };
}

export const SCALPER_LEARNING_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 6 * 60 * 60_000,
});

export function scalperLearningConfigFromEnv() {
  const enabledRaw = (process.env.SCALPER_LEARNING_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off"
      ? false
      : SCALPER_LEARNING_SCHEDULE.enabled;
  const ms = Number(process.env.SCALPER_LEARNING_MS || SCALPER_LEARNING_SCHEDULE.intervalMs);
  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : SCALPER_LEARNING_SCHEDULE.intervalMs,
  };
}
