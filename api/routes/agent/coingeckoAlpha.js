import express from "express";
import { COINGECKO_ALPHA_CRON_MS } from "../../config/coingeckoAlphaConfig.js";
import {
  getCoingeckoAlphaBriefForRead,
  getCoingeckoAlphaNextRefreshAt,
} from "../../libs/coingeckoAlphaPipeline.js";

/** Public GET is DB-only; pipeline runs on scheduler / POST /internal/coingecko-alpha/run. */
const BRIEF_CACHE_MAX_AGE_SEC = Math.max(
  300,
  Math.floor(COINGECKO_ALPHA_CRON_MS / 1000),
);

/**
 * CoinGecko Alpha — daily top gainers, pump catalyst research, forward predictions.
 */
export function createCoingeckoAlphaRouter() {
  const router = express.Router();

  /**
   * GET /agent/coingecko-alpha/brief
   * Serves the latest Mongo snapshot only (no on-demand pipeline).
   */
  router.get("/brief", async (_req, res) => {
    try {
      const cached = await getCoingeckoAlphaBriefForRead();
      if (!cached) {
        return res.status(503).json({
          success: false,
          error:
            "CoinGecko daily screen is not ready yet. Syra refreshes this feed about once every 24 hours.",
          code: "COINGECKO_ALPHA_NOT_READY",
        });
      }

      const nextRefreshAt = getCoingeckoAlphaNextRefreshAt(cached.savedAt);

      res.setHeader("Cache-Control", `public, max-age=${BRIEF_CACHE_MAX_AGE_SEC}`);
      res.setHeader("X-Syra-Alpha-Source", "database");
      if (cached.savedAt) {
        res.setHeader("X-Syra-Alpha-Saved-At", cached.savedAt);
      }

      return res.json({
        success: true,
        data: cached.data,
        savedAt: cached.savedAt,
        source: "database",
        nextRefreshAt,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "internal";
      return res.status(500).json({
        success: false,
        error: "coingecko_alpha_brief_failed",
        message,
      });
    }
  });

  return router;
}