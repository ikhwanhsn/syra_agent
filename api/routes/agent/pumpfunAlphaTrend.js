import express from "express";
import { PUMPFUN_ALPHA_TREND_CRON_MS } from "../../config/pumpfunAlphaTrendConfig.js";
import {
  getPumpfunAlphaTrendForRead,
  getPumpfunAlphaTrendNextRefreshAt,
  runPumpfunAlphaTrendPipeline,
} from "../../libs/pumpfunAlphaTrendPipeline.js";

const BRIEF_CACHE_MAX_AGE_SEC = Math.max(60, Math.floor(PUMPFUN_ALPHA_TREND_CRON_MS / 1000));

const VALID_PERIODS = new Set(["today", "week", "month"]);
const VALID_MODES = new Set(["trend", "experiment"]);

/**
 * Pump.fun Alpha / Beta Play Radar — DB-backed reads only on GET /trend.
 */
export function createPumpfunAlphaTrendRouter() {
  const router = express.Router();

  router.get("/trend", async (req, res) => {
    try {
      const periodRaw = typeof req.query.period === "string" ? req.query.period.trim() : "week";
      const modeRaw = typeof req.query.mode === "string" ? req.query.mode.trim() : "trend";
      const period = VALID_PERIODS.has(periodRaw) ? periodRaw : "week";
      const mode = VALID_MODES.has(modeRaw) ? modeRaw : "trend";

      const cached = await getPumpfunAlphaTrendForRead(period, mode);
      if (!cached) {
        return res.status(503).json({
          success: false,
          error:
            "Alpha / Beta Play Radar has not run yet. Syra refreshes this agent about every hour once MongoDB is connected.",
          code: "PUMPFUN_ALPHA_TREND_NOT_READY",
        });
      }

      const nextRefreshAt = getPumpfunAlphaTrendNextRefreshAt(cached.savedAt);
      res.setHeader("Cache-Control", `public, max-age=${BRIEF_CACHE_MAX_AGE_SEC}`);
      res.setHeader("X-Syra-Alpha-Trend-Source", "database");
      if (cached.savedAt) {
        res.setHeader("X-Syra-Alpha-Trend-Saved-At", cached.savedAt);
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
        error: "pumpfun_alpha_trend_failed",
        message,
      });
    }
  });

  router.post("/run", async (req, res) => {
    try {
      const periodRaw = typeof req.query.period === "string" ? req.query.period.trim() : "week";
      const modeRaw = typeof req.query.mode === "string" ? req.query.mode.trim() : "trend";
      const period = VALID_PERIODS.has(periodRaw) ? periodRaw : "week";
      const mode = VALID_MODES.has(modeRaw) ? modeRaw : "trend";
      const force = req.query.force === "1" || req.query.force === "true";

      const out = await runPumpfunAlphaTrendPipeline(period, mode, { force });
      return res.json({ success: true, ...out });
    } catch (err) {
      const message = err instanceof Error ? err.message : "internal";
      return res.status(500).json({
        success: false,
        error: "pumpfun_alpha_trend_run_failed",
        message,
      });
    }
  });

  return router;
}
