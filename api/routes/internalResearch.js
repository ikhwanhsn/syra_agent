/**
 * Internal research/browse/x-search for dashboard (API key auth, no x402).
 * Same behavior as /research/dev, /browse/dev, /x-search/dev but available
 * when API is in production so the internal dashboard can run research without payment.
 * Also provides POST /internal/research-resume (Jatevo) to summarize latest research.
 * GET/PUT /internal/research-store persist latest research in DB (replace on save).
 */
import express from "express";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { researchService } from "../libs/atxp/researchService.js";
import { browseService } from "../libs/atxp/browseService.js";
import { xLiveSearchService } from "../libs/atxp/xLiveSearchService.js";
import { callJatevo } from "../libs/jatevo.js";
import DashboardResearch from "../models/DashboardResearch.js";

/** Max tokens for internal research resume (Jatevo). Higher than default for full summaries. */
const INTERNAL_RESEARCH_RESUME_MAX_TOKENS = 8192;

export async function createInternalResearchRouter() {
  const router = express.Router();

  function getClient() {
    const atxpConnectionString = process.env.ATXP_CONNECTION;
    if (!atxpConnectionString) {
      throw new Error("ATXP_CONNECTION is not set");
    }
    return atxpClient({
      mcpServer: researchService.mcpServer,
      account: new ATXPAccount(atxpConnectionString),
    });
  }

  async function getBrowseClient() {
    const atxpConnectionString = process.env.ATXP_CONNECTION;
    if (!atxpConnectionString) throw new Error("ATXP_CONNECTION is not set");
    return atxpClient({
      mcpServer: browseService.mcpServer,
      account: new ATXPAccount(atxpConnectionString),
    });
  }

  async function getXSearchClient() {
    const atxpConnectionString = process.env.ATXP_CONNECTION;
    if (!atxpConnectionString) throw new Error("ATXP_CONNECTION is not set");
    return atxpClient({
      mcpServer: xLiveSearchService.mcpServer,
      account: new ATXPAccount(atxpConnectionString),
    });
  }

  // GET /internal/research?query=...&type=quick|deep
  router.get("/research", async (req, res) => {
    const { query, type } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query is required" });
    }
    try {
      const client = await getClient();
      const toolName =
        type === "deep"
          ? researchService.deepResearchToolName
          : researchService.quickResearchToolName;
      const researchResult = await client.callTool({
        name: toolName,
        arguments:
          type === "deep"
            ? researchService.getDeepResearchArguments(query)
            : researchService.getQuickResearchArguments(query),
      });
      const { status, content, sources } =
        type === "deep"
          ? researchService.getDeepResearchResult(researchResult)
          : researchService.getQuickResearchResult(researchResult);
      if (status === "success") {
        return res.json({ status, content, sources });
      }
      return res.status(500).json({ error: "Research failed" });
    } catch (error) {
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // GET /internal/browse?query=...
  router.get("/browse", async (req, res) => {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query is required" });
    }
    try {
      const client = await getBrowseClient();
      const result = await client.callTool({
        name: browseService.runTaskToolName,
        arguments: browseService.getArguments(query),
      });
      const taskId = browseService.getRunTaskResult(result);
      const pollInterval = 5000;
      for (;;) {
        const taskResult = await client.callTool({
          name: browseService.getTaskToolName,
          arguments: { taskId },
        });
        const taskData = browseService.getGetTaskResult(taskResult);
        if (["finished", "stopped", "failed"].includes(taskData.status)) {
          return res.json({ query, result: JSON.stringify(taskData) });
        }
        await new Promise((r) => setTimeout(r, pollInterval));
      }
    } catch (error) {
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // GET /internal/x-search?query=...
  router.get("/x-search", async (req, res) => {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "query is required" });
    }
    try {
      const client = await getXSearchClient();
      const result = await client.callTool({
        name: xLiveSearchService.toolName,
        arguments: xLiveSearchService.getArguments({ query }),
      });
      const { status, query: q, message, citations, toolCalls, errorMessage } =
        xLiveSearchService.getResult(result);
      if (status === "success") {
        return res.json({ query: q, result: message, citations, toolCalls });
      }
      return res.status(500).json({
        error: "Search failed",
        message: errorMessage,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // POST /internal/research-resume — summarize latest research using Jatevo
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

      const result = await callJatevo(messages, {
        max_tokens: INTERNAL_RESEARCH_RESUME_MAX_TOKENS,
        temperature: 0.4,
      });

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
