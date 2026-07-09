/**
 * Batch x402 revenue into a single SYRA buyback every 24h instead of per-transaction swaps.
 */

import { isMongooseConnected } from "../config/mongoose.js";
import {
  BUYBACK_ACCUMULATOR_ID,
  BUYBACK_SCHEDULER_CRON_MS,
} from "../config/buybackSchedulerConfig.js";
import BuybackAccumulator from "../models/BuybackAccumulator.js";
import { buybackSYRAFromRevenue } from "../utils/buybackSYRA.js";

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

/**
 * Flush accumulated revenue into a single SYRA buyback swap.
 * @returns {Promise<{ success: boolean; skipped?: boolean; revenueUsd?: number; swapSignature?: string; outAmount?: string; error?: string }>}
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
      return { success: true, skipped: true, revenueUsd: 0 };
    }

    try {
      const result = await buybackSYRAFromRevenue(revenueUsd);
      await BuybackAccumulator.findOneAndUpdate(
        { _id: BUYBACK_ACCUMULATOR_ID },
        {
          $inc: { totalFlushedUsd: revenueUsd },
          $set: {
            lastBuybackSignature: result?.swapSignature ?? null,
            lastBuybackOutAmount: result?.outAmount ?? null,
            lastFlushError: null,
          },
        },
        { upsert: true },
      );

      console.log(
        `[buyback-scheduler] flushed $${revenueUsd.toFixed(4)} revenue → SYRA buyback sig=${result?.swapSignature ?? "n/a"}`,
      );

      return {
        success: true,
        revenueUsd,
        swapSignature: result?.swapSignature,
        outAmount: result?.outAmount,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await restorePendingRevenueUsd(revenueUsd, msg);
      console.error(
        `[buyback-scheduler] buyback failed — restored $${revenueUsd.toFixed(4)} to queue:`,
        msg,
      );
      return { success: false, revenueUsd, error: msg };
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
    `[buyback-scheduler] started (every ${Math.round(ms / 3_600_000)}h; revenue queued per x402 settle)`,
  );
}

export function stopBuybackScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
