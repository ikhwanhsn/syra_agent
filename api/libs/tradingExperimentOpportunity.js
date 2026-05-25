/**
 * Multi-token lab agents: scan watchlists, rank BUY setups, open the best opportunity.
 */
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import TradingExperimentAgentState from "../models/TradingExperimentAgentState.js";
import {
  EXPERIMENT_SUITE_MULTI_TOKEN,
  normalizeSuite,
} from "../config/tradingExperimentStrategies.js";
import { isMultiTokenStrategy } from "../config/tradingExperimentMultiToken.js";
import { TRADING_EXPERIMENT_TRADE_NOTIONAL_USD } from "../config/tradingExperimentSim.js";
import { buildBinanceSignalReport } from "./binanceSignalAnalysis.js";
import { extractSignalFields } from "./experimentSignalExtract.js";
import { experimentBuyPassesAllGates } from "./experimentSignalGate.js";
import { resolveStrategiesForSuite } from "./tradingExperimentStrategyResolve.js";

const CONFIDENCE_RANK = Object.freeze({ LOW: 0, MEDIUM: 1, HIGH: 2 });

/**
 * @param {string | null | undefined} c
 */
function confidenceRank(c) {
  const k = String(c ?? "LOW").trim().toUpperCase();
  return CONFIDENCE_RANK[k] ?? 0;
}

/**
 * @param {ReturnType<typeof extractSignalFields>} ex
 * @param {string} [mode]
 */
export function scoreTradingOpportunity(ex, mode = "best_composite") {
  const conf = confidenceRank(ex.confidence);
  const entry = ex.entry;
  const sl = ex.stopLoss;
  const tp = ex.firstTarget;
  let rr = 1;
  if (entry > 0 && sl > 0 && tp > entry) {
    rr = (tp - entry) / (entry - sl);
  }
  const rrCap = Math.min(Math.max(rr, 0.25), 5);

  if (mode === "best_confidence") return conf * 1000 + rrCap * 25;
  if (mode === "best_risk_reward") return rrCap * 1000 + conf * 25;
  return conf * 500 + rrCap * 200;
}

/**
 * @param {string} suiteNorm
 * @param {number} agentId
 */
function labAgentRunFilter(suiteNorm, agentId) {
  return {
    suite: suiteNorm,
    agentId,
    $or: [{ userStrategyId: null }, { userStrategyId: { $exists: false } }],
  };
}

/**
 * @param {object} strat
 * @param {string} suiteNorm
 */
async function processMultiTokenAgent(strat, suiteNorm) {
  const maxOpen = Math.max(1, Number(strat.maxOpenPositions) || 1);
  const openCount = await TradingExperimentRun.countDocuments({
    ...labAgentRunFilter(suiteNorm, strat.id),
    status: "open",
  });
  if (openCount >= maxOpen) return { created: 0, errors: [] };

  const reserved = await TradingExperimentAgentState.findOneAndUpdate(
    {
      suite: suiteNorm,
      agentId: strat.id,
      cashUsd: { $gte: TRADING_EXPERIMENT_TRADE_NOTIONAL_USD },
    },
    { $inc: { cashUsd: -TRADING_EXPERIMENT_TRADE_NOTIONAL_USD } },
    { new: true },
  );
  if (!reserved) return { created: 0, errors: [] };

  const tokens = /** @type {string[]} */ (strat.tokens);
  const mode = strat.opportunityMode ?? "best_composite";
  const errors = [];
  /** @type {{ token: string; score: number; ex: ReturnType<typeof extractSignalFields>; symbol: string; anchorCloseMs: number | null; report: Record<string, unknown> }[]} */
  const candidates = [];

  await Promise.all(
    tokens.map(async (token) => {
      try {
        const bin = await buildBinanceSignalReport({
          token,
          bar: strat.bar,
          limit: strat.limit,
        });
        const ex = extractSignalFields(bin.report);
        if (!experimentBuyPassesAllGates(ex, strat.experimentGate, strat.indicatorFilter)) return;
        if (ex.clearSignal === "HOLD" || ex.clearSignal !== "BUY") return;
        if (
          ex.entry == null ||
          ex.stopLoss == null ||
          ex.firstTarget == null ||
          !(ex.firstTarget > ex.entry && ex.stopLoss < ex.entry)
        ) {
          return;
        }
        const score = scoreTradingOpportunity(ex, mode);
        candidates.push({
          token,
          score,
          ex,
          symbol: bin.symbol,
          anchorCloseMs: bin.anchorCloseMs ?? null,
          report: bin.report,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`[${suiteNorm}] agent ${strat.id} token ${token}: ${msg}`);
      }
    }),
  );

  if (candidates.length === 0) {
    await TradingExperimentAgentState.updateOne(
      { suite: suiteNorm, agentId: strat.id },
      { $inc: { cashUsd: TRADING_EXPERIMENT_TRADE_NOTIONAL_USD } },
    );
    return { created: 0, errors };
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const summary = {
    signal: best.ex.clearSignal,
    opportunityMode: mode,
    opportunityScore: best.score,
    candidatesScanned: tokens.length,
    candidatesValid: candidates.length,
    pickedToken: best.token,
    reasoning: best.report?.tradingRecommendation?.reasoning,
    action: best.report?.tradingRecommendation?.action,
  };

  try {
    await TradingExperimentRun.create({
      suite: suiteNorm,
      agentId: strat.id,
      agentName: strat.name,
      token: best.token,
      bar: strat.bar,
      limit: strat.limit,
      symbol: best.symbol,
      anchorCloseMs: best.anchorCloseMs,
      clearSignal: best.ex.clearSignal,
      entry: best.ex.entry,
      stopLoss: best.ex.stopLoss,
      firstTarget: best.ex.firstTarget,
      priceAtSignal: best.ex.priceAtSignal,
      confidence: best.ex.confidence,
      status: "open",
      summary,
      notionalUsd: TRADING_EXPERIMENT_TRADE_NOTIONAL_USD,
    });
    return { created: 1, errors };
  } catch (createErr) {
    await TradingExperimentAgentState.updateOne(
      { suite: suiteNorm, agentId: strat.id },
      { $inc: { cashUsd: TRADING_EXPERIMENT_TRADE_NOTIONAL_USD } },
    );
    throw createErr;
  }
}

/**
 * @param {{ suite?: string | null }} [opts]
 */
export async function runMultiTokenExperimentSignalCycle(opts = {}) {
  const suiteNorm = normalizeSuite(opts.suite ?? EXPERIMENT_SUITE_MULTI_TOKEN);
  const strategies = await resolveStrategiesForSuite(suiteNorm);
  const errors = [];
  let created = 0;

  for (const s of strategies) {
    if (!isMultiTokenStrategy(s)) continue;
    try {
      const out = await processMultiTokenAgent(s, suiteNorm);
      created += out.created;
      errors.push(...out.errors);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`[${suiteNorm}] agent ${s.id}: ${msg}`);
    }
  }

  return { created, errors, suite: suiteNorm };
}
