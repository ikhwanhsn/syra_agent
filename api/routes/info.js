import express from "express";
import { getDexscreenerTokenInfo } from "../scripts/getDexscreenerTokenInfo.js";

export async function createInfoRouter() {
  const router = express.Router();
  const syraPrice = await getDexscreenerTokenInfo(
    "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
  );
  router.get("/", (_, res) => {
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
