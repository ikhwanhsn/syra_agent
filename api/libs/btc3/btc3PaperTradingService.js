/**
 * BTC3 Macro Intelligence — paper trading sim (USDC ↔ BTC spot rebalances).
 * Mirrors BTC quant lab pattern: $1,000 starting bank, auto paper execution on allocation decisions.
 */

import crypto from "node:crypto";
import Btc3AllocationDecision from "../../models/btc3/AllocationDecision.js";
import {
  BTC3_DEFAULT_PORTFOLIO,
  BTC3_PAPER_SIM_DEFAULTS,
  getBtc3PaperSimConfig,
} from "../../config/btc3MacroConfig.js";
import {
  computeAgentReturnPct,
  roundUsd,
  TRADING_EXPERIMENT_STARTING_USD,
} from "../../config/tradingExperimentSim.js";
import { agentStateRepo, paperRebalanceRepo, portfolioRepo } from "../../repositories/btc3/index.js";
import { fetchCbbtcSpotPriceUsd } from "../btcQuantOnchainMarket.js";

const EXPERIMENT_ID_PREFIX = "btc3m";

let bootPromise = null;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function newExperimentId() {
  return `${EXPERIMENT_ID_PREFIX}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
}

async function fetchBtcPriceUsd() {
  try {
    const px = await fetchCbbtcSpotPriceUsd();
    if (Number.isFinite(px) && px > 0) return px;
  } catch {
    /* fallback below */
  }
  return null;
}

/**
 * Compute allocation percentages and total equity from holdings.
 * @param {{ usdcAmount: number; btcAmount: number }} holdings
 * @param {number} btcPriceUsd
 */
export function computePaperAllocation(holdings, btcPriceUsd) {
  const usdc = toNum(holdings.usdcAmount);
  const btc = toNum(holdings.btcAmount);
  const btcUsd = btc * btcPriceUsd;
  const totalUsd = roundUsd(usdc + btcUsd);
  if (totalUsd <= 0) {
    return { btcPct: BTC3_DEFAULT_PORTFOLIO.btcPct, usdcPct: BTC3_DEFAULT_PORTFOLIO.usdcPct, totalUsd: 0, btcUsd: 0, usdcAmount: usdc, btcAmount: btc };
  }
  const btcPct = roundUsd((btcUsd / totalUsd) * 100);
  return {
    btcPct,
    usdcPct: roundUsd(100 - btcPct),
    totalUsd,
    btcUsd: roundUsd(btcUsd),
    usdcAmount: usdc,
    btcAmount: btc,
  };
}

export async function ensureBtc3PaperBootstrapped() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    let state = await agentStateRepo.getState();
    const cfg = getBtc3PaperSimConfig(state);

    if (!state.activeExperimentId) {
      const btcPrice = (await fetchBtcPriceUsd()) ?? 60_000;
      const startingUsd = cfg.startingBankUsd;
      const btcUsd = roundUsd(startingUsd * (cfg.initialBtcPct / 100));
      const usdcAmount = roundUsd(startingUsd - btcUsd);
      const btcAmount = btcUsd / btcPrice;
      const experimentId = newExperimentId();

      state = await agentStateRepo.updateState({
        activeExperimentId: experimentId,
        startedAt: new Date(),
        simConfig: {
          startingBankUsd: startingUsd,
          initialBtcPct: cfg.initialBtcPct,
          minRebalancePct: cfg.minRebalancePct,
          paperAutoExecute: cfg.paperAutoExecute,
        },
        paperPortfolio: {
          usdcAmount,
          btcAmount,
          startingEquityUsd: startingUsd,
          lastMarkPriceUsd: btcPrice,
          rebalanceCount: 0,
        },
        portfolio: {
          btcPct: cfg.initialBtcPct,
          usdcPct: 100 - cfg.initialBtcPct,
          totalUsd: startingUsd,
        },
        targetPortfolio: {
          btcPct: cfg.initialBtcPct,
          usdcPct: 100 - cfg.initialBtcPct,
        },
      });

      await portfolioRepo.createSnapshot({
        btcPct: cfg.initialBtcPct,
        usdcPct: 100 - cfg.initialBtcPct,
        totalUsd: startingUsd,
        btcPriceUsd: btcPrice,
        source: "paper_bootstrap",
      });
    }

    return { experimentId: state.activeExperimentId };
  })().finally(() => {
    bootPromise = null;
  });
  return bootPromise;
}

/**
 * Mark paper portfolio to market at current BTC price.
 */
export async function markPaperPortfolioToMarket() {
  await ensureBtc3PaperBootstrapped();
  const state = await agentStateRepo.getState();
  const paper = state.paperPortfolio || {};
  const btcPrice = (await fetchBtcPriceUsd()) ?? toNum(paper.lastMarkPriceUsd, 60_000);

  const allocation = computePaperAllocation(
    { usdcAmount: paper.usdcAmount, btcAmount: paper.btcAmount },
    btcPrice,
  );

  await agentStateRepo.updateState({
    paperPortfolio: {
      ...paper,
      lastMarkPriceUsd: btcPrice,
    },
    portfolio: {
      btcPct: allocation.btcPct,
      usdcPct: allocation.usdcPct,
      totalUsd: allocation.totalUsd,
    },
  });

  return { btcPriceUsd: btcPrice, allocation };
}

/**
 * @returns {Promise<object>}
 */
export async function getBtc3PaperState() {
  await ensureBtc3PaperBootstrapped();
  const { allocation, btcPriceUsd } = await markPaperPortfolioToMarket();
  const state = await agentStateRepo.getState();
  const cfg = getBtc3PaperSimConfig(state);
  const startingUsd = toNum(state.paperPortfolio?.startingEquityUsd, cfg.startingBankUsd);
  const returnPct = computeAgentReturnPct(allocation.totalUsd, startingUsd);

  return {
    experimentId: state.activeExperimentId,
    startedAt: state.startedAt?.toISOString?.() ?? null,
    simConfig: cfg,
    btcSpotPriceUsd: btcPriceUsd,
    holdings: {
      usdcAmount: allocation.usdcAmount,
      btcAmount: allocation.btcAmount,
      btcUsd: allocation.btcUsd,
    },
    equityUsd: allocation.totalUsd,
    startingBankUsd: startingUsd,
    returnPct,
    allocation: {
      btcPct: allocation.btcPct,
      usdcPct: allocation.usdcPct,
    },
    rebalanceCount: state.paperPortfolio?.rebalanceCount ?? 0,
    mode: "paper",
  };
}

export async function getBtc3PaperStats() {
  const paper = await getBtc3PaperState();
  const rebalances = await paperRebalanceRepo.list({
    experimentId: paper.experimentId,
    limit: 200,
  });
  const executed = rebalances.items.filter((r) => r.status === "executed");
  const skipped = rebalances.items.filter((r) => r.status !== "executed");

  return {
    ...paper,
    totalRebalances: rebalances.total,
    executedRebalances: executed.length,
    skippedRebalances: skipped.length,
    lastRebalanceAt: executed[0]?.createdAt?.toISOString?.() ?? null,
  };
}

export async function getBtc3PaperRebalances({ limit = 25, offset = 0 } = {}) {
  await ensureBtc3PaperBootstrapped();
  const state = await agentStateRepo.getState();
  return paperRebalanceRepo.list({
    experimentId: state.activeExperimentId,
    limit,
    offset,
  });
}

/**
 * Apply a paper rebalance toward target allocation (auto-executed in pipeline).
 * @param {{
 *   decisionId?: import('mongoose').Types.ObjectId;
 *   macroEventId?: import('mongoose').Types.ObjectId;
 *   targetAllocation: { btcPct: number; usdcPct: number };
 *   headline?: string;
 *   confidence?: number;
 * }} input
 */
export async function applyPaperRebalance(input) {
  await ensureBtc3PaperBootstrapped();
  const { allocation: before, btcPriceUsd } = await markPaperPortfolioToMarket();
  const state = await agentStateRepo.getState();
  const cfg = getBtc3PaperSimConfig(state);
  const experimentId = state.activeExperimentId;
  const paper = state.paperPortfolio || {};
  const startingUsd = toNum(paper.startingEquityUsd, cfg.startingBankUsd);

  const targetBtcPct = toNum(input.targetAllocation?.btcPct, before.btcPct);
  const diffPct = Math.abs(targetBtcPct - before.btcPct);

  if (diffPct < cfg.minRebalancePct) {
    const skipped = await paperRebalanceRepo.create({
      experimentId,
      decisionId: input.decisionId ?? null,
      macroEventId: input.macroEventId ?? null,
      direction: "hold",
      headline: input.headline ?? "",
      confidence: toNum(input.confidence),
      btcPriceUsd,
      usdcDelta: 0,
      btcDelta: 0,
      notionalUsd: 0,
      beforeAllocation: { btcPct: before.btcPct, usdcPct: before.usdcPct, totalUsd: before.totalUsd },
      afterAllocation: { btcPct: before.btcPct, usdcPct: before.usdcPct, totalUsd: before.totalUsd },
      equityUsd: before.totalUsd,
      returnPct: computeAgentReturnPct(before.totalUsd, startingUsd),
      status: "skipped_below_threshold",
    });

    if (input.decisionId) {
      await Btc3AllocationDecision.findByIdAndUpdate(input.decisionId, {
        $set: { status: "expired" },
      });
    }

    return { rebalance: skipped, applied: false, reason: "below_threshold" };
  }

  const targetBtcUsd = roundUsd(before.totalUsd * (targetBtcPct / 100));
  const currentBtcUsd = before.btcUsd;
  const usdcDelta = roundUsd(currentBtcUsd - targetBtcUsd);
  const btcDelta = usdcDelta / btcPriceUsd;

  let direction = "hold";
  let usdcAmount = toNum(paper.usdcAmount);
  let btcAmount = toNum(paper.btcAmount);

  if (usdcDelta < 0) {
    direction = "buy_btc";
    const usdcSpend = Math.abs(usdcDelta);
    usdcAmount = roundUsd(usdcAmount - usdcSpend);
    btcAmount += usdcSpend / btcPriceUsd;
  } else if (usdcDelta > 0) {
    direction = "sell_btc";
    usdcAmount = roundUsd(usdcAmount + usdcDelta);
    btcAmount -= btcDelta;
  }

  const after = computePaperAllocation({ usdcAmount, btcAmount }, btcPriceUsd);
  const returnPct = computeAgentReturnPct(after.totalUsd, startingUsd);

  const rebalance = await paperRebalanceRepo.create({
    experimentId,
    decisionId: input.decisionId ?? null,
    macroEventId: input.macroEventId ?? null,
    direction,
    headline: input.headline ?? "",
    confidence: toNum(input.confidence),
    btcPriceUsd,
    usdcDelta: direction === "buy_btc" ? -Math.abs(usdcDelta) : usdcDelta,
    btcDelta: direction === "buy_btc" ? Math.abs(btcDelta) : -Math.abs(btcDelta),
    notionalUsd: roundUsd(Math.abs(usdcDelta)),
    beforeAllocation: { btcPct: before.btcPct, usdcPct: before.usdcPct, totalUsd: before.totalUsd },
    afterAllocation: { btcPct: after.btcPct, usdcPct: after.usdcPct, totalUsd: after.totalUsd },
    equityUsd: after.totalUsd,
    returnPct,
    status: direction === "hold" ? "skipped_no_change" : "executed",
  });

  if (direction !== "hold") {
    await agentStateRepo.updateState({
      paperPortfolio: {
        usdcAmount: after.usdcAmount,
        btcAmount: after.btcAmount,
        startingEquityUsd: startingUsd,
        lastMarkPriceUsd: btcPriceUsd,
        rebalanceCount: toNum(paper.rebalanceCount) + 1,
      },
      portfolio: {
        btcPct: after.btcPct,
        usdcPct: after.usdcPct,
        totalUsd: after.totalUsd,
      },
      targetPortfolio: {
        btcPct: targetBtcPct,
        usdcPct: 100 - targetBtcPct,
      },
    });

    await portfolioRepo.createSnapshot({
      btcPct: after.btcPct,
      usdcPct: after.usdcPct,
      totalUsd: after.totalUsd,
      btcPriceUsd,
      source: "paper_rebalance",
    });

    if (input.decisionId) {
      await Btc3AllocationDecision.findByIdAndUpdate(input.decisionId, {
        $set: { status: "executed", approvedAt: new Date(), approvedBy: "paper_sim" },
      });
    }
  }

  return {
    rebalance,
    applied: direction !== "hold",
    direction,
    afterAllocation: { btcPct: after.btcPct, usdcPct: after.usdcPct, totalUsd: after.totalUsd },
  };
}

/**
 * Portfolio view for optimizer — uses live paper holdings.
 */
export async function getPaperPortfolioForOptimizer() {
  const { allocation } = await markPaperPortfolioToMarket();
  return {
    btcPct: allocation.btcPct,
    usdcPct: allocation.usdcPct,
    totalUsd: allocation.totalUsd,
  };
}

export { TRADING_EXPERIMENT_STARTING_USD as BTC3_PAPER_STARTING_USD };
