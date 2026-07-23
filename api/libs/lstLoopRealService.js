/**
 * Leveraged LST Loop real agent — SOL→LST collateral + Rise borrow on invest wallet.
 * Falls back to Jupiter SOL→mSOL/JitoSOL when Marinade/Jito executors are unavailable.
 */
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import LstLoopRealConfig from '../models/LstLoopRealConfig.js';
import LstLoopRealPosition from '../models/LstLoopRealPosition.js';
import { LST_LOOP_DEFAULTS } from '../config/lstLoopStrategies.js';
import { LST_LOOP_CRON } from '../config/onchainEarnExperiments.js';
import {
  ensureLstLoopBootstrapped,
  getLstLoopStats,
} from './lstLoopService.js';
import { resolveLstLoopStrategies } from './lstLoopStrategyResolve.js';
import { siblingAnonymousId, purposeQuery } from './agentWalletPurpose.js';
import {
  executeJupiterBrokerSwap,
  EARN_MINTS,
} from './jupiterBrokerSwap.js';
import {
  executeRiseDepositAndBorrow,
  executeRiseRepayAndWithdraw,
} from './riseExecutor.js';
import { riseGetMarkets, hasRiseConfig } from './riseClient.js';
import { executeIntent } from '../services/walletBroker.js';
import { shouldTouchRealConfigMeta } from '../utils/mongoHeartbeatWrite.js';

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const PAPER_GRAD_MIN_DECIDED = 50;
const PAPER_LEADER_MIN_DECIDED = 5;
const DEFAULT_BORROW_APR = 0.06;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

export function isLstLoopRealCronEnabled() {
  return Boolean(LST_LOOP_CRON.realEnabled);
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
  const strategies = await resolveLstLoopStrategies();
  return strategies.find((s) => s.id === Number(strategyId)) || null;
}

export async function checkLstLoopPaperGraduation() {
  const stats = await getLstLoopStats();
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

async function getOrCreateConfigForWallet(wallet) {
  const state = await ensureLstLoopBootstrapped();
  let cfg = await LstLoopRealConfig.findById(wallet.agentAddress);
  if (!cfg) {
    cfg = await LstLoopRealConfig.create({
      _id: wallet.agentAddress,
      agentAddress: wallet.agentAddress,
      anonymousId: wallet.anonymousId,
      experimentId: state.activeExperimentId,
      enabled: false,
    });
  } else if (cfg.experimentId !== state.activeExperimentId) {
    cfg.experimentId = state.activeExperimentId;
    await cfg.save();
  }
  return cfg;
}

async function resolveRiseSolMarket() {
  const configured = String(LST_LOOP_CRON.riseMarketAddress || '').trim();
  if (configured) return configured;
  if (!hasRiseConfig()) return null;
  try {
    const res = await riseGetMarkets({ limit: 20 });
    const markets = res?.data?.markets || res?.data?.data || res?.data || [];
    const arr = Array.isArray(markets) ? markets : [];
    const solish = arr.find(
      (m) =>
        /sol/i.test(String(m.symbol || m.name || m.asset || '')) ||
        /So1111/.test(String(m.mint || m.address || '')),
    );
    return solish?.address || solish?.market || solish?.rise_market_address || null;
  } catch {
    return null;
  }
}

/** Stake SOL → LST via Marinade/Jito if available, else Jupiter SOL→LST proxy. */
async function stakeSolToLst({ anonymousId, agentAddress, depositSol, lstSymbol }) {
  const lstMint = lstSymbol === 'JitoSOL' ? EARN_MINTS.JITOSOL : EARN_MINTS.MSOL;
  const txSigs = [];
  let note = null;

  try {
    if (lstSymbol === 'mSOL') {
      const { buildMarinadeDepositTx } = await import('./invest/marinadeExecutor.js');
      const built = await buildMarinadeDepositTx({ agentAddress, amountSol: depositSol });
      const broker = await executeIntent(
        { anonymousId, guest: false },
        {
          type: 'tx_sign',
          chain: 'solana',
          toolId: 'marinade-deposit',
          serializedTxBase64: built.serializedTxBase64,
          estimatedUsd: depositSol * 150,
          summary: `LST loop real: Marinade SOL→mSOL (${depositSol.toFixed(4)} SOL)`,
        },
      );
      if (broker.status === 'ok') txSigs.push(broker.signature);
      else note = `marinade_broker:${(broker.reasons || []).join(';')}`;
    } else {
      const { buildJitoDepositTx } = await import('./invest/jitoStakePoolExecutor.js');
      const built = await buildJitoDepositTx({ agentAddress, amountSol: depositSol });
      const broker = await executeIntent(
        { anonymousId, guest: false },
        {
          type: 'tx_sign',
          chain: 'solana',
          toolId: 'jito-deposit',
          serializedTxBase64: built.serializedTxBase64,
          estimatedUsd: depositSol * 150,
          summary: `LST loop real: Jito SOL→JitoSOL (${depositSol.toFixed(4)} SOL)`,
        },
      );
      if (broker.status === 'ok') txSigs.push(broker.signature);
      else note = `jito_broker:${(broker.reasons || []).join(';')}`;
    }
  } catch (e) {
    note = `stake_executor_missing:${e instanceof Error ? e.message : String(e)}`;
  }

  if (!txSigs.length) {
    const lamports = Math.floor(depositSol * LAMPORTS_PER_SOL);
    const swap = await executeJupiterBrokerSwap({
      anonymousId,
      agentAddress,
      inputMint: EARN_MINTS.SOL,
      outputMint: lstMint,
      amountRaw: String(lamports),
      estimatedUsd: depositSol * 150,
      summary: `LST loop real: Jupiter SOL→${lstSymbol} proxy deposit`,
      slippageBps: 50,
    });
    if (swap.signature) txSigs.push(swap.signature);
    note = note || 'jupiter_lst_proxy';
  }

  return { txSigs, lstMint, note };
}

export async function getLstLoopRealState({ viewerAnonymousId } = {}) {
  let config = null;
  let canEnable = false;
  const graduation = await checkLstLoopPaperGraduation();

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
    LstLoopRealPosition.countDocuments({
      ...agentFilter,
      status: { $in: ['open', 'opening', 'closing'] },
    }),
    LstLoopRealPosition.aggregate([
      {
        $match: {
          ...agentFilter,
          status: { $in: ['closed_win', 'closed_loss', 'expired'] },
        },
      },
      {
        $group: {
          _id: null,
          realizedPnlSol: { $sum: { $ifNull: ['$realNetPnlSol', 0] } },
          wins: { $sum: { $cond: [{ $eq: ['$status', 'closed_win'] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ['$status', 'closed_loss'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const realizedPnlSol = toNum(closedAgg[0]?.realizedPnlSol);
  const wins = toNum(closedAgg[0]?.wins);
  const losses = toNum(closedAgg[0]?.losses);
  const decided = wins + losses;

  return {
    enabled: Boolean(config?.enabled),
    experimentId: config?.experimentId || null,
    agentAddress: config?.agentAddress || null,
    currentStrategyId: config?.currentStrategyId ?? null,
    maxPositionSol: config?.maxPositionSol ?? LST_LOOP_DEFAULTS.startingBankSol / 2,
    maxConcurrentPositions: config?.maxConcurrentPositions ?? 3,
    publicEarnListed: Boolean(config?.publicEarnListed),
    depositsPaused: Boolean(config?.depositsPaused),
    lastSignalAt: config?.lastSignalAt?.toISOString?.() ?? null,
    lastResolveAt: config?.lastResolveAt?.toISOString?.() ?? null,
    lastError: config?.lastError ?? null,
    closeAllRequested: Boolean(config?.closeAllRequested),
    openPositions,
    realizedNetPnlSol: realizedPnlSol,
    realWinRate: decided > 0 ? wins / decided : null,
    realWins: wins,
    realLosses: losses,
    canEnable,
    cronEnabled: isLstLoopRealCronEnabled(),
    paperGraduation: graduation,
    onchain: { venue: 'Solana', execution: 'Marinade/Jito+Rise', denom: 'SOL' },
  };
}

export async function listLstLoopRealPositions({ limit, offset, status, agentAddress } = {}) {
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  const filter = {};
  if (status) filter.status = status;
  if (agentAddress) filter.agentAddress = agentAddress;
  const [positions, total] = await Promise.all([
    LstLoopRealPosition.find(filter).sort({ openedAt: -1 }).skip(off).limit(lim).lean(),
    LstLoopRealPosition.countDocuments(filter),
  ]);
  return { positions, total };
}

export async function enableLstLoopReal({
  anonymousId,
  enabledBy,
  maxPositionSol,
  requireGraduation = false,
}) {
  if (!anonymousId) throw new Error('anonymousId required');
  const graduation = await checkLstLoopPaperGraduation();
  if (requireGraduation && !graduation.pass) {
    throw new Error(`paper_graduation_blocked:${graduation.reason}`);
  }
  const wallet = await resolveInvestWallet(anonymousId);
  const investAid = siblingAnonymousId(anonymousId, 'invest');
  const cfg = await getOrCreateConfigForWallet(wallet);
  const stats = await getLstLoopStats();
  const best = pickBestPaperStrategy(stats.agents);

  cfg.enabled = true;
  cfg.startedAt = cfg.startedAt ?? new Date();
  cfg.anonymousId = investAid;
  cfg.currentStrategyId = best?.strategyId ?? cfg.currentStrategyId ?? 0;
  if (maxPositionSol != null && Number.isFinite(Number(maxPositionSol))) {
    cfg.maxPositionSol = Math.max(0.5, Number(maxPositionSol));
  }
  cfg.lastError = graduation.pass ? null : `soft_warn:${graduation.reason}`;
  cfg.closeAllRequested = false;
  await cfg.save();
  return getLstLoopRealState({ viewerAnonymousId: anonymousId });
}

export async function disableLstLoopReal({ anonymousId, closeAll = true }) {
  const wallet = await resolveInvestWallet(anonymousId);
  await LstLoopRealConfig.updateOne(
    { _id: wallet.agentAddress },
    { $set: { enabled: false, closeAllRequested: Boolean(closeAll) } },
  );
  return getLstLoopRealState({ viewerAnonymousId: anonymousId });
}

async function runSignalForConfig(cfg) {
  if (!cfg.enabled || cfg.depositsPaused) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'disabled_or_paused' };
  }
  const openCount = await LstLoopRealPosition.countDocuments({
    agentAddress: cfg.agentAddress,
    status: { $in: ['open', 'opening', 'closing'] },
  });
  if (openCount >= toNum(cfg.maxConcurrentPositions, 3)) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'max_concurrent' };
  }

  const stats = await getLstLoopStats();
  const best = pickBestPaperStrategy(stats.agents);
  if (!best) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'no_qualified_leader' };
  }
  const strategy = await resolveStrategyById(best.strategyId);
  if (!strategy) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'invalid_strategy' };
  }

  const lstSymbol =
    strategy.lstSymbol && strategy.lstSymbol !== 'auto' ? strategy.lstSymbol : 'mSOL';
  const leverage = Math.min(toNum(cfg.maxLeverage, 2.5), toNum(strategy.targetLeverage, 2));
  const ltv = toNum(cfg.targetLtv, toNum(strategy.targetLtv, 0.5));
  const depositSol = Math.min(toNum(cfg.maxPositionSol, 2), toNum(cfg.publicMaxDepositSol, 10) * 0.9);
  if (depositSol < 0.5) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'deposit_too_small' };
  }
  const borrowedSol = depositSol * Math.max(0, leverage - 1) * ltv;
  const healthFactor = 1 / Math.max(ltv, 0.1);

  const position = await LstLoopRealPosition.create({
    experimentId: cfg.experimentId,
    agentAddress: cfg.agentAddress,
    anonymousId: cfg.anonymousId,
    strategyId: strategy.id,
    strategyName: strategy.name,
    lstSymbol,
    lstMint: lstSymbol === 'JitoSOL' ? EARN_MINTS.JITOSOL : EARN_MINTS.MSOL,
    leverage,
    ltv,
    healthFactor,
    depositSol,
    borrowedSol,
    signalSnapshot: { leverage, ltv, borrowApr: DEFAULT_BORROW_APR },
    status: 'opening',
    openedAt: new Date(),
  });

  try {
    const stake = await stakeSolToLst({
      anonymousId: cfg.anonymousId,
      agentAddress: cfg.agentAddress,
      depositSol,
      lstSymbol,
    });
    const txSigs = [...stake.txSigs];
    let riseNote = null;

    const market = await resolveRiseSolMarket();
    if (market && borrowedSol > 0 && hasRiseConfig()) {
      const rise = await executeRiseDepositAndBorrow(
        {
          wallet: cfg.agentAddress,
          market,
          borrowAmount: borrowedSol,
        },
        {
          anonymousId: cfg.anonymousId,
          estimatedUsd: depositSol * 150,
          summary: `LST loop real: Rise deposit+borrow (${lstSymbol})`,
        },
      );
      if (rise.ok && rise.signature) txSigs.push(rise.signature);
      else riseNote = rise.error || 'rise_deposit_borrow_failed';
    } else {
      riseNote = market ? 'rise_not_configured' : 'rise_market_unresolved';
    }

    await LstLoopRealPosition.updateOne(
      { _id: position._id },
      {
        $set: {
          status: 'open',
          openTxSigs: txSigs,
          signalSnapshot: {
            leverage,
            ltv,
            stakeNote: stake.note,
            riseNote,
            borrowApr: DEFAULT_BORROW_APR,
          },
        },
      },
    );
    await LstLoopRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastSignalAt: new Date(), lastError: riseNote && !txSigs.length ? riseNote : null, currentStrategyId: strategy.id } },
    );
    return {
      agentAddress: cfg.agentAddress,
      opened: true,
      positionId: String(position._id),
      txSigs,
      riseNote,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await LstLoopRealPosition.updateOne(
      { _id: position._id },
      { $set: { status: 'error', errorMessage: msg, resolvedAt: new Date() } },
    );
    await LstLoopRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastSignalAt: new Date(), lastError: msg } },
    );
    return { agentAddress: cfg.agentAddress, error: msg };
  }
}

export async function runLstLoopRealSignalCycle() {
  if (!isLstLoopRealCronEnabled()) return { skipped: true, reason: 'cron_disabled' };
  const configs = await LstLoopRealConfig.find({
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
  const openPositions = await LstLoopRealPosition.find({
    agentAddress: cfg.agentAddress,
    status: 'open',
    processing: { $ne: true },
  }).lean();
  let resolved = 0;
  const errors = [];
  let borrowApr = DEFAULT_BORROW_APR;

  if (hasRiseConfig()) {
    try {
      const res = await riseGetMarkets({ limit: 20 });
      const markets = res?.data?.markets || res?.data?.data || res?.data || [];
      const arr = Array.isArray(markets) ? markets : [];
      const solish = arr.find((m) => /sol/i.test(String(m.symbol || m.name || '')));
      const rate = toNum(solish?.borrowApr ?? solish?.borrow_apy, 0);
      if (rate > 0) borrowApr = rate > 1 ? rate / 100 : rate;
    } catch {
      /* keep default */
    }
  }

  for (const pos of openPositions) {
    const strategy = await resolveStrategyById(pos.strategyId);
    const minHealth = toNum(cfg.minHealthFactor, toNum(strategy?.minHealthFactor, 1.3));
    const maxBorrow = toNum(strategy?.maxBorrowRateApr, 0.18);
    const health = toNum(pos.healthFactor, 1 / Math.max(toNum(pos.ltv, 0.5), 0.1));
    const holdH = (Date.now() - new Date(pos.openedAt).getTime()) / 3_600_000;

    let shouldClose =
      health < minHealth ||
      borrowApr > maxBorrow ||
      cfg.closeAllRequested ||
      holdH >= 24;

    if (!shouldClose) continue;

    const locked = await LstLoopRealPosition.updateOne(
      { _id: pos._id, status: 'open', processing: { $ne: true } },
      { $set: { processing: true, status: 'closing' } },
    );
    if (locked.modifiedCount === 0) continue;

    try {
      const txSigs = [...(pos.closeTxSigs || [])];
      const market = await resolveRiseSolMarket();
      if (market && toNum(pos.borrowedSol) > 0 && hasRiseConfig()) {
        const rise = await executeRiseRepayAndWithdraw(
          {
            wallet: cfg.agentAddress,
            market,
            withdrawAmount: toNum(pos.depositSol),
          },
          {
            anonymousId: cfg.anonymousId,
            estimatedUsd: toNum(pos.depositSol) * 150,
            summary: 'LST loop real: Rise repay+withdraw deleverage',
          },
        );
        if (rise.ok && rise.signature) txSigs.push(rise.signature);
      }

      const lstMint = pos.lstMint || (pos.lstSymbol === 'JitoSOL' ? EARN_MINTS.JITOSOL : EARN_MINTS.MSOL);
      const lamports = Math.floor(toNum(pos.depositSol) * LAMPORTS_PER_SOL * 0.95);
      if (lamports > 0) {
        const swap = await executeJupiterBrokerSwap({
          anonymousId: cfg.anonymousId,
          agentAddress: cfg.agentAddress,
          inputMint: lstMint,
          outputMint: EARN_MINTS.SOL,
          amountRaw: String(lamports),
          estimatedUsd: toNum(pos.depositSol) * 150,
          summary: `LST loop real: ${pos.lstSymbol}→SOL unwind`,
          slippageBps: 50,
        });
        if (swap.signature) txSigs.push(swap.signature);
      }

      const holdDays = holdH / 24;
      const netApr = 0.05 - borrowApr * toNum(pos.ltv, 0.5);
      const pnlSol = toNum(pos.depositSol) * netApr * holdDays;
      const finalStatus = pnlSol >= 0 ? 'closed_win' : 'closed_loss';

      await LstLoopRealPosition.updateOne(
        { _id: pos._id },
        {
          $set: {
            status: finalStatus,
            resolution: borrowApr > maxBorrow ? 'borrow_rate_kill' : 'deleverage',
            closeTxSigs: txSigs,
            realNetPnlSol: Math.round(pnlSol * 1e6) / 1e6,
            realNetPnlUsd: Math.round(pnlSol * 150 * 100) / 100,
            resolvedAt: new Date(),
            processing: false,
          },
        },
      );
      resolved += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await LstLoopRealPosition.updateOne(
        { _id: pos._id },
        { $set: { status: 'error', errorMessage: msg, processing: false, resolvedAt: new Date() } },
      );
      errors.push({ positionId: String(pos._id), error: msg });
    }
  }

  const nextError = errors.length ? errors[0]?.error : null;
  if (shouldTouchRealConfigMeta(cfg, nextError, 'resolve')) {
    await LstLoopRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastResolveAt: new Date(), lastError: nextError } },
    );
  }
  return { agentAddress: cfg.agentAddress, resolved, errors };
}

export async function resolveLstLoopRealPositions() {
  const configs = await LstLoopRealConfig.find({ enabled: true }).lean();
  const results = [];
  for (const cfg of configs) {
    results.push(await resolvePositionsForConfig(cfg));
  }
  return { processed: configs.length, results };
}
