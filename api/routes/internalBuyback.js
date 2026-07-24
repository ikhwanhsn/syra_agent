/**
 * Internal cron hooks for batched SYRA buyback flush + manual Jupiter tracking.
 *
 * POST /internal/buyback/run   — flush x402 queue + sync on-chain buys
 * POST /internal/buyback/sync  — scan treasury for manual Jupiter/DEX buys
 * POST /internal/buyback/record — ingest one Solscan/Jupiter signature
 * Header: x-buyback-cron-secret (when BUYBACK_CRON_SECRET is set)
 */
import { Router } from "express";
import { runBuybackSchedulerTick } from "../libs/buybackScheduler.js";
import {
  ingestBuybackSignature,
  syncOnchainBuybacks,
} from "../libs/buybackOnchainSync.js";
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
          totalBuybackUsdSpent: doc?.totalBuybackUsdSpent ?? 0,
          totalSyraAcquired: doc?.totalSyraAcquired ?? 0,
          lastFlushAt: doc?.lastFlushAt ?? null,
          lastBuybackSignature: doc?.lastBuybackSignature ?? null,
          lastBuybackOutAmount: doc?.lastBuybackOutAmount ?? null,
          lastManualBuybackAt: doc?.lastManualBuybackAt ?? null,
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

  router.post("/buyback/sync", async (req, res) => {
    try {
      const limit = req.body?.limit;
      const requireUsdcSpend = req.body?.requireUsdcSpend;
      const out = await syncOnchainBuybacks({
        ...(limit != null ? { limit: Number(limit) } : {}),
        ...(requireUsdcSpend != null
          ? { requireUsdcSpend: Boolean(requireUsdcSpend) }
          : {}),
      });
      const status = out.success ? 200 : 500;
      return res.status(status).json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/buyback/record", async (req, res) => {
    try {
      const out = await ingestBuybackSignature({
        swapSignature: req.body?.swapSignature || req.body?.signature,
        buybackUsd: req.body?.buybackUsd,
        outAmountHuman: req.body?.outAmountHuman ?? req.body?.syraAcquired,
      });
      const status = out.success ? 200 : 400;
      return res.status(status).json(out);
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
