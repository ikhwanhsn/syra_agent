/**
 * Internal dashboard: research-store, research-resume, and Syra Trend Scout pipeline.
 * API key auth, no x402.
 */
import express from "express";
import { callOpenRouter } from "../libs/openrouter.js";
import { withLlmIdentitySystemNote } from "./agent/chat.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import DashboardResearch from "../models/DashboardResearch.js";
import {
  runSyraTrendScoutPipeline,
  SYRA_TREND_SCOUT_DB_ID,
} from "../libs/syraTrendScoutPipeline.js";
import {
  runSyraPartnershipScoutPipeline,
  SYRA_PARTNERSHIP_SCOUT_DB_ID,
} from "../libs/syraPartnershipScoutPipeline.js";
import {
  ALPHA_X_BATCH_CANONICAL_DB_ID,
  loadAlphaXBatchSnapshot,
  runAlphaXBatchPipeline,
} from "../libs/alphaXBatchPipeline.js";

/** Max tokens for internal research resume (OpenRouter). Higher than default for full summaries. */
const INTERNAL_RESEARCH_RESUME_MAX_TOKENS = 8192;

export async function createInternalResearchRouter() {
  const router = express.Router();

  // POST /internal/research-resume — summarize latest research using OpenRouter
  router.post("/research-resume", async (req, res) => {
    try {
      const body = req.body || {};
      const parts = [];

      if (body.panels && typeof body.panels === "object") {
        for (const [id, p] of Object.entries(body.panels)) {
          if (p?.data?.result) {
            parts.push(`[Panel: ${id}]\nQuery: ${p.lastQuery || id}\n\n${p.data.result}`);
          }
        }
      }
      if (body.customXSearch?.data?.result) {
        parts.push(`[Custom X Search]\nQuery: ${body.customXSearch.lastQuery || "custom"}\n\n${body.customXSearch.data.result}`);
      }
      if (body.deepResearch?.data?.content) {
        parts.push(`[Deep Research]\nQuery: ${body.deepResearch.lastQuery || "deep"}\n\n${body.deepResearch.data.content}`);
      }
      if (body.browse?.data?.result) {
        const r = body.browse.data.result;
        const text = typeof r === "string" && r.length < 50000 ? r : (typeof r === "string" ? r.slice(0, 20000) + "…" : JSON.stringify(r).slice(0, 20000) + "…");
        parts.push(`[Browse]\nQuery: ${body.browse.lastQuery || "browse"}\n\n${text}`);
      }

      if (parts.length === 0) {
        return res.status(400).json({
          error: "No research content to summarize",
          hint: "Send panels, customXSearch, deepResearch, or browse with result content.",
        });
      }

      const researchBlob = parts.join("\n\n---\n\n");
      const systemPrompt = `You are an expert analyst. Given the following latest research findings (from X search, deep research, and browse), produce a concise executive resume/summary in clear sections. Focus on: key insights, strategic takeaways, risks or opportunities, and actionable recommendations for the Syra project. Use bullet points and short paragraphs. Write in English.`;
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Summarize this research into an executive resume:\n\n${researchBlob.slice(0, 120000)}` },
      ];

      const result = await callOpenRouter(
        withLlmIdentitySystemNote(messages, OPENROUTER_DEFAULT_MODEL),
        {
          max_tokens: INTERNAL_RESEARCH_RESUME_MAX_TOKENS,
          temperature: 0.4,
        }
      );

      return res.json({ resume: result.response, truncated: result.truncated || false });
    } catch (error) {
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/research-store", async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: "latest" }).lean();
      if (!doc?.payload) {
        return res.json({ payload: null });
      }
      const savedAt = doc.savedAt ? new Date(doc.savedAt).toISOString() : undefined;
      return res.json({ payload: doc.payload, savedAt });
    } catch (error) {
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/trend-scout/latest", async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: SYRA_TREND_SCOUT_DB_ID }).lean();
      if (!doc?.payload) {
        return res.json({ success: true, data: null, savedAt: undefined });
      }
      const savedAt = doc.savedAt ? new Date(doc.savedAt).toISOString() : undefined;
      return res.json({ success: true, data: doc.payload, savedAt });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/trend-scout/run", async (_req, res) => {
    try {
      const out = await runSyraTrendScoutPipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Syra trend scout pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/partnership-scout/latest", async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: SYRA_PARTNERSHIP_SCOUT_DB_ID }).lean();
      if (!doc?.payload) {
        return res.json({ success: true, data: null, savedAt: undefined });
      }
      const savedAt = doc.savedAt ? new Date(doc.savedAt).toISOString() : undefined;
      return res.json({ success: true, data: doc.payload, savedAt });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/partnership-scout/run", async (_req, res) => {
    try {
      const out = await runSyraPartnershipScoutPipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Syra partnership scout pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/alpha-x-batch/latest", async (_req, res) => {
    try {
      const doc = await loadAlphaXBatchSnapshot(ALPHA_X_BATCH_CANONICAL_DB_ID);
      if (!doc) {
        return res.json({ success: true, data: null, savedAt: undefined });
      }
      return res.json({ success: true, data: doc.data, savedAt: doc.savedAt });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/alpha-x-batch/run", async (_req, res) => {
    try {
      const out = await runAlphaXBatchPipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "alpha-x-batch pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.put("/research-store", async (req, res) => {
    try {
      const payload = req.body?.payload ?? req.body;
      if (!payload || typeof payload !== "object") {
        return res.status(400).json({ error: "payload is required (object)" });
      }
      const savedAt = new Date().toISOString();
      const toSave = { ...payload, savedAt };
      await DashboardResearch.findOneAndUpdate(
        { id: "latest" },
        { id: "latest", payload: toSave, savedAt: new Date() },
        { upsert: true, new: true }
      );
      return res.json({ ok: true, savedAt });
    } catch (error) {
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
