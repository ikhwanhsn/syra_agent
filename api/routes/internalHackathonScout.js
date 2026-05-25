/**
 * Internal hackathon scout — pipeline run + lead CRUD for dashboard UI.
 */
import express from "express";
import DashboardResearch from "../models/DashboardResearch.js";
import { HACKATHON_SCOUT_STATUSES } from "../config/syraHackathonScoutConfig.js";
import {
  runSyraHackathonScoutPipeline,
  listHackathonLeads,
  updateHackathonLead,
  hackathonLeadStatusCounts,
  SYRA_HACKATHON_SCOUT_DB_ID,
} from "../libs/syraHackathonScoutPipeline.js";

export function createInternalHackathonScoutRouter() {
  const router = express.Router();

  router.get("/hackathon-scout/leads", async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : "all";
      const limit = Number(req.query.limit) || 50;
      const skip = Number(req.query.skip) || 0;
      const { items, total } = await listHackathonLeads({ status, limit, skip });
      const counts = await hackathonLeadStatusCounts();
      return res.json({ success: true, items, total, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to list hackathon leads",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.patch("/hackathon-scout/leads/:id", async (req, res) => {
    try {
      const { status, notes } = req.body || {};
      if (status && !HACKATHON_SCOUT_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Use: ${HACKATHON_SCOUT_STATUSES.join(", ")}`,
        });
      }
      const doc = await updateHackathonLead(req.params.id, { status, notes });
      if (!doc) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }
      const counts = await hackathonLeadStatusCounts();
      return res.json({ success: true, data: doc, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to update lead",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/hackathon-scout/latest-run", async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: SYRA_HACKATHON_SCOUT_DB_ID }).lean();
      if (!doc?.payload) {
        return res.json({ success: true, data: null, savedAt: undefined });
      }
      const savedAt = doc.savedAt ? new Date(doc.savedAt).toISOString() : undefined;
      return res.json({ success: true, data: doc.payload, savedAt });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/hackathon-scout/run", async (_req, res) => {
    try {
      const out = await runSyraHackathonScoutPipeline();
      const counts = await hackathonLeadStatusCounts();
      return res.json({ ...out, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Hackathon scout pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
