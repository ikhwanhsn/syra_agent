import express from "express";
import { PUMPFUN_UTILITY_SCOUT_CRON_MS } from "../../config/pumpfunUtilityScoutConfig.js";
import {
  getPumpfunUtilityScoutBriefForRead,
  getPumpfunUtilityScoutNextRefreshAt,
  runPumpfunUtilityScoutAgent,
} from "../../libs/pumpfunUtilityScoutAgent.js";

const BRIEF_CACHE_MAX_AGE_SEC = Math.max(60, Math.floor(PUMPFUN_UTILITY_SCOUT_CRON_MS / 1000));

export function createPumpfunUtilityScoutRouter() {
  const router = express.Router();

  router.get("/brief", async (_req, res) => {
    try {
      const cached = await getPumpfunUtilityScoutBriefForRead();
      if (!cached) {
        return res.status(503).json({
          success: false,
          error: "Utility Scout has not run yet. Syra refreshes this agent about every hour once MongoDB is connected.",
          code: "PUMPFUN_UTILITY_SCOUT_NOT_READY",
        });
      }

      const nextRefreshAt = getPumpfunUtilityScoutNextRefreshAt(cached.savedAt);
      res.setHeader("Cache-Control", `public, max-age=${BRIEF_CACHE_MAX_AGE_SEC}`);
      res.setHeader("X-Syra-Utility-Scout-Source", "database");

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
        error: "pumpfun_utility_scout_brief_failed",
        message,
      });
    }
  });

  router.post("/run", async (req, res) => {
    try {
      const force = req.query.force === "1" || req.query.force === "true";
      const out = await runPumpfunUtilityScoutAgent({ force });
      return res.json({ success: true, ...out });
    } catch (err) {
      const message = err instanceof Error ? err.message : "internal";
      return res.status(500).json({
        success: false,
        error: "pumpfun_utility_scout_run_failed",
        message,
      });
    }
  });

  return router;
}
