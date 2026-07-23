/**
 * Momentum Rotator real agent — USDC→major spot via Jupiter on invest wallet.
 */
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import MomentumRotatorRealConfig from '../models/MomentumRotatorRealConfig.js';
import MomentumRotatorRealPosition from '../models/MomentumRotatorRealPosition.js';
import { MOMENTUM_DEFAULTS, MOMENTUM_UNIVERSE } from '../config/momentumRotatorStrategies.js';
import { MOMENTUM_CRON } from '../config/onchainEarnExperiments.js';
import {
  ensureMomentumBootstrapped,
  getMomentumStats,
} from './momentumRotatorService.js';
import { resolveMomentumStrategies } from './momentumRotatorStrategyResolve.js';
import { siblingAnonymousId, purposeQuery } from './agentWalletPurpose.js';
import {
  executeJupiterBrokerSwap,
  EARN_MINTS,
  fetchJupiterQuoteRaw,
} from './jupiterBrokerSwap.js';
import { shouldTouchRealConfigMeta } from '../utils/mongoHeartbeatWrite.js';

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const USDC_DECIMALS = 6;
const PAPER_GRAD_MIN_DECIDED = 50;
const PAPER_LEADER_MIN_DECIDED = 5;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

export function isMomentumRealCronEnabled() {
  return Boolean(MOMENTUM_CRON.realEnabled);
}

async function resolveInvestWallet(anonymousId) {
  const investAid = siblingAnonymousId(anonymousId, 'invest');
  if (!investAid) throw new Error('Invalid anonymous id');
  const wallet = await AgentWallet.findOne({
    anonymousId: investAid,
    chain: 'solana',
    status: 'active',
    ...purposeQuery('invest'),
  }).lean();
  if (!wallet?.agentAddress) throw new Error('Invest wallet not provisioned for this user');
  return wallet;
}

async function resolveStrategyById(strategyId) {
  const strategies = await resolveMomentumStrategies();
  return strategies.find((s) => s.id === Number(strategyId)) || null;
}

/** Paper lab graduation: min 50 decided trades and positive sum PnL. */
export async function checkMomentumPaperGraduation() {
  const stats = await getMomentumStats();
  const totals = (stats.agents || []).reduce(
    (acc, a) => ({
      decided: acc.decided + toNum(a.decided),
      sumPnlUsd: acc.sumPnlUsd + toNum(a.sumPnlUsd),
    }),
    { decided: 0, sumPnlUsd: 0 },
  );
  const pass = totals.decided >= PAPER_GRAD_MIN_DECIDED && totals.sumPnlUsd > 0;
  return {
    pass,
    decided: totals.decided,
    sumPnlUsd: totals.sumPnlUsd,
    reason: pass ? null : `need_${PAPER_GRAD_MIN_DECIDED}_decided_positive_pnl`,
  };
}

function pickBestPaperStrategy(agents) {
  return (agents || [])
    .filter((a) => toNum(a.decided) >= PAPER_LEADER_MIN_DECIDED)
    .sort((a, b) => {
      const scoreA = toNum(a.leaderScore, toNum(a.sumPnlUsd));
      const scoreB = toNum(b.leaderScore, toNum(b.sumPnlUsd));
      return scoreB - scoreA;
    })[0] || null;
}

async function fetchMintPriceUsd(mint, symbol) {
  if (mint === EARN_MINTS.SOL || symbol === 'SOL') {
    const q = await fetchJupiterQuoteRaw({
      inputMint: EARN_MINTS.SOL,
      outputMint: EARN_MINTS.USDC,
      amountRaw: String(Math.floor(0.1 * LAMPORTS_PER_SOL)),
      slippageBps: 50,
    });
    const outUsdc = toNum(q?.outAmount, 0) / 1e6;
    return outUsdc / 0.1;
  }
  const q = await fetchJupiterQuoteRaw({
    inputMint: mint,
    outputMint: EARN_MINTS.USDC,
    amountRaw: '1000000',
    slippageBps: 50,
  });
  return toNum(q?.outAmount, 0) / 1e6;
}

async function getOrCreateConfigForWallet(wallet) {
  const state = await ensureMomentumBootstrapped();
  const investAid = wallet.anonymousId;
  let cfg = await MomentumRotatorRealConfig.findById(wallet.agentAddress);
  if (!cfg) {
    cfg = await MomentumRotatorRealConfig.create({
      _id: wallet.agentAddress,
      agentAddress: wallet.agentAddress,
      anonymousId: investAid,
      experimentId: state.activeExperimentId,
      enabled: false,
    });
  } else if (cfg.experimentId !== state.activeExperimentId) {
    cfg.experimentId = state.activeExperimentId;
    await cfg.save();
  }
  return cfg;
}

export async function getMomentumRealState({ viewerAnonymousId } = {}) {
  let config = null;
  let canEnable = false;
  const graduation = await checkMomentumPaperGraduation();

  if (viewerAnonymousId) {
    try {
      const wallet = await resolveInvestWallet(viewerAnonymousId);
      config = await getOrCreateConfigForWallet(wallet);
      canEnable = true;
    } catch {
      config = null;
    }
  }

  const agentFilter = config?.agentAddress ? { agentAddress: config.agentAddress } : {};
  const [openPositions, closedAgg] = await Promise.all([
    MomentumRotatorRealPosition.countDocuments({
      ...agentFilter,
      status: { $in: ['open', 'opening', 'closing'] },
    }),
    MomentumRotatorRealPosition.aggregate([
      {
        $match: {
          ...agentFilter,
          status: { $in: ['closed_win', 'closed_loss', 'expired'] },
        },
      },
      {
        $group: {
          _id: null,
          realizedPnlUsd: { $sum: { $ifNull: ['$realNetPnlUsd', 0] } },
          wins: { $sum: { $cond: [{ $eq: ['$status', 'closed_win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$status', 'closed_loss'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const realizedPnlUsd = toNum(closedAgg[0]?.realizedPnlUsd);
  const wins = toNum(closedAgg[0]?.wins);
  const losses = toNum(closedAgg[0]?.losses);
  const decided = wins + losses;

  return {
    enabled: Boolean(config?.enabled),
    experimentId: config?.experimentId || null,
    agentAddress: config?.agentAddress || null,
    currentStrategyId: config?.currentStrategyId ?? null,
    maxPositionUsd: config?.maxPositionUsd ?? MOMENTUM_DEFAULTS.minTradeNotionalUsd,
    maxConcurrentPositions: config?.maxConcurrentPositions ?? 3,
    publicEarnListed: Boolean(config?.publicEarnListed),
    depositsPaused: Boolean(config?.depositsPaused),
    lastSignalAt: config?.lastSignalAt?.toISOString?.() ?? null,
    lastResolveAt: config?.lastResolveAt?.toISOString?.() ?? null,
    lastError: config?.lastError ?? null,
    closeAllRequested: Boolean(config?.closeAllRequested),
    openPositions,
    realizedNetPnlUsd: realizedPnlUsd,
    realWinRate: decided > 0 ? wins / decided : null,
    realWins: wins,
    realLosses: losses,
    canEnable,
    cronEnabled: isMomentumRealCronEnabled(),
    paperGraduation: graduation,
    onchain: { venue: 'Solana', execution: 'Jupiter', denom: 'USDC' },
  };
}

export async function listMomentumRealPositions({
  limit,
  offset,
  status,
  agentAddress,
} = {}) {
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  const filter = {};
  if (status) filter.status = status;
  if (agentAddress) filter.agentAddress = agentAddress;
  const [positions, total] = await Promise.all([
    MomentumRotatorRealPosition.find(filter).sort({ openedAt: -1 }).skip(off).limit(lim).lean(),
    MomentumRotatorRealPosition.countDocuments(filter),
  ]);
  return { positions, total };
}

export async function enableMomentumReal({
  anonymousId,
  enabledBy,
  maxPositionUsd,
  requireGraduation = false,
}) {
  if (!anonymousId) throw new Error('anonymousId required');
  const graduation = await checkMomentumPaperGraduation();
  if (requireGraduation && !graduation.pass) {
    throw new Error(`paper_graduation_blocked:${graduation.reason}`);
  }
  const wallet = await resolveInvestWallet(anonymousId);
  const investAid = siblingAnonymousId(anonymousId, 'invest');
  const cfg = await getOrCreateConfigForWallet(wallet);
  const stats = await getMomentumStats();
  const best = pickBestPaperStrategy(stats.agents);

  cfg.enabled = true;
  cfg.startedAt = cfg.startedAt ?? new Date();
  cfg.anonymousId = investAid;
  cfg.currentStrategyId = best?.strategyId ?? cfg.currentStrategyId ?? 0;
  if (maxPositionUsd != null && Number.isFinite(Number(maxPositionUsd))) {
    cfg.maxPositionUsd = Math.max(10, Number(maxPositionUsd));
  }
  cfg.lastError = graduation.pass ? null : `soft_warn:${graduation.reason}`;
  cfg.closeAllRequested = false;
  await cfg.save();
  return getMomentumRealState({ viewerAnonymousId: anonymousId });
}

export async function disableMomentumReal({ anonymousId, closeAll = true }) {
  const wallet = await resolveInvestWallet(anonymousId);
  await MomentumRotatorRealConfig.updateOne(
    { _id: wallet.agentAddress },
    { $set: { enabled: false, closeAllRequested: Boolean(closeAll) } },
  );
  return getMomentumRealState({ viewerAnonymousId: anonymousId });
}

async function pickEntryCandidate(strategy) {
  const allowed = strategy?.universeFilter?.symbols || MOMENTUM_UNIVERSE.map((u) => u.symbol);
  const candidates = [];
  for (const u of MOMENTUM_UNIVERSE) {
    if (!allowed.includes(u.symbol)) continue;
    try {
      const priceUsd = await fetchMintPriceUsd(u.mint, u.symbol);
      if (priceUsd > 0) candidates.push({ symbol: u.symbol, mint: u.mint, priceUsd });
    } catch {
      /* skip */
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.priceUsd - a.priceUsd);
  return candidates[0];
}

async function runSignalForConfig(cfg) {
  if (!cfg.enabled || cfg.depositsPaused) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'disabled_or_paused' };
  }
  const openCount = await MomentumRotatorRealPosition.countDocuments({
    agentAddress: cfg.agentAddress,
    status: { $in: ['open', 'opening', 'closing'] },
  });
  if (openCount >= toNum(cfg.maxConcurrentPositions, 3)) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'max_concurrent' };
  }

  const stats = await getMomentumStats();
  const best = pickBestPaperStrategy(stats.agents);
  if (!best) {
    if (shouldTouchRealConfigMeta(cfg, 'no_qualified_leader', 'signal')) {
      await MomentumRotatorRealConfig.updateOne(
        { _id: cfg._id },
        { $set: { lastSignalAt: new Date(), lastError: 'no_qualified_leader' } },
      );
    }
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'no_qualified_leader' };
  }

  const strategy = await resolveStrategyById(best.strategyId);
  if (!strategy) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'invalid_strategy' };
  }

  if (cfg.currentStrategyId !== best.strategyId) {
    await MomentumRotatorRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { currentStrategyId: best.strategyId } },
    );
  }

  const candidate = await pickEntryCandidate(strategy);
  if (!candidate) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'no_price_candidate' };
  }

  const dup = await MomentumRotatorRealPosition.findOne({
    agentAddress: cfg.agentAddress,
    mint: candidate.mint,
    status: { $in: ['open', 'opening', 'closing'] },
  }).lean();
  if (dup) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'already_open_mint' };
  }

  const notionalUsd = Math.min(toNum(cfg.maxPositionUsd, 50), toNum(cfg.publicMaxDepositUsd, 250));
  const usdcRaw = BigInt(Math.max(0, Math.floor(notionalUsd * 10 ** USDC_DECIMALS)));
  if (usdcRaw <= 0n) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'zero_notional' };
  }

  const position = await MomentumRotatorRealPosition.create({
    experimentId: cfg.experimentId,
    agentAddress: cfg.agentAddress,
    anonymousId: cfg.anonymousId,
    strategyId: strategy.id,
    strategyName: strategy.name,
    symbol: candidate.symbol,
    mint: candidate.mint,
    entryPriceUsd: candidate.priceUsd,
    notionalUsd,
    signalSnapshot: candidate,
    status: 'opening',
    openedAt: new Date(),
  });

  try {
    const swap = await executeJupiterBrokerSwap({
      anonymousId: cfg.anonymousId,
      agentAddress: cfg.agentAddress,
      inputMint: EARN_MINTS.USDC,
      outputMint: candidate.mint,
      amountRaw: usdcRaw.toString(),
      estimatedUsd: notionalUsd,
      summary: `Momentum real: USDC→${candidate.symbol} (${strategy.name})`,
      slippageBps: 50,
    });
    if (swap.skipped) {
      await MomentumRotatorRealPosition.updateOne(
        { _id: position._id },
        { $set: { status: 'error', errorMessage: 'swap_skipped', resolvedAt: new Date() } },
      );
      return { agentAddress: cfg.agentAddress, skipped: true, reason: 'swap_skipped' };
    }
    await MomentumRotatorRealPosition.updateOne(
      { _id: position._id },
      {
        $set: {
          status: 'open',
          openTxSig: swap.signature,
          signalSnapshot: { ...candidate, tokenAmountRaw: swap.outAmount },
        },
      },
    );
    await MomentumRotatorRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastSignalAt: new Date(), lastError: null } },
    );
    return {
      agentAddress: cfg.agentAddress,
      opened: true,
      positionId: String(position._id),
      txSig: swap.signature,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await MomentumRotatorRealPosition.updateOne(
      { _id: position._id },
      { $set: { status: 'error', errorMessage: msg, resolvedAt: new Date() } },
    );
    await MomentumRotatorRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastSignalAt: new Date(), lastError: msg } },
    );
    return { agentAddress: cfg.agentAddress, error: msg };
  }
}

export async function runMomentumRealSignalCycle() {
  if (!isMomentumRealCronEnabled()) return { skipped: true, reason: 'cron_disabled' };
  const configs = await MomentumRotatorRealConfig.find({
    enabled: true,
    depositsPaused: { $ne: true },
  }).lean();
  const results = [];
  for (const cfg of configs) {
    results.push(await runSignalForConfig(cfg));
  }
  return { processed: configs.length, results };
}

async function resolvePositionsForConfig(cfg) {
  const openPositions = await MomentumRotatorRealPosition.find({
    agentAddress: cfg.agentAddress,
    status: 'open',
    processing: { $ne: true },
  }).lean();
  let resolved = 0;
  const errors = [];

  for (const pos of openPositions) {
    const strategy = await resolveStrategyById(pos.strategyId);
    const exit = strategy?.exit || { stopLossPct: -5, takeProfitPct: 8 };
    let px = 0;
    try {
      px = await fetchMintPriceUsd(pos.mint, pos.symbol);
    } catch {
      errors.push({ positionId: String(pos._id), error: 'no_price' });
      continue;
    }
    if (!(px > 0)) continue;

    const entry = toNum(pos.entryPriceUsd);
    const pnlPct = entry > 0 ? ((px - entry) / entry) * 100 : 0;
    const holdH = (Date.now() - new Date(pos.openedAt).getTime()) / 3_600_000;
    let shouldClose = false;
    let finalStatus = 'closed_loss';
    if (pnlPct <= toNum(exit.stopLossPct, -5)) {
      shouldClose = true;
      finalStatus = 'closed_loss';
    } else if (pnlPct >= toNum(exit.takeProfitPct, 8)) {
      shouldClose = true;
      finalStatus = 'closed_win';
    } else if (holdH >= toNum(strategy?.maxHoldHours, 48)) {
      shouldClose = true;
      finalStatus = pnlPct >= 0 ? 'closed_win' : 'closed_loss';
    } else if (cfg.closeAllRequested) {
      shouldClose = true;
      finalStatus = pnlPct >= 0 ? 'closed_win' : 'closed_loss';
    }
    if (!shouldClose) continue;

    const locked = await MomentumRotatorRealPosition.updateOne(
      { _id: pos._id, status: 'open', processing: { $ne: true } },
      { $set: { processing: true, status: 'closing' } },
    );
    if (locked.modifiedCount === 0) continue;

    try {
      const tokenRaw = pos.signalSnapshot?.tokenAmountRaw || '0';
      const swap = await executeJupiterBrokerSwap({
        anonymousId: cfg.anonymousId,
        agentAddress: cfg.agentAddress,
        inputMint: pos.mint,
        outputMint: EARN_MINTS.USDC,
        amountRaw: tokenRaw,
        estimatedUsd: toNum(pos.notionalUsd),
        summary: `Momentum real: ${pos.symbol}→USDC close (${pos.strategyName})`,
        slippageBps: 50,
      });
      const pnlUsd =
        entry > 0 && px > 0
          ? Math.round((toNum(pos.notionalUsd) * (px / entry - 1)) * 100) / 100
          : 0;
      await MomentumRotatorRealPosition.updateOne(
        { _id: pos._id },
        {
          $set: {
            status: finalStatus,
            resolution: finalStatus === 'closed_win' ? 'take_profit' : 'stop_or_time',
            closeTxSig: swap.signature,
            realExitPriceUsd: px,
            realNetPnlUsd: pnlUsd,
            resolvedAt: new Date(),
            processing: false,
          },
        },
      );
      resolved += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await MomentumRotatorRealPosition.updateOne(
        { _id: pos._id },
        { $set: { status: 'error', errorMessage: msg, processing: false, resolvedAt: new Date() } },
      );
      errors.push({ positionId: String(pos._id), error: msg });
    }
  }

  const nextError = errors.length ? errors[0]?.error : null;
  const closeAllRequested =
    cfg.closeAllRequested && resolved === 0 ? cfg.closeAllRequested : false;
  if (
    closeAllRequested !== cfg.closeAllRequested ||
    shouldTouchRealConfigMeta(cfg, nextError, 'resolve')
  ) {
    await MomentumRotatorRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastResolveAt: new Date(), lastError: nextError, closeAllRequested } },
    );
  }
  return { agentAddress: cfg.agentAddress, resolved, errors };
}

export async function resolveMomentumRealPositions() {
  const configs = await MomentumRotatorRealConfig.find({ enabled: true }).lean();
  const results = [];
  for (const cfg of configs) {
    results.push(await resolvePositionsForConfig(cfg));
  }
  return { processed: configs.length, results };
}
