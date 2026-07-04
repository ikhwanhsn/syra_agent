import express from "express";
import { requireSession, optionalWalletSession } from "../utils/requireSession.js";
import {
  applyRealRebalance,
  disableBtc3Real,
  enableBtc3Real,
  getBtc3RealState,
  listBtc3RealRebalances,
  runBtc3RealRebalanceCycle,
} from "../libs/btc3/btc3RealService.js";

function requireCronSecret(req, res, next) {
  const secret = (process.env.BTC3_MACRO_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-btc3-macro-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-btc3-macro-secret",
    });
  }
  return next();
}

export function createBtc3RealRouter() {
  const router = express.Router();

  router.get("/state", optionalWalletSession(), async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId ?? null;
      const data = await getBtc3RealState({ viewerAnonymousId: anonymousId });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/rebalances", optionalWalletSession(), async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const data = await listBtc3RealRebalances({ limit, offset, status });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/enable", requireSession(), async (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const maxNotionalUsd =
        body.maxNotionalUsd != null ? Number(body.maxNotionalUsd) : undefined;
      const minRebalancePct =
        body.minRebalancePct != null ? Number(body.minRebalancePct) : undefined;
      const data = await enableBtc3Real({
        anonymousId: req.user.anonymousId,
        enabledBy: req.user.walletAddress || req.user.anonymousId,
        maxNotionalUsd,
        minRebalancePct,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/disable", requireSession(), async (req, res) => {
    try {
      const data = await disableBtc3Real({ anonymousId: req.user.anonymousId });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/rebalance-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runBtc3RealRebalanceCycle();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/rebalance", requireSession(), async (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const data = await applyRealRebalance({
        targetAllocation: body.targetAllocation,
        headline: typeof body.headline === "string" ? body.headline : undefined,
        confidence: body.confidence != null ? Number(body.confidence) : undefined,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
