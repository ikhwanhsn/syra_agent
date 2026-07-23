/**
 * BTC3 macro paper trading — learn from past rebalances and nudge thresholds.
 */
import Btc3LearningState from "../../models/btc3/LearningState.js";
import Btc3PaperRebalance from "../../models/btc3/PaperRebalance.js";
import { getBtc3PaperSimConfig } from "../../config/btc3MacroConfig.js";
import { agentStateRepo } from "../../repositories/btc3/index.js";

const GLOBAL_ID = "singleton";

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function getLearningDoc() {
  let doc = await Btc3LearningState.findById(GLOBAL_ID).lean();
  if (!doc) {
    await Btc3LearningState.create({ _id: GLOBAL_ID, lessons: [], thresholdOverrides: {} });
    doc = await Btc3LearningState.findById(GLOBAL_ID).lean();
  }
  return doc;
}

export async function getBtc3LearningSnapshot() {
  const doc = await getLearningDoc();
  const state = await agentStateRepo.getState();
  const cfg = getBtc3PaperSimConfig(state);
  return {
    lessons: doc?.lessons ?? [],
    thresholdOverrides: doc?.thresholdOverrides ?? {},
    lastEvolutionAt: doc?.lastEvolutionAt ?? null,
    lastEvolutionSummary: doc?.lastEvolutionSummary ?? null,
    rebalancesAnalyzed: doc?.rebalancesAnalyzed ?? 0,
    baseConfig: {
      minRebalancePct: cfg.minRebalancePct,
      initialBtcPct: cfg.initialBtcPct,
    },
  };
}

/**
 * Merge learned threshold overrides into paper sim config.
 * @param {object} state
 */
export async function getEffectiveBtc3PaperConfig(state) {
  const base = getBtc3PaperSimConfig(state);
  const doc = await getLearningDoc();
  const overrides = doc?.thresholdOverrides ?? {};

  return {
    ...base,
    minRebalancePct: toNum(overrides.minRebalancePct, base.minRebalancePct),
    minConfidence: toNum(overrides.minConfidence, 0),
    maxBtcTiltPct: overrides.maxBtcTiltPct != null ? toNum(overrides.maxBtcTiltPct) : null,
    roundTripCostBps: toNum(overrides.roundTripCostBps, base.roundTripCostBps),
  };
}

/**
 * Analyze executed paper rebalances and derive lessons + threshold nudges.
 */
export async function runBtc3Learning() {
  const minRebalances = Number(process.env.BTC3_LEARNING_MIN_REBALANCES || 5);
  const state = await agentStateRepo.getState();
  const experimentId = state?.activeExperimentId;
  if (!experimentId) {
    return { skipped: true, reason: "no_active_experiment" };
  }

  const rebalances = await Btc3PaperRebalance.find({ experimentId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const executed = rebalances.filter((r) => r.status === "executed");
  if (executed.length < minRebalances) {
    return {
      skipped: true,
      reason: "insufficient_rebalances",
      executedCount: executed.length,
      minRebalances,
    };
  }

  const cfg = getBtc3PaperSimConfig(state);
  const lessons = [];
  const thresholdOverrides = {};

  const returns = executed
    .map((r) => toNum(r.returnPct))
    .filter((v) => Number.isFinite(v));
  const avgReturn = returns.length ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;

  const recentExecuted = executed.slice(0, 20);
  let hurtfulCount = 0;
  for (let i = 0; i < recentExecuted.length - 1; i += 1) {
    const curr = recentExecuted[i];
    const prev = recentExecuted[i + 1];
    const currRet = toNum(curr.returnPct);
    const prevRet = toNum(prev.returnPct);
    if (Number.isFinite(currRet) && Number.isFinite(prevRet) && currRet < prevRet) {
      hurtfulCount += 1;
    }
  }

  if (avgReturn < 0 || hurtfulCount >= 8) {
    lessons.push(
      `Recent rebalances underperformed (avg return ${avgReturn.toFixed(2)}%) — raising min rebalance threshold.`,
    );
    thresholdOverrides.minRebalancePct = Math.min(
      cfg.minRebalancePct + 1,
      cfg.minRebalancePct * 1.5,
      8,
    );
    thresholdOverrides.minConfidence = Math.max(0.55, toNum(cfg.minConfidence, 0));
  } else if (avgReturn > 2 && hurtfulCount <= 3) {
    lessons.push(
      `Paper rebalances are profitable (avg return ${avgReturn.toFixed(2)}%) — current allocation policy is working.`,
    );
  }

  const lowConfidenceLosses = executed.filter(
    (r) => toNum(r.confidence) < 0.5 && toNum(r.returnPct) < 0,
  );
  if (lowConfidenceLosses.length >= 3) {
    lessons.push(
      `${lowConfidenceLosses.length} low-confidence rebalances hurt returns — require higher confidence.`,
    );
    thresholdOverrides.minConfidence = 0.6;
  }

  const largeTilts = executed.filter((r) => {
    const before = r.beforeAllocation?.btcPct ?? 0;
    const after = r.afterAllocation?.btcPct ?? 0;
    return Math.abs(after - before) > 15 && toNum(r.returnPct) < 0;
  });
  if (largeTilts.length >= 2) {
    lessons.push("Large BTC tilts (>15%) correlated with losses — capping max tilt.");
    thresholdOverrides.maxBtcTiltPct = 12;
  }

  const summary = `Analyzed ${executed.length} executed rebalances — avg return ${avgReturn.toFixed(2)}%, ${hurtfulCount} recent underperformers.`;

  await Btc3LearningState.updateOne(
    { _id: GLOBAL_ID },
    {
      $set: {
        lessons: lessons.slice(0, 30),
        thresholdOverrides,
        lastEvolutionAt: new Date(),
        lastEvolutionSummary: summary,
        rebalancesAnalyzed: executed.length,
      },
    },
    { upsert: true },
  );

  return {
    skipped: false,
    executedCount: executed.length,
    avgReturn,
    hurtfulCount,
    lessons,
    thresholdOverrides,
    summary,
  };
}

export const BTC3_LEARNING_SCHEDULE = Object.freeze({
  enabled: true,
  intervalMs: 86_400_000,
});

export function btc3LearningConfigFromEnv() {
  const enabledRaw = (process.env.BTC3_LEARNING_ENABLED || "").trim().toLowerCase();
  const enabled =
    enabledRaw === "0" || enabledRaw === "false" || enabledRaw === "off" ? false : BTC3_LEARNING_SCHEDULE.enabled;
  const ms = Number(process.env.BTC3_LEARNING_MS || BTC3_LEARNING_SCHEDULE.intervalMs);
  return {
    enabled,
    ms: Number.isFinite(ms) && ms >= 60_000 ? ms : BTC3_LEARNING_SCHEDULE.intervalMs,
  };
}
