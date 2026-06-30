import express from "express";
import { runMacroIntelligencePipeline } from "../libs/btc3/macroIntelligencePipeline.js";
import {
  approveBtc3Decision,
  getBtc3Entities,
  getBtc3Events,
  getBtc3Executions,
  getBtc3Learning,
  getBtc3Logs,
  getBtc3News,
  getBtc3Overview,
  getBtc3Portfolio,
  getBtc3Predictions,
  getBtc3Reasoning,
  getBtc3Settings,
  getBtc3Similarity,
  getBtc3State,
  getBtc3PaperTrading,
  runBtc3Learning,
} from "../libs/btc3/btc3MacroApiService.js";
import { resetBtc3FromScratch } from "../libs/btc3/btc3PaperTradingService.js";

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

function requireResetAuth(req, res, next) {
  const ui = (process.env.BTC3_RESET_UI_TOKEN || "").trim();
  const cron = (process.env.BTC3_MACRO_CRON_SECRET || "").trim();
  const uiHdr = (req.get("x-btc3-reset-ui") || "").trim();
  const cronHdr = (req.get("x-btc3-macro-secret") || "").trim();
  if (ui && uiHdr === ui) return next();
  if (cron && cronHdr === cron) return next();
  if (!ui && !cron) return next();
  return res.status(403).json({
    success: false,
    error: "Missing or invalid reset credentials (x-btc3-reset-ui or x-btc3-macro-secret)",
  });
}

function parseLimit(value, fallback = 20, max = 100) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, n);
}

function parseOffset(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function createBtc3MacroRouter() {
  const router = express.Router();

  router.get("/overview", async (_req, res) => {
    try {
      const data = await getBtc3Overview();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/state", async (_req, res) => {
    try {
      const data = await getBtc3State();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/news", async (req, res) => {
    try {
      const data = await getBtc3News({
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
        search: typeof req.query.search === "string" ? req.query.search : "",
        providerId: typeof req.query.providerId === "string" ? req.query.providerId : null,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/events", async (req, res) => {
    try {
      const data = await getBtc3Events({
        limit: parseLimit(req.query.limit),
        offset: parseOffset(req.query.offset),
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/entities", async (req, res) => {
    try {
      const data = await getBtc3Entities({
        limit: parseLimit(req.query.limit, 50),
        offset: parseOffset(req.query.offset),
        type: typeof req.query.type === "string" ? req.query.type : null,
        search: typeof req.query.search === "string" ? req.query.search : "",
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/similarity", async (_req, res) => {
    try {
      const data = await getBtc3Similarity();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/reasoning", async (req, res) => {
    try {
      const data = await getBtc3Reasoning({ limit: parseLimit(req.query.limit, 10) });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/predictions", async (req, res) => {
    try {
      const data = await getBtc3Predictions({ limit: parseLimit(req.query.limit, 10) });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/portfolio", async (_req, res) => {
    try {
      const data = await getBtc3Portfolio();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/executions", async (req, res) => {
    try {
      const data = await getBtc3Executions({ limit: parseLimit(req.query.limit, 20) });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/logs", async (req, res) => {
    try {
      const data = await getBtc3Logs({
        limit: parseLimit(req.query.limit, 50),
        offset: parseOffset(req.query.offset),
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/settings", async (_req, res) => {
    try {
      const data = await getBtc3Settings();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/paper", async (req, res) => {
    try {
      const data = await getBtc3PaperTrading({
        limit: parseLimit(req.query.limit, 25),
        offset: parseOffset(req.query.offset),
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/run", requireCronSecret, async (_req, res) => {
    try {
      const data = await runMacroIntelligencePipeline();
      res.json({ success: data.success !== false, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/portfolio/approve", async (req, res) => {
    try {
      const decisionId = typeof req.body?.decisionId === "string" ? req.body.decisionId.trim() : "";
      if (!decisionId) {
        return res.status(400).json({ success: false, error: "decisionId required" });
      }
      const approvedBy = typeof req.body?.approvedBy === "string" ? req.body.approvedBy : "admin";
      const data = await approveBtc3Decision(decisionId, approvedBy);
      if (!data.success) {
        return res.status(data.error === "Decision not found" ? 404 : 503).json(data);
      }
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/learning", async (_req, res) => {
    try {
      const data = await getBtc3Learning();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/learning-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runBtc3Learning();
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
      const title = typeof req.body?.title === "string" ? req.body.title : undefined;
      const data = await resetBtc3FromScratch({ title });
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
