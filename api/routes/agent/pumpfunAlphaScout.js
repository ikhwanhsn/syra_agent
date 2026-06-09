import express from "express";
import { PUMPFUN_ALPHA_SCOUT_CRON_MS } from "../../config/pumpfunAlphaScoutConfig.js";
import {
  getPumpfunAlphaScoutBriefForRead,
  getPumpfunAlphaScoutNextRefreshAt,
  runPumpfunAlphaScoutAgent,
} from "../../libs/pumpfunAlphaScoutAgent.js";

const BRIEF_CACHE_MAX_AGE_SEC = Math.max(60, Math.floor(PUMPFUN_ALPHA_SCOUT_CRON_MS / 1000));

/**
 * Pump.fun Alpha Scout Agent — learns from past alphas to predict new runners.
 */
export function createPumpfunAlphaScoutRouter() {
  const router = express.Router();

  router.get("/brief", async (_req, res) => {
    try {
      const cached = await getPumpfunAlphaScoutBriefForRead();
      if (!cached) {
        return res.status(503).json({
          success: false,
          error: "Alpha Scout has not run yet. Syra refreshes this agent about every hour once MongoDB is connected.",
          code: "PUMPFUN_ALPHA_SCOUT_NOT_READY",
        });
      }

      const nextRefreshAt = getPumpfunAlphaScoutNextRefreshAt(cached.savedAt);
      res.setHeader("Cache-Control", `public, max-age=${BRIEF_CACHE_MAX_AGE_SEC}`);
      res.setHeader("X-Syra-Alpha-Scout-Source", "database");
      if (cached.savedAt) {
        res.setHeader("X-Syra-Alpha-Scout-Saved-At", cached.savedAt);
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
        error: "pumpfun_alpha_scout_brief_failed",
        message,
      });
    }
  });

  router.post("/run", async (req, res) => {
    try {
      const force = req.query.force === "1" || req.query.force === "true";
      const out = await runPumpfunAlphaScoutAgent({ force });
      return res.json({ success: true, ...out });
    } catch (err) {
      const message = err instanceof Error ? err.message : "internal";
      return res.status(500).json({
        success: false,
        error: "pumpfun_alpha_scout_run_failed",
        message,
      });
    }
  });

  return router;
}
