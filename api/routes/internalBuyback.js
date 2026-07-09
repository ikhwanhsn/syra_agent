/**
 * Internal cron hook for batched SYRA buyback flush.
 *
 * POST /internal/buyback/run
 * Header: x-buyback-cron-secret (when BUYBACK_CRON_SECRET is set)
 */
import { Router } from "express";
import { runBuybackSchedulerTick } from "../libs/buybackScheduler.js";
import BuybackAccumulator from "../models/BuybackAccumulator.js";
import { BUYBACK_ACCUMULATOR_ID } from "../config/buybackSchedulerConfig.js";

export function createInternalBuybackRouter() {
  const router = Router();

  router.get("/buyback/status", async (_req, res) => {
    try {
      const doc = await BuybackAccumulator.findById(BUYBACK_ACCUMULATOR_ID).lean();
      return res.json({
        success: true,
        data: {
          pendingRevenueUsd: doc?.pendingRevenueUsd ?? 0,
          totalAccumulatedUsd: doc?.totalAccumulatedUsd ?? 0,
          totalFlushedUsd: doc?.totalFlushedUsd ?? 0,
          lastFlushAt: doc?.lastFlushAt ?? null,
          lastBuybackSignature: doc?.lastBuybackSignature ?? null,
          lastFlushError: doc?.lastFlushError ?? null,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/buyback/run", async (_req, res) => {
    try {
      const out = await runBuybackSchedulerTick();
      const status = out.success ? 200 : out.skipped ? 200 : 500;
      return res.status(status).json({ success: out.success, ...out });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}

export default createInternalBuybackRouter;
