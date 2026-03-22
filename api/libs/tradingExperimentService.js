/**
 * Trading agent experiment: Binance OHLC + CryptoAnalysisEngine, outcome tracking, win rates.
 * No x402 — intended for internal / lab use.
 */
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import { TRADING_EXPERIMENT_STRATEGIES } from "../config/tradingExperimentStrategies.js";
import { buildBinanceSignalReport, fetchBinanceKlinesJson } from "./binanceSignalAnalysis.js";

/**
 * @param {Record<string, unknown>} report
 */
function extractSignalFields(report) {
  const qs = /** @type {Record<string, unknown> | undefined} */ (report?.quickSummary);
  const mo = /** @type {Record<string, unknown> | undefined} */ (report?.marketOverview);
  const clearSignal = String(qs?.signal ?? "HOLD").toUpperCase();
  const entry = parseFloat(String(qs?.entry ?? ""));
  const stopLoss = parseFloat(String(qs?.stopLoss ?? ""));
  const firstTarget = parseFloat(String(qs?.firstTarget ?? ""));
  const priceRaw = mo?.currentPrice;
  const priceAtSignal = parseFloat(String(priceRaw ?? ""));
  const confidence = qs?.confidence != null ? String(qs.confidence) : null;

  return {
    clearSignal,
    entry: Number.isFinite(entry) ? entry : null,
    stopLoss: Number.isFinite(stopLoss) ? stopLoss : null,
    firstTarget: Number.isFinite(firstTarget) ? firstTarget : null,
    priceAtSignal: Number.isFinite(priceAtSignal) ? priceAtSignal : null,
    confidence,
  };
}

/**
 * @param {unknown[][]} candles ascending
 * @param {number} stopLoss
 * @param {number} firstTarget
 * @returns {{ outcome: 'win' | 'loss' | 'expired'; resolution: string; bars: number }}
 */
function evaluateLongForward(candles, stopLoss, firstTarget) {
  let bars = 0;
  for (const k of candles) {
    if (!Array.isArray(k) || k.length < 5) continue;
    bars += 1;
    const high = parseFloat(String(k[2]));
    const low = parseFloat(String(k[3]));
    if (!Number.isFinite(high) || !Number.isFinite(low)) continue;

    const hitSl = low <= stopLoss;
    const hitTp = high >= firstTarget;
    if (hitSl && hitTp) {
      return { outcome: "loss", resolution: "same_bar_both_touched_stop_first_assumption", bars };
    }
    if (hitSl) return { outcome: "loss", resolution: "stop_loss", bars };
    if (hitTp) return { outcome: "win", resolution: "first_target", bars };
  }
  return { outcome: "expired", resolution: "max_bars_no_tp_sl", bars };
}

async function countOpenForAgent(agentId) {
  return TradingExperimentRun.countDocuments({ agentId, status: "open" });
}

/**
 * Run all strategies once: create run rows (BUY → open; else skipped).
 * @returns {Promise<{ created: number; errors: string[] }>}
 */
export async function runExperimentSignalCycle() {
  const errors = [];
  let created = 0;

  for (const s of TRADING_EXPERIMENT_STRATEGIES) {
    try {
      const hasOpen = (await countOpenForAgent(s.id)) > 0;
      if (hasOpen) {
        continue;
      }

      const { symbol, report, anchorCloseMs } = await buildBinanceSignalReport({
        token: s.token,
        bar: s.bar,
        limit: s.limit,
      });

      const ex = extractSignalFields(report);
      const summary = {
        signal: ex.clearSignal,
        reasoning: report?.tradingRecommendation?.reasoning,
        action: report?.tradingRecommendation?.action,
      };

      if (ex.clearSignal !== "BUY") {
        await TradingExperimentRun.create({
          agentId: s.id,
          agentName: s.name,
          token: s.token,
          bar: s.bar,
          limit: s.limit,
          symbol,
          anchorCloseMs,
          clearSignal: ex.clearSignal,
          entry: ex.entry,
          stopLoss: ex.stopLoss,
          firstTarget: ex.firstTarget,
          priceAtSignal: ex.priceAtSignal,
          confidence: ex.confidence,
          status: "skipped_non_buy",
          summary,
        });
        created += 1;
        continue;
      }

      if (
        ex.entry == null ||
        ex.stopLoss == null ||
        ex.firstTarget == null ||
        !(ex.firstTarget > ex.entry && ex.stopLoss < ex.entry)
      ) {
        await TradingExperimentRun.create({
          agentId: s.id,
          agentName: s.name,
          token: s.token,
          bar: s.bar,
          limit: s.limit,
          symbol,
          anchorCloseMs,
          clearSignal: ex.clearSignal,
          entry: ex.entry,
          stopLoss: ex.stopLoss,
          firstTarget: ex.firstTarget,
          priceAtSignal: ex.priceAtSignal,
          confidence: ex.confidence,
          status: "skipped_invalid_levels",
          summary,
        });
        created += 1;
        continue;
      }

      await TradingExperimentRun.create({
        agentId: s.id,
        agentName: s.name,
        token: s.token,
        bar: s.bar,
        limit: s.limit,
        symbol,
        anchorCloseMs,
        clearSignal: ex.clearSignal,
        entry: ex.entry,
        stopLoss: ex.stopLoss,
        firstTarget: ex.firstTarget,
        priceAtSignal: ex.priceAtSignal,
        confidence: ex.confidence,
        status: "open",
        summary,
      });
      created += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`agent ${s.id}: ${msg}`);
    }
  }

  return { created, errors };
}

/**
 * Resolve all open BUY runs using forward Binance klines.
 * @returns {Promise<{ resolved: number; errors: string[] }>}
 */
export async function resolveOpenExperimentRuns() {
  const errors = [];
  let resolved = 0;
  const openRuns = await TradingExperimentRun.find({ status: "open" }).lean();

  for (const run of openRuns) {
    try {
      const strat = TRADING_EXPERIMENT_STRATEGIES.find((x) => x.id === run.agentId);
      const lookAhead = strat?.lookAheadBars ?? 48;

      if (run.anchorCloseMs == null || run.stopLoss == null || run.firstTarget == null) {
        await TradingExperimentRun.updateOne(
          { _id: run._id },
          { status: "error", errorMessage: "missing anchor or levels", resolvedAt: new Date() },
        );
        resolved += 1;
        continue;
      }

      const startTime = run.anchorCloseMs + 1;
      const candles = await fetchBinanceKlinesJson(run.symbol, {
        bar: run.bar,
        limit: lookAhead,
        startTime,
      });

      const { outcome, resolution, bars } = evaluateLongForward(
        candles,
        run.stopLoss,
        run.firstTarget,
      );

      await TradingExperimentRun.updateOne(
        { _id: run._id },
        {
          status: outcome === "win" ? "win" : outcome === "loss" ? "loss" : "expired",
          resolution,
          forwardBarsExamined: bars,
          resolvedAt: new Date(),
        },
      );
      resolved += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`run ${run._id}: ${msg}`);
    }
  }

  return { resolved, errors };
}

/**
 * @returns {Promise<{ sampled: number; resolved: number; errors: string[] }>}
 */
export async function runFullExperimentCycle() {
  const errors = [];
  /** Close outstanding positions first so agents can take a new sample in the same cycle. */
  const res = await resolveOpenExperimentRuns();
  errors.push(...res.errors);
  const sig = await runExperimentSignalCycle();
  errors.push(...sig.errors);
  return {
    sampled: sig.created,
    resolved: res.resolved,
    errors,
  };
}

/**
 * @returns {Promise<{ strategies: typeof TRADING_EXPERIMENT_STRATEGIES; agents: object[] }>}
 */
export async function getExperimentStats() {
  const agents = [];

  for (const s of TRADING_EXPERIMENT_STRATEGIES) {
    const settled = await TradingExperimentRun.find({
      agentId: s.id,
      status: { $in: ["win", "loss"] },
    }).lean();
    const wins = settled.filter((r) => r.status === "win").length;
    const losses = settled.filter((r) => r.status === "loss").length;
    const decided = wins + losses;
    const winRate = decided > 0 ? wins / decided : null;

    const openCount = await TradingExperimentRun.countDocuments({ agentId: s.id, status: "open" });

    agents.push({
      agentId: s.id,
      name: s.name,
      token: s.token,
      bar: s.bar,
      limit: s.limit,
      wins,
      losses,
      decided,
      winRate,
      winRatePct: winRate != null ? Math.round(winRate * 1000) / 10 : null,
      openPositions: openCount,
    });
  }

  return { strategies: TRADING_EXPERIMENT_STRATEGIES, agents };
}

/**
 * @param {{ limit?: number }} [opts]
 */
export async function listRecentRuns(opts = {}) {
  const limit = Math.min(200, Math.max(1, Number(opts.limit) || 50));
  const runs = await TradingExperimentRun.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return runs;
}
