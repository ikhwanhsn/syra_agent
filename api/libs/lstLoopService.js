/**
 * Leveraged LST Loop paper lab — simulate LST staking APY vs Rise borrow cost.
 */
import LstLoopState from '../models/LstLoopState.js';
import LstLoopRun from '../models/LstLoopRun.js';
import LstLoopAgentState from '../models/LstLoopAgentState.js';
import { LST_LOOP_DEFAULTS } from '../config/lstLoopStrategies.js';
import { resolveLstLoopStrategies } from './lstLoopStrategyResolve.js';
import { aggregateStrategyStats, newCohortId, toNum, clamp } from './earnExperimentKit.js';
import { riseGetMarkets, hasRiseConfig } from './riseClient.js';

/** Fallback APYs when live fetch fails. */
const DEFAULT_LST_APY = { mSOL: 0.078, JitoSOL: 0.082 };
const DEFAULT_BORROW_APR = 0.06;

async function fetchMarketRates() {
  let borrowApr = DEFAULT_BORROW_APR;
  if (hasRiseConfig()) {
    try {
      const res = await riseGetMarkets({ limit: 20 });
      const markets = res?.data?.markets || res?.data?.data || res?.data || [];
      const arr = Array.isArray(markets) ? markets : [];
      const solish = arr.find(
        (m) =>
          /sol/i.test(String(m.symbol || m.name || m.asset || '')) ||
          /So1111/.test(String(m.mint || m.address || '')),
      );
      const rate = toNum(
        solish?.borrowApr ?? solish?.borrow_apy ?? solish?.variableBorrowRate,
        0,
      );
      if (rate > 0) borrowApr = rate > 1 ? rate / 100 : rate;
    } catch {
      /* keep default */
    }
  }
  return {
    borrowApr,
    lstApy: { ...DEFAULT_LST_APY },
  };
}

function pickLst(strategy, rates) {
  if (strategy.lstSymbol && strategy.lstSymbol !== 'auto') return strategy.lstSymbol;
  const m = rates.lstApy.mSOL - rates.borrowApr * (strategy.targetLtv || 0.5);
  const j = rates.lstApy.JitoSOL - rates.borrowApr * (strategy.targetLtv || 0.5);
  return j >= m ? 'JitoSOL' : 'mSOL';
}

function netApr(lstApy, borrowApr, leverage, ltv) {
  // Approx: earn lstApy on full exposure, pay borrowApr on borrowed portion
  const borrowedFrac = Math.max(0, 1 - 1 / Math.max(leverage, 1));
  return lstApy * leverage - borrowApr * borrowedFrac * leverage * (ltv || 0.5) * 2;
}

export async function ensureLstLoopBootstrapped() {
  let state = await LstLoopState.findById('singleton').lean();
  if (!state) {
    const experimentId = newCohortId('lst');
    await LstLoopState.findByIdAndUpdate(
      'singleton',
      {
        _id: 'singleton',
        activeExperimentId: experimentId,
        title: 'Leveraged LST Loop paper lab',
        startedAt: new Date(),
        simConfig: { ...LST_LOOP_DEFAULTS },
      },
      { upsert: true },
    );
    state = await LstLoopState.findById('singleton').lean();
  }
  const strategies = await resolveLstLoopStrategies();
  const bank = toNum(state.simConfig?.startingBankSol, LST_LOOP_DEFAULTS.startingBankSol);
  for (const s of strategies) {
    await LstLoopAgentState.updateOne(
      { experimentId: state.activeExperimentId, strategyId: s.id },
      {
        $setOnInsert: {
          experimentId: state.activeExperimentId,
          strategyId: s.id,
          cashSol: bank,
          startingBankSol: bank,
        },
      },
      { upsert: true },
    );
  }
  return state;
}

export async function getLstLoopLabState() {
  const state = await ensureLstLoopBootstrapped();
  return {
    activeExperimentId: state.activeExperimentId,
    title: state.title,
    startedAt: state.startedAt,
    simConfig: state.simConfig,
  };
}

export async function getLstLoopStats() {
  const state = await ensureLstLoopBootstrapped();
  const strategies = await resolveLstLoopStrategies();
  // Map simPnlUsd field — LstLoopRun uses simPnlUsd / simPnlSol
  const stats = await aggregateStrategyStats(LstLoopRun, state.activeExperimentId);
  const byId = new Map(stats.map((s) => [s.strategyId, s]));
  return {
    experimentId: state.activeExperimentId,
    agents: strategies.map((s) => ({
      strategyId: s.id,
      strategyName: s.name,
      lstSymbol: s.lstSymbol,
      targetLeverage: s.targetLeverage,
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

export async function listLstLoopRuns({ limit = 50, offset = 0, status } = {}) {
  const state = await ensureLstLoopBootstrapped();
  const q = { experimentId: state.activeExperimentId };
  if (status) q.status = status;
  const [rows, total] = await Promise.all([
    LstLoopRun.find(q).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    LstLoopRun.countDocuments(q),
  ]);
  return { rows, total, experimentId: state.activeExperimentId };
}

export async function listLstLoopStrategies() {
  return resolveLstLoopStrategies();
}

export async function runLstLoopSignalCycle() {
  const state = await ensureLstLoopBootstrapped();
  const experimentId = state.activeExperimentId;
  const rates = await fetchMarketRates();
  const strategies = await resolveLstLoopStrategies();
  const opened = [];
  const skipped = [];
  const solPriceUsd = 150;

  for (const strategy of strategies) {
    const openCount = await LstLoopRun.countDocuments({
      experimentId,
      strategyId: strategy.id,
      status: 'open',
    });
    if (openCount >= 1) {
      skipped.push({ strategyId: strategy.id, reason: 'already_looped' });
      continue;
    }
    if (rates.borrowApr > toNum(strategy.maxBorrowRateApr, 0.18)) {
      skipped.push({ strategyId: strategy.id, reason: 'borrow_rate_too_high' });
      continue;
    }
    const ledger = await LstLoopAgentState.findOne({
      experimentId,
      strategyId: strategy.id,
    }).lean();
    const cash = toNum(ledger?.cashSol, LST_LOOP_DEFAULTS.startingBankSol);
    if (cash < 0.5) {
      skipped.push({ strategyId: strategy.id, reason: 'insufficient_cash' });
      continue;
    }
    const lstSymbol = pickLst(strategy, rates);
    const lstApy = rates.lstApy[lstSymbol] || 0.08;
    const leverage = toNum(strategy.targetLeverage, 2);
    const ltv = toNum(strategy.targetLtv, 0.5);
    const apr = netApr(lstApy, rates.borrowApr, leverage, ltv);
    if (apr <= 0.01) {
      skipped.push({ strategyId: strategy.id, reason: 'negative_net_apr' });
      continue;
    }
    const notionalSol = cash * 0.9;
    const healthFactor = clamp(1 / Math.max(ltv, 0.1), 1.1, 3);

    await LstLoopRun.create({
      experimentId,
      strategyId: strategy.id,
      strategyName: strategy.name,
      lstSymbol,
      leverage,
      entryLtv: ltv,
      notionalSol,
      healthFactor,
      borrowRateApr: rates.borrowApr,
      lstApy,
      signalSnapshot: { apr, lstApy, borrowApr: rates.borrowApr, leverage, ltv },
      status: 'open',
      openedAt: new Date(),
      lastEvaluatedAt: new Date(),
    });
    await LstLoopAgentState.updateOne(
      { experimentId, strategyId: strategy.id },
      { $inc: { cashSol: -notionalSol } },
    );
    opened.push({ strategyId: strategy.id, lstSymbol, notionalSol, apr });
  }

  return { opened: opened.length, skipped: skipped.length, openedRows: opened, skippedRows: skipped, solPriceUsd };
}

export async function resolveOpenLstLoopRuns() {
  const state = await ensureLstLoopBootstrapped();
  const experimentId = state.activeExperimentId;
  const open = await LstLoopRun.find({ experimentId, status: 'open' }).lean();
  const rates = await fetchMarketRates();
  const strategies = await resolveLstLoopStrategies();
  const byId = new Map(strategies.map((s) => [s.id, s]));
  let resolved = 0;
  const solPriceUsd = 150;

  for (const run of open) {
    const strategy = byId.get(run.strategyId);
    const holdH = (Date.now() - new Date(run.openedAt).getTime()) / 3_600_000;
    const lstApy = rates.lstApy[run.lstSymbol] || toNum(run.lstApy, 0.08);
    const borrowApr = rates.borrowApr;
    const apr = netApr(lstApy, borrowApr, toNum(run.leverage, 2), toNum(run.entryLtv, 0.5));
    // Accrue PnL over hold period
    const pnlPct = (apr * holdH) / 24 / 365 * 100 * 365; // simplify: apr * days
    const days = holdH / 24;
    const realizedPct = apr * days * 100;

    let status = null;
    let resolution = null;
    const health = 1 / Math.max(toNum(run.entryLtv, 0.5), 0.1);
    if (health < toNum(strategy?.minHealthFactor, 1.3) || borrowApr > toNum(strategy?.maxBorrowRateApr, 0.18)) {
      status = realizedPct >= 0 ? 'win' : 'loss';
      resolution = 'deleverage';
    } else if (days >= 1) {
      // Resolve daily for paper feedback
      status = realizedPct >= 0 ? 'win' : 'loss';
      resolution = 'daily_mark';
    }
    if (!status) {
      await LstLoopRun.updateOne(
        { _id: run._id },
        { $set: { lastEvaluatedAt: new Date(), simPnlPct: realizedPct, borrowRateApr: borrowApr, lstApy } },
      );
      continue;
    }
    const pnlSol = (toNum(run.notionalSol, 0) * realizedPct) / 100;
    const pnlUsd = pnlSol * solPriceUsd;
    await LstLoopRun.updateOne(
      { _id: run._id },
      {
        $set: {
          status,
          resolution,
          simPnlPct: realizedPct,
          simPnlSol: pnlSol,
          simPnlUsd: pnlUsd,
          resolvedAt: new Date(),
          lastEvaluatedAt: new Date(),
        },
      },
    );
    await LstLoopAgentState.updateOne(
      { experimentId, strategyId: run.strategyId },
      { $inc: { cashSol: toNum(run.notionalSol, 0) + pnlSol } },
    );
    resolved += 1;
  }
  return { resolved };
}

export async function resetLstLoopFromScratch() {
  const experimentId = newCohortId('lst');
  await LstLoopState.findByIdAndUpdate(
    'singleton',
    {
      activeExperimentId: experimentId,
      title: 'Leveraged LST Loop paper lab',
      startedAt: new Date(),
      simConfig: { ...LST_LOOP_DEFAULTS },
    },
    { upsert: true },
  );
  await LstLoopAgentState.deleteMany({});
  await ensureLstLoopBootstrapped();
  return { experimentId };
}
