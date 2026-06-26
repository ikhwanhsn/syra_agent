import express from "express";
import { requireSession, optionalWalletSession } from "../utils/requireSession.js";
import {
  disableBtcQuantReal,
  enableBtcQuantReal,
  getBtcQuantRealState,
  listBtcQuantRealPositions,
  resolveBtcQuantRealPositions,
  runBtcQuantRealSignalCycle,
} from "../libs/btcQuantRealService.js";

function requireCronSecret(req, res, next) {
  const secret = (process.env.BTC_QUANT_EXPERIMENT_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-btc-quant-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-btc-quant-secret",
    });
  }
  return next();
}

export function createBtcQuantRealRouter() {
  const router = express.Router();

  router.get("/state", optionalWalletSession(), async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId ?? null;
      const data = await getBtcQuantRealState({ viewerAnonymousId: anonymousId });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/positions", optionalWalletSession(), async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const experimentId =
        typeof req.query.experimentId === "string" && req.query.experimentId.trim() !== ""
          ? req.query.experimentId.trim()
          : undefined;
      const data = await listBtcQuantRealPositions({ limit, offset, status, experimentId });
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
      const leaderStrategyId =
        body.leaderStrategyId != null ? Number(body.leaderStrategyId) : undefined;
      const maxNotionalUsd =
        body.maxNotionalUsd != null ? Number(body.maxNotionalUsd) : undefined;
      const data = await enableBtcQuantReal({
        anonymousId: req.user.anonymousId,
        enabledBy: req.user.walletAddress || req.user.anonymousId,
        leaderStrategyId,
        maxNotionalUsd,
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
      const data = await disableBtcQuantReal({ anonymousId: req.user.anonymousId });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/signal-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runBtcQuantRealSignalCycle();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/resolve-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await resolveBtcQuantRealPositions();
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
