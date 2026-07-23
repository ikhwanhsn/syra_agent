/**
 * BTC3 Macro Intelligence — real USDC ↔ cbBTC allocation via Jupiter.
 * Mirrors paper target allocation onto the user's custodial invest wallet.
 */
import AgentWallet from "../../models/agent/AgentWallet.js";
import Btc3RealConfig from "../../models/btc3/Btc3RealConfig.js";
import Btc3RealRebalance from "../../models/btc3/Btc3RealRebalance.js";
import Btc3AllocationDecision from "../../models/btc3/AllocationDecision.js";
import {
  BTC_QUANT_QUOTE_DECIMALS,
  CBBTC_DECIMALS,
  CBBTC_MINT,
  BTC_QUANT_QUOTE_MINT,
} from "../../config/tradingExperimentStrategies.js";
import { executeBtcQuantJupiterSwap, BTC_QUANT_SWAP_MINTS } from "../btcQuantJupiterSwap.js";
import { fetchAgentWalletPortfolio } from "../agentWalletPortfolio.js";
import { siblingAnonymousId, purposeQuery } from "../agentWalletPurpose.js";
import { fetchCbbtcSpotPriceUsd } from "../btcQuantOnchainMarket.js";
import { ensureBtc3PaperBootstrapped } from "./btc3PaperTradingService.js";
import { getEffectiveBtc3PaperConfig } from "./btc3LearningService.js";
import { agentStateRepo } from "../../repositories/btc3/index.js";
import { computeAgentReturnPct, roundUsd } from "../../config/tradingExperimentSim.js";
import {
  shouldTouchRealConfigMeta,
  shouldWriteBtc3SkipRebalance,
} from "../../utils/mongoHeartbeatWrite.js";

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;
const MIN_SWAP_USD = 5;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeLimit(limit) {
  const n = Number(limit);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIST_LIMIT;
  return Math.min(MAX_LIST_LIMIT, Math.floor(n));
}

export function isBtc3RealCronEnabled() {
  const env = String(process.env.BTC3_REAL_CRON_ENABLED || "").trim().toLowerCase();
  return env === "1" || env === "true" || env === "yes";
}

/**
 * Throttle skip-row inserts; always clear processing lock.
 * @param {import('mongoose').Document} cfg
 * @param {Record<string, unknown>} skipDoc
 * @param {string | null} lastError
 */
async function finishSkip(cfg, skipDoc, lastError) {
  let rebalance = null;
  if (shouldWriteBtc3SkipRebalance(cfg.lastRebalanceAt)) {
    rebalance = await Btc3RealRebalance.create(skipDoc);
  }
  const patch = { processing: false };
  if (shouldTouchRealConfigMeta(cfg, lastError, "rebalance") || rebalance) {
    patch.lastError = lastError;
    patch.lastRebalanceAt = new Date();
  }
  await Btc3RealConfig.updateOne({ _id: "singleton" }, { $set: patch });
  return rebalance;
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

async function getOrCreateRealConfig() {
  await ensureBtc3PaperBootstrapped();
  const state = await agentStateRepo.getState();
  const experimentId = state?.activeExperimentId ?? null;

  let cfg = await Btc3RealConfig.findById("singleton");
  if (!cfg) {
    cfg = await Btc3RealConfig.create({
      _id: "singleton",
      enabled: false,
      experimentId,
      title: "BTC3 macro real (cbBTC allocation)",
    });
  } else if (cfg.experimentId !== experimentId && experimentId) {
    cfg.experimentId = experimentId;
    await cfg.save();
  }
  return cfg;
}

/**
 * Read USDC + cbBTC balances from invest wallet.
 * @param {string} agentAddress
 * @param {number} btcPriceUsd
 */
async function readWalletAllocation(agentAddress, btcPriceUsd) {
  const portfolio = await fetchAgentWalletPortfolio(agentAddress);
  const tokens = Array.isArray(portfolio.tokens) ? portfolio.tokens : [];

  let usdcAmount = 0;
  let btcAmount = 0;
  let usdcRaw = 0n;
  let cbbtcRaw = 0n;

  for (const t of tokens) {
    const mint = String(t.mint || "");
    const amount = toNum(t.amount);
    if (mint === BTC_QUANT_QUOTE_MINT || mint === BTC_QUANT_SWAP_MINTS.usdc) {
      usdcAmount += amount;
      usdcRaw += BigInt(Math.max(0, Math.floor(amount * 10 ** BTC_QUANT_QUOTE_DECIMALS)));
    }
    if (mint === CBBTC_MINT || mint === BTC_QUANT_SWAP_MINTS.cbbtc) {
      btcAmount += amount;
      cbbtcRaw += BigInt(Math.max(0, Math.floor(amount * 10 ** CBBTC_DECIMALS)));
    }
  }

  const btcUsd = btcAmount * btcPriceUsd;
  const totalUsd = roundUsd(usdcAmount + btcUsd);
  const btcPct = totalUsd > 0 ? roundUsd((btcUsd / totalUsd) * 100) : 0;
  const usdcPct = totalUsd > 0 ? roundUsd(100 - btcPct) : 100;

  return {
    usdcAmount: roundUsd(usdcAmount),
    btcAmount,
    btcUsd: roundUsd(btcUsd),
    totalUsd,
    btcPct,
    usdcPct,
    usdcRaw,
    cbbtcRaw,
  };
}

/**
 * @param {{ viewerAnonymousId?: string | null }} [opts]
 */
export async function getBtc3RealState({ viewerAnonymousId } = {}) {
  const cfg = await getOrCreateRealConfig();
  const executedAgg = await Btc3RealRebalance.aggregate([
    { $match: { experimentId: cfg.experimentId, status: "executed" } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        realizedNetPnlUsd: { $sum: { $ifNull: ["$realNetPnlUsd", 0] } },
      },
    },
  ]);
  const executedCount = toNum(executedAgg[0]?.count);
  const realizedNetPnlUsd = toNum(executedAgg[0]?.realizedNetPnlUsd);
  let walletAllocation = null;
  let equityUsd = null;
  let returnPct = null;

  if (cfg.agentAddress) {
    try {
      const btcPrice = (await fetchCbbtcSpotPriceUsd()) || 0;
      if (btcPrice > 0) {
        walletAllocation = await readWalletAllocation(cfg.agentAddress, btcPrice);
        equityUsd = walletAllocation.totalUsd;
        const baseline = toNum(cfg.capitalBaselineUsd, equityUsd);
        returnPct = computeAgentReturnPct(equityUsd, baseline > 0 ? baseline : equityUsd);
      }
    } catch {
      /* portfolio read is best-effort for state */
    }
  }

  return {
    enabled: cfg.enabled,
    experimentId: cfg.experimentId,
    title: cfg.title,
    startedAt: cfg.startedAt?.toISOString?.() ?? null,
    agentAddress: cfg.agentAddress,
    maxNotionalUsd: cfg.maxNotionalUsd,
    reserveUsdc: cfg.reserveUsdc,
    minRebalancePct: cfg.minRebalancePct,
    slippageBps: cfg.slippageBps,
    lastRebalanceAt: cfg.lastRebalanceAt?.toISOString?.() ?? null,
    lastError: cfg.lastError,
    capitalBaselineUsd: cfg.capitalBaselineUsd,
    executedRebalances: executedCount,
    realizedNetPnlUsd: roundUsd(realizedNetPnlUsd),
    equityUsd,
    returnPct,
    walletAllocation,
    canEnable: Boolean(viewerAnonymousId),
    cronEnabled: isBtc3RealCronEnabled(),
    onchain: {
      venue: "Solana",
      inputMint: BTC_QUANT_SWAP_MINTS.usdc,
      outputMint: BTC_QUANT_SWAP_MINTS.cbbtc,
      execution: "Jupiter",
    },
  };
}

/**
 * @param {{ limit?: number; offset?: number; status?: string }} [opts]
 */
export async function listBtc3RealRebalances({ limit, offset, status } = {}) {
  const cfg = await getOrCreateRealConfig();
  const filter = { experimentId: cfg.experimentId };
  if (status) filter.status = status;
  const lim = normalizeLimit(limit);
  const off = Math.max(0, Number(offset) || 0);
  const [items, total] = await Promise.all([
    Btc3RealRebalance.find(filter).sort({ createdAt: -1 }).skip(off).limit(lim).lean(),
    Btc3RealRebalance.countDocuments(filter),
  ]);
  return { items, total };
}

/**
 * @param {{
 *   anonymousId: string;
 *   enabledBy?: string;
 *   maxNotionalUsd?: number;
 *   minRebalancePct?: number;
 * }} input
 */
export async function enableBtc3Real({
  anonymousId,
  enabledBy,
  maxNotionalUsd,
  minRebalancePct,
}) {
  if (!anonymousId) throw new Error("anonymousId required");
  const wallet = await resolveInvestWallet(anonymousId);
  const investAid = siblingAnonymousId(anonymousId, "invest");
  const cfg = await getOrCreateRealConfig();

  const btcPrice = (await fetchCbbtcSpotPriceUsd()) || 0;
  let baseline = toNum(cfg.capitalBaselineUsd);
  if (btcPrice > 0) {
    try {
      const alloc = await readWalletAllocation(wallet.agentAddress, btcPrice);
      if (!(baseline > 0) && alloc.totalUsd > 0) {
        baseline = alloc.totalUsd;
      }
    } catch {
      /* ignore */
    }
  }

  cfg.enabled = true;
  cfg.startedAt = cfg.startedAt ?? new Date();
  cfg.agentAddress = wallet.agentAddress;
  cfg.anonymousId = investAid;
  if (maxNotionalUsd != null && Number.isFinite(Number(maxNotionalUsd))) {
    cfg.maxNotionalUsd = Math.max(10, Number(maxNotionalUsd));
  }
  if (minRebalancePct != null && Number.isFinite(Number(minRebalancePct))) {
    cfg.minRebalancePct = Math.min(50, Math.max(0.5, Number(minRebalancePct)));
  }
  if (baseline > 0) cfg.capitalBaselineUsd = baseline;
  cfg.lastEnabledBy = enabledBy || anonymousId;
  cfg.lastError = null;
  cfg.processing = false;
  await cfg.save();

  return getBtc3RealState({ viewerAnonymousId: anonymousId });
}

/**
 * @param {{ anonymousId: string }} input
 */
export async function disableBtc3Real({ anonymousId }) {
  const cfg = await getOrCreateRealConfig();
  cfg.enabled = false;
  cfg.lastError = null;
  cfg.processing = false;
  await cfg.save();
  return getBtc3RealState({ viewerAnonymousId: anonymousId });
}

/**
 * Execute a real rebalance toward target allocation (called from pipeline or cron).
 * @param {{
 *   decisionId?: import('mongoose').Types.ObjectId | string;
 *   macroEventId?: import('mongoose').Types.ObjectId | string;
 *   targetAllocation?: { btcPct: number; usdcPct: number };
 *   headline?: string;
 *   confidence?: number;
 * }} [input]
 */
export async function applyRealRebalance(input = {}) {
  const cfg = await getOrCreateRealConfig();
  if (!cfg.enabled) {
    return { applied: false, reason: "disabled" };
  }
  if (!cfg.anonymousId || !cfg.agentAddress) {
    return { applied: false, reason: "no_wallet" };
  }
  if (cfg.processing) {
    return { applied: false, reason: "busy" };
  }

  const locked = await Btc3RealConfig.updateOne(
    { _id: "singleton", enabled: true, processing: { $ne: true } },
    { $set: { processing: true } },
  );
  if (locked.modifiedCount === 0) {
    return { applied: false, reason: "busy" };
  }

  try {
    const state = await agentStateRepo.getState();
    const experimentId = cfg.experimentId || state?.activeExperimentId;

    let targetBtcPct = toNum(input.targetAllocation?.btcPct);
    let headline = input.headline ?? "";
    let confidence = toNum(input.confidence);
    let decisionId = input.decisionId ?? null;
    let macroEventId = input.macroEventId ?? null;

    if (!(targetBtcPct > 0) || targetBtcPct > 100) {
      const pending = await Btc3AllocationDecision.findOne({
        status: { $in: ["pending", "executed"] },
      })
        .sort({ createdAt: -1 })
        .lean();
      if (pending?.targetAllocation?.btcPct != null) {
        targetBtcPct = toNum(pending.targetAllocation.btcPct);
        headline = pending.headline || headline;
        confidence = toNum(pending.confidence, confidence);
        decisionId = decisionId || pending._id;
        macroEventId = macroEventId || pending.macroEventId;
      } else if (state?.targetPortfolio?.btcPct != null) {
        targetBtcPct = toNum(state.targetPortfolio.btcPct);
      }
    }

    if (!(targetBtcPct >= 0) || targetBtcPct > 100) {
      await Btc3RealConfig.updateOne(
        { _id: "singleton" },
        { $set: { processing: false, lastError: "no_target_allocation" } },
      );
      return { applied: false, reason: "no_target_allocation" };
    }

    const btcPriceUsd = await fetchCbbtcSpotPriceUsd();
    if (!(btcPriceUsd > 0)) {
      await Btc3RealConfig.updateOne(
        { _id: "singleton" },
        { $set: { processing: false, lastError: "no_price" } },
      );
      return { applied: false, reason: "no_price" };
    }

    const before = await readWalletAllocation(cfg.agentAddress, btcPriceUsd);
    const reserveUsdc = toNum(cfg.reserveUsdc, 25);
    const maxNotional = toNum(cfg.maxNotionalUsd, 200);

    // Wire paper learning overrides into real so learned gates actually protect capital.
    const paperCfg = await getEffectiveBtc3PaperConfig(state).catch(() => null);
    const minRebalancePct = Math.max(
      toNum(cfg.minRebalancePct, 5),
      toNum(paperCfg?.minRebalancePct, 0),
    );
    const minConfidence = toNum(paperCfg?.minConfidence, 0);
    const maxBtcTiltPct =
      paperCfg?.maxBtcTiltPct != null ? toNum(paperCfg.maxBtcTiltPct) : null;
    const diffPct = Math.abs(targetBtcPct - before.btcPct);

    const skipBase = {
      experimentId,
      decisionId,
      macroEventId,
      direction: "hold",
      headline,
      confidence,
      btcPriceUsd,
      notionalUsd: 0,
      beforeAllocation: {
        btcPct: before.btcPct,
        usdcPct: before.usdcPct,
        totalUsd: before.totalUsd,
      },
      afterAllocation: {
        btcPct: before.btcPct,
        usdcPct: before.usdcPct,
        totalUsd: before.totalUsd,
      },
      equityUsd: before.totalUsd,
      targetBtcPct,
    };

    if (before.totalUsd < MIN_SWAP_USD + reserveUsdc) {
      const skipped = await finishSkip(
        cfg,
        { ...skipBase, status: "skipped_insufficient" },
        "insufficient_wallet_balance",
      );
      return { applied: false, reason: "insufficient_wallet_balance", rebalance: skipped };
    }

    if (minConfidence > 0 && confidence > 0 && confidence < minConfidence) {
      const skipped = await finishSkip(
        cfg,
        { ...skipBase, status: "skipped_below_threshold" },
        "below_confidence",
      );
      return { applied: false, reason: "below_confidence", rebalance: skipped };
    }

    if (maxBtcTiltPct != null && diffPct > maxBtcTiltPct) {
      const skipped = await finishSkip(
        cfg,
        { ...skipBase, status: "skipped_below_threshold" },
        "max_tilt_exceeded",
      );
      return { applied: false, reason: "max_tilt_exceeded", rebalance: skipped };
    }

    if (diffPct < minRebalancePct) {
      const skipped = await finishSkip(cfg, { ...skipBase, status: "skipped_below_threshold" }, null);
      return { applied: false, reason: "below_threshold", rebalance: skipped };
    }

    const targetBtcUsd = before.totalUsd * (targetBtcPct / 100);
    const deltaUsd = targetBtcUsd - before.btcUsd;
    let direction = "hold";
    let notionalUsd = 0;
    let inputMint = null;
    let outputMint = null;
    let amountRaw = 0n;

    if (deltaUsd > MIN_SWAP_USD) {
      direction = "buy_btc";
      const spendableUsdc = Math.max(0, before.usdcAmount - reserveUsdc);
      notionalUsd = Math.min(Math.abs(deltaUsd), maxNotional, spendableUsdc);
      inputMint = BTC_QUANT_SWAP_MINTS.usdc;
      outputMint = BTC_QUANT_SWAP_MINTS.cbbtc;
      amountRaw = BigInt(Math.max(0, Math.floor(notionalUsd * 10 ** BTC_QUANT_QUOTE_DECIMALS)));
    } else if (deltaUsd < -MIN_SWAP_USD) {
      direction = "sell_btc";
      const sellUsd = Math.min(Math.abs(deltaUsd), maxNotional, before.btcUsd);
      notionalUsd = sellUsd;
      const btcToSell = sellUsd / btcPriceUsd;
      inputMint = BTC_QUANT_SWAP_MINTS.cbbtc;
      outputMint = BTC_QUANT_SWAP_MINTS.usdc;
      amountRaw = BigInt(Math.max(0, Math.floor(btcToSell * 10 ** CBBTC_DECIMALS)));
      if (amountRaw > before.cbbtcRaw) amountRaw = before.cbbtcRaw;
    }

    if (direction === "hold" || amountRaw <= 0n || notionalUsd < MIN_SWAP_USD) {
      const skipped = await finishSkip(cfg, { ...skipBase, status: "skipped_no_change" }, null);
      return { applied: false, reason: "no_change", rebalance: skipped };
    }

    const pending = await Btc3RealRebalance.create({
      experimentId,
      decisionId,
      macroEventId,
      direction,
      headline,
      confidence,
      btcPriceUsd,
      notionalUsd: roundUsd(notionalUsd),
      usdcDelta: direction === "buy_btc" ? -roundUsd(notionalUsd) : roundUsd(notionalUsd),
      btcDelta:
        direction === "buy_btc"
          ? roundUsd(notionalUsd / btcPriceUsd)
          : -roundUsd(notionalUsd / btcPriceUsd),
      beforeAllocation: {
        btcPct: before.btcPct,
        usdcPct: before.usdcPct,
        totalUsd: before.totalUsd,
      },
      afterAllocation: {
        btcPct: before.btcPct,
        usdcPct: before.usdcPct,
        totalUsd: before.totalUsd,
      },
      equityUsd: before.totalUsd,
      targetBtcPct,
      inputMint,
      outputMint,
      amountRaw: amountRaw.toString(),
      status: "pending",
    });

    try {
      const swap = await executeBtcQuantJupiterSwap({
        anonymousId: cfg.anonymousId,
        agentAddress: cfg.agentAddress,
        inputMint,
        outputMint,
        amountRaw: amountRaw.toString(),
        estimatedUsd: notionalUsd,
        summary: `BTC3 macro real: ${direction} (target ${targetBtcPct.toFixed(1)}% BTC)`,
        slippageBps: cfg.slippageBps ?? 50,
      });

      if (swap.skipped) {
        await Btc3RealRebalance.updateOne(
          { _id: pending._id },
          {
            $set: {
              status: "error",
              errorMessage: "swap_skipped",
            },
          },
        );
        await Btc3RealConfig.updateOne(
          { _id: "singleton" },
          { $set: { processing: false, lastError: "swap_skipped" } },
        );
        return { applied: false, reason: "swap_skipped" };
      }

      const after = await readWalletAllocation(cfg.agentAddress, btcPriceUsd);
      const baseline = toNum(cfg.capitalBaselineUsd, after.totalUsd);
      const realNetPnlUsd =
        baseline > 0 ? roundUsd(after.totalUsd - baseline) : 0;

      await Btc3RealRebalance.updateOne(
        { _id: pending._id },
        {
          $set: {
            status: "executed",
            txSig: swap.signature,
            outAmountRaw: swap.outAmount ?? null,
            afterAllocation: {
              btcPct: after.btcPct,
              usdcPct: after.usdcPct,
              totalUsd: after.totalUsd,
            },
            equityUsd: after.totalUsd,
            realNetPnlUsd,
          },
        },
      );

      if (decisionId) {
        await Btc3AllocationDecision.findByIdAndUpdate(decisionId, {
          $set: { status: "executed", approvedAt: new Date(), approvedBy: "btc3_real" },
        }).catch(() => {});
      }

      await Btc3RealConfig.updateOne(
        { _id: "singleton" },
        {
          $set: {
            processing: false,
            lastError: null,
            lastRebalanceAt: new Date(),
          },
        },
      );

      return {
        applied: true,
        direction,
        notionalUsd: roundUsd(notionalUsd),
        txSig: swap.signature,
        afterAllocation: {
          btcPct: after.btcPct,
          usdcPct: after.usdcPct,
          totalUsd: after.totalUsd,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await Btc3RealRebalance.updateOne(
        { _id: pending._id },
        { $set: { status: "error", errorMessage: msg } },
      );
      await Btc3RealConfig.updateOne(
        { _id: "singleton" },
        { $set: { processing: false, lastError: msg } },
      );
      return { applied: false, reason: "error", error: msg };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await Btc3RealConfig.updateOne(
      { _id: "singleton" },
      { $set: { processing: false, lastError: msg } },
    );
    return { applied: false, reason: "error", error: msg };
  }
}

/** Cron / manual tick: rebalance toward latest target allocation. */
export async function runBtc3RealRebalanceCycle() {
  const cfg = await getOrCreateRealConfig();
  if (!cfg.enabled) return { skipped: true, reason: "disabled" };
  return applyRealRebalance({});
}
