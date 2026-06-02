/**
 * Syra Alpha Arena API — Bitget Hackathon grand-prize build.
 *
 * Env: PLAYBOOK_API_KEY (Bitget Playbook ACCESS-KEY), MONGODB_URI, OPENROUTER_API_KEY
 * Optional: PINATA_JWT + SOLANA_PRIVATE_KEY for 8004 publish; PAYER_KEYPAIR for Nansen overlay
 */
import express from "express";
import {
  createArenaAgent,
  getArenaAgent,
  getArenaAgentByShareSlug,
  getArenaLeaderboard,
  publishArenaAgent,
  publishArenaAgentFull,
  registerArenaAgent8004,
  seedArenaAgents,
  subscribeArenaAgent,
  tickArenaAgent,
} from "../libs/arenaService.js";
import { compileArenaStrategy } from "../libs/playbookStrategyCompiler.js";
import { computeSyraAlphaOverlay } from "../libs/syraAlphaOverlay.js";
import { hasPlaybookCredentials } from "../libs/integrations/bitget/getagentClient.js";

export function createArenaRouter() {
  const router = express.Router();

  router.get("/config", (_req, res) => {
    res.json({
      success: true,
      data: {
        playbookCapable: hasPlaybookCredentials(),
        bitgetAgentHub: {
          skillHub: [
            "macro-analyst",
            "market-intel",
            "news-briefing",
            "sentiment-analyst",
            "technical-analysis",
          ],
        },
        demoUrl: "https://agent.syraa.fun/arena",
      },
    });
  });

  router.post("/compile", async (req, res) => {
    try {
      const strategySpec = await compileArenaStrategy(req.body?.prompt);
      res.json({ success: true, data: { strategySpec } });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/overlay", async (req, res) => {
    try {
      const overlay = await computeSyraAlphaOverlay({
        token: req.body?.token || "BTC",
        bar: req.body?.bar || "1h",
        limit: req.body?.limit,
      });
      res.json({ success: true, data: { overlay } });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/leaderboard", async (req, res) => {
    try {
      const data = await getArenaLeaderboard({ limit: req.query.limit });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/agents", async (req, res) => {
    try {
      const data = await createArenaAgent({
        prompt: req.body?.prompt,
        name: req.body?.name,
        ownerWalletAddress: req.body?.walletAddress,
        runPlaybook: req.body?.runPlaybook !== false,
        runPaperTick: req.body?.runPaperTick !== false,
      });
      res.status(201).json({ success: true, data });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/seed", async (_req, res) => {
    try {
      const data = await seedArenaAgents();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/agents/share/:slug", async (req, res) => {
    try {
      const data = await getArenaAgentByShareSlug(req.params.slug);
      res.json({ success: true, data });
    } catch (e) {
      res.status(404).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/agents/:id", async (req, res) => {
    try {
      const data = await getArenaAgent(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      res.status(404).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/agents/:id/tick", async (req, res) => {
    try {
      const data = await tickArenaAgent(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/agents/:id/publish", async (req, res) => {
    try {
      const data =
        req.body?.register8004 === true
          ? await publishArenaAgentFull(req.params.id, { register8004: true })
          : await publishArenaAgent(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/agents/:id/register-8004", async (req, res) => {
    try {
      const data = await registerArenaAgent8004(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/agents/:id/subscribe", async (req, res) => {
    try {
      const data = await subscribeArenaAgent(req.params.id, {
        subscriberId: req.body?.subscriberId,
        chatId: req.body?.chatId,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
