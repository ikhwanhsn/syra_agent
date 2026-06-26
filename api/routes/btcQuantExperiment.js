import express from "express";
import {
  getBtcQuantLabState,
  getBtcQuantOverview,
  getBtcQuantStats,
  listBtcQuantRuns,
  listBtcQuantStrategies,
  resolveOpenBtcQuantRuns,
  runBtcQuantSignalCycle,
} from "../libs/btcQuantExperimentService.js";
import {
  buildBtcOnchainSignalReport,
  fetchCbbtcOnchainOhlcvRows,
} from "../libs/btcQuantOnchainMarket.js";

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

export function createBtcQuantExperimentRouter() {
  const router = express.Router();

  router.get("/strategies", async (_req, res) => {
    try {
      const strategies = listBtcQuantStrategies();
      res.json({ success: true, data: { strategies } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/state", async (_req, res) => {
    try {
      const data = await getBtcQuantLabState();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/stats", async (_req, res) => {
    try {
      const data = await getBtcQuantStats();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/overview", async (_req, res) => {
    try {
      const data = await getBtcQuantOverview();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/signal-report", async (req, res) => {
    try {
      const bar = typeof req.query.bar === "string" && req.query.bar.trim() ? req.query.bar.trim() : "1h";
      const limit = req.query.limit != null ? Number(req.query.limit) : 200;
      const data = await buildBtcOnchainSignalReport({ bar, limit });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/ohlcv", async (req, res) => {
    try {
      const bar = typeof req.query.bar === "string" && req.query.bar.trim() ? req.query.bar.trim() : "1h";
      const limit = req.query.limit != null ? Number(req.query.limit) : 80;
      const rows = await fetchCbbtcOnchainOhlcvRows(bar, limit);
      const points = rows.map((row) => ({
        t: row[0],
        o: row[1],
        h: row[2],
        l: row[3],
        c: row[4],
        v: row[5] ?? 0,
      }));
      res.json({ success: true, data: { bar, points } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/runs", async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const strategyId =
        req.query.strategyId != null && String(req.query.strategyId).trim() !== ""
          ? Number(req.query.strategyId)
          : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const experimentId =
        typeof req.query.experimentId === "string" && req.query.experimentId.trim() !== ""
          ? req.query.experimentId.trim()
          : undefined;
      const data = await listBtcQuantRuns({ limit, offset, strategyId, status, experimentId });
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
      const data = await runBtcQuantSignalCycle();
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
      const data = await resolveOpenBtcQuantRuns();
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
