/**
 * Trading agent experiment: Binance OHLC + CryptoAnalysisEngine, outcome tracking, win rates.
 * No x402 — intended for internal / lab use.
 */
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import { TRADING_EXPERIMENT_STRATEGIES } from "../config/tradingExperimentStrategies.js";
import { buildBinanceSignalReport, fetchBinanceKlinesJson } from "./binanceSignalAnalysis.js";

/** Max 1m candles fetched per open position per validation tick (10s default). */
const VALIDATION_1M_BATCH = 150;

/**
 * @param {string} bar
 * @returns {number}
 */
function barDurationMs(bar) {
  const k = String(bar || "1h").trim().toLowerCase();
  const map = {
    "1m": 60_000,
    "3m": 180_000,
    "5m": 300_000,
    "15m": 900_000,
    "30m": 1_800_000,
    "1h": 3_600_000,
    "2h": 7_200_000,
    "4h": 14_400_000,
    "6h": 21_600_000,
    "8h": 28_800_000,
    "12h": 43_200_000,
    "1d": 86_400_000,
    "1w": 604_800_000,
  };
  if (map[k] != null) return map[k];
  return 3_600_000;
}

/**
 * @param {{ bar?: string; lookAheadBars?: number } | undefined} strat
 */
function maxHoldMsForStrategy(strat) {
  const bars = strat?.lookAheadBars ?? 48;
  const dur = barDurationMs(strat?.bar ?? "1h");
  return Math.max(dur, bars * dur);
}

/**
 * @param {unknown[][]} candles ascending
 * @param {number} stopLoss
 * @param {number} firstTarget
 * @returns {{ hit: 'win' | 'loss' | null; resolution: string | null; bars: number }}
 */
function scanCandlesForTpSl(candles, stopLoss, firstTarget) {
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
      return { hit: "loss", resolution: "same_bar_both_touched_stop_first_assumption", bars };
    }
    if (hitSl) return { hit: "loss", resolution: "stop_loss", bars };
    if (hitTp) return { hit: "win", resolution: "first_target", bars };
  }
  return { hit: null, resolution: null, bars };
}

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
  const r = scanCandlesForTpSl(candles, stopLoss, firstTarget);
  if (r.hit === "win" || r.hit === "loss") {
    return { outcome: r.hit, resolution: r.resolution ?? "", bars: r.bars };
  }
  return { outcome: "expired", resolution: "max_bars_no_tp_sl", bars: r.bars };
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
 * Resolve open BUY runs using forward klines on the **signal bar** interval (coarse, one-shot).
 * Prefer {@link resolveOpenExperimentRunsIncremental1m} for frequent validation.
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
          { _id: run._id, status: "open" },
          {
            status: "error",
            errorMessage: "missing anchor or levels",
            resolvedAt: new Date(),
          },
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
        { _id: run._id, status: "open" },
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
 * Fast validation for volatile markets: scan **1m** Binance klines after the signal anchor in batches,
 * advancing `lastProcessed1mCloseMs` until TP/SL hit or max hold (`lookAheadBars` × signal bar duration).
 * @returns {Promise<{ resolved: number; errors: string[]; touched: number }>}
 */
export async function resolveOpenExperimentRunsIncremental1m() {
  const errors = [];
  let resolved = 0;
  let touched = 0;
  const openRuns = await TradingExperimentRun.find({ status: "open" }).lean();

  for (const run of openRuns) {
    try {
      touched += 1;
      const strat = TRADING_EXPERIMENT_STRATEGIES.find((x) => x.id === run.agentId);
      const maxHoldMs = maxHoldMsForStrategy(strat);

      if (run.anchorCloseMs == null || run.stopLoss == null || run.firstTarget == null) {
        const u = await TradingExperimentRun.updateOne(
          { _id: run._id, status: "open" },
          {
            $set: {
              status: "error",
              errorMessage: "missing anchor or levels",
              resolvedAt: new Date(),
            },
          },
        );
        if (u.modifiedCount) resolved += 1;
        continue;
      }

      const now = Date.now();
      const pastMaxHold = now > run.anchorCloseMs + maxHoldMs;

      const cursor =
        run.lastProcessed1mCloseMs != null ? run.lastProcessed1mCloseMs + 1 : run.anchorCloseMs + 1;

      if (cursor > now && !pastMaxHold) {
        continue;
      }

      let candles = [];
      if (cursor <= now) {
        candles = await fetchBinanceKlinesJson(run.symbol, {
          bar: "1m",
          startTime: cursor,
          limit: VALIDATION_1M_BATCH,
        });
      }

      const prevExamined = run.forwardBarsExamined ?? 0;

      if (candles.length > 0) {
        const r = scanCandlesForTpSl(candles, run.stopLoss, run.firstTarget);
        const lastClose = Number(candles[candles.length - 1][6]);

        if (r.hit === "win" || r.hit === "loss") {
          const u = await TradingExperimentRun.updateOne(
            { _id: run._id, status: "open" },
            {
              $set: {
                status: r.hit,
                resolution: r.resolution,
                forwardBarsExamined: prevExamined + r.bars,
                lastProcessed1mCloseMs: lastClose,
                resolvedAt: new Date(),
              },
            },
          );
          if (u.modifiedCount) resolved += 1;
          continue;
        }

        await TradingExperimentRun.updateOne(
          { _id: run._id, status: "open" },
          {
            $set: {
              lastProcessed1mCloseMs: lastClose,
              forwardBarsExamined: prevExamined + candles.length,
            },
          },
        );
      }

      if (Date.now() > run.anchorCloseMs + maxHoldMs) {
        const u = await TradingExperimentRun.updateOne(
          { _id: run._id, status: "open" },
          {
            $set: {
              status: "expired",
              resolution: "max_hold_time_no_tp_sl",
              resolvedAt: new Date(),
            },
          },
        );
        if (u.modifiedCount) resolved += 1;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`run ${run._id}: ${msg}`);
    }
  }

  return { resolved, errors, touched };
}

/**
 * @returns {Promise<{ sampled: number; resolved: number; errors: string[] }>}
 */
export async function runFullExperimentCycle() {
  const errors = [];
  const res = await resolveOpenExperimentRunsIncremental1m();
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
