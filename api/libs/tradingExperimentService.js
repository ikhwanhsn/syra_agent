/**
 * Trading agent experiment: Binance OHLC + CryptoAnalysisEngine, outcome tracking, win rates.
 * No x402 — intended for internal / lab use.
 */
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import TradingExperimentAgentState from "../models/TradingExperimentAgentState.js";
import {
  TRADING_EXPERIMENT_STARTING_USD,
  TRADING_EXPERIMENT_TRADE_NOTIONAL_USD,
  computeAgentEquityUsd,
} from "../config/tradingExperimentSim.js";
import {
  EXPERIMENT_SUITE_PRIMARY,
  EXPERIMENT_SUITE_SECONDARY,
  EXPERIMENT_SUITE_MULTI_RESOURCE,
  normalizeSuite,
} from "../config/tradingExperimentStrategies.js";
import { resolveStrategiesForSuite } from "./tradingExperimentStrategyResolve.js";
import UserCustomStrategy from "../models/UserCustomStrategy.js";
import { buildBinanceSignalReport, fetchBinanceKlinesJson } from "./binanceSignalAnalysis.js";
import { buildCexSignalReport, normalizeSignalCexSource } from "./cexSignalAnalysis.js";
import { extractSignalFields } from "./experimentSignalExtract.js";
import { experimentBuyPassesAllGates } from "./experimentSignalGate.js";
import { runUserCustomSignalCycle } from "./userCustomStrategyService.js";

/**
 * @param {string | undefined | null} suite
 * @returns {Record<string, unknown>}
 */
function mongoMatchSuite(suite) {
  const s = normalizeSuite(suite);
  if (s === EXPERIMENT_SUITE_PRIMARY) {
    return {
      $or: [
        { suite: EXPERIMENT_SUITE_PRIMARY },
        { suite: { $exists: false } },
        { suite: null },
        { suite: "" },
      ],
    };
  }
  if (s === EXPERIMENT_SUITE_MULTI_RESOURCE) {
    return { suite: EXPERIMENT_SUITE_MULTI_RESOURCE };
  }
  return { suite: EXPERIMENT_SUITE_SECONDARY };
}

/** Internal sentinel for listRecentRuns: all standard lab ledgers merged (excludes wallet custom). */
const LIST_RUNS_ALL_STANDARD_LAB = "__standard_lab__";

function mongoMatchAllStandardLabSuites() {
  return {
    $or: [
      { suite: EXPERIMENT_SUITE_PRIMARY },
      { suite: { $exists: false } },
      { suite: null },
      { suite: "" },
      { suite: EXPERIMENT_SUITE_SECONDARY },
      { suite: EXPERIMENT_SUITE_MULTI_RESOURCE },
    ],
  };
}

const EXPERIMENT_RUN_STATUSES = new Set([
  "open",
  "win",
  "loss",
  "expired",
  "skipped_invalid_levels",
  "error",
]);

const MAX_RUN_FILTER_LEN = 64;

/** Standard lab runs only (not wallet custom strategies). */
const LAB_RUN_USER_STRATEGY_CLAUSE = {
  $or: [{ userStrategyId: null }, { userStrategyId: { $exists: false } }],
};

/**
 * @param {unknown} value
 * @param {number} [fallback]
 * @returns {number}
 */
function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** @param {string} suiteNorm */
function labAgentRunBase(suiteNorm, agentId) {
  return { agentId, ...mongoMatchSuite(suiteNorm), ...LAB_RUN_USER_STRATEGY_CLAUSE };
}

/**
 * @param {import("mongoose").LeanDocument<any>} run
 * @returns {boolean}
 */
function isLabCapitalRun(run) {
  return !run?.userStrategyId;
}

/**
 * @param {import("mongoose").LeanDocument<any>} run
 * @returns {number}
 */
function estimateHistoricalSettledPnlUsd(run) {
  if (run.simPnlUsd != null && Number.isFinite(run.simPnlUsd)) return toNum(run.simPnlUsd);
  const n = toNum(run.notionalUsd, TRADING_EXPERIMENT_TRADE_NOTIONAL_USD);
  const entry = toNum(run.entry);
  if (!(entry > 0)) return 0;
  let exit = toNum(run.simExitPrice);
  if (!(exit > 0)) {
    if (run.status === "win") exit = toNum(run.firstTarget, entry);
    else if (run.status === "loss") exit = toNum(run.stopLoss, entry);
    else if (run.status === "expired") exit = toNum(run.priceAtSignal, entry);
    else if (run.status === "error") exit = entry;
    else return 0;
  }
  return n * (exit / entry - 1);
}

/**
 * @param {string} suiteNorm
 * @param {number} agentId
 * @returns {Promise<number>}
 */
async function computeSyntheticCashUsd(suiteNorm, agentId) {
  const base = labAgentRunBase(suiteNorm, agentId);
  const settled = await TradingExperimentRun.find({
    ...base,
    status: { $in: ["win", "loss", "expired", "error"] },
  }).lean();
  let pnl = 0;
  for (const r of settled) pnl += estimateHistoricalSettledPnlUsd(r);
  const opens = await TradingExperimentRun.countDocuments({ ...base, status: "open" });
  return (
    TRADING_EXPERIMENT_STARTING_USD +
    pnl -
    TRADING_EXPERIMENT_TRADE_NOTIONAL_USD * opens
  );
}

/**
 * Ensures Mongo rows exist for every strategy agent in this suite; backfills cash from run history.
 * @param {string} suiteNorm
 */
export async function ensureTradingExperimentLedgerBootstrapped(suiteNorm) {
  const strategies = await resolveStrategiesForSuite(suiteNorm);
  for (const s of strategies) {
    const ex = await TradingExperimentAgentState.findOne({ suite: suiteNorm, agentId: s.id }).lean();
    if (ex) continue;
    const cash = await computeSyntheticCashUsd(suiteNorm, s.id);
    await TradingExperimentAgentState.create({
      suite: suiteNorm,
      agentId: s.id,
      cashUsd: Math.max(0, cash),
      startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
    });
  }
}

/**
 * @param {import("mongoose").Types.ObjectId | string} runId
 * @param {import("mongoose").LeanDocument<any>} runLean
 * @param {Record<string, unknown>} setFields resolved fields (status, resolution, …)
 * @param {number} simExitPrice
 * @returns {Promise<boolean>} true if an open row was settled
 */
async function finalizeOpenLabRun(runId, runLean, setFields, simExitPrice) {
  if (!isLabCapitalRun(runLean)) {
    const u = await TradingExperimentRun.updateOne({ _id: runId, status: "open" }, { $set: setFields });
    return u.modifiedCount > 0;
  }
  const suiteNorm = normalizeSuite(runLean.suite);
  await ensureTradingExperimentLedgerBootstrapped(suiteNorm);
  const notional = toNum(runLean.notionalUsd, TRADING_EXPERIMENT_TRADE_NOTIONAL_USD);
  const entry = toNum(runLean.entry);
  const exitP =
    Number.isFinite(simExitPrice) && simExitPrice > 0 ? simExitPrice : toNum(runLean.priceAtSignal, entry);
  const simPnlUsd = entry > 0 && exitP > 0 ? notional * (exitP / entry - 1) : 0;
  const u = await TradingExperimentRun.updateOne(
    { _id: runId, status: "open" },
    {
      $set: {
        ...setFields,
        simExitPrice: exitP,
        simPnlUsd,
        notionalUsd: notional,
      },
    },
  );
  if (u.modifiedCount === 0) return false;
  await TradingExperimentAgentState.updateOne(
    { suite: suiteNorm, agentId: runLean.agentId },
    { $inc: { cashUsd: notional + simPnlUsd } },
  );
  return true;
}

/**
 * Mark price near max-hold for expired paper P/L.
 * @param {import("mongoose").LeanDocument<any>} run
 * @param {{ bar?: string; lookAheadBars?: number }} stratCfg
 */
async function fetchExpireExitPrice(run, stratCfg) {
  const maxHoldMs = maxHoldMsForStrategy(stratCfg);
  const endMs = toNum(run.anchorCloseMs) + maxHoldMs;
  try {
    const kl = await fetchBinanceKlinesJson(run.symbol, { bar: "1m", endTime: endMs, limit: 5 });
    if (Array.isArray(kl) && kl.length > 0) {
      const close = parseFloat(String(kl[kl.length - 1][4]));
      if (Number.isFinite(close) && close > 0) return close;
    }
  } catch {
    // fall through
  }
  return toNum(run.priceAtSignal, toNum(run.entry));
}

/** @param {string} s */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} suiteNorm
 * @param {{ status?: string; agentId?: number; symbol?: string; signal?: string }} f
 * @returns {Record<string, unknown>}
 */
function buildListRunsFilter(suiteNorm, f) {
  const suiteQ =
    suiteNorm === LIST_RUNS_ALL_STANDARD_LAB ? mongoMatchAllStandardLabSuites() : mongoMatchSuite(suiteNorm);
  /** @type {Record<string, unknown>[]} */
  const parts = [suiteQ];

  const st = typeof f.status === "string" ? f.status.trim() : "";
  if (st && EXPERIMENT_RUN_STATUSES.has(st)) {
    parts.push({ status: st });
  }

  if (f.agentId != null && Number.isInteger(f.agentId) && f.agentId >= 0 && f.agentId <= 999) {
    parts.push({ agentId: f.agentId });
  }

  const sym = typeof f.symbol === "string" ? f.symbol.trim().slice(0, MAX_RUN_FILTER_LEN) : "";
  if (sym.length > 0) {
    parts.push({ symbol: new RegExp(escapeRegex(sym), "i") });
  }

  const sig = typeof f.signal === "string" ? f.signal.trim().slice(0, MAX_RUN_FILTER_LEN) : "";
  if (sig.length > 0) {
    parts.push({ clearSignal: new RegExp(escapeRegex(sig), "i") });
  }

  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

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

/**
 * Run all strategies for one suite once: create run rows only for spot-long (BUY with valid levels → open;
 * invalid BUY levels → skipped_invalid_levels). HOLD and non-BUY (e.g. SELL) are not persisted.
 * @param {{ suite?: string | null }} [opts]
 * @returns {Promise<{ created: number; errors: string[]; suite: string }>}
 */
export async function runExperimentSignalCycle(opts = {}) {
  const suiteNorm = normalizeSuite(opts.suite);
  await ensureTradingExperimentLedgerBootstrapped(suiteNorm);
  const strategies = await resolveStrategiesForSuite(suiteNorm);
  const errors = [];
  let created = 0;

  for (const s of strategies) {
    try {
      /** @type {string} */
      let symbol;
      /** @type {Record<string, unknown>} */
      let report;
      /** @type {number | null} */
      let anchorCloseMs;
      /** @type {string | null} */
      let cexSource = null;

      if (suiteNorm === EXPERIMENT_SUITE_MULTI_RESOURCE) {
        const src = /** @type {{ source: string }} */ (s).source;
        const built = await buildCexSignalReport(src, {
          token: s.token,
          bar: s.bar,
          limit: s.limit,
        });
        report = built.report;
        anchorCloseMs = built.anchorCloseMs ?? null;
        symbol = built.instrument;
        cexSource = built.source;
      } else {
        const bin = await buildBinanceSignalReport({
          token: s.token,
          bar: s.bar,
          limit: s.limit,
        });
        symbol = bin.symbol;
        report = bin.report;
        anchorCloseMs = bin.anchorCloseMs;
      }

      const ex = extractSignalFields(report);
      const summary = {
        signal: ex.clearSignal,
        reasoning: report?.tradingRecommendation?.reasoning,
        action: report?.tradingRecommendation?.action,
      };

      if (!experimentBuyPassesAllGates(ex, s.experimentGate, s.indicatorFilter)) {
        continue;
      }

      if (ex.clearSignal === "HOLD") {
        // HOLD means no actionable position; skip persistence to keep experiment ledger focused.
        continue;
      }

      if (ex.clearSignal !== "BUY") {
        // Spot-long experiment: do not record SELL or other non-BUY signals.
        continue;
      }

      if (
        ex.entry == null ||
        ex.stopLoss == null ||
        ex.firstTarget == null ||
        !(ex.firstTarget > ex.entry && ex.stopLoss < ex.entry)
      ) {
        await TradingExperimentRun.create({
          suite: suiteNorm,
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

      const reserved = await TradingExperimentAgentState.findOneAndUpdate(
        {
          suite: suiteNorm,
          agentId: s.id,
          cashUsd: { $gte: TRADING_EXPERIMENT_TRADE_NOTIONAL_USD },
        },
        { $inc: { cashUsd: -TRADING_EXPERIMENT_TRADE_NOTIONAL_USD } },
        { new: true },
      );
      if (!reserved) {
        continue;
      }

      try {
        await TradingExperimentRun.create({
          suite: suiteNorm,
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
          notionalUsd: TRADING_EXPERIMENT_TRADE_NOTIONAL_USD,
        });
        created += 1;
      } catch (createErr) {
        await TradingExperimentAgentState.updateOne(
          { suite: suiteNorm, agentId: s.id },
          { $inc: { cashUsd: TRADING_EXPERIMENT_TRADE_NOTIONAL_USD } },
        );
        throw createErr;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`[${suiteNorm}] agent ${s.id}: ${msg}`);
    }
  }

  return { created, errors, suite: suiteNorm };
}

/**
 * Hourly job: sample signals for every suite (isolated ledgers).
 * @returns {Promise<{ created: number; errors: string[]; bySuite: Record<string, number> }>}
 */
export async function runAllExperimentSignalCycles() {
  const errors = [];
  let created = 0;
  /** @type {Record<string, number>} */
  const bySuite = {};

  for (const suiteId of [EXPERIMENT_SUITE_PRIMARY, EXPERIMENT_SUITE_SECONDARY]) {
    const out = await runExperimentSignalCycle({ suite: suiteId });
    errors.push(...out.errors);
    created += out.created;
    bySuite[out.suite] = out.created;
  }

  return { created, errors, bySuite };
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
  const uniqSuites = [...new Set(openRuns.map((r) => normalizeSuite(r.suite)))];
  const stratLists = await Promise.all(uniqSuites.map((su) => resolveStrategiesForSuite(su)));
  /** @type {Record<string, object[]>} */
  const stratBySuite = Object.fromEntries(uniqSuites.map((su, i) => [su, stratLists[i]]));

  for (const run of openRuns) {
    try {
      /** @type {number} */
      let lookAhead = 48;

      if (run.userStrategyId) {
        const us = await UserCustomStrategy.findById(run.userStrategyId).lean();
        if (!us) {
          const ok = await finalizeOpenLabRun(
            run._id,
            run,
            {
              status: "error",
              errorMessage: "custom strategy removed",
              resolvedAt: new Date(),
            },
            toNum(run.entry, toNum(run.priceAtSignal)),
          );
          if (ok) resolved += 1;
          continue;
        }
        lookAhead = us.lookAheadBars ?? 48;
      } else {
        const sk = normalizeSuite(run.suite);
        const list = stratBySuite[sk] || (await resolveStrategiesForSuite(sk));
        const strat = list.find((x) => x.id === run.agentId);
        lookAhead = strat?.lookAheadBars ?? 48;

        const cexNorm = run.cexSource ? normalizeSignalCexSource(run.cexSource) : null;
        if (cexNorm && cexNorm !== "binance") {
          continue;
        }
      }

      if (run.anchorCloseMs == null || run.stopLoss == null || run.firstTarget == null) {
        const ok = await finalizeOpenLabRun(
          run._id,
          run,
          {
            status: "error",
            errorMessage: "missing anchor or levels",
            resolvedAt: new Date(),
          },
          toNum(run.entry, toNum(run.priceAtSignal)),
        );
        if (ok) resolved += 1;
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

      const finalStatus = outcome === "win" ? "win" : outcome === "loss" ? "loss" : "expired";
      let simExit = toNum(run.entry);
      if (finalStatus === "win") simExit = toNum(run.firstTarget, simExit);
      else if (finalStatus === "loss") simExit = toNum(run.stopLoss, simExit);
      else if (candles.length > 0) {
        const last = candles[candles.length - 1];
        const c = parseFloat(String(last[4]));
        if (Number.isFinite(c) && c > 0) simExit = c;
      }

      const ok = await finalizeOpenLabRun(
        run._id,
        run,
        {
          status: finalStatus,
          resolution,
          forwardBarsExamined: bars,
          resolvedAt: new Date(),
        },
        simExit,
      );
      if (ok) resolved += 1;
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
  const uniqSuites = [...new Set(openRuns.map((r) => normalizeSuite(r.suite)))];
  const stratLists = await Promise.all(uniqSuites.map((su) => resolveStrategiesForSuite(su)));
  /** @type {Record<string, object[]>} */
  const stratBySuite = Object.fromEntries(uniqSuites.map((su, i) => [su, stratLists[i]]));

  for (const run of openRuns) {
    try {
      touched += 1;

      /** @type {{ bar?: string; lookAheadBars?: number }} */
      let stratCfg;
      if (run.userStrategyId) {
        const us = await UserCustomStrategy.findById(run.userStrategyId).lean();
        if (!us) {
          const ok = await finalizeOpenLabRun(
            run._id,
            run,
            {
              status: "error",
              errorMessage: "custom strategy removed",
              resolvedAt: new Date(),
            },
            toNum(run.entry, toNum(run.priceAtSignal)),
          );
          if (ok) resolved += 1;
          continue;
        }
        stratCfg = { bar: us.bar, lookAheadBars: us.lookAheadBars };
      } else {
        const sk = normalizeSuite(run.suite);
        const list = stratBySuite[sk] || (await resolveStrategiesForSuite(sk));
        const strat = list.find((x) => x.id === run.agentId);
        stratCfg = strat
          ? { bar: strat.bar, lookAheadBars: strat.lookAheadBars }
          : { bar: run.bar, lookAheadBars: 48 };
      }
      const maxHoldMs = maxHoldMsForStrategy(stratCfg);

      if (run.anchorCloseMs == null || run.stopLoss == null || run.firstTarget == null) {
        const ok = await finalizeOpenLabRun(
          run._id,
          run,
          {
            status: "error",
            errorMessage: "missing anchor or levels",
            resolvedAt: new Date(),
          },
          toNum(run.entry, toNum(run.priceAtSignal)),
        );
        if (ok) resolved += 1;
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
          const exitPx = r.hit === "win" ? toNum(run.firstTarget) : toNum(run.stopLoss);
          const ok = await finalizeOpenLabRun(
            run._id,
            run,
            {
              status: r.hit,
              resolution: r.resolution,
              forwardBarsExamined: prevExamined + r.bars,
              lastProcessed1mCloseMs: lastClose,
              resolvedAt: new Date(),
            },
            exitPx,
          );
          if (ok) resolved += 1;
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
        const exitPx = await fetchExpireExitPrice(run, stratCfg);
        const ok = await finalizeOpenLabRun(
          run._id,
          run,
          {
            status: "expired",
            resolution: "max_hold_time_no_tp_sl",
            resolvedAt: new Date(),
          },
          exitPx,
        );
        if (ok) resolved += 1;
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
  const sig = await runAllExperimentSignalCycles();
  errors.push(...sig.errors);
  const userSig = await runUserCustomSignalCycle();
  errors.push(...userSig.errors);
  return {
    sampled: sig.created + userSig.created,
    resolved: res.resolved,
    errors,
    bySuite: { ...sig.bySuite, user_custom: userSig.created },
  };
}

/**
 * @param {{ suite?: string | null }} [opts]
 * @returns {Promise<{ strategies: readonly object[]; agents: object[]; suite: string }>}
 */
export async function getExperimentStats(opts = {}) {
  const suiteNorm = normalizeSuite(opts.suite);
  await ensureTradingExperimentLedgerBootstrapped(suiteNorm);
  const strategies = await resolveStrategiesForSuite(suiteNorm);
  const suiteQ = mongoMatchSuite(suiteNorm);
  const states = await TradingExperimentAgentState.find({ suite: suiteNorm }).lean();
  /** @type {Map<number, import("mongoose").LeanDocument<any>>} */
  const stateByAgent = new Map(states.map((x) => [x.agentId, x]));
  const agents = [];

  for (const s of strategies) {
    const settled = await TradingExperimentRun.find({
      agentId: s.id,
      status: { $in: ["win", "loss"] },
      ...suiteQ,
      ...LAB_RUN_USER_STRATEGY_CLAUSE,
    }).lean();
    const wins = settled.filter((r) => r.status === "win").length;
    const losses = settled.filter((r) => r.status === "loss").length;
    const decided = wins + losses;
    const winRate = decided > 0 ? wins / decided : null;

    const openCount = await TradingExperimentRun.countDocuments({
      agentId: s.id,
      status: "open",
      ...suiteQ,
      ...LAB_RUN_USER_STRATEGY_CLAUSE,
    });

    const st = stateByAgent.get(s.id);
    const cashUsd =
      Math.round((toNum(st?.cashUsd, TRADING_EXPERIMENT_STARTING_USD) + Number.EPSILON) * 100) / 100;
    const deployedUsd = openCount * TRADING_EXPERIMENT_TRADE_NOTIONAL_USD;
    const equityUsd = computeAgentEquityUsd(cashUsd, openCount);

    agents.push({
      agentId: s.id,
      name: s.name,
      token: s.token,
      bar: s.bar,
      limit: s.limit,
      lookAheadBars: s.lookAheadBars,
      experimentGate: "experimentGate" in s ? s.experimentGate ?? null : null,
      indicatorFilter: "indicatorFilter" in s ? s.indicatorFilter ?? null : null,
      cexSource: "source" in s ? /** @type {{ source: string }} */ (s).source : null,
      wins,
      losses,
      decided,
      winRate,
      winRatePct: winRate != null ? Math.round(winRate * 1000) / 10 : null,
      openPositions: openCount,
      startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
      tradeNotionalUsd: TRADING_EXPERIMENT_TRADE_NOTIONAL_USD,
      cashUsd,
      deployedUsd,
      equityUsd,
    });
  }

  return {
    strategies,
    agents,
    suite: suiteNorm,
    simConfig: {
      startingBankUsd: TRADING_EXPERIMENT_STARTING_USD,
      tradeNotionalUsd: TRADING_EXPERIMENT_TRADE_NOTIONAL_USD,
    },
  };
}

/**
 * Paginated recent runs for a suite (newest first).
 * @param {{
 *   limit?: number;
 *   offset?: number;
 *   suite?: string;
 *   status?: string;
 *   agentId?: number;
 *   symbol?: string;
 *   signal?: string;
 * }} [opts]
 */
export async function listRecentRuns(opts = {}) {
  const limit = Math.min(200, Math.max(1, Number(opts.limit) || 50));
  const offset = Math.max(0, Number(opts.offset) || 0);
  const rawSuite = typeof opts.suite === "string" ? opts.suite.trim().toLowerCase() : "";
  const suiteNorm =
    rawSuite === "all" || rawSuite === "lab_all" || rawSuite === "merged"
      ? LIST_RUNS_ALL_STANDARD_LAB
      : normalizeSuite(opts.suite);
  const filter = buildListRunsFilter(suiteNorm, {
    status: opts.status,
    agentId: opts.agentId,
    symbol: opts.symbol,
    signal: opts.signal,
  });
  const [runs, total] = await Promise.all([
    TradingExperimentRun.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    TradingExperimentRun.countDocuments(filter),
  ]);
  return { runs, total };
}
