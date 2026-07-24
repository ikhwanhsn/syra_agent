/**
 * Batch x402 revenue into a single SYRA buyback every 24h instead of per-transaction swaps.
 * Also syncs manual Jupiter / on-chain treasury buys into the same proof ledger.
 */

import { isMongooseConnected } from "../config/mongoose.js";
import {
  BUYBACK_ACCUMULATOR_ID,
  BUYBACK_SCHEDULER_CRON_MS,
} from "../config/buybackSchedulerConfig.js";
import BuybackAccumulator from "../models/BuybackAccumulator.js";
import { buybackSYRAFromRevenue } from "../utils/buybackSYRA.js";
import {
  outAmountToHuman,
  recordBuybackEvent,
  resolveTreasuryWallet,
} from "./buybackRecord.js";
import { syncOnchainBuybacks } from "./buybackOnchainSync.js";

const isProduction = process.env.NODE_ENV === "production";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

function parseRevenueUsd(revenueAmountUSD) {
  const revenue =
    typeof revenueAmountUSD === "string"
      ? parseFloat(revenueAmountUSD)
      : revenueAmountUSD;
  if (!Number.isFinite(revenue) || revenue <= 0) {
    throw new Error(`Invalid revenue amount: ${revenueAmountUSD}`);
  }
  return revenue;
}

/**
 * Queue x402 revenue for the next batched buyback (production only).
 * @param {number | string} revenueAmountUSD
 */
export async function queueBuybackRevenue(revenueAmountUSD) {
  if (!isProduction) return;

  const revenue = parseRevenueUsd(revenueAmountUSD);
  if (!isMongooseConnected()) {
    console.warn(
      "[buyback-scheduler] mongodb_not_connected — revenue not queued:",
      revenue,
    );
    return;
  }

  await BuybackAccumulator.findOneAndUpdate(
    { _id: BUYBACK_ACCUMULATOR_ID },
    {
      $inc: {
        pendingRevenueUsd: revenue,
        totalAccumulatedUsd: revenue,
      },
    },
    { upsert: true },
  );
}

/**
 * Atomically claim pending revenue and reset the accumulator.
 * @returns {Promise<number>}
 */
async function claimPendingRevenueUsd() {
  const doc = await BuybackAccumulator.findOne({ _id: BUYBACK_ACCUMULATOR_ID });
  const amount = doc?.pendingRevenueUsd ?? 0;
  if (amount <= 0) return 0;

  const claimed = await BuybackAccumulator.findOneAndUpdate(
    { _id: BUYBACK_ACCUMULATOR_ID, pendingRevenueUsd: amount },
    {
      $inc: { pendingRevenueUsd: -amount },
      $set: { lastFlushAt: new Date(), lastFlushError: null },
    },
    { new: true },
  );

  if (!claimed) {
    return claimPendingRevenueUsd();
  }

  return amount;
}

async function restorePendingRevenueUsd(amount, errorMessage) {
  await BuybackAccumulator.findOneAndUpdate(
    { _id: BUYBACK_ACCUMULATOR_ID },
    {
      $inc: { pendingRevenueUsd: amount },
      $set: { lastFlushError: errorMessage },
    },
    { upsert: true },
  );
}

async function syncManualBuysQuietly() {
  try {
    const sync = await syncOnchainBuybacks({ requireUsdcSpend: true });
    if (sync.recorded > 0) {
      console.log(
        `[buyback-scheduler] on-chain sync recorded ${sync.recorded} manual buy(s)`,
      );
    }
    return sync;
  } catch (err) {
    console.warn(
      "[buyback-scheduler] on-chain sync failed:",
      err?.message ?? err,
    );
    return { success: false, recorded: 0, error: err?.message ?? String(err) };
  }
}

/**
 * Flush accumulated revenue into a single SYRA buyback swap, then sync on-chain buys.
 * @returns {Promise<{ success: boolean; skipped?: boolean; revenueUsd?: number; swapSignature?: string; outAmount?: string; error?: string; onchainSync?: object }>}
 */
export async function runBuybackSchedulerTick() {
  if (!isProduction) {
    return { success: true, skipped: true, error: "not_production" };
  }
  if (!isMongooseConnected()) {
    return { success: false, error: "mongodb_not_connected" };
  }
  if (tickInFlight) {
    return { success: false, error: "tick_already_in_flight" };
  }

  tickInFlight = true;
  try {
    const revenueUsd = await claimPendingRevenueUsd();
    if (revenueUsd <= 0) {
      const onchainSync = await syncManualBuysQuietly();
      return { success: true, skipped: true, revenueUsd: 0, onchainSync };
    }

    try {
      const result = await buybackSYRAFromRevenue(revenueUsd);
      const buybackUsd =
        typeof result?.buybackUsd === "number"
          ? result.buybackUsd
          : revenueUsd * 0.8;
      const outAmountHuman = outAmountToHuman(result?.outAmount);
      const treasuryWallet = resolveTreasuryWallet();

      await BuybackAccumulator.findOneAndUpdate(
        { _id: BUYBACK_ACCUMULATOR_ID },
        {
          $inc: {
            totalFlushedUsd: revenueUsd,
          },
          $set: {
            lastFlushError: null,
          },
        },
        { upsert: true },
      );

      if (result?.swapSignature) {
        const recorded = await recordBuybackEvent({
          revenueUsd,
          buybackUsd,
          outAmountRaw: result?.outAmount ?? null,
          outAmountHuman,
          swapSignature: result.swapSignature,
          treasuryWallet,
          source: "x402_scheduler",
        });
        if (!recorded.recorded && !recorded.duplicate) {
          console.warn(
            "[buyback-scheduler] recordBuybackEvent failed:",
            recorded.error,
          );
        }
      } else {
        // Swap returned without signature — still track USD spend on accumulator.
        await BuybackAccumulator.findOneAndUpdate(
          { _id: BUYBACK_ACCUMULATOR_ID },
          {
            $inc: {
              totalBuybackUsdSpent: buybackUsd,
              ...(outAmountHuman != null ? { totalSyraAcquired: outAmountHuman } : {}),
            },
            $set: {
              lastBuybackOutAmount: result?.outAmount ?? null,
            },
          },
          { upsert: true },
        );
      }

      console.log(
        `[buyback-scheduler] flushed $${revenueUsd.toFixed(4)} revenue → SYRA buyback sig=${result?.swapSignature ?? "n/a"}`,
      );

      const onchainSync = await syncManualBuysQuietly();

      return {
        success: true,
        revenueUsd,
        buybackUsd,
        swapSignature: result?.swapSignature,
        outAmount: result?.outAmount,
        outAmountHuman,
        onchainSync,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await restorePendingRevenueUsd(revenueUsd, msg);
      console.error(
        `[buyback-scheduler] buyback failed — restored $${revenueUsd.toFixed(4)} to queue:`,
        msg,
      );
      const onchainSync = await syncManualBuysQuietly();
      return { success: false, revenueUsd, error: msg, onchainSync };
    }
  } finally {
    tickInFlight = false;
  }
}

export function startBuybackScheduler() {
  if (cronHandle || !isProduction) return;

  const ms = BUYBACK_SCHEDULER_CRON_MS;
  if (!Number.isFinite(ms) || ms <= 0) {
    console.info(
      "[buyback-scheduler] in-process scheduler disabled (BUYBACK_CRON_MS=0)",
    );
    return;
  }

  cronHandle = setInterval(() => {
    runBuybackSchedulerTick().catch(() => {});
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  console.info(
    `[buyback-scheduler] started (every ${Math.round(ms / 3_600_000)}h; x402 queue + on-chain manual buy sync)`,
  );
}

export function stopBuybackScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
