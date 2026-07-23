/**
 * Alpha Sniper real agent — RugCheck-gated entries on LP wallet, exits via Jupiter.
 */
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import SniperRealConfig from '../models/SniperRealConfig.js';
import SniperRealPosition from '../models/SniperRealPosition.js';
import { SNIPER_DEFAULTS } from '../config/sniperStrategies.js';
import { SNIPER_CRON } from '../config/onchainEarnExperiments.js';
import {
  ensureSniperBootstrapped,
  getSniperStats,
} from './sniperService.js';
import { resolveSniperStrategies } from './sniperStrategyResolve.js';
import { lpAnonymousIdFromChat, purposeQuery } from './agentWalletPurpose.js';
import {
  executeJupiterBrokerSwap,
  EARN_MINTS,
  fetchJupiterQuoteRaw,
} from './jupiterBrokerSwap.js';
import { executeAgentToolCall } from './agentToolExecutor.js';
import { shouldTouchRealConfigMeta } from '../utils/mongoHeartbeatWrite.js';

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const PAPER_GRAD_MIN_DECIDED = 50;
const PAPER_LEADER_MIN_DECIDED = 5;
const SOL_PRICE_USD = 150;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

export function isSniperRealCronEnabled() {
  return Boolean(SNIPER_CRON.realEnabled);
}

async function resolveLpWallet(anonymousId) {
  const lpAid = lpAnonymousIdFromChat(anonymousId) || String(anonymousId || '').trim();
  if (!lpAid) throw new Error('Invalid anonymous id');
  let wallet = await AgentWallet.findOne({
    anonymousId: lpAid,
    chain: 'solana',
    status: 'active',
    ...purposeQuery('lp'),
  }).lean();
  if (!wallet) {
    wallet = await AgentWallet.findOne({
      anonymousId: lpAid,
      chain: 'solana',
      status: 'active',
    }).lean();
  }
  if (!wallet?.agentAddress) throw new Error('LP wallet not provisioned for this user');
  return wallet;
}

async function resolveStrategyById(strategyId) {
  const strategies = await resolveSniperStrategies();
  return strategies.find((s) => s.id === Number(strategyId)) || null;
}

export async function checkSniperPaperGraduation() {
  const stats = await getSniperStats();
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
  const state = await ensureSniperBootstrapped();
  let cfg = await SniperRealConfig.findById(wallet.agentAddress);
  if (!cfg) {
    cfg = await SniperRealConfig.create({
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
    return { pass: false, score: 0, dangerous: true };
  }
}

async function getDailyRealizedLossSol(agentAddress) {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const rows = await SniperRealPosition.aggregate([
    {
      $match: {
        agentAddress,
        status: 'closed_loss',
        resolvedAt: { $gte: startOfDay },
      },
    },
    { $group: { _id: null, lossSol: { $sum: { $abs: { $ifNull: ['$realNetPnlSol', 0] } } } } },
  ]);
  return toNum(rows[0]?.lossSol);
}

async function fetchMintPriceUsd(mint) {
  try {
    const q = await fetchJupiterQuoteRaw({
      inputMint: mint,
      outputMint: EARN_MINTS.USDC,
      amountRaw: '1000000',
      slippageBps: 100,
    });
    return toNum(q?.outAmount, 0) / 1e6;
  } catch {
    return 0;
  }
}

export async function getSniperRealState({ viewerAnonymousId } = {}) {
  let config = null;
  let canEnable = false;
  const graduation = await checkSniperPaperGraduation();

  if (viewerAnonymousId) {
    try {
      const wallet = await resolveLpWallet(viewerAnonymousId);
      config = await getOrCreateConfigForWallet(wallet);
      canEnable = true;
    } catch {
      config = null;
    }
  }

  const agentFilter = config?.agentAddress ? { agentAddress: config.agentAddress } : {};
  const [openPositions, closedAgg, dailyLossSol] = await Promise.all([
    SniperRealPosition.countDocuments({
      ...agentFilter,
      status: { $in: ['open', 'opening', 'closing'] },
    }),
    SniperRealPosition.aggregate([
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
    config?.agentAddress ? getDailyRealizedLossSol(config.agentAddress) : 0,
  ]);

  const realizedPnlSol = toNum(closedAgg[0]?.realizedPnlSol);
  const wins = toNum(closedAgg[0]?.wins);
  const losses = toNum(closedAgg[0]?.losses);
  const decided = wins + losses;
  const dailyLossCapSol = toNum(config?.dailyLossCapSol, 0.5);
  const dailyLossKill = dailyLossSol >= dailyLossCapSol;

  return {
    enabled: Boolean(config?.enabled),
    experimentId: config?.experimentId || null,
    agentAddress: config?.agentAddress || null,
    currentStrategyId: config?.currentStrategyId ?? null,
    maxPositionSol: config?.maxPositionSol ?? SNIPER_DEFAULTS.maxPositionSol,
    maxConcurrentPositions: config?.maxConcurrentPositions ?? 3,
    dailyLossCapSol,
    dailyLossSol,
    dailyLossKill,
    publicEarnListed: Boolean(config?.publicEarnListed),
    depositsPaused: Boolean(config?.depositsPaused || dailyLossKill),
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
    cronEnabled: isSniperRealCronEnabled(),
    paperGraduation: graduation,
    onchain: { venue: 'Solana', execution: 'pump.fun+Jupiter', denom: 'SOL' },
  };
}

export async function listSniperRealPositions({ limit, offset, status, agentAddress } = {}) {
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  const filter = {};
  if (status) filter.status = status;
  if (agentAddress) filter.agentAddress = agentAddress;
  const [positions, total] = await Promise.all([
    SniperRealPosition.find(filter).sort({ openedAt: -1 }).skip(off).limit(lim).lean(),
    SniperRealPosition.countDocuments(filter),
  ]);
  return { positions, total };
}

export async function enableSniperReal({
  anonymousId,
  enabledBy,
  maxPositionSol,
  requireGraduation = false,
}) {
  if (!anonymousId) throw new Error('anonymousId required');
  const graduation = await checkSniperPaperGraduation();
  if (requireGraduation && !graduation.pass) {
    throw new Error(`paper_graduation_blocked:${graduation.reason}`);
  }
  const wallet = await resolveLpWallet(anonymousId);
  const cfg = await getOrCreateConfigForWallet(wallet);
  const stats = await getSniperStats();
  const best = pickBestPaperStrategy(stats.agents);

  cfg.enabled = true;
  cfg.startedAt = cfg.startedAt ?? new Date();
  cfg.anonymousId = wallet.anonymousId;
  cfg.currentStrategyId = best?.strategyId ?? cfg.currentStrategyId ?? 1;
  if (maxPositionSol != null && Number.isFinite(Number(maxPositionSol))) {
    cfg.maxPositionSol = Math.max(SNIPER_DEFAULTS.minTradeSol, Number(maxPositionSol));
  }
  cfg.lastError = graduation.pass ? null : `soft_warn:${graduation.reason}`;
  cfg.closeAllRequested = false;
  await cfg.save();
  return getSniperRealState({ viewerAnonymousId: anonymousId });
}

export async function disableSniperReal({ anonymousId, closeAll = true }) {
  const wallet = await resolveLpWallet(anonymousId);
  await SniperRealConfig.updateOne(
    { _id: wallet.agentAddress },
    { $set: { enabled: false, closeAllRequested: Boolean(closeAll) } },
  );
  return getSniperRealState({ viewerAnonymousId: anonymousId });
}

async function tryPumpfunEntry({ anonymousId, mint, lamports }) {
  const out = await executeAgentToolCall({
    anonymousId,
    toolId: 'pumpfun-agents-swap',
    params: {
      inputMint: EARN_MINTS.SOL,
      outputMint: mint,
      amount: String(lamports),
    },
    skipUsdcCharge: true,
  });
  if (out?.success && out?.data?.signature) {
    return { signature: out.data.signature, via: 'pumpfun' };
  }
  return null;
}

async function pickCandidate(strategy, cfg) {
  const candidates = await fetchScoutCandidates();
  for (const c of candidates) {
    if (c.syraAlphaScore < toNum(strategy.minAlphaScore, toNum(cfg.minAlphaScore, 70))) continue;
    if (c.mcapUsd > 0 && c.mcapUsd > toNum(strategy.maxMcapUsd, 3e6)) continue;
    if (c.liqUsd > 0 && c.liqUsd < toNum(strategy.minLiqUsd, 20_000)) continue;
    if (strategy.requireGraduated && !c.graduated) continue;
    if (strategy.requireSmartMoney && !c.smartMoney) continue;
    if (strategy.requireRugcheckPass !== false || cfg.requireRugcheckPass) {
      const rug = await rugcheckPass(c.mint);
      if (!rug.pass) continue;
      c.rugcheckScore = rug.score;
    }
    const dup = await SniperRealPosition.findOne({
      agentAddress: cfg.agentAddress,
      mint: c.mint,
      status: { $in: ['open', 'opening', 'closing'] },
    }).lean();
    if (dup) continue;
    return c;
  }
  return null;
}

async function runSignalForConfig(cfg) {
  if (!cfg.enabled || cfg.depositsPaused) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'disabled_or_paused' };
  }

  const dailyLossSol = await getDailyRealizedLossSol(cfg.agentAddress);
  if (dailyLossSol >= toNum(cfg.dailyLossCapSol, 0.5)) {
    await SniperRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { depositsPaused: true, lastError: 'daily_loss_cap' } },
    );
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'daily_loss_cap' };
  }

  const openCount = await SniperRealPosition.countDocuments({
    agentAddress: cfg.agentAddress,
    status: { $in: ['open', 'opening', 'closing'] },
  });
  if (openCount >= toNum(cfg.maxConcurrentPositions, 3)) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'max_concurrent' };
  }

  const stats = await getSniperStats();
  const best = pickBestPaperStrategy(stats.agents);
  if (!best) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'no_qualified_leader' };
  }
  const strategy = await resolveStrategyById(best.strategyId);
  if (!strategy) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'invalid_strategy' };
  }

  const picked = await pickCandidate(strategy, cfg);
  if (!picked) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'no_qualified_pair' };
  }

  const depositSol = Math.min(
    toNum(cfg.maxPositionSol, 0.4),
    toNum(cfg.publicMaxDepositSol, 3) * 0.25,
  );
  if (depositSol < SNIPER_DEFAULTS.minTradeSol) {
    return { agentAddress: cfg.agentAddress, skipped: true, reason: 'deposit_too_small' };
  }
  const entryPx = picked.priceUsd > 0 ? picked.priceUsd : 0.00001;
  const lamports = Math.floor(depositSol * LAMPORTS_PER_SOL);

  const position = await SniperRealPosition.create({
    experimentId: cfg.experimentId,
    agentAddress: cfg.agentAddress,
    anonymousId: cfg.anonymousId,
    strategyId: strategy.id,
    strategyName: strategy.name,
    mint: picked.mint,
    symbol: picked.symbol,
    depositSol,
    entryPriceUsd: entryPx,
    syraAlphaScore: picked.syraAlphaScore,
    signalSnapshot: picked,
    status: 'opening',
    openedAt: new Date(),
  });

  try {
    let openTxSig = null;
    let entryVia = 'jupiter';
    const pump = await tryPumpfunEntry({
      anonymousId: cfg.anonymousId,
      mint: picked.mint,
      lamports,
    });
    if (pump?.signature) {
      openTxSig = pump.signature;
      entryVia = pump.via;
    } else {
      const swap = await executeJupiterBrokerSwap({
        anonymousId: cfg.anonymousId,
        agentAddress: cfg.agentAddress,
        inputMint: EARN_MINTS.SOL,
        outputMint: picked.mint,
        amountRaw: String(lamports),
        estimatedUsd: depositSol * SOL_PRICE_USD,
        summary: `Sniper real: SOL→${picked.symbol} (${strategy.name})`,
        slippageBps: 100,
      });
      openTxSig = swap.signature;
    }

    await SniperRealPosition.updateOne(
      { _id: position._id },
      {
        $set: {
          status: 'open',
          openTxSig,
          signalSnapshot: { ...picked, entryVia, tokenLamports: lamports },
        },
      },
    );
    await SniperRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastSignalAt: new Date(), lastError: null, currentStrategyId: strategy.id } },
    );
    return {
      agentAddress: cfg.agentAddress,
      opened: true,
      positionId: String(position._id),
      txSig: openTxSig,
      mint: picked.mint,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await SniperRealPosition.updateOne(
      { _id: position._id },
      { $set: { status: 'error', errorMessage: msg, resolvedAt: new Date() } },
    );
    await SniperRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastSignalAt: new Date(), lastError: msg } },
    );
    return { agentAddress: cfg.agentAddress, error: msg };
  }
}

export async function runSniperRealSignalCycle() {
  if (!isSniperRealCronEnabled()) return { skipped: true, reason: 'cron_disabled' };
  const configs = await SniperRealConfig.find({
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
  const openPositions = await SniperRealPosition.find({
    agentAddress: cfg.agentAddress,
    status: 'open',
    processing: { $ne: true },
  }).lean();
  let resolved = 0;
  const errors = [];

  for (const pos of openPositions) {
    const strategy = await resolveStrategyById(pos.strategyId);
    const exit = strategy?.exit || { stopLossPct: -15, takeProfitPct: 30 };
    const px = await fetchMintPriceUsd(pos.mint);
    if (!(px > 0) && !cfg.closeAllRequested) continue;

    const entry = toNum(pos.entryPriceUsd);
    const simPx = px > 0 ? px : entry;
    const pnlPct = entry > 0 ? ((simPx - entry) / entry) * 100 : 0;
    const holdMin = (Date.now() - new Date(pos.openedAt).getTime()) / 60_000;

    let shouldClose = false;
    let finalStatus = 'closed_loss';
    if (pnlPct <= toNum(exit.stopLossPct, -15)) {
      shouldClose = true;
      finalStatus = 'closed_loss';
    } else if (pnlPct >= toNum(exit.takeProfitPct, 30)) {
      shouldClose = true;
      finalStatus = 'closed_win';
    } else if (holdMin >= toNum(strategy?.maxHoldMinutes, 90)) {
      shouldClose = true;
      finalStatus = pnlPct >= 0 ? 'closed_win' : 'closed_loss';
    } else if (cfg.closeAllRequested) {
      shouldClose = true;
      finalStatus = pnlPct >= 0 ? 'closed_win' : 'closed_loss';
    }
    if (!shouldClose) continue;

    const locked = await SniperRealPosition.updateOne(
      { _id: pos._id, status: 'open', processing: { $ne: true } },
      { $set: { processing: true, status: 'closing' } },
    );
    if (locked.modifiedCount === 0) continue;

    try {
      const tokenRaw =
        pos.signalSnapshot?.tokenAmountRaw ||
        String(Math.floor(toNum(pos.depositSol) * LAMPORTS_PER_SOL));
      const swap = await executeJupiterBrokerSwap({
        anonymousId: cfg.anonymousId,
        agentAddress: cfg.agentAddress,
        inputMint: pos.mint,
        outputMint: EARN_MINTS.SOL,
        amountRaw: tokenRaw,
        estimatedUsd: toNum(pos.depositSol) * SOL_PRICE_USD,
        summary: `Sniper real: ${pos.symbol}→SOL close`,
        slippageBps: 150,
      });
      const pnlSol = (toNum(pos.depositSol) * pnlPct) / 100;
      await SniperRealPosition.updateOne(
        { _id: pos._id },
        {
          $set: {
            status: finalStatus,
            resolution: finalStatus === 'closed_win' ? 'take_profit' : 'stop_or_time',
            closeTxSig: swap.signature,
            realNetPnlSol: Math.round(pnlSol * 1e6) / 1e6,
            realNetPnlUsd: Math.round(pnlSol * SOL_PRICE_USD * 100) / 100,
            resolvedAt: new Date(),
            processing: false,
          },
        },
      );
      resolved += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await SniperRealPosition.updateOne(
        { _id: pos._id },
        { $set: { status: 'error', errorMessage: msg, processing: false, resolvedAt: new Date() } },
      );
      errors.push({ positionId: String(pos._id), error: msg });
    }
  }

  const nextError = errors.length ? errors[0]?.error : null;
  if (shouldTouchRealConfigMeta(cfg, nextError, 'resolve')) {
    await SniperRealConfig.updateOne(
      { _id: cfg._id },
      { $set: { lastResolveAt: new Date(), lastError: nextError } },
    );
  }
  return { agentAddress: cfg.agentAddress, resolved, errors };
}

export async function resolveSniperRealPositions() {
  const configs = await SniperRealConfig.find({ enabled: true }).lean();
  const results = [];
  for (const cfg of configs) {
    results.push(await resolvePositionsForConfig(cfg));
  }
  return { processed: configs.length, results };
}
