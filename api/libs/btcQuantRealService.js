/**
 * BTC quant real agent — onchain cbBTC spot-long via Jupiter from custodial invest wallet.
 */
import AgentWallet from "../models/agent/AgentWallet.js";
import BtcQuantRealConfig from "../models/BtcQuantRealConfig.js";
import BtcQuantRealPosition from "../models/BtcQuantRealPosition.js";
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import {
  BTC_QUANT_QUOTE_DECIMALS,
  CBBTC_DECIMALS,
  EXPERIMENT_SUITE_BTC_ONCHAIN,
  resolveBtcQuantStrategyById,
} from "../config/tradingExperimentStrategies.js";
import {
  ensureBtcQuantBootstrapped,
  getBtcQuantStats,
  resolveOpenBtcQuantRuns,
  runBtcQuantSignalCycle,
} from "./btcQuantExperimentService.js";
import { executeBtcQuantJupiterSwap, BTC_QUANT_SWAP_MINTS } from "./btcQuantJupiterSwap.js";
import BtcQuantExperimentState from "../models/BtcQuantExperimentState.js";
import { siblingAnonymousId, purposeQuery } from "./agentWalletPurpose.js";
import { fetchCbbtcSpotPriceUsd } from "./btcQuantOnchainMarket.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

export function isBtcQuantRealCronEnabled() {
  const env = String(process.env.BTC_QUANT_REAL_CRON_ENABLED || "").trim().toLowerCase();
  return env === "1" || env === "true" || env === "yes";
}

async function fetchBtcSpotPrice() {
  return fetchCbbtcSpotPriceUsd();
}

async function getOrCreateRealConfig() {
  await ensureBtcQuantBootstrapped();
  const state = await BtcQuantExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId;
  let cfg = await BtcQuantRealConfig.findById("singleton");
  if (!cfg) {
    cfg = await BtcQuantRealConfig.create({
      _id: "singleton",
      enabled: false,
      experimentId,
      title: "BTC quant real (cbBTC)",
    });
  } else if (cfg.experimentId !== experimentId) {
    cfg.experimentId = experimentId;
    await cfg.save();
  }
  return cfg;
}

async function resolveInvestWallet(anonymousId) {
  const investAid = siblingAnonymousId(anonymousId, "invest");
  if (!investAid) throw new Error("Invalid anonymous id");
  const wallet = await AgentWallet.findOne({
    anonymousId: investAid,
    chain: "solana",
    status: "active",
    ...purposeQuery("invest"),
  }).lean();
  if (!wallet?.agentAddress) {
    throw new Error("Invest wallet not provisioned for this user");
  }
  return wallet;
}

function usdcRawFromUsd(usd) {
  return BigInt(Math.max(0, Math.floor(toNum(usd, 0) * 10 ** BTC_QUANT_QUOTE_DECIMALS)));
}

export async function getBtcQuantRealState({ viewerAnonymousId } = {}) {
  const cfg = await getOrCreateRealConfig();
  const openPositions = await BtcQuantRealPosition.countDocuments({
    experimentId: cfg.experimentId,
    status: { $in: ["open", "opening", "closing"] },
  });
  const closed = await BtcQuantRealPosition.find({
    experimentId: cfg.experimentId,
    status: { $in: ["closed_win", "closed_loss", "expired"] },
  }).lean();
  const realizedPnlUsd = closed.reduce((sum, p) => sum + toNum(p.realNetPnlUsd, 0), 0);
  const wins = closed.filter((p) => p.status === "closed_win").length;
  const losses = closed.filter((p) => p.status === "closed_loss").length;
  const decided = wins + losses;

  return {
    enabled: cfg.enabled,
    experimentId: cfg.experimentId,
    title: cfg.title,
    startedAt: cfg.startedAt?.toISOString?.() ?? null,
    agentAddress: cfg.agentAddress,
    leaderStrategyId: cfg.leaderStrategyId,
    maxNotionalUsd: cfg.maxNotionalUsd,
    reserveUsdc: cfg.reserveUsdc,
    slippageBps: cfg.slippageBps,
    lastSignalAt: cfg.lastSignalAt?.toISOString?.() ?? null,
    lastResolveAt: cfg.lastResolveAt?.toISOString?.() ?? null,
    lastError: cfg.lastError,
    closeAllRequested: cfg.closeAllRequested,
    openPositions,
    realizedNetPnlUsd: realizedPnlUsd,
    realWinRate: decided > 0 ? wins / decided : null,
    realWins: wins,
    realLosses: losses,
    canEnable: Boolean(viewerAnonymousId),
    cronEnabled: isBtcQuantRealCronEnabled(),
    onchain: {
      venue: "Solana",
      inputMint: BTC_QUANT_SWAP_MINTS.usdc,
      outputMint: BTC_QUANT_SWAP_MINTS.cbbtc,
      execution: "Jupiter",
    },
  };
}

export async function listBtcQuantRealPositions({ limit, offset, status, experimentId } = {}) {
  const cfg = await getOrCreateRealConfig();
  const expId = experimentId || cfg.experimentId;
  const filter = { experimentId: expId };
  if (status) filter.status = status;
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  const [positions, total] = await Promise.all([
    BtcQuantRealPosition.find(filter).sort({ openedAt: -1 }).skip(off).limit(lim).lean(),
    BtcQuantRealPosition.countDocuments(filter),
  ]);
  return { positions, total };
}

export async function enableBtcQuantReal({ anonymousId, enabledBy, leaderStrategyId, maxNotionalUsd }) {
  if (!anonymousId) throw new Error("anonymousId required");
  const wallet = await resolveInvestWallet(anonymousId);
  const investAid = siblingAnonymousId(anonymousId, "invest");
  const cfg = await getOrCreateRealConfig();

  const stats = await getBtcQuantStats();
  const ranked = [...stats.agents].sort((a, b) => toNum(b.sumPnlUsd) - toNum(a.sumPnlUsd));
  const leader =
    leaderStrategyId != null
      ? resolveBtcQuantStrategyById(leaderStrategyId)
      : resolveBtcQuantStrategyById(ranked[0]?.strategyId ?? 14);
  if (!leader) throw new Error("Invalid leader strategy");

  cfg.enabled = true;
  cfg.startedAt = cfg.startedAt ?? new Date();
  cfg.agentAddress = wallet.agentAddress;
  cfg.anonymousId = investAid;
  cfg.leaderStrategyId = leader.id;
  if (maxNotionalUsd != null && Number.isFinite(Number(maxNotionalUsd))) {
    cfg.maxNotionalUsd = Math.max(10, Number(maxNotionalUsd));
  }
  cfg.lastEnabledBy = enabledBy || anonymousId;
  cfg.lastError = null;
  cfg.closeAllRequested = false;
  await cfg.save();

  return getBtcQuantRealState({ viewerAnonymousId: anonymousId });
}

export async function disableBtcQuantReal({ anonymousId }) {
  const cfg = await getOrCreateRealConfig();
  cfg.enabled = false;
  cfg.closeAllRequested = true;
  cfg.lastError = null;
  await cfg.save();
  return getBtcQuantRealState({ viewerAnonymousId: anonymousId });
}

export async function runBtcQuantRealSignalCycle() {
  const cfg = await getOrCreateRealConfig();
  if (!cfg.enabled) return { skipped: true, reason: "disabled" };
  if (!cfg.anonymousId || !cfg.agentAddress) {
    return { skipped: true, reason: "no_wallet" };
  }

  await runBtcQuantSignalCycle();
  await resolveOpenBtcQuantRuns();

  const openCount = await BtcQuantRealPosition.countDocuments({
    experimentId: cfg.experimentId,
    status: { $in: ["open", "opening", "closing"] },
  });
  if (openCount > 0) {
    await BtcQuantRealConfig.updateOne(
      { _id: "singleton" },
      { $set: { lastSignalAt: new Date(), lastError: "holding_open_position" } },
    );
    return { skipped: true, reason: "holding_open_position" };
  }

  const strategy = resolveBtcQuantStrategyById(cfg.leaderStrategyId ?? 14);
  if (!strategy) {
    return { skipped: true, reason: "invalid_strategy" };
  }

  const simOpen = await TradingExperimentRun.findOne({
    suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
    "summary.experimentId": cfg.experimentId,
    agentId: strategy.id,
    status: "open",
    clearSignal: "BUY",
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!simOpen) {
    await BtcQuantRealConfig.updateOne(
      { _id: "singleton" },
      { $set: { lastSignalAt: new Date(), lastError: "no_sim_buy_signal" } },
    );
    return { skipped: true, reason: "no_sim_buy_signal" };
  }

  const notionalUsd = Math.min(
    toNum(simOpen.notionalUsd, cfg.maxNotionalUsd),
    toNum(cfg.maxNotionalUsd, 200),
  );
  const usdcRaw = usdcRawFromUsd(notionalUsd);
  if (usdcRaw <= 0n) {
    return { skipped: true, reason: "zero_notional" };
  }

  const position = await BtcQuantRealPosition.create({
    experimentId: cfg.experimentId,
    strategyId: strategy.id,
    strategyName: strategy.name,
    bar: strategy.bar,
    cexSource: strategy.dataSource,
    simRunId: simOpen._id,
    inputMint: BTC_QUANT_SWAP_MINTS.usdc,
    outputMint: BTC_QUANT_SWAP_MINTS.cbbtc,
    entryPriceUsd: simOpen.entry,
    stopLoss: simOpen.stopLoss,
    firstTarget: simOpen.firstTarget,
    notionalUsd,
    usdcSpentRaw: usdcRaw.toString(),
    status: "opening",
    openedAt: new Date(),
  });

  try {
    const swap = await executeBtcQuantJupiterSwap({
      anonymousId: cfg.anonymousId,
      agentAddress: cfg.agentAddress,
      inputMint: BTC_QUANT_SWAP_MINTS.usdc,
      outputMint: BTC_QUANT_SWAP_MINTS.cbbtc,
      amountRaw: usdcRaw.toString(),
      estimatedUsd: notionalUsd,
      summary: `BTC quant real: USDC→cbBTC (${strategy.name})`,
      slippageBps: cfg.slippageBps ?? 50,
    });

    if (swap.skipped) {
      await BtcQuantRealPosition.updateOne(
        { _id: position._id },
        { $set: { status: "error", errorMessage: "swap_skipped", resolvedAt: new Date() } },
      );
      return { skipped: true, reason: "swap_skipped" };
    }

    await BtcQuantRealPosition.updateOne(
      { _id: position._id },
      {
        $set: {
          status: "open",
          openTxSig: swap.signature,
          cbbtcAmountRaw: swap.outAmount,
        },
      },
    );
    await BtcQuantRealConfig.updateOne(
      { _id: "singleton" },
      { $set: { lastSignalAt: new Date(), lastError: null } },
    );

    return {
      opened: true,
      positionId: String(position._id),
      txSig: swap.signature,
      notionalUsd,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await BtcQuantRealPosition.updateOne(
      { _id: position._id },
      { $set: { status: "error", errorMessage: msg, resolvedAt: new Date() } },
    );
    await BtcQuantRealConfig.updateOne(
      { _id: "singleton" },
      { $set: { lastSignalAt: new Date(), lastError: msg } },
    );
    return { error: msg };
  }
}

export async function resolveBtcQuantRealPositions() {
  const cfg = await getOrCreateRealConfig();
  if (!cfg.enabled || !cfg.anonymousId || !cfg.agentAddress) {
    return { skipped: true, reason: "disabled" };
  }

  const px = await fetchBtcSpotPrice();
  if (!(px > 0)) return { resolved: 0, errors: ["no_price"] };

  const openPositions = await BtcQuantRealPosition.find({
    experimentId: cfg.experimentId,
    status: "open",
    processing: { $ne: true },
  }).lean();

  let resolved = 0;
  const errors = [];

  for (const pos of openPositions) {
    const entry = toNum(pos.entryPriceUsd);
    const sl = toNum(pos.stopLoss);
    const tp = toNum(pos.firstTarget);
    const notional = toNum(pos.notionalUsd);

    let shouldClose = false;
    let finalStatus = "closed_loss";
    if (px >= tp) {
      shouldClose = true;
      finalStatus = "closed_win";
    } else if (px <= sl) {
      shouldClose = true;
      finalStatus = "closed_loss";
    } else if (cfg.closeAllRequested) {
      shouldClose = true;
      finalStatus = px >= entry ? "closed_win" : "closed_loss";
    }

    if (!shouldClose) continue;

    const locked = await BtcQuantRealPosition.updateOne(
      { _id: pos._id, status: "open", processing: { $ne: true } },
      { $set: { processing: true, status: "closing" } },
    );
    if (locked.modifiedCount === 0) continue;

    try {
      const cbbtcRaw = pos.cbbtcAmountRaw || "0";
      const swap = await executeBtcQuantJupiterSwap({
        anonymousId: cfg.anonymousId,
        agentAddress: cfg.agentAddress,
        inputMint: BTC_QUANT_SWAP_MINTS.cbbtc,
        outputMint: BTC_QUANT_SWAP_MINTS.usdc,
        amountRaw: cbbtcRaw,
        estimatedUsd: notional,
        summary: `BTC quant real: cbBTC→USDC close (${pos.strategyName})`,
        slippageBps: cfg.slippageBps ?? 50,
      });

      const exitPx = px;
      const pnlUsd =
        entry > 0 && exitPx > 0 ? Math.round((notional * (exitPx / entry - 1)) * 100) / 100 : 0;

      await BtcQuantRealPosition.updateOne(
        { _id: pos._id },
        {
          $set: {
            status: finalStatus,
            resolution: finalStatus === "closed_win" ? "take_profit" : "stop_or_market",
            closeTxSig: swap.signature,
            realExitPriceUsd: exitPx,
            realNetPnlUsd: pnlUsd,
            resolvedAt: new Date(),
            processing: false,
          },
        },
      );
      resolved += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await BtcQuantRealPosition.updateOne(
        { _id: pos._id },
        { $set: { status: "error", errorMessage: msg, processing: false, resolvedAt: new Date() } },
      );
      errors.push({ positionId: String(pos._id), error: msg });
    }
  }

  await BtcQuantRealConfig.updateOne(
    { _id: "singleton" },
    {
      $set: {
        lastResolveAt: new Date(),
        lastError: errors.length ? errors[0]?.error : null,
        closeAllRequested: cfg.closeAllRequested && resolved === 0 ? cfg.closeAllRequested : false,
      },
    },
  );

  return { resolved, stillOpen: openPositions.length - resolved, errors };
}
