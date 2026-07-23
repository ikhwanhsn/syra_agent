/**
 * Momentum Rotator paper lab — Jupiter-priced majors, trend/momentum signals.
 */
import MomentumRotatorState from '../models/MomentumRotatorState.js';
import MomentumRotatorRun from '../models/MomentumRotatorRun.js';
import MomentumRotatorAgentState from '../models/MomentumRotatorAgentState.js';
import {
  MOMENTUM_DEFAULTS,
  MOMENTUM_UNIVERSE,
} from '../config/momentumRotatorStrategies.js';
import { resolveMomentumStrategies } from './momentumRotatorStrategyResolve.js';
import { aggregateStrategyStats, newCohortId, toNum, clamp } from './earnExperimentKit.js';
import { fetchJupiterQuoteRaw, EARN_MINTS } from './jupiterBrokerSwap.js';

function gatePass(strategy, signal) {
  const gate = strategy.signalGate;
  if (!gate) return true;
  const check = (rule) => {
    const v = toNum(signal[rule.field.replace(/_([a-z])/g, (_, c) => c.toUpperCase())]
      ?? signal[rule.field]
      ?? signal[camel(rule.field)], 0);
    if (rule.op === 'gte') return v >= rule.value;
    if (rule.op === 'lte') return v <= rule.value;
    return true;
  };
  const allOk = !gate.all || gate.all.every(check);
  const anyOk = !gate.any || gate.any.some(check);
  return allOk && anyOk;
}

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

async function fetchUniversePrices() {
  const out = {};
  const usdc = EARN_MINTS.USDC;
  for (const u of MOMENTUM_UNIVERSE) {
    try {
      // Quote 1 USDC worth → token amount, invert for USD price of 1 token unit
      const amount = u.mint === EARN_MINTS.SOL ? String(100_000_000) : String(1_000_000); // 0.1 SOL or 1 unit
      if (u.mint === EARN_MINTS.SOL) {
        const q = await fetchJupiterQuoteRaw({
          inputMint: EARN_MINTS.SOL,
          outputMint: usdc,
          amountRaw: '100000000',
          slippageBps: 50,
        });
        const outUsdc = toNum(q?.outAmount, 0) / 1e6;
        out[u.symbol] = { priceUsd: outUsdc / 0.1, mint: u.mint };
      } else {
        const q = await fetchJupiterQuoteRaw({
          inputMint: u.mint,
          outputMint: usdc,
          amountRaw: amount,
          slippageBps: 50,
        });
        const outUsdc = toNum(q?.outAmount, 0) / 1e6;
        const units = toNum(amount, 1) / 1e6;
        out[u.symbol] = { priceUsd: units > 0 ? outUsdc / units : 0, mint: u.mint };
      }
    } catch {
      out[u.symbol] = { priceUsd: 0, mint: u.mint };
    }
  }
  return out;
}

/** Synthetic momentum from short price history cache. */
const priceHist = new Map();

function buildSignals(prices) {
  const signals = [];
  for (const u of MOMENTUM_UNIVERSE) {
    const px = prices[u.symbol]?.priceUsd || 0;
    if (!(px > 0)) continue;
    const hist = priceHist.get(u.symbol) || [];
    hist.push(px);
    if (hist.length > 20) hist.shift();
    priceHist.set(u.symbol, hist);
    const ret =
      hist.length >= 3 ? (hist[hist.length - 1] - hist[0]) / hist[0] : 0;
    const vol =
      hist.length >= 4
        ? Math.sqrt(
            hist
              .slice(1)
              .map((p, i) => ((p - hist[i]) / hist[i]) ** 2)
              .reduce((a, b) => a + b, 0) / (hist.length - 1),
          )
        : 0.02;
    const momentumScore = clamp(0.5 + ret * 8, 0, 1);
    const trendScore = clamp(0.5 + ret * 5, 0, 1);
    const volatilityScore = clamp(1 - vol * 20, 0, 1);
    const volumeScore = 0.6;
    signals.push({
      symbol: u.symbol,
      mint: u.mint,
      priceUsd: px,
      momentumScore,
      trendScore,
      volatilityScore,
      volumeScore,
      momentum_score: momentumScore,
      trend_score: trendScore,
      volatility_score: volatilityScore,
      volume_score: volumeScore,
    });
  }
  return signals;
}

export async function ensureMomentumBootstrapped() {
  let state = await MomentumRotatorState.findById('singleton').lean();
  if (!state) {
    const experimentId = newCohortId('mom');
    await MomentumRotatorState.findByIdAndUpdate(
      'singleton',
      {
        _id: 'singleton',
        activeExperimentId: experimentId,
        title: 'Momentum Rotator paper lab',
        startedAt: new Date(),
        simConfig: { ...MOMENTUM_DEFAULTS },
      },
      { upsert: true },
    );
    state = await MomentumRotatorState.findById('singleton').lean();
  }
  const strategies = await resolveMomentumStrategies();
  const bank = toNum(state.simConfig?.startingBankUsd, MOMENTUM_DEFAULTS.startingBankUsd);
  for (const s of strategies) {
    await MomentumRotatorAgentState.updateOne(
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

export async function getMomentumLabState() {
  const state = await ensureMomentumBootstrapped();
  return {
    activeExperimentId: state.activeExperimentId,
    title: state.title,
    startedAt: state.startedAt,
    simConfig: state.simConfig,
  };
}

export async function getMomentumStats() {
  const state = await ensureMomentumBootstrapped();
  const strategies = await resolveMomentumStrategies();
  const stats = await aggregateStrategyStats(MomentumRotatorRun, state.activeExperimentId);
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

export async function listMomentumRuns({ limit = 50, offset = 0, status } = {}) {
  const state = await ensureMomentumBootstrapped();
  const q = { experimentId: state.activeExperimentId };
  if (status) q.status = status;
  const [rows, total] = await Promise.all([
    MomentumRotatorRun.find(q).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    MomentumRotatorRun.countDocuments(q),
  ]);
  return { rows, total, experimentId: state.activeExperimentId };
}

export async function listMomentumStrategies() {
  return resolveMomentumStrategies();
}

export async function runMomentumSignalCycle() {
  const state = await ensureMomentumBootstrapped();
  const experimentId = state.activeExperimentId;
  const cfg = { ...MOMENTUM_DEFAULTS, ...(state.simConfig || {}) };
  const prices = await fetchUniversePrices();
  const signals = buildSignals(prices);
  const signalBySym = new Map(signals.map((s) => [s.symbol, s]));
  const strategies = await resolveMomentumStrategies();
  const opened = [];
  const skipped = [];

  for (const strategy of strategies) {
    const openCount = await MomentumRotatorRun.countDocuments({
      experimentId,
      strategyId: strategy.id,
      status: 'open',
    });
    if (openCount >= cfg.maxConcurrentPositions) {
      skipped.push({ strategyId: strategy.id, reason: 'max_concurrent' });
      continue;
    }
    const ledger = await MomentumRotatorAgentState.findOne({
      experimentId,
      strategyId: strategy.id,
    }).lean();
    const cash = toNum(ledger?.cashUsd, cfg.startingBankUsd);
    const notional = cash * (toNum(cfg.maxPositionPct, 35) / 100);
    if (notional < MOMENTUM_DEFAULTS.minTradeNotionalUsd) {
      skipped.push({ strategyId: strategy.id, reason: 'insufficient_cash' });
      continue;
    }

    const allowed = strategy.universeFilter?.symbols || MOMENTUM_UNIVERSE.map((u) => u.symbol);
    const candidates = [];
    for (const sym of allowed) {
      const signal = signalBySym.get(sym);
      if (!signal || !gatePass(strategy, signal)) continue;
      candidates.push({
        ...signal,
        score: scoreSignal(strategy.signalWeights, signal),
      });
    }
    if (!candidates.length) {
      skipped.push({ strategyId: strategy.id, reason: 'no_candidates' });
      continue;
    }
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const dup = await MomentumRotatorRun.findOne({
      experimentId,
      strategyId: strategy.id,
      symbol: best.symbol,
      status: 'open',
    }).lean();
    if (dup) {
      skipped.push({ strategyId: strategy.id, reason: 'already_open' });
      continue;
    }

    await MomentumRotatorRun.create({
      experimentId,
      strategyId: strategy.id,
      strategyName: strategy.name,
      symbol: best.symbol,
      mint: best.mint,
      entryPriceUsd: best.priceUsd,
      notionalUsd: notional,
      signalSnapshot: best,
      status: 'open',
      openedAt: new Date(),
      lastEvaluatedAt: new Date(),
    });
    await MomentumRotatorAgentState.updateOne(
      { experimentId, strategyId: strategy.id },
      { $inc: { cashUsd: -notional } },
    );
    opened.push({ strategyId: strategy.id, symbol: best.symbol, notional });
  }

  return { opened: opened.length, skipped: skipped.length, openedRows: opened, skippedRows: skipped };
}

export async function resolveOpenMomentumRuns() {
  const state = await ensureMomentumBootstrapped();
  const experimentId = state.activeExperimentId;
  const open = await MomentumRotatorRun.find({ experimentId, status: 'open' }).lean();
  if (!open.length) return { resolved: 0 };
  const prices = await fetchUniversePrices();
  const strategies = await resolveMomentumStrategies();
  const byId = new Map(strategies.map((s) => [s.id, s]));
  let resolved = 0;

  for (const run of open) {
    const strategy = byId.get(run.strategyId);
    const px = prices[run.symbol]?.priceUsd || 0;
    if (!(px > 0)) continue;
    const pnlPct = ((px - run.entryPriceUsd) / run.entryPriceUsd) * 100;
    const exit = strategy?.exit || { stopLossPct: -5, takeProfitPct: 8 };
    const holdH = (Date.now() - new Date(run.openedAt).getTime()) / 3_600_000;
    let status = null;
    let resolution = null;
    if (pnlPct <= toNum(exit.stopLossPct, -5)) {
      status = 'loss';
      resolution = 'stop_loss';
    } else if (pnlPct >= toNum(exit.takeProfitPct, 8)) {
      status = 'win';
      resolution = 'take_profit';
    } else if (holdH >= toNum(strategy?.maxHoldHours, 48)) {
      status = pnlPct >= 0 ? 'win' : 'expired';
      resolution = 'time_expiry';
    }
    if (!status) {
      await MomentumRotatorRun.updateOne(
        { _id: run._id },
        { $set: { lastEvaluatedAt: new Date(), simPnlPct: pnlPct } },
      );
      continue;
    }
    const pnlUsd = (run.notionalUsd * pnlPct) / 100;
    await MomentumRotatorRun.updateOne(
      { _id: run._id },
      {
        $set: {
          status,
          resolution,
          simExitPrice: px,
          simPnlPct: pnlPct,
          simPnlUsd: pnlUsd,
          resolvedAt: new Date(),
          lastEvaluatedAt: new Date(),
        },
      },
    );
    await MomentumRotatorAgentState.updateOne(
      { experimentId, strategyId: run.strategyId },
      { $inc: { cashUsd: run.notionalUsd + pnlUsd } },
    );
    resolved += 1;
  }
  return { resolved };
}

export async function resetMomentumFromScratch() {
  const experimentId = newCohortId('mom');
  await MomentumRotatorState.findByIdAndUpdate(
    'singleton',
    {
      activeExperimentId: experimentId,
      title: 'Momentum Rotator paper lab',
      startedAt: new Date(),
      simConfig: { ...MOMENTUM_DEFAULTS },
    },
    { upsert: true },
  );
  await MomentumRotatorAgentState.deleteMany({});
  await ensureMomentumBootstrapped();
  return { experimentId };
}
