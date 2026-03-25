/**
 * Trading agent experiment API — no x402. Uses MongoDB + Binance public data.
 *
 * Env (optional):
 * - TRADING_EXPERIMENT_CRON_SECRET: if set, POST /run-cycle and POST /validate-tick require header x-trading-experiment-secret
 */
import express from "express";
import {
  getExperimentStats,
  listRecentRuns,
  runExperimentSignalCycle,
  runAllExperimentSignalCycles,
  runFullExperimentCycle,
  resolveOpenExperimentRunsIncremental1m,
} from "../libs/tradingExperimentService.js";
import {
  getStrategiesForSuite,
  normalizeSuite,
  EXPERIMENT_SUITES_META,
} from "../config/tradingExperimentStrategies.js";

function requireCronSecret(req, res, next) {
  const secret = (process.env.TRADING_EXPERIMENT_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-trading-experiment-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-trading-experiment-secret",
    });
  }
  return next();
}

export function createTradingExperimentRouter() {
  const router = express.Router();

  router.get("/strategies", (req, res) => {
    const suite = normalizeSuite(req.query.suite);
    const strategies = getStrategiesForSuite(suite);
    res.json({
      success: true,
      data: { strategies, source: "binance", suite },
    });
  });

  router.get("/suites", (_req, res) => {
    res.json({ success: true, data: { suites: EXPERIMENT_SUITES_META } });
  });

  router.get("/stats", async (req, res) => {
    try {
      const data = await getExperimentStats({ suite: req.query.suite });
      res.json({ success: true, data });
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
      const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
      const symbol = typeof req.query.symbol === "string" ? req.query.symbol : "";
      const signal = typeof req.query.signal === "string" ? req.query.signal : "";
      let agentId = undefined;
      if (req.query.agentId != null && String(req.query.agentId).trim() !== "") {
        const n = Number(req.query.agentId);
        if (Number.isInteger(n) && n >= 0 && n <= 99) agentId = n;
      }
      const { runs, total } = await listRecentRuns({
        limit,
        offset,
        suite: req.query.suite,
        ...(status ? { status } : {}),
        ...(agentId !== undefined ? { agentId } : {}),
        ...(symbol.trim() ? { symbol: symbol.trim() } : {}),
        ...(signal.trim() ? { signal: signal.trim() } : {}),
      });
      res.json({ success: true, data: { runs, total } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/run-cycle", requireCronSecret, async (_req, res) => {
    try {
      const result = await runFullExperimentCycle();
      res.json({ success: true, data: result });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  /** 1m TP/SL scan only (use every ~10s); does not sample new signals. */
  router.post("/validate-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await resolveOpenExperimentRunsIncremental1m();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  /** New hourly samples only; does not run validation (assumes validate-tick cron). Body: { suite?: "primary" | "secondary" | "all" } (default all). */
  router.post("/signal-tick", requireCronSecret, async (req, res) => {
    try {
      const raw = req.body?.suite;
      const mode =
        raw == null || raw === ""
          ? "all"
          : String(raw).trim().toLowerCase();
      const data =
        mode === "all" || mode === "both"
          ? await runAllExperimentSignalCycles()
          : await runExperimentSignalCycle({ suite: raw });
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
