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
 * Derive score multiplier from source win rate (0.4–1.35).
 * @param {number} winRate
 * @param {number} sampleSize
 */
function deriveScoreMultiplier(winRate, sampleSize) {
  if (sampleSize < 2) return 1;
  if (winRate >= 0.65) return clamp(1.1 + (winRate - 0.5) * 0.7, 1.1, 1.35);
  if (winRate >= 0.55) return clamp(1.02 + (winRate - 0.5) * 0.5, 1.02, 1.2);
  if (winRate < 0.35) return clamp(0.35 + winRate, 0.4, 0.65);
  if (winRate < 0.45) return clamp(0.65 + (winRate - 0.35) * 2, 0.65, 0.85);
  return 1;
}

/**
 * Expectancy-first: idle score relaxation must not undo learning while losing.
 * @param {{ winRate: number; avgPnlPct: number; decided?: number }} overall
 * @param {Record<string, unknown>} [overrides]
 */
export function shouldDisableIdleRelaxation(overall, overrides = {}) {
  if (overrides.disableIdleRelaxation === true) return true;
  if (!overall || !Number.isFinite(overall.avgPnlPct)) return false;
  return overall.avgPnlPct < 0 || overall.winRate < 0.45;
}

/**
 * Hard desk pause when decided expectancy is negative.
 * Recovery clears pause when WR and avg PnL recover.
 * @param {{ winRate: number; avgPnlPct: number; decided: number }} overall
 * @param {number} minRuns
 * @param {Date | string | null | undefined} existingUntil
 * @param {number} [nowMs]
 * @param {number} [pauseHours]
 */
export function computeDeskPauseDecision(
  overall,
  minRuns,
  existingUntil = null,
  nowMs = Date.now(),
  pauseHours = SCALPER_DEFAULTS.deskPauseHours,
) {
  const recovered = overall.decided >= minRuns && overall.winRate >= 0.5 && overall.avgPnlPct >= 0;
  if (recovered) {
    return { paused: false, until: null, reason: null, cleared: Boolean(existingUntil) };
  }

  const existingMs = existingUntil ? new Date(existingUntil).getTime() : 0;
  if (existingMs > nowMs) {
    return {
      paused: true,
      until: new Date(existingMs),
      reason: "existing_pause",
      cleared: false,
    };
  }

  const negativeExpectancy =
    overall.decided >= minRuns && overall.avgPnlPct < 0 && overall.winRate < 0.45;
  if (!negativeExpectancy) {
    return { paused: false, until: null, reason: null, cleared: false };
  }

  const hours = overall.winRate < 0.35 ? Math.max(pauseHours, 18) : pauseHours;
  return {
    paused: true,
    until: new Date(nowMs + hours * 60 * 60_000),
    reason: `negative_expectancy:wr_${(overall.winRate * 100).toFixed(0)}:avg_${overall.avgPnlPct.toFixed(2)}`,
    cleared: false,
  };
}

/**
 * Threshold nudges while underperforming (expectancy-first, not demo-alive).
 * @param {typeof SCALPER_DEFAULTS} baseCfg
 * @param {{ winRate: number; avgPnlPct: number; decided: number }} overall
 */
export function computeUnderperformanceOverrides(baseCfg, overall) {
  /** @type {Record<string, unknown>} */
  const thresholdOverrides = {};
  /** @type {string[]} */
  const lessons = [];

  if (!(overall.winRate < 0.45 || overall.avgPnlPct < 0)) {
    return { thresholdOverrides, lessons, underperforming: false };
  }

  const ceiling = toNum(baseCfg.underperfMinScoreCeiling, SCALPER_DEFAULTS.underperfMinScoreCeiling);
  const momFloor = toNum(
    baseCfg.underperfMinSoloMomentumScore,
    SCALPER_DEFAULTS.underperfMinSoloMomentumScore,
  );

  lessons.push(
    `Recent scalps underperformed (win rate ${(overall.winRate * 100).toFixed(0)}%, avg PnL ${overall.avgPnlPct.toFixed(2)}%) — raising entry bar and pausing weak solo flow.`,
  );
  thresholdOverrides.minOpportunityScore = Math.min(
    Math.max(baseCfg.minOpportunityScore + 0.08, 0.66),
    ceiling,
  );
  thresholdOverrides.minEdgeBufferPct = Math.min(
    (baseCfg.minEdgeBufferPct ?? SCALPER_DEFAULTS.minEdgeBufferPct) + 0.08,
    0.35,
  );
  thresholdOverrides.notionalSlicePct = Math.max(baseCfg.notionalSlicePct * 0.6, 0.08);
  thresholdOverrides.disableIdleRelaxation = true;
  thresholdOverrides.confluenceOnly = true;
  thresholdOverrides.minSoloMomentumScore = Math.max(
    baseCfg.minSoloMomentumScore ?? SCALPER_DEFAULTS.minSoloMomentumScore,
    momFloor,
  );

  return { thresholdOverrides, lessons, underperforming: true };
}

/**
 * @param {Record<string, unknown>} baseCfg
 */
export async function getEffectiveScalperConfig(baseCfg) {
  const doc = await getLearningDoc();
  const overrides = doc?.thresholdOverrides ?? {};

  let minOpportunityScore = toNum(overrides.minOpportunityScore, baseCfg.minOpportunityScore);
  const deskPausedUntil = doc?.deskPausedUntil ? new Date(doc.deskPausedUntil) : null;
  const deskPaused = Boolean(deskPausedUntil && deskPausedUntil.getTime() > Date.now());

  const sourceStats = doc?.sourceStats ?? {};
  const aggregate = Object.values(sourceStats);
  const decided = aggregate.reduce((n, s) => n + toNum(s?.decided), 0);
  const wins = aggregate.reduce((n, s) => n + toNum(s?.wins), 0);
  const losses = aggregate.reduce((n, s) => n + toNum(s?.losses), 0);
  const decidedN = wins + losses;
  const winRate = decidedN > 0 ? wins / decidedN : 1;
  const avgPnlPct =
    decidedN > 0
      ? aggregate.reduce((sum, s) => sum + toNum(s?.avgPnlPct) * toNum(s?.decided), 0) /
        Math.max(1, decided)
      : 0;
  const idleBlocked = shouldDisableIdleRelaxation(
    { winRate, avgPnlPct, decided: decidedN },
    overrides,
  );

  // Idle relaxation only when expectancy is not negative (and desk not paused).
  if (!idleBlocked && !deskPaused) {
    try {
      const ScalperRun = (await import("../../models/ScalperRun.js")).default;
      const ScalperState = (await import("../../models/ScalperState.js")).default;
      const latestOpen = await ScalperRun.findOne({})
        .sort({ openedAt: -1 })
        .select({ openedAt: 1, createdAt: 1 })
        .lean();
      const state = await ScalperState.findById("singleton")
        .select({ startedAt: 1, lastSignalAt: 1 })
        .lean();
      const lastTradeAt = latestOpen?.openedAt || latestOpen?.createdAt || state?.startedAt;
      const idleHours = lastTradeAt
        ? (Date.now() - new Date(lastTradeAt).getTime()) / 3_600_000
        : 999;
      const idleAdaptHours = toNum(baseCfg.idleAdaptHours, SCALPER_DEFAULTS.idleAdaptHours);
      const floor = toNum(baseCfg.adaptiveMinScoreFloor, SCALPER_DEFAULTS.adaptiveMinScoreFloor);
      if (idleHours >= idleAdaptHours) {
        const steps = Math.min(4, Math.floor(idleHours / idleAdaptHours));
        minOpportunityScore = Math.max(floor, minOpportunityScore - steps * 0.04);
      }
    } catch {
      /* keep override / default */
    }
  }

  return {
    ...baseCfg,
    takeProfitPct: toNum(overrides.takeProfitPct, baseCfg.takeProfitPct),
    stopLossPct: toNum(overrides.stopLossPct, baseCfg.stopLossPct),
    maxHoldMinutes: toNum(overrides.maxHoldMinutes, baseCfg.maxHoldMinutes),
    minOpportunityScore,
    notionalSlicePct: toNum(overrides.notionalSlicePct, baseCfg.notionalSlicePct),
    minEdgeBufferPct: toNum(
      overrides.minEdgeBufferPct,
      baseCfg.minEdgeBufferPct ?? SCALPER_DEFAULTS.minEdgeBufferPct,
    ),
    minSoloMomentumScore: toNum(
      overrides.minSoloMomentumScore,
      baseCfg.minSoloMomentumScore ?? SCALPER_DEFAULTS.minSoloMomentumScore,
    ),
    confluenceOnly: overrides.confluenceOnly === true,
    disableIdleRelaxation: idleBlocked || deskPaused,
  };
}

/**
 * @returns {Promise<{ paused: boolean; reason: string | null; until: string | null }>}
 */
export async function getScalperDeskPause() {
  const doc = await getLearningDoc();
  const until = doc?.deskPausedUntil ? new Date(doc.deskPausedUntil) : null;
  if (!until || until.getTime() <= Date.now()) {
    return { paused: false, reason: null, until: null };
  }
  return {
    paused: true,
    reason: doc?.deskPauseReason ?? "desk_paused",
    until: until.toISOString(),
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
  const deskPause = await getScalperDeskPause();

  return {
    lessons: doc?.lessons ?? [],
    thresholdOverrides: doc?.thresholdOverrides ?? {},
    sourceStats: adjustments.sourceStats,
    symbolStats: doc?.symbolStats ?? {},
    sourceCooldowns: adjustments.sourceCooldowns,
    symbolCooldowns: adjustments.symbolCooldowns,
    deskPause,
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
      minSoloMomentumScore: baseCfg.minSoloMomentumScore ?? SCALPER_DEFAULTS.minSoloMomentumScore,
    },
    effectiveConfig: {
      takeProfitPct: effectiveConfig.takeProfitPct,
      stopLossPct: effectiveConfig.stopLossPct,
      minOpportunityScore: effectiveConfig.minOpportunityScore,
      notionalSlicePct: effectiveConfig.notionalSlicePct,
      maxHoldMinutes: effectiveConfig.maxHoldMinutes,
      minEdgeBufferPct: effectiveConfig.minEdgeBufferPct,
      minSoloMomentumScore: effectiveConfig.minSoloMomentumScore,
      confluenceOnly: effectiveConfig.confluenceOnly === true,
      disableIdleRelaxation: effectiveConfig.disableIdleRelaxation === true,
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
  const confluenceFactor = confluenceCount >= 3 ? 1.3 : confluenceCount >= 2 ? 1.18 : 0.92;
  const slice = minNotionalSlicePct + (notionalSlicePct - minNotionalSlicePct) * scoreFactor;
  return clamp(slice * sourceFactor * confluenceFactor, minNotionalSlicePct, notionalSlicePct * 1.15);
}

/**
 * Whether expected TP edge clears estimated round-trip cost + buffer.
 * Slippage bps is a quote ceiling; expected fill cost is typically ~half of that.
 * Confluence / higher scores raise assumed TP capture rate.
 * @param {object} cfg
 * @param {number} score
 * @param {number} [confluenceCount]
 */
export function passesCostAwareEdgeGate(cfg, score, confluenceCount = 1) {
  const maxRoundTrip = estimateRoundTripCostPct(cfg.quoteSlippageBps ?? SCALPER_DEFAULTS.quoteSlippageBps);
  // Expected fill drag (not worst-case slip ceiling)
  const expectedFillCost = maxRoundTrip * 0.55;
  const minEdge = toNum(cfg.minEdgeBufferPct, SCALPER_DEFAULTS.minEdgeBufferPct);
  const tp = toNum(cfg.takeProfitPct, SCALPER_DEFAULTS.takeProfitPct);
  const sl = toNum(cfg.stopLossPct, SCALPER_DEFAULTS.stopLossPct);

  if (tp < expectedFillCost + minEdge * 0.4) return false;

  const scoreNorm = clamp((score - 0.55) / 0.4, 0, 1);
  const captureRate = clamp(
    0.5 + scoreNorm * 0.38 + (confluenceCount >= 2 ? 0.1 : 0) + (confluenceCount >= 3 ? 0.05 : 0),
    0.5,
    0.95,
  );

  const expectedNet = captureRate * tp - (1 - captureRate) * sl;
  const required =
    expectedFillCost + minEdge * (confluenceCount >= 2 ? 0.55 : confluenceCount >= 3 ? 0.45 : 0.85);
  return expectedNet >= required;
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
  const priorLearning = await getLearningDoc();

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
  if (confluenceRuns.length >= 3) {
    const confStats = computeWinRateStats(confluenceRuns);
    if (confStats.winRate >= 0.55) {
      lessons.push(
        `Confluence entries working (${(confStats.winRate * 100).toFixed(0)}% WR) — favoring multi-source setups.`,
      );
      thresholdOverrides.minOpportunityScore = Math.max(
        baseCfg.minOpportunityScore - 0.02,
        0.56,
      );
    }
  }

  const momentumOnly = decided.filter(
    (r) => r.source === "momentum" && toNum(r.confluenceCount) < 2,
  );
  if (momentumOnly.length >= 4) {
    const momStats = computeWinRateStats(momentumOnly);
    if (momStats.winRate < 0.45 || momStats.avgPnlPct < 0) {
      lessons.push(
        `Solo momentum scalps underperforming (${(momStats.winRate * 100).toFixed(0)}% WR) — confluence-only + higher solo momentum floor.`,
      );
      const ceiling = toNum(
        baseCfg.underperfMinScoreCeiling,
        SCALPER_DEFAULTS.underperfMinScoreCeiling,
      );
      thresholdOverrides.minOpportunityScore = Math.max(
        thresholdOverrides.minOpportunityScore ?? baseCfg.minOpportunityScore,
        Math.min(ceiling, baseCfg.minOpportunityScore + 0.1),
      );
      thresholdOverrides.confluenceOnly = true;
      thresholdOverrides.minSoloMomentumScore = Math.max(
        toNum(thresholdOverrides.minSoloMomentumScore, baseCfg.minSoloMomentumScore),
        SCALPER_DEFAULTS.underperfMinSoloMomentumScore,
      );
      thresholdOverrides.disableIdleRelaxation = true;
    }
  }

  const stocksOnly = decided.filter(
    (r) => r.source === "stocks" && toNum(r.confluenceCount) < 2,
  );
  if (stocksOnly.length >= 4) {
    const stockStats = computeWinRateStats(stocksOnly);
    if (stockStats.winRate < 0.42 || stockStats.avgPnlPct < 0) {
      lessons.push(
        `Solo stocks news scalps underperforming (${(stockStats.winRate * 100).toFixed(0)}% WR) — cooling news-only entries.`,
      );
      sourceCooldowns.push({
        source: "stocks",
        reason: `solo_stocks_weak:wr_${(stockStats.winRate * 100).toFixed(0)}`,
        until: new Date(Date.now() + 8 * 60 * 60_000),
      });
    }
  }

  const underperf = computeUnderperformanceOverrides(baseCfg, overall);
  if (underperf.underperforming) {
    Object.assign(thresholdOverrides, underperf.thresholdOverrides);
    lessons.push(...underperf.lessons);
  } else if (overall.winRate >= 0.6 && overall.avgPnlPct > 0.4) {
    lessons.push(
      `Scalper is profitable (win rate ${(overall.winRate * 100).toFixed(0)}%, avg PnL ${overall.avgPnlPct.toFixed(2)}%) — increasing size on strong confluence.`,
    );
    thresholdOverrides.notionalSlicePct = Math.min(baseCfg.notionalSlicePct * 1.15, 0.28);
    thresholdOverrides.confluenceOnly = false;
    thresholdOverrides.disableIdleRelaxation = false;
  } else if (overall.winRate >= 0.55 && overall.avgPnlPct > 0.25) {
    lessons.push(
      `Scalper is profitable (win rate ${(overall.winRate * 100).toFixed(0)}%, avg PnL ${overall.avgPnlPct.toFixed(2)}%) — current policy is working.`,
    );
    thresholdOverrides.confluenceOnly = false;
    thresholdOverrides.disableIdleRelaxation = false;
  }

  const pauseDecision = computeDeskPauseDecision(
    overall,
    minRuns,
    priorLearning?.deskPausedUntil ?? null,
    Date.now(),
    toNum(baseCfg.deskPauseHours, SCALPER_DEFAULTS.deskPauseHours),
  );
  let deskPausedUntil = pauseDecision.until;
  let deskPauseReason =
    pauseDecision.reason === "existing_pause"
      ? priorLearning?.deskPauseReason ?? "desk_paused"
      : pauseDecision.reason;
  if (pauseDecision.paused && pauseDecision.reason !== "existing_pause") {
    lessons.push(
      `Desk paused until ${pauseDecision.until?.toISOString?.() ?? "n/a"} — negative expectancy (no new opens).`,
    );
  } else if (pauseDecision.cleared) {
    lessons.push("Desk pause cleared — expectancy recovered.");
  } else if (pauseDecision.paused) {
    lessons.push(
      `Desk remains paused until ${pauseDecision.until?.toISOString?.() ?? "n/a"} (${deskPauseReason}).`,
    );
  }

  if (expiredRecent.length >= 4 && expiredLossRate >= 0.5) {
    lessons.push(
      `${expiredRecent.length} max-hold exits were mostly losers — shortening hold and cutting stale losers earlier.`,
    );
    thresholdOverrides.maxHoldMinutes = Math.max(baseCfg.maxHoldMinutes - 4, 10);
  }

  const lowScoreLosses = decided.filter(
    (r) => toNum(r.opportunityScore) < 0.58 && r.status === "loss",
  );
  if (lowScoreLosses.length >= 3) {
    lessons.push(
      `${lowScoreLosses.length} losses came from sub-0.58 score entries — tightening min score.`,
    );
    const ceiling = toNum(
      baseCfg.underperfMinScoreCeiling,
      SCALPER_DEFAULTS.underperfMinScoreCeiling,
    );
    thresholdOverrides.minOpportunityScore = Math.min(
      ceiling,
      Math.max(thresholdOverrides.minOpportunityScore ?? baseCfg.minOpportunityScore, 0.68),
    );
  }

  const highImpactLosses = decided.filter(
    (r) => r.status === "loss" && toNum(r.entryImpactBps) > 45,
  );
  if (highImpactLosses.length >= 2) {
    lessons.push(
      `${highImpactLosses.length} losses had high entry impact (>45 bps) — reducing position size.`,
    );
    thresholdOverrides.notionalSlicePct = Math.max(
      baseCfg.notionalSlicePct * 0.7,
      0.1,
    );
  }

  if (overall.winRate < 0.4) {
    thresholdOverrides.takeProfitPct = Math.min(baseCfg.takeProfitPct + 0.1, 1.5);
    thresholdOverrides.stopLossPct = Math.max(baseCfg.stopLossPct - 0.05, 0.35);
    lessons.push("Win rate very low — adjusting TP/SL for cleaner R:R and faster cuts.");
  }

  for (const [source, stats] of Object.entries(sourceStats)) {
    // Momentum can be long-cooled when expectancy-first policy is active.
    const minDecidedForCooldown = source === "momentum" ? 4 : 3;
    if (stats.decided >= minDecidedForCooldown && stats.winRate < 0.35) {
      lessons.push(
        `Source "${source}" win rate ${(stats.winRate * 100).toFixed(0)}% — on 18h cooldown.`,
      );
      sourceCooldowns.push({
        source,
        reason: `repeated_losses:wr_${(stats.winRate * 100).toFixed(0)}`,
        until: new Date(Date.now() + 18 * 60 * 60_000),
      });
    } else if (stats.decided >= 5 && stats.avgPnlPct < -0.15) {
      lessons.push(
        `Source "${source}" avg PnL ${stats.avgPnlPct.toFixed(2)}% — on 10h cooldown.`,
      );
      sourceCooldowns.push({
        source,
        reason: `negative_expectancy:${stats.avgPnlPct.toFixed(2)}`,
        until: new Date(Date.now() + 10 * 60 * 60_000),
      });
    }
  }

  // Only cooldown symbols based on RECENT losses (48h). Historical wipeouts must not
  // permanently freeze the only liquid scalp symbol (cbBTC failure mode).
  const recentCutoff = Date.now() - 48 * 60 * 60_000;
  for (const [symbol, stats] of Object.entries(symbolStats)) {
    const recentSymbolRuns = decided.filter(
      (r) =>
        r.symbol === symbol &&
        r.resolvedAt &&
        new Date(r.resolvedAt).getTime() >= recentCutoff,
    );
    const recentStats = computeWinRateStats(recentSymbolRuns);
    if (
      recentStats.decided >= 3 &&
      recentStats.losses >= 2 &&
      recentStats.winRate < 0.35
    ) {
      lessons.push(
        `Symbol ${symbol} recent win rate ${(recentStats.winRate * 100).toFixed(0)}% — on 2h cooldown.`,
      );
      symbolCooldowns.push({
        symbol,
        reason: `repeated_symbol_losses:${recentStats.losses}`,
        until: new Date(Date.now() + 2 * 60 * 60_000),
      });
    } else if (stats.decided >= 3 && stats.winRate < 0.35) {
      lessons.push(
        `Symbol ${symbol} historical win rate weak (${(stats.winRate * 100).toFixed(0)}%) — score haircut only, no freeze.`,
      );
    }
  }

  const pauseNote = deskPausedUntil
    ? `, desk paused until ${deskPausedUntil.toISOString()}`
    : "";
  const summary = `Analyzed ${decided.length} decided scalps — win rate ${(overall.winRate * 100).toFixed(0)}%, avg PnL $${avgPnlUsd.toFixed(2)}, ${sourceCooldowns.length} source cooldowns, ${symbolCooldowns.length} symbol cooldowns${pauseNote}.`;

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
        deskPausedUntil,
        deskPauseReason,
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
    deskPausedUntil,
    deskPauseReason,
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
