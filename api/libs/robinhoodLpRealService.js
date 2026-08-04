/**
 * Robinhood Chain LP Autopilot: real execution pilot (dry-run by default).
 * Uses sim leader strategy + live pool data; on-chain txs when dryRun=false and EV gate passed.
 */
import crypto from "node:crypto";
import RobinhoodLpRealConfig from "../models/RobinhoodLpRealConfig.js";
import RobinhoodLpRealPosition from "../models/RobinhoodLpRealPosition.js";
import {
  getRobinhoodLpCandidatePools,
  rankRobinhoodLpStrategiesByNetPnl,
  resolveOpenRobinhoodLpRuns,
  runRobinhoodLpSignalCycle,
} from "./robinhoodLpExperimentService.js";
import RobinhoodLpExperimentState from "../models/RobinhoodLpExperimentState.js";
import {
  getRobinhoodLpRealDryRun,
  getRobinhoodLpRealKillSwitch,
  getRobinhoodLpRealMaxConcurrentPositions,
  getRobinhoodLpRealMaxOpensPerTick,
  getRobinhoodLpRealMaxPositionUsd,
  getRobinhoodLpRealMinClaimFeesUsd,
  getRobinhoodLpRealPilotEnabled,
  getRobinhoodLpRealSafetySnapshot,
  passesRobinhoodRealPoolScreen,
} from "../config/robinhoodLpRealAccess.js";
import { robinhoodTxUrl } from "../config/robinhoodChain.js";
import { isRealExecutionUnlocked } from "./outcomeEvGateService.js";
import { getRobinhoodLpStrategyById } from "../config/robinhoodLpStrategies.js";
import { getOutcomeMandate } from "./outcomeMandateService.js";
import {
  computeFeeYieldPct,
  computeLpNetPnlPct,
  mergeRealExitRules,
  resolveAdaptiveExitRules,
  resolveEffectiveBins,
  shouldCloseByFastOor,
  shouldCloseByOor,
} from "./lpEconomicsModel.js";
import {
  assertGasBalance,
  closePosition as execClosePosition,
  collectFees as execCollectFees,
  estimateMintAmounts,
  isTickInRange,
  openPosition as execOpenPosition,
  readPoolState,
} from "./robinhoodUniswapExecutor.js";
import {
  createPrivyServerWallet,
  isPrivyConfigured,
} from "../services/privyServerWallet.js";
import { ROBINHOOD_LP_EXPERIMENT_DEFAULTS } from "../config/robinhoodLpStrategies.js";

function newPositionId() {
  return `rhpos_${crypto.randomBytes(10).toString("hex")}`;
}

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Ensure real config exists for mandate.
 * @param {object} mandate
 */
export async function ensureRobinhoodLpRealConfig(mandate) {
  let config = await RobinhoodLpRealConfig.findById(mandate.mandateId).lean();
  if (config) return config;

  const dryRun = getRobinhoodLpRealDryRun() || !(await isRealExecutionUnlocked("robinhood_lp_autopilot"));
  config = (
    await RobinhoodLpRealConfig.create({
      _id: mandate.mandateId,
      mandateId: mandate.mandateId,
      anonymousId: mandate.anonymousId,
      agentAddress: mandate.agentAddress,
      enabled: false,
      dryRun,
      targetBankUsd: Math.min(mandate.maxManagedCapitalUsd ?? 25, 25),
      maxPositionUsd: getRobinhoodLpRealMaxPositionUsd(),
      maxConcurrentPositions: getRobinhoodLpRealMaxConcurrentPositions(),
    })
  ).toObject();
  return config;
}

/**
 * Provision Privy ethereum server wallet for live signing; persist on config.
 * @param {object} config
 * @param {object} mandate
 */
async function ensurePrivyWalletForConfig(config, mandate) {
  if (config.privyWalletId && config.agentAddress) return config;
  if (!isPrivyConfigured()) {
    throw new Error("privy_not_configured_for_robinhood_lp");
  }
  const wallet = await createPrivyServerWallet({
    chain: "robinhood",
    anonymousId: mandate.anonymousId || config.anonymousId,
  });
  const updated = await RobinhoodLpRealConfig.findOneAndUpdate(
    { mandateId: config.mandateId },
    {
      $set: {
        privyWalletId: wallet.privyWalletId,
        agentAddress: wallet.agentAddress,
      },
    },
    { new: true },
  ).lean();
  return updated || { ...config, ...wallet };
}

/**
 * Enable Robinhood LP Autopilot for a mandate.
 */
export async function enableRobinhoodLpAutopilot(mandateId) {
  if (getRobinhoodLpRealKillSwitch()) {
    throw new Error("Robinhood LP real kill switch is active");
  }
  const unlocked = await isRealExecutionUnlocked("robinhood_lp_autopilot");
  if (!unlocked) {
    throw new Error("EV gate not passed for robinhood_lp_autopilot");
  }

  const dryRun = getRobinhoodLpRealDryRun();
  // Dry-run may start after EV gate clears. Live funds still need the pilot flag.
  if (!dryRun && !getRobinhoodLpRealPilotEnabled()) {
    throw new Error("Robinhood LP real pilot not enabled (set ROBINHOOD_LP_REAL_PILOT_ENABLED=true)");
  }

  const mandate = await getOutcomeMandate(mandateId);
  if (!mandate) throw new Error(`Mandate not found: ${mandateId}`);

  let config = await ensureRobinhoodLpRealConfig(mandate);

  if (!dryRun) {
    config = await ensurePrivyWalletForConfig(config, {
      anonymousId: config.anonymousId,
      mandateId,
    });
  }

  config = await RobinhoodLpRealConfig.findOneAndUpdate(
    { mandateId },
    {
      $set: {
        enabled: true,
        dryRun,
        lastError: null,
        ...(config.privyWalletId ? { privyWalletId: config.privyWalletId } : {}),
        ...(config.agentAddress ? { agentAddress: config.agentAddress } : {}),
      },
    },
    { new: true },
  ).lean();
  if (!config) throw new Error(`Config not found for mandate ${mandateId}`);
  return config;
}

/**
 * Disable Autopilot (stop opening; does not force-close positions).
 */
export async function disableRobinhoodLpAutopilot(mandateId) {
  const config = await RobinhoodLpRealConfig.findOneAndUpdate(
    { mandateId },
    { $set: { enabled: false } },
    { new: true },
  ).lean();
  if (!config) throw new Error(`Config not found for mandate ${mandateId}`);
  return config;
}

/**
 * Pick first candidate that passes the live pool screen (stricter than sim).
 * Candidate rows from getRobinhoodLpCandidatePools are flat pool+score objects.
 * @param {object[]} candidates
 * @param {{ binsBelow: number; binsAbove: number }} bins
 */
function pickLivePool(candidates, bins) {
  for (const row of candidates) {
    if (!row?.poolAddress) continue;
    if (passesRobinhoodRealPoolScreen(row, bins)) return row;
  }
  return null;
}

/**
 * Evaluate whether an open real (or dry-run) position should close.
 * @param {object} position
 * @param {{ currentTick: number; entryPriceUsd?: number; currentPriceUsd?: number; feeTvlRatio?: number; tvlUsd?: number; volume24hUsd?: number }} market
 */
function evaluateRealExit(position, market) {
  const openedAt = position.openedAt ? new Date(position.openedAt).getTime() : Date.now();
  const hoursElapsed = Math.max(0, (Date.now() - openedAt) / 3_600_000);
  const strategy = getRobinhoodLpStrategyById(position.strategyId) || {};
  const binsBelow = toNum(position.binsBelow, strategy.binsBelow ?? 30);
  const binsAbove = toNum(position.binsAbove, strategy.binsAbove ?? 30);
  const poolContext = {
    tvlUsd: toNum(market.tvlUsd),
    volume24hUsd: toNum(market.volume24hUsd),
    feeTvlRatio: toNum(market.feeTvlRatio),
    volatilityScore: 0.45,
  };
  const adaptive = resolveAdaptiveExitRules(strategy.exit || {}, poolContext, binsBelow, binsAbove);
  const exit = mergeRealExitRules(position.exitRules?.stopLossPct != null ? position.exitRules : adaptive);

  const entry = toNum(position.entryPriceUsd, market.entryPriceUsd);
  const current = toNum(market.currentPriceUsd, entry);
  const priceDriftPct = entry > 0 ? ((current - entry) / entry) * 100 : 0;

  const tickLower = toNum(position.tickLower);
  const tickUpper = toNum(position.tickUpper);
  const currentTick = toNum(market.currentTick, position.activeTickAtOpen);
  const inRange =
    tickLower !== 0 || tickUpper !== 0
      ? isTickInRange(currentTick, tickLower, tickUpper)
      : true;

  const feeYieldPct = inRange
    ? computeFeeYieldPct(toNum(market.feeTvlRatio), hoursElapsed)
    : computeFeeYieldPct(toNum(market.feeTvlRatio), hoursElapsed) * 0.25;
  const netPnlPct = computeLpNetPnlPct(priceDriftPct, feeYieldPct, inRange, 0.4);
  const peakPnlPct = Math.max(toNum(position.peakPnlPct), netPnlPct);

  const binProxy = {
    activeBinAtOpen: toNum(position.activeTickAtOpen, currentTick),
    binsBelow,
    binsAbove,
  };
  const detail = { activeBinId: currentTick };

  let shouldClose = false;
  let resolution = null;

  if (priceDriftPct <= toNum(exit.stopLossPct, -15)) {
    shouldClose = true;
    resolution = "stop_loss";
  } else if (netPnlPct >= toNum(exit.takeProfitPct, 10)) {
    shouldClose = true;
    resolution = "take_profit";
  } else {
    const trailingTrigger = toNum(exit.trailingTriggerPct);
    const trailingGiveback = Math.max(toNum(exit.trailingGivebackPct, trailingTrigger * 0.4), 1.1);
    if (
      trailingTrigger > 0 &&
      peakPnlPct >= trailingTrigger &&
      netPnlPct <= peakPnlPct - trailingGiveback
    ) {
      shouldClose = true;
      resolution = "trailing_stop";
    } else if (shouldCloseByFastOor(priceDriftPct, inRange)) {
      shouldClose = true;
      resolution = "fast_oor";
    } else if (shouldCloseByOor(binProxy, detail, exit, hoursElapsed)) {
      shouldClose = true;
      resolution = "oor";
    } else if (hoursElapsed >= ROBINHOOD_LP_EXPERIMENT_DEFAULTS.maxRunAgeHours) {
      shouldClose = true;
      resolution = "time_expiry";
    }
  }

  const feesEarnedUsd = toNum(position.depositUsd) * (feeYieldPct / 100);
  return {
    shouldClose,
    resolution,
    netPnlPct,
    priceDriftPct,
    feeYieldPct,
    peakPnlPct,
    inRange,
    hoursElapsed,
    feesEarnedUsd,
    exitRules: exit,
  };
}

/**
 * Resolve open real positions (close when exit rules fire).
 * @param {object} config
 * @param {object[]} txProofs
 */
async function resolveRealOpenPositions(config, txProofs) {
  const positions = await RobinhoodLpRealPosition.find({
    mandateId: config.mandateId,
    status: { $in: ["open", "claim_only"] },
    dryRun: false,
  }).lean();

  let closed = 0;
  let realizedPnlUsd = 0;
  let feesCollectedUsd = 0;

  for (const pos of positions) {
    try {
      if (!pos.tokenId && !pos.poolAddress) continue;

      let currentTick = toNum(pos.activeTickAtOpen);
      let feeTvlRatio = toNum(pos.screeningSnapshot?.feeTvlRatio);
      let currentPriceUsd = toNum(pos.entryPriceUsd);
      let tvlUsd = 0;
      let volume24hUsd = 0;

      if (pos.poolAddress) {
        try {
          const pool = await readPoolState(pos.poolAddress);
          currentTick = pool.currentTick;
        } catch (e) {
          console.warn(
            `[rh-lp-real] slot0 failed ${pos.positionId}:`,
            e instanceof Error ? e.message : e,
          );
        }
      }

      const evalResult = evaluateRealExit(pos, {
        currentTick,
        entryPriceUsd: pos.entryPriceUsd,
        currentPriceUsd,
        feeTvlRatio,
        tvlUsd,
        volume24hUsd,
      });

      await RobinhoodLpRealPosition.updateOne(
        { positionId: pos.positionId },
        {
          $set: {
            peakPnlPct: evalResult.peakPnlPct,
            feesEarnedUsd: evalResult.feesEarnedUsd,
            lastEvaluatedAt: new Date(),
          },
        },
      );

      // Optional fee claim without full close when threshold met and still in range.
      if (
        !evalResult.shouldClose &&
        evalResult.inRange &&
        evalResult.feesEarnedUsd - toNum(pos.feesClaimedUsd) >= getRobinhoodLpRealMinClaimFeesUsd() &&
        config.privyWalletId &&
        pos.tokenId
      ) {
        try {
          const claim = await execCollectFees({
            privyWalletId: config.privyWalletId,
            owner: config.agentAddress,
            tokenId: pos.tokenId,
          });
          await RobinhoodLpRealPosition.updateOne(
            { positionId: pos.positionId },
            {
              $set: {
                feesClaimedUsd: evalResult.feesEarnedUsd,
                claimTxHash: claim.hash,
                status: "open",
              },
            },
          );
          feesCollectedUsd += evalResult.feesEarnedUsd - toNum(pos.feesClaimedUsd);
          if (claim.hash) {
            txProofs.push({
              chain: "robinhood",
              signature: claim.hash,
              action: "lp_collect",
              amountUsd: evalResult.feesEarnedUsd,
              explorerUrl: robinhoodTxUrl(claim.hash),
            });
          }
        } catch (e) {
          console.warn(
            `[rh-lp-real] collect failed ${pos.positionId}:`,
            e instanceof Error ? e.message : e,
          );
        }
      }

      if (!evalResult.shouldClose && !config.closeAllRequested) continue;

      await RobinhoodLpRealPosition.updateOne(
        { positionId: pos.positionId },
        { $set: { status: "closing" } },
      );

      let closeTxHash = null;
      if (config.privyWalletId && pos.tokenId) {
        const closedOnChain = await execClosePosition({
          privyWalletId: config.privyWalletId,
          owner: config.agentAddress,
          tokenId: pos.tokenId,
        });
        closeTxHash = closedOnChain.hash || closedOnChain.hashes?.[closedOnChain.hashes.length - 1] || null;
        for (const h of closedOnChain.hashes || []) {
          txProofs.push({
            chain: "robinhood",
            signature: h,
            action: "lp_close",
            amountUsd: pos.depositUsd,
            explorerUrl: robinhoodTxUrl(h),
          });
        }
      }

      const pnlUsd = (toNum(pos.depositUsd) * evalResult.netPnlPct) / 100;
      realizedPnlUsd += pnlUsd;
      closed += 1;

      await RobinhoodLpRealPosition.updateOne(
        { positionId: pos.positionId },
        {
          $set: {
            status: "closed",
            closedAt: new Date(),
            closeTxHash,
            closeReason: evalResult.resolution || (config.closeAllRequested ? "close_all" : "exit"),
            exitPriceUsd: currentPriceUsd,
            realizedPnlUsd: pnlUsd,
            feesEarnedUsd: evalResult.feesEarnedUsd,
            peakPnlPct: evalResult.peakPnlPct,
            lastEvaluatedAt: new Date(),
            error: null,
          },
        },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[rh-lp-real] resolve error ${pos.positionId}:`, msg);
      await RobinhoodLpRealPosition.updateOne(
        { positionId: pos.positionId },
        { $set: { status: "error", error: msg, lastEvaluatedAt: new Date() } },
      );
      await RobinhoodLpRealConfig.updateOne(
        { mandateId: config.mandateId },
        { $set: { lastError: msg } },
      );
    }
  }

  await RobinhoodLpRealConfig.updateOne(
    { mandateId: config.mandateId },
    { $set: { lastResolveAt: new Date(), closeAllRequested: false } },
  );

  return { closed, realizedPnlUsd, feesCollectedUsd };
}

/**
 * Open one live position via Uniswap executor (idempotent per pool/tick).
 * @param {object} params
 */
async function openRealPosition({ config, mandate, pool, strategyId, depositUsd, txProofs }) {
  const strategy = getRobinhoodLpStrategyById(strategyId) || {};
  const bins = resolveEffectiveBins(strategy.binsBelow ?? 30, strategy.binsAbove ?? 30);
  const exitRules = mergeRealExitRules(
    resolveAdaptiveExitRules(
      strategy.exit || {},
      {
        tvlUsd: pool.tvlUsd,
        volume24hUsd: pool.volume24hUsd,
        feeTvlRatio: pool.feeTvlRatio,
      },
      bins.binsBelow,
      bins.binsAbove,
    ),
  );

  // Idempotency: skip if already opening/open on this pool.
  const existing = await RobinhoodLpRealPosition.findOne({
    mandateId: mandate.mandateId,
    poolAddress: pool.poolAddress,
    status: { $in: ["opening", "open", "closing"] },
    dryRun: false,
  }).lean();
  if (existing) {
    return { skipped: true, reason: "idempotent_pool_open", positionId: existing.positionId };
  }

  const positionId = newPositionId();
  await RobinhoodLpRealPosition.create({
    positionId,
    mandateId: mandate.mandateId,
    configId: config._id,
    anonymousId: mandate.anonymousId,
    strategyId: strategyId ?? 1,
    poolAddress: pool.poolAddress,
    poolName: pool.poolName ?? "",
    status: "opening",
    depositUsd,
    entryPriceUsd: pool.currentPriceUsd ?? pool.currentPrice ?? 0,
    dryRun: false,
    binsBelow: bins.binsBelow,
    binsAbove: bins.binsAbove,
    exitRules,
    screeningSnapshot: {
      leaderStrategyId: strategyId,
      feeTvlRatio: pool.feeTvlRatio,
      tvlUsd: pool.tvlUsd,
      volume24hUsd: pool.volume24hUsd,
    },
  });

  try {
    if (!config.privyWalletId) {
      throw new Error("missing_privy_wallet_id");
    }
    await assertGasBalance(config.agentAddress);

    const amounts = await estimateMintAmounts({
      poolAddress: pool.poolAddress,
      depositUsd,
      entryPriceUsd: pool.currentPriceUsd ?? pool.currentPrice ?? 0,
      binsBelow: bins.binsBelow,
      binsAbove: bins.binsAbove,
      ethUsd: pool.currentPriceUsd ?? pool.currentPrice,
    });

    if (amounts.amount0Desired <= 0n && amounts.amount1Desired <= 0n) {
      throw new Error("mint_amounts_zero");
    }

    const opened = await execOpenPosition({
      privyWalletId: config.privyWalletId,
      owner: config.agentAddress,
      poolAddress: pool.poolAddress,
      binsBelow: bins.binsBelow,
      binsAbove: bins.binsAbove,
      amount0Desired: amounts.amount0Desired,
      amount1Desired: amounts.amount1Desired,
      feeTierDecimal: pool.feeTier,
      skipSidecar: true,
    });

    await RobinhoodLpRealPosition.updateOne(
      { positionId },
      {
        $set: {
          status: "open",
          tokenId: opened.tokenId,
          openTxHash: opened.hash,
          liquidity: opened.liquidity,
          tickLower: opened.tickLower,
          tickUpper: opened.tickUpper,
          token0: opened.token0,
          token1: opened.token1,
          feeTier: opened.feeTier,
          activeTickAtOpen: opened.currentTick,
          lastEvaluatedAt: new Date(),
          error: null,
        },
      },
    );

    if (opened.hash) {
      txProofs.push({
        chain: "robinhood",
        signature: opened.hash,
        action: "lp_open",
        amountUsd: depositUsd,
        explorerUrl: robinhoodTxUrl(opened.hash),
      });
    }

    return { positionId, tokenId: opened.tokenId, hash: opened.hash };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await RobinhoodLpRealPosition.updateOne(
      { positionId },
      { $set: { status: "error", error: msg, lastEvaluatedAt: new Date() } },
    );
    await RobinhoodLpRealConfig.updateOne(
      { mandateId: mandate.mandateId },
      { $set: { lastError: msg } },
    );
    return { positionId, error: msg };
  }
}

/**
 * Runtime handler tick for outcome job engine.
 * @param {import('./outcomeJobRuntime.js').RuntimeContext} ctx
 */
export async function runRobinhoodLpAutopilotTick(ctx) {
  const { mandate } = ctx;
  let config = await ensureRobinhoodLpRealConfig(mandate);

  if (!config.enabled) {
    return {
      decision: { action: "skip", reason: "autopilot_not_enabled" },
      summary: "LP Autopilot mandate exists but is not enabled. Call POST /outcomes/mandates/:id/enable.",
      metrics: { managedCapitalUsd: 0, realizedPnlUsd: 0 },
      execution: { skipped: true },
    };
  }

  if (getRobinhoodLpRealKillSwitch()) {
    return {
      decision: { action: "halt", reason: "kill_switch" },
      summary: "LP Autopilot halted by operator kill switch.",
      metrics: { managedCapitalUsd: 0, realizedPnlUsd: 0 },
      execution: { halted: true },
    };
  }

  // Force dry-run if env says so (operator cannot bypass via stale config alone).
  const envDryRun = getRobinhoodLpRealDryRun();
  const dryRun = Boolean(config.dryRun) || envDryRun;

  const state = await RobinhoodLpExperimentState.findById("singleton").lean();
  const experimentId = state?.activeExperimentId;
  let leaderStrategyId = config.currentStrategyId;

  if (experimentId) {
    const ranked = await rankRobinhoodLpStrategiesByNetPnl(experimentId);
    if (ranked[0]?.strategyId != null) {
      leaderStrategyId = ranked[0].strategyId;
      await RobinhoodLpRealConfig.updateOne(
        { mandateId: mandate.mandateId },
        { $set: { currentStrategyId: leaderStrategyId } },
      );
    }
  }

  const openCount = await RobinhoodLpRealPosition.countDocuments({
    mandateId: mandate.mandateId,
    status: { $in: ["opening", "open", "closing", "claim_only"] },
  });

  const candidates = await getRobinhoodLpCandidatePools();
  const maxOpens = getRobinhoodLpRealMaxOpensPerTick();
  const opened = [];
  const txProofs = [];
  let realizedPnlUsd = 0;
  let feesCollectedUsd = 0;
  let positionsClosed = 0;

  // Resolve / close pass for live positions first.
  if (!dryRun) {
    if (!config.privyWalletId) {
      try {
        config = await ensurePrivyWalletForConfig(config, mandate);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await RobinhoodLpRealConfig.updateOne(
          { mandateId: mandate.mandateId },
          { $set: { lastError: msg } },
        );
        return {
          decision: { action: "error", reason: "privy_wallet" },
          summary: `LP Autopilot cannot sign: ${msg}`,
          metrics: { managedCapitalUsd: 0, realizedPnlUsd: 0 },
          execution: { error: msg },
        };
      }
    }
    const resolved = await resolveRealOpenPositions(config, txProofs);
    realizedPnlUsd += resolved.realizedPnlUsd;
    feesCollectedUsd += resolved.feesCollectedUsd;
    positionsClosed += resolved.closed;
  }

  const strategy = getRobinhoodLpStrategyById(leaderStrategyId) || {};
  const bins = resolveEffectiveBins(strategy.binsBelow ?? 30, strategy.binsAbove ?? 30);

  if (openCount < config.maxConcurrentPositions && maxOpens > 0 && candidates.length > 0) {
    const depositUsd = Math.min(config.maxPositionUsd, getRobinhoodLpRealMaxPositionUsd());

    if (dryRun) {
      const pool = candidates[0];
      const positionId = newPositionId();
      const position = await RobinhoodLpRealPosition.create({
        positionId,
        mandateId: mandate.mandateId,
        configId: config._id,
        anonymousId: mandate.anonymousId,
        strategyId: leaderStrategyId ?? 1,
        poolAddress: pool.poolAddress,
        poolName: pool.poolName ?? "",
        status: "open",
        depositUsd,
        entryPriceUsd: pool.currentPriceUsd ?? pool.currentPrice ?? 0,
        dryRun: true,
        binsBelow: bins.binsBelow,
        binsAbove: bins.binsAbove,
        openTxHash: `dry_run_${positionId}`,
        exitRules: mergeRealExitRules(strategy.exit || {}),
        screeningSnapshot: { leaderStrategyId, feeTvlRatio: pool.feeTvlRatio },
      });
      opened.push(position.positionId);
      txProofs.push({
        chain: "robinhood",
        signature: position.openTxHash,
        action: "lp_open",
        amountUsd: depositUsd,
      });
    } else {
      const unlocked = await isRealExecutionUnlocked("robinhood_lp_autopilot");
      if (!unlocked) {
        return {
          decision: { action: "gate_blocked", reason: "ev_gate" },
          summary: "EV gate not green; refusing live open.",
          metrics: { managedCapitalUsd: 0, realizedPnlUsd },
          execution: { dryRun: false, gated: true },
          txProofs,
        };
      }

      const picked = pickLivePool(candidates, bins);
      if (picked) {
        const result = await openRealPosition({
          config,
          mandate,
          pool: picked,
          strategyId: leaderStrategyId ?? 1,
          depositUsd,
          txProofs,
        });
        if (result.positionId && !result.error && !result.skipped) {
          opened.push(result.positionId);
        }
      }
    }
  }

  // Keep paper sim progressing alongside the real pilot.
  const resolveSim = await resolveOpenRobinhoodLpRuns();
  await runRobinhoodLpSignalCycle();

  const totalDeployed = await RobinhoodLpRealPosition.aggregate([
    { $match: { mandateId: mandate.mandateId, status: { $in: ["open", "opening", "closing", "claim_only"] } } },
    { $group: { _id: null, total: { $sum: "$depositUsd" } } },
  ]);

  await RobinhoodLpRealConfig.updateOne(
    { mandateId: mandate.mandateId },
    { $set: { lastSignalAt: new Date() } },
  );

  return {
    decision: {
      action: opened.length > 0 ? "open_position" : positionsClosed > 0 ? "close_position" : "monitor",
      leaderStrategyId,
      candidatesScanned: candidates.length,
      simResolved: resolveSim.resolved,
    },
    execution: {
      opened,
      openPositions: openCount + opened.length - positionsClosed,
      dryRun,
      positionsClosed,
    },
    realizedPnlUsd,
    summary: dryRun
      ? `LP Autopilot (dry-run): monitored ${candidates.length} pools, opened ${opened.length} simulated positions using strategy #${leaderStrategyId}.`
      : `LP Autopilot: opened ${opened.length}, closed ${positionsClosed} on Robinhood Chain using strategy #${leaderStrategyId}.`,
    metrics: {
      managedCapitalUsd: totalDeployed[0]?.total ?? 0,
      realizedPnlUsd,
      positionsOpened: opened.length,
      positionsClosed,
      feesCollectedUsd,
    },
    txProofs,
  };
}

/**
 * @param {string} mandateId
 */
export async function getRobinhoodLpAutopilotStatus(mandateId) {
  const config = await RobinhoodLpRealConfig.findOne({ mandateId }).lean();
  const positions = await RobinhoodLpRealPosition.find({ mandateId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const safety = getRobinhoodLpRealSafetySnapshot();
  const unlocked = await isRealExecutionUnlocked("robinhood_lp_autopilot");
  return {
    config,
    positions: positions.map((p) => ({
      ...p,
      openExplorerUrl: p.openTxHash && !String(p.openTxHash).startsWith("dry_run_")
        ? robinhoodTxUrl(p.openTxHash)
        : null,
      closeExplorerUrl: p.closeTxHash ? robinhoodTxUrl(p.closeTxHash) : null,
    })),
    safety,
    evGateUnlocked: unlocked,
  };
}
