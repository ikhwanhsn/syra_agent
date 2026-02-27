/**
 * Sentinel Dashboard API — programmatic query API for Sentinel audit data.
 * Runs locally against the shared StorageBackend used by wrapWithSentinel.
 * Protected by API key (same as /internal/*).
 * @see https://sentinel.valeocash.com/docs/dashboard/overview
 */
import express from "express";
import { getSentinelDashboard } from "../libs/sentinelStorage.js";

const VALID_RANGES = ["last_hour", "last_day", "last_week", "last_month"];

function parseRange(query) {
  const range = query.range;
  if (!range) return { range: "last_day" };
  if (VALID_RANGES.includes(range)) return { range };
  const start = query.start != null ? Number(query.start) : NaN;
  const end = query.end != null ? Number(query.end) : NaN;
  if (Number.isFinite(start) && Number.isFinite(end)) {
    return { range: { start, end } };
  }
  return { range: "last_day" };
}

export async function createSentinelDashboardRouter() {
  const router = express.Router();

  /**
   * GET /internal/sentinel/spend
   * Query params: range (last_hour|last_day|last_week|last_month), start, end (ms), agentId?, team?, endpoint?
   */
  router.get("/spend", async (req, res) => {
    try {
      const dashboard = getSentinelDashboard();
      const { range } = parseRange(req.query);
      const query = {
        range,
        ...(req.query.agentId && { agentId: String(req.query.agentId) }),
        ...(req.query.team && { team: String(req.query.team) }),
        ...(req.query.endpoint && { endpoint: String(req.query.endpoint) }),
      };
      const report = await dashboard.getSpend(query);
      res.json(report);
    } catch (err) {
      console.error("[sentinel-dashboard] getSpend error:", err);
      res.status(500).json({ error: "Failed to query spend", message: err.message });
    }
  });

  /**
   * GET /internal/sentinel/agents
   * Summary for all agents (spend, count, last active).
   */
  router.get("/agents", async (req, res) => {
    try {
      const dashboard = getSentinelDashboard();
      const agents = await dashboard.getAgents();
      res.json({ agents });
    } catch (err) {
      console.error("[sentinel-dashboard] getAgents error:", err);
      res.status(500).json({ error: "Failed to query agents", message: err.message });
    }
  });

  /**
   * GET /internal/sentinel/alerts
   * Violations and anomalies. Optional query: range (for future filtering if dashboard supports it).
   */
  router.get("/alerts", async (req, res) => {
    try {
      const dashboard = getSentinelDashboard();
      const alerts = await dashboard.getAlerts();
      res.json({ alerts });
    } catch (err) {
      console.error("[sentinel-dashboard] getAlerts error:", err);
      res.status(500).json({ error: "Failed to query alerts", message: err.message });
    }
  });

  /**
   * GET /internal/sentinel/dashboard
   * Single response with spend (last_day), agents, and alerts for dashboard UI.
   */
  router.get("/dashboard", async (req, res) => {
    try {
      const dashboard = getSentinelDashboard();
      const range = req.query.range && VALID_RANGES.includes(req.query.range)
        ? req.query.range
        : "last_day";
      const [spend, agents, alerts] = await Promise.all([
        dashboard.getSpend({ range }),
        dashboard.getAgents(),
        dashboard.getAlerts(),
      ]);
      res.json({ spend, agents, alerts });
    } catch (err) {
      console.error("[sentinel-dashboard] dashboard error:", err);
      res.status(500).json({ error: "Failed to query dashboard", message: err.message });
    }
  });

  return router;
}
