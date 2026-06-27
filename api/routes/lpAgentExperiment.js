import express from "express";
import { resolveLpExperimentStrategies } from "../libs/lpExperimentStrategyResolve.js";
import {
  getLpCandidatePools,
  getLpExperimentLabState,
  getLpExperimentStats,
  listLpExperimentRuns,
  resetLpExperimentFromScratch,
  resolveOpenLpRuns,
  runLpExperimentSignalCycle,
} from "../libs/lpExperimentService.js";
import { runLpExperimentEvolution } from "../libs/lpExperimentEvolution.js";
import { getLpGlobalOverview } from "../libs/lpGlobalOverview.js";
import { fetchMeteoraPoolPages, fetchMeteoraPoolsByTokenMint } from "../libs/meteoraDlmmClient.js";

function parsePositiveInt(value, fallback, { min = 1, max = 500 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function stripPoolRaw(pool) {
  if (!pool || typeof pool !== "object") return pool;
  const { raw: _raw, ...rest } = pool;
  return rest;
}

function matchesPoolSearch(pool, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    pool.poolName,
    pool.baseSymbol,
    pool.quoteSymbol,
    pool.poolAddress,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function requireCronSecret(req, res, next) {
  const secret = (process.env.LP_AGENT_EXPERIMENT_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-lp-experiment-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-lp-experiment-secret",
    });
  }
  return next();
}

/** Reset: cron secret OR LP_AGENT_EXPERIMENT_FINALIZE_UI_TOKEN via x-lp-experiment-finalize-ui (same as prior finalize). */
function requireResetAuth(req, res, next) {
  const ui = (process.env.LP_AGENT_EXPERIMENT_FINALIZE_UI_TOKEN || "").trim();
  const cron = (process.env.LP_AGENT_EXPERIMENT_CRON_SECRET || "").trim();
  const uiHdr = (req.get("x-lp-experiment-finalize-ui") || "").trim();
  const cronHdr = (req.get("x-lp-experiment-secret") || "").trim();
  if (ui && uiHdr === ui) return next();
  if (cron && cronHdr === cron) return next();
  if (!ui && !cron) return next();
  return res.status(403).json({
    success: false,
    error: "Missing or invalid reset credentials (x-lp-experiment-finalize-ui or x-lp-experiment-secret)",
  });
}

export function createLpAgentExperimentRouter() {
  const router = express.Router();

  router.get("/strategies", async (_req, res) => {
    try {
      const strategies = await resolveLpExperimentStrategies();
      res.json({ success: true, data: { strategies } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/candidates", async (_req, res) => {
    try {
      const candidates = await getLpCandidatePools();
      res.json({ success: true, data: { candidates } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/stats", async (_req, res) => {
    try {
      const data = await getLpExperimentStats();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/overview", async (_req, res) => {
    try {
      const data = await getLpGlobalOverview();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/pools", async (req, res) => {
    try {
      const sortKey =
        typeof req.query.sort_key === "string" && req.query.sort_key.trim()
          ? req.query.sort_key.trim()
          : "tvl";
      const order =
        typeof req.query.order === "string" && req.query.order.toLowerCase() === "asc"
          ? "asc"
          : "desc";
      const limit = parsePositiveInt(req.query.limit, 100, { min: 1, max: 200 });
      const pages = parsePositiveInt(req.query.pages, 3, { min: 1, max: 10 });
      const hideLowTvl = req.query.hideLowTvl !== "false";
      const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
      const mint = typeof req.query.mint === "string" ? req.query.mint.trim() : "";

      const rows = mint
        ? await fetchMeteoraPoolsByTokenMint(mint)
        : await fetchMeteoraPoolPages({
            pages,
            limit,
            sortKey,
            order,
            hideLowTvl,
          });

      const filtered = rows.filter((pool) => (search ? matchesPoolSearch(pool, search) : true));
      const pools = filtered.map(stripPoolRaw);

      res.json({
        success: true,
        data: {
          pools,
          count: pools.length,
        },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/state", async (_req, res) => {
    try {
      const data = await getLpExperimentLabState();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/runs", async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const strategyId =
        req.query.strategyId != null && String(req.query.strategyId).trim() !== ""
          ? Number(req.query.strategyId)
          : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const symbol = typeof req.query.symbol === "string" ? req.query.symbol : undefined;
      const experimentId =
        typeof req.query.experimentId === "string" && req.query.experimentId.trim() !== ""
          ? req.query.experimentId.trim()
          : undefined;
      const data = await listLpExperimentRuns({ limit, offset, strategyId, status, symbol, experimentId });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/signal-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runLpExperimentSignalCycle();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/resolve-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await resolveOpenLpRuns();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  /**
   * Delete all LP experiment runs, all agent ledger rows, all archive documents, and start a new cohort at zero.
   * Body optional: { title?: string }
   */
  router.post("/reset-lab", requireResetAuth, async (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const data = await resetLpExperimentFromScratch({
        title: typeof body.title === "string" ? body.title : undefined,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  /**
   * Cull worst LP strategies, wipe their runs, spawn elite-mutated replacements.
   * Also spawns new daily agents (ids 20–97) mutated from sim leaders.
   * Body optional: { removeCount?, minDecided?, dailySpawnCount?, maxStrategies?, pinnedStrategyIds?: number[] }
   */
  router.post("/evolution-tick", requireCronSecret, async (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const removeCount =
        body.removeCount != null && Number.isFinite(Number(body.removeCount))
          ? Number(body.removeCount)
          : undefined;
      const minDecided =
        body.minDecided != null && Number.isFinite(Number(body.minDecided))
          ? Number(body.minDecided)
          : undefined;
      const dailySpawnCount =
        body.dailySpawnCount != null && Number.isFinite(Number(body.dailySpawnCount))
          ? Number(body.dailySpawnCount)
          : undefined;
      const maxStrategies =
        body.maxStrategies != null && Number.isFinite(Number(body.maxStrategies))
          ? Number(body.maxStrategies)
          : undefined;
      let pinned = undefined;
      if (Array.isArray(body.pinnedStrategyIds)) {
        pinned = new Set(
          body.pinnedStrategyIds
            .map((x) => Number(x))
            .filter((n) => Number.isInteger(n) && n >= 0 && n <= 99),
        );
      }
      const data = await runLpExperimentEvolution({
        removeCount,
        minDecided,
        dailySpawnCount,
        maxStrategies,
        pinned,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
