/**
 * Delphi paper lab — Polymarket smart-money bias → Jupiter-priced Solana spot.
 * Long and short are both simulated in paper. Real layer (later) executes longs only.
 */
import DelphiState from "../models/DelphiState.js";
import DelphiRun from "../models/DelphiRun.js";
import DelphiAgentState from "../models/DelphiAgentState.js";
import DelphiLesson from "../models/DelphiLesson.js";
import {
  DELPHI_ASSET_UNIVERSE,
  DELPHI_DEFAULTS,
  getDelphiAsset,
} from "../config/delphiStrategies.js";
import { resolveDelphiStrategies } from "./delphiStrategyResolve.js";
import { aggregateStrategyStats, newCohortId, toNum, clamp } from "./earnExperimentKit.js";
import { fetchJupiterQuoteRaw, EARN_MINTS } from "./jupiterBrokerSwap.js";
import { fetchPythPrices, parsePythPriceRequest } from "./pythHermesService.js";
import { fetchPolymarketTraderSignals } from "./polymarketTraderSignals.js";

const SLIPPAGE_HAIRCUT = 0.0015;

function camel(s) {
  return String(s).replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function scoreSignal(weights, signal) {
  let sum = 0;
  let wsum = 0;
  for (const [k, w] of Object.entries(weights || {})) {
    const v = toNum(signal[camel(k)] ?? signal[k], 0);
    sum += v * toNum(w, 1);
    wsum += toNum(w, 1);
  }
  return wsum > 0 ? sum / wsum : 0;
}

function directionalPnlPct(side, entryPriceUsd, markPriceUsd) {
  const entry = toNum(entryPriceUsd, 0);
  const mark = toNum(markPriceUsd, 0);
  if (!(entry > 0) || !(mark > 0)) return 0;
  const raw = ((mark - entry) / entry) * 100;
  return side === "short" ? -raw : raw;
}

function maxHoldMinutes(strategy) {
  const fromExit = toNum(strategy?.exit?.maxHoldMin, 0);
  if (fromExit > 0) return fromExit;
  const hours = toNum(strategy?.maxHoldHours, DELPHI_DEFAULTS.defaultMaxHoldMin / 60);
  return hours * 60;
}

/**
 * Entry gate: quality, consensus, sample, and |bias| vs strategy thresholds.
 *
 * @param {{ signal: Record<string, unknown>, strategy: Record<string, unknown> }} input
 */
export function evaluateDelphiOpenGate({ signal, strategy }) {
  if (!signal) return { pass: false, reason: "no_signal" };
  const sampleSize = toNum(signal.sampleSize, 0);
  const consensus = toNum(signal.consensus, 0);
  const quality = toNum(signal.traderQuality ?? signal.trader_quality, 0);
  const bias = toNum(signal.bias, 0);
  const minSample = toNum(strategy?.minSampleSize, 2);
  const minConsensus = toNum(strategy?.minConsensus, 0.55);
  const minQuality = toNum(strategy?.minTraderQuality, 0.4);
  const threshold = toNum(strategy?.biasThreshold, 0.2);
  if (sampleSize < minSample) return { pass: false, reason: "sample_size" };
  if (consensus < minConsensus) return { pass: false, reason: "consensus" };
  if (quality < minQuality) return { pass: false, reason: "trader_quality" };
  if (Math.abs(bias) < threshold) return { pass: false, reason: "bias" };
  return { pass: true, reason: null, side: bias >= 0 ? "long" : "short" };
}

/**
 * Pure resolve of an open paper run against a mark price and optional live bias.
 *
 * @param {Record<string, unknown>} run
 * @param {{ markPriceUsd: number, liveBias?: number|null, now?: Date, strategy?: Record<string, unknown> }} ctx
 */
export function evaluateDelphiRunResolution(run, ctx = {}) {
  const strategy = ctx.strategy || {};
  const exit = strategy.exit || {};
  const mark = toNum(ctx.markPriceUsd, 0);
  const entry = toNum(run.entryPriceUsd, 0);
  if (!(mark > 0) || !(entry > 0)) {
    return { close: false, reason: "no_mark", pnlPct: 0, pnlUsd: 0 };
  }
  const side = run.side === "short" ? "short" : "long";
  const pnlPct = directionalPnlPct(side, entry, mark);
  const pnlUsd = (toNum(run.notionalUsd, 0) * pnlPct) / 100;
  const openedAt = run.openedAt ? new Date(run.openedAt).getTime() : Date.now();
  const now = (ctx.now || new Date()).getTime();
  const holdMin = (now - openedAt) / 60_000;
  const stop = toNum(exit.stopLossPct, -5);
  const take = toNum(exit.takeProfitPct, 8);
  const maxHold = maxHoldMinutes(strategy);

  if (pnlPct <= stop) {
    return { close: true, status: "loss", resolution: "stop_loss", pnlPct, pnlUsd, markPriceUsd: mark };
  }
  if (pnlPct >= take) {
    return { close: true, status: "win", resolution: "take_profit", pnlPct, pnlUsd, markPriceUsd: mark };
  }
  const flipOnReversal = exit.flipOnReversal !== false;
  if (flipOnReversal && ctx.liveBias != null) {
    const live = toNum(ctx.liveBias, 0);
    const threshold = toNum(strategy.biasThreshold, 0.2);
    const flipped =
      (side === "long" && live <= -threshold) || (side === "short" && live >= threshold);
    if (flipped) {
      return {
        close: true,
        status: pnlPct >= 0 ? "win" : "loss",
        resolution: "signal_reversal",
        pnlPct,
        pnlUsd,
        markPriceUsd: mark,
      };
    }
  }
  if (holdMin >= maxHold) {
    return {
      close: true,
      status: pnlPct >= 0 ? "win" : "expired",
      resolution: "time_expiry",
      pnlPct,
      pnlUsd,
      markPriceUsd: mark,
    };
  }
  return { close: false, reason: "hold", pnlPct, pnlUsd, markPriceUsd: mark };
}

async function fetchJupiterPriceUsd(asset) {
  const usdc = EARN_MINTS.USDC;
  if (asset.mint === EARN_MINTS.SOL) {
    const q = await fetchJupiterQuoteRaw({
      inputMint: EARN_MINTS.SOL,
      outputMint: usdc,
      amountRaw: "100000000",
      slippageBps: 50,
    });
    const outUsdc = toNum(q?.outAmount, 0) / 1e6;
    return outUsdc > 0 ? outUsdc / 0.1 : 0;
  }
  const decimals = toNum(asset.decimals, 8);
  const raw = String(10 ** Math.min(decimals, 8));
  const units = toNum(raw, 1) / 10 ** decimals;
  const q = await fetchJupiterQuoteRaw({
    inputMint: asset.mint,
    outputMint: usdc,
    amountRaw: raw,
    slippageBps: 50,
  });
  const outUsdc = toNum(q?.outAmount, 0) / 1e6;
  return units > 0 ? outUsdc / units : 0;
}

async function fetchUniversePrices() {
  /** @type {Record<string, { priceUsd: number, mint: string, source: string }>} */
  const out = {};
  try {
    const parsed = parsePythPriceRequest({
      method: "GET",
      query: { symbols: DELPHI_ASSET_UNIVERSE.map((a) => a.pyth).join(",") },
    });
    const pyth = await fetchPythPrices(parsed);
    for (const row of pyth.prices || []) {
      const asset = DELPHI_ASSET_UNIVERSE.find((a) => a.pyth === row.symbol);
      if (asset && toNum(row.priceUsd, 0) > 0) {
        out[asset.symbol] = { priceUsd: row.priceUsd, mint: asset.mint, source: "pyth" };
      }
    }
  } catch {
    /* fall through to Jupiter */
  }
  for (const asset of DELPHI_ASSET_UNIVERSE) {
    if (out[asset.symbol]?.priceUsd > 0) continue;
    try {
      const px = await fetchJupiterPriceUsd(asset);
      if (px > 0) out[asset.symbol] = { priceUsd: px, mint: asset.mint, source: "jupiter" };
    } catch {
      out[asset.symbol] = { priceUsd: 0, mint: asset.mint, source: "none" };
    }
  }
  return out;
}

async function fetchFillPriceUsd(asset) {
  try {
    const px = await fetchJupiterPriceUsd(asset);
    if (px > 0) return px * (1 + SLIPPAGE_HAIRCUT);
  } catch {
    /* fall back */
  }
  return 0;
}

function toStrategySignals(assets) {
  return (assets || []).map((row) => ({
    ...row,
    trader_quality: row.traderQuality,
    sample_size: clamp(toNum(row.sampleSize, 0) / 8, 0, 1),
    absBias: Math.abs(toNum(row.bias, 0)),
  }));
}

export async function ensureDelphiBootstrapped() {
  let state = await DelphiState.findById("singleton").lean();
  if (!state) {
    const experimentId = newCohortId("delphi");
    await DelphiState.findByIdAndUpdate(
      "singleton",
      {
        _id: "singleton",
        activeExperimentId: experimentId,
        title: "Delphi Polymarket-mirror paper lab",
        startedAt: new Date(),
        simConfig: { ...DELPHI_DEFAULTS },
      },
      { upsert: true },
    );
    state = await DelphiState.findById("singleton").lean();
  }
  const strategies = await resolveDelphiStrategies();
  const bank = toNum(state.simConfig?.startingBankUsd, DELPHI_DEFAULTS.startingBankUsd);
  for (const s of strategies) {
    await DelphiAgentState.updateOne(
      { experimentId: state.activeExperimentId, strategyId: s.id },
      {
        $setOnInsert: {
          experimentId: state.activeExperimentId,
          strategyId: s.id,
          cashUsd: bank,
          startingBankUsd: bank,
        },
      },
      { upsert: true },
    );
  }
  return state;
}

export async function getDelphiLabState() {
  const state = await ensureDelphiBootstrapped();
  return {
    activeExperimentId: state.activeExperimentId,
    title: state.title,
    startedAt: state.startedAt,
    simConfig: state.simConfig,
  };
}

export async function getDelphiStats() {
  const state = await ensureDelphiBootstrapped();
  const strategies = await resolveDelphiStrategies();
  const stats = await aggregateStrategyStats(DelphiRun, state.activeExperimentId);
  const byId = new Map(stats.map((s) => [s.strategyId, s]));
  return {
    experimentId: state.activeExperimentId,
    agents: strategies.map((s) => ({
      strategyId: s.id,
      strategyName: s.name,
      ...(byId.get(s.id) || {
        wins: 0,
        losses: 0,
        expired: 0,
        decided: 0,
        openPositions: 0,
        winRate: null,
        sumPnlUsd: 0,
      }),
    })),
  };
}

export async function listDelphiRuns({ limit = 50, offset = 0, status, strategyId } = {}) {
  const state = await ensureDelphiBootstrapped();
  const q = { experimentId: state.activeExperimentId };
  if (status) q.status = status;
  if (strategyId != null) q.strategyId = Number(strategyId);
  const [rows, total] = await Promise.all([
    DelphiRun.find(q).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    DelphiRun.countDocuments(q),
  ]);
  return { rows, total, experimentId: state.activeExperimentId };
}

export async function listDelphiStrategies() {
  return resolveDelphiStrategies();
}

export async function rankDelphiStrategiesByNetPnl(experimentId) {
  const id = experimentId || (await ensureDelphiBootstrapped()).activeExperimentId;
  const stats = await aggregateStrategyStats(DelphiRun, id);
  return stats.sort((a, b) => toNum(b.sumPnlUsd) - toNum(a.sumPnlUsd));
}

export async function pickBestDelphiStrategy() {
  const stats = await getDelphiStats();
  return (
    (stats.agents || [])
      .filter((a) => toNum(a.decided) >= 3)
      .sort((a, b) => {
        const scoreA = toNum(a.leaderScore, toNum(a.sumPnlUsd));
        const scoreB = toNum(b.leaderScore, toNum(b.sumPnlUsd));
        return scoreB - scoreA;
      })[0] || null
  );
}

export async function runDelphiSignalCycle(opts = {}) {
  const state = await ensureDelphiBootstrapped();
  const experimentId = state.activeExperimentId;
  const cfg = { ...DELPHI_DEFAULTS, ...(state.simConfig || {}) };
  const allowed = DELPHI_ASSET_UNIVERSE.map((a) => a.symbol);
  const payload = await fetchPolymarketTraderSignals({
    allowedAssets: allowed,
    fetchImpl: opts.fetchImpl,
  });
  const signals = toStrategySignals(payload.assets || []);
  const signalBySym = new Map(signals.map((s) => [s.symbol, s]));
  const strategies = await resolveDelphiStrategies();
  const opened = [];
  const skipped = [];

  for (const strategy of strategies) {
    const openCount = await DelphiRun.countDocuments({
      experimentId,
      strategyId: strategy.id,
      status: "open",
    });
    if (openCount >= toNum(cfg.maxConcurrentPositions, 3)) {
      skipped.push({ strategyId: strategy.id, reason: "max_concurrent" });
      continue;
    }
    const ledger = await DelphiAgentState.findOne({
      experimentId,
      strategyId: strategy.id,
    }).lean();
    const cash = toNum(ledger?.cashUsd, cfg.startingBankUsd);
    const sizePct = toNum(strategy.sizePctOfBank, cfg.maxPositionPct);
    const notional = cash * (sizePct / 100);
    if (notional < DELPHI_DEFAULTS.minTradeNotionalUsd) {
      skipped.push({ strategyId: strategy.id, reason: "insufficient_cash" });
      continue;
    }

    const allowedSyms = strategy.universeFilter?.symbols || allowed;
    const candidates = [];
    for (const sym of allowedSyms) {
      const signal = signalBySym.get(sym);
      if (!signal) continue;
      const gate = evaluateDelphiOpenGate({ signal, strategy });
      if (!gate.pass) continue;
      const asset = getDelphiAsset(sym);
      if (!asset) continue;
      candidates.push({
        ...signal,
        mint: asset.mint,
        side: gate.side,
        score: scoreSignal(strategy.signalWeights, {
          ...signal,
          bias: Math.abs(toNum(signal.bias, 0)),
        }),
      });
    }
    if (!candidates.length) {
      skipped.push({ strategyId: strategy.id, reason: "no_candidates" });
      continue;
    }
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const dup = await DelphiRun.findOne({
      experimentId,
      strategyId: strategy.id,
      symbol: best.symbol,
      status: "open",
    }).lean();
    if (dup) {
      skipped.push({ strategyId: strategy.id, reason: "already_open" });
      continue;
    }

    const asset = getDelphiAsset(best.symbol);
    let fillPx = 0;
    if (opts.prices?.[best.symbol]?.priceUsd > 0) {
      fillPx = opts.prices[best.symbol].priceUsd * (1 + SLIPPAGE_HAIRCUT);
    } else {
      fillPx = await fetchFillPriceUsd(asset);
    }
    if (!(fillPx > 0)) {
      skipped.push({ strategyId: strategy.id, reason: "no_fill_price" });
      continue;
    }

    await DelphiRun.create({
      experimentId,
      strategyId: strategy.id,
      strategyName: strategy.name,
      symbol: best.symbol,
      mint: best.mint,
      side: best.side,
      entryPriceUsd: fillPx,
      notionalUsd: notional,
      signalSnapshot: best,
      status: "open",
      openedAt: new Date(),
      lastEvaluatedAt: new Date(),
    });
    await DelphiAgentState.updateOne(
      { experimentId, strategyId: strategy.id },
      { $inc: { cashUsd: -notional } },
    );
    opened.push({
      strategyId: strategy.id,
      symbol: best.symbol,
      side: best.side,
      notional,
    });
  }

  return {
    opened: opened.length,
    skipped: skipped.length,
    openedRows: opened,
    skippedRows: skipped,
    signalAssets: signals,
  };
}

export async function resolveOpenDelphiRuns(opts = {}) {
  const state = await ensureDelphiBootstrapped();
  const experimentId = state.activeExperimentId;
  const open = await DelphiRun.find({ experimentId, status: "open" }).lean();
  if (!open.length) return { resolved: 0 };
  const prices = opts.prices || (await fetchUniversePrices());
  const liveSignals = opts.signals || null;
  let liveBySym = new Map();
  if (liveSignals) {
    liveBySym = new Map(liveSignals.map((s) => [s.symbol, s]));
  } else {
    try {
      const payload = await fetchPolymarketTraderSignals({
        allowedAssets: DELPHI_ASSET_UNIVERSE.map((a) => a.symbol),
        fetchImpl: opts.fetchImpl,
      });
      liveBySym = new Map((payload.assets || []).map((s) => [s.symbol, s]));
    } catch {
      liveBySym = new Map();
    }
  }
  const strategies = await resolveDelphiStrategies();
  const byId = new Map(strategies.map((s) => [s.id, s]));
  let resolved = 0;

  for (const run of open) {
    const strategy = byId.get(run.strategyId);
    const px = prices[run.symbol]?.priceUsd || 0;
    const liveBias = liveBySym.get(run.symbol)?.bias;
    const verdict = evaluateDelphiRunResolution(run, {
      markPriceUsd: px,
      liveBias,
      now: opts.now || new Date(),
      strategy,
    });
    if (!verdict.close) {
      await DelphiRun.updateOne(
        { _id: run._id },
        { $set: { lastEvaluatedAt: new Date(), simPnlPct: verdict.pnlPct } },
      );
      continue;
    }
    await DelphiRun.updateOne(
      { _id: run._id },
      {
        $set: {
          status: verdict.status,
          resolution: verdict.resolution,
          simExitPrice: verdict.markPriceUsd,
          simPnlPct: verdict.pnlPct,
          simPnlUsd: verdict.pnlUsd,
          resolvedAt: new Date(),
          lastEvaluatedAt: new Date(),
        },
      },
    );
    await DelphiAgentState.updateOne(
      { experimentId, strategyId: run.strategyId },
      { $inc: { cashUsd: toNum(run.notionalUsd, 0) + toNum(verdict.pnlUsd, 0) } },
    );
    try {
      await DelphiLesson.create({
        experimentId,
        symbol: run.symbol,
        side: run.side,
        lesson: `${run.symbol} ${run.side} ${verdict.resolution} ${toNum(verdict.pnlPct).toFixed(2)}%`,
        closeReason: verdict.resolution,
        pnlUsd: verdict.pnlUsd,
        strategyId: run.strategyId,
      });
    } catch {
      /* lesson is best-effort */
    }
    resolved += 1;
  }
  return { resolved };
}

export async function resetDelphiFromScratch() {
  const experimentId = newCohortId("delphi");
  await DelphiState.findByIdAndUpdate(
    "singleton",
    {
      activeExperimentId: experimentId,
      title: "Delphi Polymarket-mirror paper lab",
      startedAt: new Date(),
      simConfig: { ...DELPHI_DEFAULTS },
    },
    { upsert: true },
  );
  await DelphiAgentState.deleteMany({});
  await ensureDelphiBootstrapped();
  return { experimentId };
}
