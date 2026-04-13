/**
 * Arena tick: POST /internal/arena-worker/tick (optional; for external cron).
 * Same single-flight runner as in-process schedule: ../scripts/devfun-arena/arenaTickRunner.mjs
 *
 * Env:
 *   ARENA_CRON_SECRET — required for this route; header x-arena-cron-secret: <same>
 *   ARENA_PAUSED=1 — tick succeeds immediately with { idle, reason: arena_paused }; no API calls (between seasons)
 *   In-process schedule (no external cron): ARENA_SCHEDULE_TICKS=1 and optional ARENA_TICK_INTERVAL_MS (default 600000)
 *
 * Example crontab (every 10 minutes, Linux):
 *   0,10,20,30,40,50 * * * * curl -sS -f -X POST "https://YOUR_API/internal/arena-worker/tick" -H "x-arena-cron-secret: $ARENA_CRON_SECRET"
 */
import express from "express";
import { tryRunArenaWorkerTick } from "../scripts/devfun-arena/arenaTickRunner.mjs";

function requireArenaCronSecret(req, res, next) {
  const secret = (process.env.ARENA_CRON_SECRET || "").trim();
  if (!secret) {
    return res.status(503).json({
      success: false,
      error: "ARENA_CRON_SECRET is not set — refusing unauthenticated arena tick",
    });
  }
  const got = (req.get("x-arena-cron-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-arena-cron-secret",
    });
  }
  next();
}

export function createInternalArenaWorkerRouter() {
  const router = express.Router();

  router.post("/tick", requireArenaCronSecret, async (_req, res) => {
    const out = await tryRunArenaWorkerTick();
    if (out.ok) {
      return res.json({ success: true, data: out.data });
    }
    if (out.skipped) {
      return res.status(429).json({
        success: false,
        error: "arena_tick_already_running",
        hint: "Wait for the previous tick to finish or reduce overlap in cron schedule",
      });
    }
    return res.status(500).json({
      success: false,
      error: out.error,
    });
  });

  return router;
}
