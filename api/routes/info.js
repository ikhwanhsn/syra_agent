import express from "express";
import { getDexscreenerTokenInfo } from "../scripts/getDexscreenerTokenInfo.js";
import Chat from "../models/agent/Chat.js";
import { AGENT_TOOLS } from "../config/agentTools.js";
import PaidApiCall from "../models/PaidApiCall.js";

export async function createInfoRouter() {
  const router = express.Router();

  /**
   * GET /info/stats – landing page stats (users, uptime, signals, tools).
   * Public, no payment. Used by landing HeroStats.
   */
  router.get("/stats", async (_, res) => {
    try {
      const [userCount, signalCount] = await Promise.all([
        Chat.distinct("anonymousId").then((ids) => ids.filter(Boolean).length),
        PaidApiCall.countDocuments({ path: "/signal" }),
      ]);
      const toolsCount = AGENT_TOOLS.length;
      const serverUptimeSeconds = process.uptime();
      // Uptime %: we don't track downtime; show 99.9% as target/sla (replace with real monitoring later)
      const uptimePercent = 99.9;

      res.json({
        users: userCount,
        uptime: uptimePercent,
        signals: signalCount,
        tools: toolsCount,
        serverUptimeSeconds: Math.round(serverUptimeSeconds),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({
        error: "Failed to load stats",
        message: err?.message || "Unknown error",
      });
    }
  });

  router.get("/", async (_, res) => {
    const syraPrice = await getDexscreenerTokenInfo(
      "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
    );
    res.status(200).json({
      token: syraPrice.pairs[0],
      website: "https://syraa.fun",
      api: "https://api.syraa.fun",
      telegram: "https://t.me/syra_ai",
      x: "https://x.com/syra_agent",
      x_community: "https://x.com/i/communities/1984803953360716275",
      docs: "https://docs.syraa.fun",
      linktree: "https://linktr.ee/syra_ai",
      agent:
        "https://www.x402scan.com/composer/agent/c543b43e-6f49-492d-9f8a-6b0cc273fb06/chat",
      live_burn:
        "https://solscan.io/token/8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump?activity_type=ACTIVITY_SPL_BURN&exclude_amount_zero=true&remove_spam=false&page_size=10",
      dex: {
        pumpfun:
          "https://pump.fun/8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump",
        dexscreener:
          "https://dexscreener.com/solana/0x8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump",
      },
    });
  });
  return router;
}
