import express from "express";
import {
  getBtcQuantLabState,
  getBtcQuantOverview,
  getBtcQuantStats,
  listBtcQuantRuns,
  listBtcQuantStrategies,
  resetAllBtcQuantFromScratch,
  resetBtcQuantFromScratch,
  resolveAllOpenBtcQuantRuns,
  resolveOpenBtcQuantRuns,
  runAllBtcQuantSignalCycles,
  runBtcQuantSignalCycle,
} from "../libs/btcQuantExperimentService.js";
import { normalizeBtcQuantLane } from "../config/btcQuantLanes.js";
import {
  getBtcQuantEvolutionSnapshot,
  runAllBtcQuantEvolutions,
  runBtcQuantEvolution,
  runBtcQuantRealEvolution,
} from "../libs/btcQuantExperimentEvolution.js";
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

function requireResetAuth(req, res, next) {
  const ui = (process.env.BTC_QUANT_RESET_UI_TOKEN || "").trim();
  const cron = (process.env.BTC_QUANT_EXPERIMENT_CRON_SECRET || "").trim();
  const uiHdr = (req.get("x-btc-quant-reset-ui") || "").trim();
  const cronHdr = (req.get("x-btc-quant-secret") || "").trim();
  if (ui && uiHdr === ui) return next();
  if (cron && cronHdr === cron) return next();
  if (!ui && !cron) return next();
  return res.status(403).json({
    success: false,
    error: "Missing or invalid reset credentials (x-btc-quant-reset-ui or x-btc-quant-secret)",
  });
}

export function createBtcQuantExperimentRouter() {
  const router = express.Router();

  router.get("/strategies", async (req, res) => {
    try {
      const lane = normalizeBtcQuantLane(req.query.lane);
      const strategies = await listBtcQuantStrategies(lane);
      res.json({ success: true, data: { strategies } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/state", async (req, res) => {
    try {
      const lane = normalizeBtcQuantLane(req.query.lane);
      const data = await getBtcQuantLabState(lane);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/stats", async (req, res) => {
    try {
      const lane = normalizeBtcQuantLane(req.query.lane);
      const data = await getBtcQuantStats(lane);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/overview", async (req, res) => {
    try {
      const lane = normalizeBtcQuantLane(req.query.lane);
      const data = await getBtcQuantOverview(lane);
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
      const lane = normalizeBtcQuantLane(req.query.lane);
      const data = await listBtcQuantRuns({ limit, offset, strategyId, status, experimentId, lane });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/signal-tick", requireCronSecret, async (req, res) => {
    try {
      const lane = req.query.lane != null ? normalizeBtcQuantLane(req.query.lane) : null;
      const data = lane ? await runBtcQuantSignalCycle(lane) : await runAllBtcQuantSignalCycles();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/resolve-tick", requireCronSecret, async (req, res) => {
    try {
      const lane = req.query.lane != null ? normalizeBtcQuantLane(req.query.lane) : null;
      const data = lane ? await resolveOpenBtcQuantRuns(lane) : await resolveAllOpenBtcQuantRuns();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/learning", async (req, res) => {
    try {
      const lane = normalizeBtcQuantLane(req.query.lane);
      const data = await getBtcQuantEvolutionSnapshot(lane);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/evolution-tick", requireCronSecret, async (req, res) => {
    try {
      const lane = req.query.lane != null ? normalizeBtcQuantLane(req.query.lane) : null;
      const data = lane ? await runBtcQuantEvolution(lane) : await runAllBtcQuantEvolutions();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/real/evolve-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runBtcQuantRealEvolution();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/reset-lab", requireResetAuth, async (req, res) => {
    try {
      const lane = req.query.lane != null ? normalizeBtcQuantLane(req.query.lane) : null;
      const title = typeof req.body?.title === "string" ? req.body.title : undefined;
      const data = lane
        ? await resetBtcQuantFromScratch({ lane, title })
        : await resetAllBtcQuantFromScratch({ title });
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
