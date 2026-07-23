/**
 * New-Pair Alpha Sniper paper lab — pumpfun scout + RugCheck gates + adaptive exits.
 */
import SniperState from '../models/SniperState.js';
import SniperRun from '../models/SniperRun.js';
import SniperAgentState from '../models/SniperAgentState.js';
import { SNIPER_DEFAULTS } from '../config/sniperStrategies.js';
import { resolveSniperStrategies } from './sniperStrategyResolve.js';
import { aggregateStrategyStats, newCohortId, toNum, clamp } from './earnExperimentKit.js';

/** In-memory rugged cooldown by mint. */
const ruggedCooldowns = new Map();

async function fetchScoutCandidates() {
  try {
    const { getPumpfunScout, parsePumpfunScoutParams } = await import('./pumpfunScoutService.js');
    const params =
      typeof parsePumpfunScoutParams === 'function'
        ? parsePumpfunScoutParams({ query: { segment: 'alpha', limit: '20' } })
        : { segment: 'alpha', period: '1h', limit: 20, minPumpScore: 0, llm: false };
    const scout = await getPumpfunScout(params).catch(() => null);
    const rows =
      scout?.items ||
      scout?.tokens ||
      scout?.alphaTokens ||
      scout?.data?.items ||
      (Array.isArray(scout) ? scout : []);
    return (Array.isArray(rows) ? rows : []).slice(0, 30).map((t) => ({
      mint: String(t.mint || t.address || t.tokenAddress || ''),
      symbol: String(t.symbol || t.ticker || 'UNK').slice(0, 16),
      mcapUsd: toNum(t.marketCapUsd ?? t.mcap ?? t.marketCap, 0),
      liqUsd: toNum(t.liquidityUsd ?? t.liquidity ?? t.liq, 0),
      priceUsd: toNum(t.priceUsd ?? t.price, 0),
      syraAlphaScore: toNum(t.syraAlphaScore ?? t.alphaScore ?? t.pumpScore ?? t.score, 0),
      graduated: Boolean(t.graduated || t.isGraduated || t.raydium),
      smartMoney: Boolean(t.smartWalletsPresent || t.smartMoney),
    })).filter((t) => t.mint);
  } catch {
    return [];
  }
}

async function rugcheckPass(mint) {
  try {
    const { fetchRugcheckReport } = await import('./rugcheckService.js');
    const report = await fetchRugcheckReport({ mint });
    const score = toNum(report?.score ?? report?.data?.score, 0);
    const risks = report?.risks || report?.data?.risks || [];
    const dangerous = Array.isArray(risks)
      ? risks.some((r) => /rug|honeypot|mint.?auth|freeze/i.test(String(r?.name || r?.level || r)))
      : false;
    return { pass: score >= 1 && !dangerous, score, dangerous };
  } catch {
    // Fail closed when RugCheck unavailable
    return { pass: false, score: 0, dangerous: true };
  }
}

export async function ensureSniperBootstrapped() {
  let state = await SniperState.findById('singleton').lean();
  if (!state) {
    const experimentId = newCohortId('snp');
    await SniperState.findByIdAndUpdate(
      'singleton',
      {
        _id: 'singleton',
        activeExperimentId: experimentId,
        title: 'New-Pair Alpha Sniper paper lab',
        startedAt: new Date(),
        simConfig: { ...SNIPER_DEFAULTS },
      },
      { upsert: true },
    );
    state = await SniperState.findById('singleton').lean();
  }
  const strategies = await resolveSniperStrategies();
  const bank = toNum(state.simConfig?.startingBankSol, SNIPER_DEFAULTS.startingBankSol);
  for (const s of strategies) {
    await SniperAgentState.updateOne(
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

export async function getSniperLabState() {
  const state = await ensureSniperBootstrapped();
  return {
    activeExperimentId: state.activeExperimentId,
    title: state.title,
    startedAt: state.startedAt,
    simConfig: state.simConfig,
  };
}

export async function getSniperStats() {
  const state = await ensureSniperBootstrapped();
  const strategies = await resolveSniperStrategies();
  const stats = await aggregateStrategyStats(SniperRun, state.activeExperimentId);
  const byId = new Map(stats.map((s) => [s.strategyId, s]));
  return {
    experimentId: state.activeExperimentId,
    agents: strategies.map((s) => ({
      strategyId: s.id,
      strategyName: s.name,
      minAlphaScore: s.minAlphaScore,
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

export async function listSniperRuns({ limit = 50, offset = 0, status } = {}) {
  const state = await ensureSniperBootstrapped();
  const q = { experimentId: state.activeExperimentId };
  if (status) q.status = status;
  const [rows, total] = await Promise.all([
    SniperRun.find(q).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    SniperRun.countDocuments(q),
  ]);
  return { rows, total, experimentId: state.activeExperimentId };
}

export async function listSniperStrategies() {
  return resolveSniperStrategies();
}

export async function runSniperSignalCycle() {
  const state = await ensureSniperBootstrapped();
  const experimentId = state.activeExperimentId;
  const cfg = { ...SNIPER_DEFAULTS, ...(state.simConfig || {}) };
  const candidates = await fetchScoutCandidates();
  const strategies = await resolveSniperStrategies();
  const opened = [];
  const skipped = [];
  const solPriceUsd = 150;

  if (!candidates.length) {
    return { opened: 0, skipped: strategies.length, openedRows: [], skippedRows: [{ reason: 'no_scout_candidates' }] };
  }

  for (const strategy of strategies) {
    const openCount = await SniperRun.countDocuments({
      experimentId,
      strategyId: strategy.id,
      status: 'open',
    });
    if (openCount >= toNum(cfg.maxConcurrentPositions, 5)) {
      skipped.push({ strategyId: strategy.id, reason: 'max_concurrent' });
      continue;
    }
    const ledger = await SniperAgentState.findOne({
      experimentId,
      strategyId: strategy.id,
    }).lean();
    const cash = toNum(ledger?.cashSol, cfg.startingBankSol);
    const size = Math.min(toNum(cfg.maxPositionSol, 0.5), cash * 0.25);
    if (size < SNIPER_DEFAULTS.minTradeSol) {
      skipped.push({ strategyId: strategy.id, reason: 'insufficient_cash' });
      continue;
    }

    let picked = null;
    for (const c of candidates) {
      if (ruggedCooldowns.has(c.mint) && ruggedCooldowns.get(c.mint) > Date.now()) continue;
      if (c.syraAlphaScore < toNum(strategy.minAlphaScore, 70)) continue;
      if (c.mcapUsd > 0 && c.mcapUsd > toNum(strategy.maxMcapUsd, 3e6)) continue;
      if (c.liqUsd > 0 && c.liqUsd < toNum(strategy.minLiqUsd, 20_000)) continue;
      if (strategy.requireGraduated && !c.graduated) continue;
      if (strategy.requireSmartMoney && !c.smartMoney) continue;
      if (strategy.requireRugcheckPass !== false) {
        const rug = await rugcheckPass(c.mint);
        if (!rug.pass) {
          if (rug.dangerous) ruggedCooldowns.set(c.mint, Date.now() + 6 * 3600_000);
          continue;
        }
        c.rugcheckScore = rug.score;
      }
      const dup = await SniperRun.findOne({
        experimentId,
        strategyId: strategy.id,
        mint: c.mint,
        status: 'open',
      }).lean();
      if (dup) continue;
      picked = c;
      break;
    }
    if (!picked) {
      skipped.push({ strategyId: strategy.id, reason: 'no_qualified_pair' });
      continue;
    }

    const entryPx = picked.priceUsd > 0 ? picked.priceUsd : 0.00001;
    await SniperRun.create({
      experimentId,
      strategyId: strategy.id,
      strategyName: strategy.name,
      mint: picked.mint,
      symbol: picked.symbol,
      entryPriceUsd: entryPx,
      notionalSol: size,
      notionalUsd: size * solPriceUsd,
      syraAlphaScore: picked.syraAlphaScore,
      rugcheckScore: picked.rugcheckScore ?? null,
      signalSnapshot: picked,
      status: 'open',
      peakPnlPct: 0,
      openedAt: new Date(),
      lastEvaluatedAt: new Date(),
    });
    await SniperAgentState.updateOne(
      { experimentId, strategyId: strategy.id },
      { $inc: { cashSol: -size } },
    );
    opened.push({ strategyId: strategy.id, mint: picked.mint, symbol: picked.symbol });
  }

  return { opened: opened.length, skipped: skipped.length, openedRows: opened, skippedRows: skipped };
}

export async function resolveOpenSniperRuns() {
  const state = await ensureSniperBootstrapped();
  const experimentId = state.activeExperimentId;
  const open = await SniperRun.find({ experimentId, status: 'open' }).lean();
  const strategies = await resolveSniperStrategies();
  const byId = new Map(strategies.map((s) => [s.id, s]));
  let resolved = 0;
  const solPriceUsd = 150;

  // Refresh scout prices for open mints
  const candidates = await fetchScoutCandidates();
  const priceByMint = new Map(candidates.map((c) => [c.mint, c.priceUsd]));

  for (const run of open) {
    const strategy = byId.get(run.strategyId);
    const exit = strategy?.exit || { stopLossPct: -15, takeProfitPct: 30 };
    const px = priceByMint.get(run.mint) || 0;
    // If price missing, use random-walk paper sim around entry for lab progress
    const simPx =
      px > 0
        ? px
        : run.entryPriceUsd * (1 + (Math.random() - 0.48) * 0.1);
    const pnlPct = ((simPx - run.entryPriceUsd) / run.entryPriceUsd) * 100;
    const peak = Math.max(toNum(run.peakPnlPct, 0), pnlPct);
    const holdMin = (Date.now() - new Date(run.openedAt).getTime()) / 60_000;

    let status = null;
    let resolution = null;
    if (pnlPct <= toNum(exit.stopLossPct, -15)) {
      status = 'loss';
      resolution = 'stop_loss';
      if (pnlPct <= -40) ruggedCooldowns.set(run.mint, Date.now() + 12 * 3600_000);
    } else if (pnlPct >= toNum(exit.takeProfitPct, 30)) {
      status = 'win';
      resolution = 'take_profit';
    } else if (
      peak >= toNum(exit.trailingTriggerPct, 12) &&
      pnlPct <= peak - toNum(exit.trailingGivebackPct, 6)
    ) {
      status = pnlPct >= 0 ? 'win' : 'loss';
      resolution = 'trailing_stop';
    } else if (holdMin >= toNum(strategy?.maxHoldMinutes, 90)) {
      status = pnlPct >= 0 ? 'win' : 'expired';
      resolution = 'time_expiry';
    }

    if (!status) {
      await SniperRun.updateOne(
        { _id: run._id },
        { $set: { lastEvaluatedAt: new Date(), simPnlPct: pnlPct, peakPnlPct: peak } },
      );
      continue;
    }

    const pnlSol = (toNum(run.notionalSol, 0) * pnlPct) / 100;
    const pnlUsd = pnlSol * solPriceUsd;
    await SniperRun.updateOne(
      { _id: run._id },
      {
        $set: {
          status,
          resolution,
          simPnlPct: pnlPct,
          simPnlSol: pnlSol,
          simPnlUsd: pnlUsd,
          peakPnlPct: peak,
          resolvedAt: new Date(),
          lastEvaluatedAt: new Date(),
        },
      },
    );
    await SniperAgentState.updateOne(
      { experimentId, strategyId: run.strategyId },
      { $inc: { cashSol: toNum(run.notionalSol, 0) + pnlSol } },
    );
    resolved += 1;
  }
  return { resolved };
}

export async function resetSniperFromScratch() {
  const experimentId = newCohortId('snp');
  await SniperState.findByIdAndUpdate(
    'singleton',
    {
      activeExperimentId: experimentId,
      title: 'New-Pair Alpha Sniper paper lab',
      startedAt: new Date(),
      simConfig: { ...SNIPER_DEFAULTS },
    },
    { upsert: true },
  );
  await SniperAgentState.deleteMany({});
  await ensureSniperBootstrapped();
  return { experimentId };
}

export { ruggedCooldowns };
