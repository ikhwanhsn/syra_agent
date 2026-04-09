import express from "express";
import { getDexscreenerTokenInfo } from "../scripts/getDexscreenerTokenInfo.js";
import Chat from "../models/agent/Chat.js";
import AgentWallet from "../models/agent/AgentWallet.js";
import PredictionStaking from "../models/prediction-game/Staking.js";
import PredictionCreator from "../models/prediction-game/Creator.js";
import PredictionEvent from "../models/prediction-game/Event.js";
import UserCustomStrategy from "../models/UserCustomStrategy.js";
import { AGENT_TOOLS } from "../config/agentTools.js";

/** Normalize wallet strings so the same address is not double-counted across chains/casing. */
function normalizeWalletAddress(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  return s.startsWith("0x") ? s.toLowerCase() : s;
}

/**
 * Distinct wallets across agent, prediction game, trading experiment, and event participation.
 */
async function countUniqueEcosystemWallets() {
  const set = new Set();
  const addList = (list) => {
    for (const w of list) {
      const n = normalizeWalletAddress(w);
      if (n) set.add(n);
    }
  };

  const [agentWallets, stakingWallets, creatorWallets, strategyWallets, eventWalletRows] =
    await Promise.all([
      AgentWallet.distinct("walletAddress", {
        walletAddress: { $exists: true, $nin: [null, ""] },
      }),
      PredictionStaking.distinct("walletAddress"),
      PredictionCreator.distinct("walletAddress"),
      UserCustomStrategy.distinct("walletAddress"),
      PredictionEvent.aggregate([
        {
          $project: {
            addrs: {
              $concatArrays: [
                {
                  $cond: [
                    { $gt: [{ $strLenCP: { $ifNull: ["$creatorWallet", ""] } }, 0] },
                    ["$creatorWallet"],
                    [],
                  ],
                },
                {
                  $map: {
                    input: { $ifNull: ["$participants", []] },
                    as: "p",
                    in: "$$p.walletAddress",
                  },
                },
                {
                  $map: {
                    input: { $ifNull: ["$predictions", []] },
                    as: "p",
                    in: "$$p.walletAddress",
                  },
                },
                {
                  $map: {
                    input: { $ifNull: ["$winners", []] },
                    as: "w",
                    in: "$$w.walletAddress",
                  },
                },
              ],
            },
          },
        },
        { $unwind: { path: "$addrs", preserveNullAndEmptyArrays: false } },
        { $match: { addrs: { $nin: [null, ""] } } },
        { $group: { _id: "$addrs" } },
      ]),
    ]);

  addList(agentWallets);
  addList(stakingWallets);
  addList(creatorWallets);
  addList(strategyWallets);
  addList(eventWalletRows.map((r) => r._id));

  return set.size;
}

/** User-authored messages in agent chats (questions). */
async function countAgentUserMessages() {
  const rows = await Chat.aggregate([
    { $unwind: { path: "$messages", preserveNullAndEmptyArrays: false } },
    { $match: { "messages.role": "user" } },
    { $count: "total" },
  ]);
  return rows[0]?.total ?? 0;
}

export async function createInfoRouter() {
  const router = express.Router();

  /**
   * GET /info/stats – landing HeroStats.
   * users = unique wallets (ecosystem-wide, one per address).
   * chat = total user messages to the AI agent.
   * session = agent chat documents (sessions).
   * tools = agent tool count.
   */
  router.get("/stats", async (_, res) => {
    try {
      const toolsCount = AGENT_TOOLS.length;
      const serverUptimeSeconds = process.uptime();

      const [users, chat, session] = await Promise.all([
        countUniqueEcosystemWallets(),
        countAgentUserMessages(),
        Chat.countDocuments({}),
      ]);

      res.json({
        users,
        chat,
        session,
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
