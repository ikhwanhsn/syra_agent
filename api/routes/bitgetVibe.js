/**
 * Bitget Vibe Trader API — Track 1 hackathon (NL strategy + autonomous loop).
 *
 * Env:
 * - BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE — optional live trading
 * - BITGET_VIBE_DEFAULT_MODE — paper (default) | live
 * - BITGET_VIBE_CRON_SECRET — if set, POST /cron/tick requires x-bitget-vibe-secret
 * - BITGET_VIBE_CRON_MS — interval for auto-ticks (default 0 = disabled)
 * - BITGET_VIBE_MAX_LIVE_NOTIONAL_USD — live cap per order (default 100)
 */
import express from "express";
import {
  compileVibeStrategy,
  createVibeSession,
  getVibeSession,
  getVibeSessionByShareSlug,
  listVibeSessions,
  runAllVibeLoopTicks,
  runVibeLoopTick,
} from "../libs/bitgetVibeService.js";
import { hasBitgetTradingCredentials } from "../libs/integrations/bitget/bitgetAgentHubClient.js";
import { resolveDefaultExecutionMode } from "../libs/integrations/bitget/bitgetExecutionAdapter.js";

function requireCronSecret(req, res, next) {
  const secret = (process.env.BITGET_VIBE_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-bitget-vibe-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-bitget-vibe-secret",
    });
  }
  return next();
}

export function createBitgetVibeRouter() {
  const router = express.Router();

  router.get("/config", (_req, res) => {
    res.json({
      success: true,
      data: {
        defaultMode: resolveDefaultExecutionMode(),
        liveCapable: hasBitgetTradingCredentials(),
        agentHub: {
          skillHub: [
            "macro-analyst",
            "market-intel",
            "news-briefing",
            "sentiment-analyst",
            "technical-analysis",
          ],
          mcp: "npx -y bitget-mcp-server",
        },
      },
    });
  });

  router.post("/compile", async (req, res) => {
    try {
      const prompt = req.body?.prompt;
      const strategySpec = await compileVibeStrategy(prompt);
      res.json({ success: true, data: { strategySpec } });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/sessions", async (req, res) => {
    try {
      const limit = req.query.limit;
      const data = await listVibeSessions({ limit });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/sessions", async (req, res) => {
    try {
      const data = await createVibeSession({
        prompt: req.body?.prompt,
        name: req.body?.name,
        mode: req.body?.mode,
        walletAddress: req.body?.walletAddress,
        runFirstTick: req.body?.runFirstTick !== false,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/sessions/share/:slug", async (req, res) => {
    try {
      const data = await getVibeSessionByShareSlug(req.params.slug);
      res.json({ success: true, data });
    } catch (e) {
      res.status(404).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/sessions/:id", async (req, res) => {
    try {
      const data = await getVibeSession(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      res.status(404).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/sessions/:id/tick", async (req, res) => {
    try {
      const tickResult = await runVibeLoopTick(req.params.id);
      const data = await getVibeSession(req.params.id);
      res.json({ success: true, data: { ...data, tickResult } });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/cron/tick", requireCronSecret, async (_req, res) => {
    try {
      const tickResult = await runAllVibeLoopTicks();
      res.json({ success: true, data: tickResult });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
