/**
 * BTC quant real agent — onchain cbBTC spot-long via Jupiter from custodial invest wallet.
 * Supports paper-sim lanes btc1 and btc2 (separate config + positions per lane).
 */
import AgentWallet from "../models/agent/AgentWallet.js";
import BtcQuantRealConfig from "../models/BtcQuantRealConfig.js";
import BtcQuantRealPosition from "../models/BtcQuantRealPosition.js";
import TradingExperimentRun from "../models/TradingExperimentRun.js";
import {
  BTC_QUANT_QUOTE_DECIMALS,
  EXPERIMENT_SUITE_BTC_ONCHAIN,
} from "../config/tradingExperimentStrategies.js";
import {
  ensureBtcQuantBootstrapped,
  getBtcQuantStats,
  resolveOpenBtcQuantRuns,
  runBtcQuantSignalCycle,
} from "./btcQuantExperimentService.js";
import {
  pickBestBtcQuantStrategy,
  getBtcQuantEvolutionSnapshot,
  getEvolutionCooldownStrategyIds,
} from "./btcQuantExperimentEvolution.js";
import { resolveBtcQuantStrategyById } from "./btcQuantStrategyResolve.js";
import { executeBtcQuantJupiterSwap, BTC_QUANT_SWAP_MINTS } from "./btcQuantJupiterSwap.js";
import BtcQuantExperimentState from "../models/BtcQuantExperimentState.js";
import { siblingAnonymousId, purposeQuery } from "./agentWalletPurpose.js";
import { fetchCbbtcSpotPriceUsd } from "./btcQuantOnchainMarket.js";
import {
  BTC_QUANT_LANE_IDS,
  getBtcQuantLaneDef,
  normalizeBtcQuantLane,
} from "../config/btcQuantLanes.js";
import { shouldTouchRealConfigMeta } from "../utils/mongoHeartbeatWrite.js";

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

function realConfigId(lane) {
  return getBtcQuantLaneDef(lane).stateId;
}

function realTitle(lane) {
  const laneDef = getBtcQuantLaneDef(lane);
  return laneDef.lane === "btc2"
    ? "BTC quant agent real (cbBTC)"
    : "BTC quant real (cbBTC)";
}

export function isBtcQuantRealCronEnabled() {
  const env = String(process.env.BTC_QUANT_REAL_CRON_ENABLED || "").trim().toLowerCase();
  return env === "1" || env === "true" || env === "yes";
}

async function fetchBtcSpotPrice() {
  return fetchCbbtcSpotPriceUsd();
}

/**
 * @param {unknown} [lane]
 */
async function getOrCreateRealConfig(lane = "btc1") {
  const laneKey = normalizeBtcQuantLane(lane);
  const laneDef = getBtcQuantLaneDef(laneKey);
  await ensureBtcQuantBootstrapped(laneKey);
  const state = await BtcQuantExperimentState.findById(laneDef.stateId).lean();
  const experimentId = state?.activeExperimentId;
  const configId = realConfigId(laneKey);

  let cfg = await BtcQuantRealConfig.findById(configId);
  if (!cfg) {
    cfg = await BtcQuantRealConfig.create({
      _id: configId,
      lane: laneKey,
      enabled: false,
      experimentId,
      title: realTitle(laneKey),
    });
  } else {
    let dirty = false;
    if (cfg.experimentId !== experimentId) {
      cfg.experimentId = experimentId;
      dirty = true;
    }
    if (cfg.lane !== laneKey) {
      cfg.lane = laneKey;
      dirty = true;
    }
    if (dirty) await cfg.save();
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

/** Legacy btc1 positions may omit `lane`; treat missing as btc1. */
function lanePositionFilter(laneKey) {
  if (laneKey === "btc1") {
    return { $or: [{ lane: "btc1" }, { lane: { $exists: false } }, { lane: null }] };
  }
  return { lane: laneKey };
}

/**
 * @param {{ viewerAnonymousId?: string | null; lane?: string }} [opts]
 */
export async function getBtcQuantRealState({ viewerAnonymousId, lane = "btc1" } = {}) {
  const laneKey = normalizeBtcQuantLane(lane);
  const cfg = await getOrCreateRealConfig(laneKey);
  const [openPositions, closedAgg] = await Promise.all([
    BtcQuantRealPosition.countDocuments({
      experimentId: cfg.experimentId,
      ...lanePositionFilter(laneKey),
      status: { $in: ["open", "opening", "closing"] },
    }),
    BtcQuantRealPosition.aggregate([
      {
        $match: {
          experimentId: cfg.experimentId,
          ...lanePositionFilter(laneKey),
          status: { $in: ["closed_win", "closed_loss", "expired"] },
        },
      },
      {
        $group: {
          _id: null,
          realizedPnlUsd: { $sum: { $ifNull: ["$realNetPnlUsd", 0] } },
          wins: { $sum: { $cond: [{ $eq: ["$status", "closed_win"] }, 1, 0] } },
          losses: { $sum: { $cond: [{ $eq: ["$status", "closed_loss"] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const realizedPnlUsd = toNum(closedAgg[0]?.realizedPnlUsd);
  const wins = toNum(closedAgg[0]?.wins);
  const losses = toNum(closedAgg[0]?.losses);
  const decided = wins + losses;

  return {
    lane: laneKey,
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

/**
 * @param {{ limit?: number; offset?: number; status?: string; experimentId?: string; lane?: string }} [opts]
 */
export async function listBtcQuantRealPositions({
  limit,
  offset,
  status,
  experimentId,
  lane = "btc1",
} = {}) {
  const laneKey = normalizeBtcQuantLane(lane);
  const cfg = await getOrCreateRealConfig(laneKey);
  const expId = experimentId || cfg.experimentId;
  const filter = { experimentId: expId, ...lanePositionFilter(laneKey) };
  if (status) filter.status = status;
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  const [positions, total] = await Promise.all([
    BtcQuantRealPosition.find(filter).sort({ openedAt: -1 }).skip(off).limit(lim).lean(),
    BtcQuantRealPosition.countDocuments(filter),
  ]);
  return {
    lane: laneKey,
    positions: positions.map((p) => ({
      ...p,
      dataSource: p.dataSource ?? p.cexSource ?? null,
    })),
    total,
  };
}

/**
 * @param {{
 *   anonymousId: string;
 *   enabledBy?: string;
 *   leaderStrategyId?: number;
 *   maxNotionalUsd?: number;
 *   lane?: string;
 * }} input
 */
export async function enableBtcQuantReal({
  anonymousId,
  enabledBy,
  leaderStrategyId,
  maxNotionalUsd,
  lane = "btc1",
}) {
  if (!anonymousId) throw new Error("anonymousId required");
  const laneKey = normalizeBtcQuantLane(lane);
  const wallet = await resolveInvestWallet(anonymousId);
  const investAid = siblingAnonymousId(anonymousId, "invest");
  const cfg = await getOrCreateRealConfig(laneKey);

  const stats = await getBtcQuantStats(laneKey);
  const best = stats.experimentId ? await pickBestBtcQuantStrategy(stats.experimentId) : null;
  const leader =
    leaderStrategyId != null
      ? await resolveBtcQuantStrategyById(laneKey, leaderStrategyId)
      : best
        ? await resolveBtcQuantStrategyById(laneKey, best.strategyId)
        : await resolveBtcQuantStrategyById(laneKey, 14);
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

  return getBtcQuantRealState({ viewerAnonymousId: anonymousId, lane: laneKey });
}

/**
 * @param {{ anonymousId: string; lane?: string }} input
 */
export async function disableBtcQuantReal({ anonymousId, lane = "btc1" }) {
  const laneKey = normalizeBtcQuantLane(lane);
  const cfg = await getOrCreateRealConfig(laneKey);
  cfg.enabled = false;
  cfg.closeAllRequested = true;
  cfg.lastError = null;
  await cfg.save();
  return getBtcQuantRealState({ viewerAnonymousId: anonymousId, lane: laneKey });
}

/**
 * @param {unknown} [lane]
 */
export async function runBtcQuantRealSignalCycle(lane = "btc1") {
  const laneKey = normalizeBtcQuantLane(lane);
  const configId = realConfigId(laneKey);
  const cfg = await getOrCreateRealConfig(laneKey);
  if (!cfg.enabled) return { lane: laneKey, skipped: true, reason: "disabled" };
  if (!cfg.anonymousId || !cfg.agentAddress) {
    return { lane: laneKey, skipped: true, reason: "no_wallet" };
  }

  await runBtcQuantSignalCycle(laneKey);
  await resolveOpenBtcQuantRuns(laneKey);

  const openCount = await BtcQuantRealPosition.countDocuments({
    experimentId: cfg.experimentId,
    ...lanePositionFilter(laneKey),
    status: { $in: ["open", "opening", "closing"] },
  });
  if (openCount > 0) {
    if (shouldTouchRealConfigMeta(cfg, "holding_open_position", "signal")) {
      await BtcQuantRealConfig.updateOne(
        { _id: configId },
        { $set: { lastSignalAt: new Date(), lastError: "holding_open_position" } },
      );
    }
    return { lane: laneKey, skipped: true, reason: "holding_open_position" };
  }

  // Refresh leader from sim when a better qualified strategy exists (do not freeze forever at enable).
  const best = cfg.experimentId ? await pickBestBtcQuantStrategy(cfg.experimentId) : null;
  if (!best) {
    if (shouldTouchRealConfigMeta(cfg, "no_qualified_leader", "signal")) {
      await BtcQuantRealConfig.updateOne(
        { _id: configId },
        { $set: { lastSignalAt: new Date(), lastError: "no_qualified_leader" } },
      );
    }
    return { lane: laneKey, skipped: true, reason: "no_qualified_leader" };
  }
  if (best.strategyId !== cfg.leaderStrategyId) {
    cfg.leaderStrategyId = best.strategyId;
    await BtcQuantRealConfig.updateOne(
      { _id: configId },
      { $set: { leaderStrategyId: best.strategyId, lastError: null } },
    );
  }

  const cooldownIds = await getEvolutionCooldownStrategyIds(laneKey);
  if (cooldownIds.has(Number(cfg.leaderStrategyId))) {
    if (shouldTouchRealConfigMeta(cfg, "leader_on_cooldown", "signal")) {
      await BtcQuantRealConfig.updateOne(
        { _id: configId },
        { $set: { lastSignalAt: new Date(), lastError: "leader_on_cooldown" } },
      );
    }
    return { lane: laneKey, skipped: true, reason: "leader_on_cooldown" };
  }

  const evoSnap = await getBtcQuantEvolutionSnapshot(laneKey);
  const notionalMult = Math.min(
    1,
    Math.max(0.25, toNum(evoSnap?.thresholdOverrides?.maxNotionalMultiplier, 1)),
  );

  const strategy = await resolveBtcQuantStrategyById(laneKey, cfg.leaderStrategyId ?? 14);
  if (!strategy) {
    return { lane: laneKey, skipped: true, reason: "invalid_strategy" };
  }

  const laneRunFilter =
    laneKey === "btc1"
      ? {
          $or: [
            { "summary.lane": "btc1" },
            { "summary.lane": { $exists: false } },
            { "summary.lane": null },
          ],
        }
      : { "summary.lane": laneKey };

  const simOpen = await TradingExperimentRun.findOne({
    suite: EXPERIMENT_SUITE_BTC_ONCHAIN,
    "summary.experimentId": cfg.experimentId,
    ...laneRunFilter,
    agentId: strategy.id,
    status: "open",
    clearSignal: "BUY",
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!simOpen) {
    if (shouldTouchRealConfigMeta(cfg, "no_sim_buy_signal", "signal")) {
      await BtcQuantRealConfig.updateOne(
        { _id: configId },
        { $set: { lastSignalAt: new Date(), lastError: "no_sim_buy_signal" } },
      );
    }
    return { lane: laneKey, skipped: true, reason: "no_sim_buy_signal" };
  }

  const notionalUsd =
    Math.min(toNum(simOpen.notionalUsd, cfg.maxNotionalUsd), toNum(cfg.maxNotionalUsd, 200)) *
    notionalMult;
  const usdcRaw = usdcRawFromUsd(notionalUsd);
  if (usdcRaw <= 0n) {
    return { lane: laneKey, skipped: true, reason: "zero_notional" };
  }

  const position = await BtcQuantRealPosition.create({
    experimentId: cfg.experimentId,
    lane: laneKey,
    strategyId: strategy.id,
    strategyName: strategy.name,
    bar: strategy.bar,
    dataSource: strategy.dataSource,
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
      summary: `BTC quant ${laneKey} real: USDC→cbBTC (${strategy.name})`,
      slippageBps: cfg.slippageBps ?? 50,
    });

    if (swap.skipped) {
      await BtcQuantRealPosition.updateOne(
        { _id: position._id },
        { $set: { status: "error", errorMessage: "swap_skipped", resolvedAt: new Date() } },
      );
      return { lane: laneKey, skipped: true, reason: "swap_skipped" };
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
      { _id: configId },
      { $set: { lastSignalAt: new Date(), lastError: null } },
    );

    return {
      lane: laneKey,
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
      { _id: configId },
      { $set: { lastSignalAt: new Date(), lastError: msg } },
    );
    return { lane: laneKey, error: msg };
  }
}

/**
 * @param {unknown} [lane]
 */
export async function resolveBtcQuantRealPositions(lane = "btc1") {
  const laneKey = normalizeBtcQuantLane(lane);
  const configId = realConfigId(laneKey);
  const cfg = await getOrCreateRealConfig(laneKey);
  if (!cfg.enabled || !cfg.anonymousId || !cfg.agentAddress) {
    return { lane: laneKey, skipped: true, reason: "disabled" };
  }

  const px = await fetchBtcSpotPrice();
  if (!(px > 0)) return { lane: laneKey, resolved: 0, errors: ["no_price"] };

  const openPositions = await BtcQuantRealPosition.find({
    experimentId: cfg.experimentId,
    ...lanePositionFilter(laneKey),
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
        summary: `BTC quant ${laneKey} real: cbBTC→USDC close (${pos.strategyName})`,
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

  const nextError = errors.length ? errors[0]?.error : null;
  const closeAllRequested =
    cfg.closeAllRequested && resolved === 0 ? cfg.closeAllRequested : false;
  if (
    closeAllRequested !== cfg.closeAllRequested ||
    shouldTouchRealConfigMeta(cfg, nextError, "resolve")
  ) {
    await BtcQuantRealConfig.updateOne(
      { _id: configId },
      {
        $set: {
          lastResolveAt: new Date(),
          lastError: nextError,
          closeAllRequested,
        },
      },
    );
  }

  return { lane: laneKey, resolved, stillOpen: openPositions.length - resolved, errors };
}

export async function runAllBtcQuantRealSignalCycles() {
  /** @type {Record<string, Awaited<ReturnType<typeof runBtcQuantRealSignalCycle>>>} */
  const lanes = {};
  for (const lane of BTC_QUANT_LANE_IDS) {
    lanes[lane] = await runBtcQuantRealSignalCycle(lane);
  }
  return { lanes };
}

export async function resolveAllBtcQuantRealPositions() {
  /** @type {Record<string, Awaited<ReturnType<typeof resolveBtcQuantRealPositions>>>} */
  const lanes = {};
  for (const lane of BTC_QUANT_LANE_IDS) {
    lanes[lane] = await resolveBtcQuantRealPositions(lane);
  }
  return { lanes };
}
