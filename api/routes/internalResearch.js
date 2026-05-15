/**
 * Internal dashboard: research-store (persist/load) and research-resume (OpenRouter summarize).
 * API key auth, no x402. ATXP-based research/browse/x-search endpoints have been removed.
 */
import express from "express";
import { callOpenRouter } from "../libs/openrouter.js";
import { withLlmIdentitySystemNote } from "./agent/chat.js";
import { OPENROUTER_DEFAULT_MODEL } from "../config/openrouterModels.js";
import DashboardResearch from "../models/DashboardResearch.js";
import {
  runAgentTeamPipeline,
  AGENT_TEAM_DB_ID,
} from "../libs/agentTeamScheduler.js";
import {
  runX402XTrendsPipeline,
  X402_X_TRENDS_DB_ID,
} from "../libs/x402XTrendsScheduler.js";
import {
  runGrowthSyraMarketPipeline,
  runGrowthSyraSocialPipeline,
  runGrowthSectorNarrativePipeline,
  runAllGrowthInternalAgentsPipelines,
  GROWTH_SYRA_MARKET_DB_ID,
  GROWTH_SYRA_SOCIAL_DB_ID,
  GROWTH_SECTOR_NARRATIVE_DB_ID,
} from "../libs/growthInternalAgentsScheduler.js";
import {
  runInternalHrCoachPipeline,
  INTERNAL_HR_COACH_DB_ID,
} from "../libs/internalHrCoachScheduler.js";
import {
  runUponlyFundDevAgentTeamPipeline,
  UPONLY_FUND_DEV_TEAM_DB_ID,
} from "../libs/uponlyFundDevAgentScheduler.js";

/** Max tokens for internal research resume (OpenRouter). Higher than default for full summaries. */
const INTERNAL_RESEARCH_RESUME_MAX_TOKENS = 8192;

export async function createInternalResearchRouter() {
  const router = express.Router();

  // POST /internal/research-resume — summarize latest research using OpenRouter
  // Body: { panels?: Record<id, { data: { result }, lastQuery }>, customXSearch?, deepResearch?, browse? }
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

  // GET /internal/research-store — fetch latest research from DB (for dashboard load)
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

  // GET /internal/agent-team/latest — latest chained agent-team run (internal + business JSON)
  router.get("/agent-team/latest", async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: AGENT_TEAM_DB_ID }).lean();
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

  // GET /internal/x402-x-trends/latest — latest persisted x402 X trends digest (after a successful pipeline run)
  router.get("/x402-x-trends/latest", async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: X402_X_TRENDS_DB_ID }).lean();
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

  // POST /internal/x402-x-trends/run — X recent search + OpenRouter x402 digest + Telegram (optional x-x402-x-trends-cron-secret)
  router.post("/x402-x-trends/run", async (_req, res) => {
    try {
      const out = await runX402XTrendsPipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "x402 X trends pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // --- Growth internal agents ($1M-class growth intelligence; DexScreener / Jupiter / CoinGecko / X + OpenRouter)

  /** @param {string} dbId */
  const growthLatestHandler = (dbId) => async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: dbId }).lean();
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
  };

  router.get("/growth-syra-market/latest", growthLatestHandler(GROWTH_SYRA_MARKET_DB_ID));
  router.get("/growth-syra-social/latest", growthLatestHandler(GROWTH_SYRA_SOCIAL_DB_ID));
  router.get("/growth-sector-narrative/latest", growthLatestHandler(GROWTH_SECTOR_NARRATIVE_DB_ID));

  router.post("/growth-syra-market/run", async (_req, res) => {
    try {
      const out = await runGrowthSyraMarketPipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "growth-syra-market failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/growth-syra-social/run", async (_req, res) => {
    try {
      const out = await runGrowthSyraSocialPipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "growth-syra-social failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/growth-sector-narrative/run", async (_req, res) => {
    try {
      const out = await runGrowthSectorNarrativePipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "growth-sector-narrative failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/growth-internal-agents/run-all", async (_req, res) => {
    try {
      const out = await runAllGrowthInternalAgentsPipelines();
      return res.json({ success: true, ...out });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "growth-internal-agents run-all failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // POST /internal/agent-team/run — on-demand full pipeline (crawl + OpenRouter + Telegram + persist)
  // Optional GitHub cron: .github/workflows/agent-team-daily-wib.yml + x-agent-team-cron-secret (AGENT_TEAM_CRON_SECRET on API).
  router.post("/agent-team/run", async (_req, res) => {
    try {
      const out = await runAgentTeamPipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Agent team pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/hr-coach/latest", async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: INTERNAL_HR_COACH_DB_ID }).lean();
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

  router.post("/hr-coach/run", async (_req, res) => {
    try {
      const out = await runInternalHrCoachPipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "HR coach pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // GET /internal/uponly-fund-dev-team/latest — latest Up Only Fund dev internal run (API key; not on public fund site)
  router.get("/uponly-fund-dev-team/latest", async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: UPONLY_FUND_DEV_TEAM_DB_ID }).lean();
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

  // POST /internal/uponly-fund-dev-team/run — crawl + 13 dev specialists + HR → Telegram + Mongo (optional cron secret)
  router.post("/uponly-fund-dev-team/run", async (_req, res) => {
    try {
      const out = await runUponlyFundDevAgentTeamPipeline();
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Up Only Fund dev team pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // PUT /internal/research-store — replace latest research in DB (delete old, update with new)
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
