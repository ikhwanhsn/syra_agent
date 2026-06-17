import express from "express";
import {
  getBtcBubblemap,
  getBtcOverview,
  getBtcSnapshotMeta,
  BTC_VALID_INTERVALS,
} from "../libs/btcIntelligenceService.js";
import { getBtcDashboard } from "../libs/btcDashboardService.js";
import { BTC_SNAPSHOT_KEYS, btcBubblemapSnapshotKey } from "../libs/btcIntelligenceStore.js";

function snapshotNotReady(res, label) {
  return res.status(503).json({
    success: false,
    error: `${label} snapshot not ready — background refresh in progress`,
  });
}

export async function createBtcRouter() {
  const router = express.Router();

  router.get("/overview", async (_req, res) => {
    try {
      const data = await getBtcOverview();
      if (!data) return snapshotNotReady(res, "Overview");
      const meta = await getBtcSnapshotMeta(BTC_SNAPSHOT_KEYS.overview);
      res.json({ success: true, data, meta });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: msg });
    }
  });

  router.get("/dashboard", async (_req, res) => {
    try {
      const data = await getBtcDashboard();
      if (!data) return snapshotNotReady(res, "Dashboard");
      const meta = await getBtcSnapshotMeta(BTC_SNAPSHOT_KEYS.dashboard);
      res.json({ success: true, data, meta });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: msg });
    }
  });

  router.get("/bubblemap", async (req, res) => {
    try {
      const exchange = typeof req.query.exchange === "string" ? req.query.exchange : "binance";
      const rawInterval = typeof req.query.interval === "string" ? req.query.interval : "1h";
      const interval = BTC_VALID_INTERVALS.includes(rawInterval) ? rawInterval : "1h";
      const limit = req.query.limit != null ? Number(req.query.limit) : 200;
      const data = await getBtcBubblemap({ exchange, interval, limit });
      if (!data) return snapshotNotReady(res, "Bubblemap");
      const meta = await getBtcSnapshotMeta(btcBubblemapSnapshotKey(exchange, interval, limit));
      res.json({ success: true, data, meta });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: msg });
    }
  });

  return router;
}
