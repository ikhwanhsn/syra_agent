import express from "express";
import {
  getScalperOverview,
  listScalperRuns,
  getScalperEquityHistory,
  runScalperSignalCycle,
  resolveOpenScalperRuns,
  getScalperLearning,
  runScalperLearning,
  resetScalperFromScratch,
} from "../libs/scalper/scalperService.js";
import SignAudit from "../models/agent/SignAudit.js";
import { getPublicTreasuryAddresses } from "../libs/publicMetricsService.js";

function parsePositiveInt(value, fallback, { min = 1, max = 500 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function requireCronSecret(req, res, next) {
  const secret = (process.env.SCALPER_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-scalper-cron-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-scalper-cron-secret",
    });
  }
  return next();
}

function requireResetAuth(req, res, next) {
  const secret = (process.env.SCALPER_CRON_SECRET || "").trim();
  const got = (req.get("x-scalper-cron-secret") || "").trim();
  if (secret && got === secret) return next();
  if (!secret) return next();
  return res.status(403).json({
    success: false,
    error: "Missing or invalid reset credentials (x-scalper-cron-secret)",
  });
}

export function createScalperExperimentRouter() {
  const router = express.Router();

  router.get("/overview", async (_req, res) => {
    try {
      const data = await getScalperOverview();
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
      const limit = parsePositiveInt(req.query.limit, 50, { min: 1, max: 200 });
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const status = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
      const data = await listScalperRuns({ limit, offset, status });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/equity-history", async (_req, res) => {
    try {
      const data = await getScalperEquityHistory();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/learning", async (_req, res) => {
    try {
      const data = await getScalperLearning();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  /** Public reference agent card — Franklin-style demo with x402 spend summary. */
  router.get("/reference", async (_req, res) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [overview, spendAgg, treasury] = await Promise.all([
        getScalperOverview(),
        SignAudit.aggregate([
          {
            $match: {
              action: "x402_pay",
              status: "ok",
              ts: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: null,
              totalUsd: { $sum: { $ifNull: ["$amountUsd", 0] } },
              calls: { $sum: 1 },
            },
          },
        ]),
        Promise.resolve(getPublicTreasuryAddresses()),
      ]);
      const spend = spendAgg[0] || { totalUsd: 0, calls: 0 };
      res.setHeader("Cache-Control", "public, max-age=30");
      res.json({
        success: true,
        data: {
          agent: "Syra Scalper",
          tagline: "An agent that pays for its own intelligence via x402",
          mode: "paper",
          wallet: treasury.solana,
          treasury,
          x402SpendLast30d: {
            totalUsd: Math.round((spend.totalUsd || 0) * 100) / 100,
            calls: spend.calls || 0,
          },
          ledger: overview?.ledger ?? null,
          equityUsd: overview?.ledger?.equityUsd ?? null,
          returnPct: overview?.ledger?.returnPct ?? null,
          openPositions: overview?.ledger?.openPositions ?? 0,
          lastSignalAt: overview?.lastSignalAt ?? null,
          demoUrl: "https://syraa.fun/reference/scalper",
          metricsUrl: "https://api.syraa.fun/api/metrics",
        },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/learning-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runScalperLearning();
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
      const data = await runScalperSignalCycle();
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
      const data = await resolveOpenScalperRuns();
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
      const title = typeof req.body?.title === "string" ? req.body.title.trim() : undefined;
      const data = await resetScalperFromScratch({ title });
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
