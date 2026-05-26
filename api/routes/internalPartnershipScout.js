/**
 * Internal partnership scout — pipeline run + lead CRUD for dashboard UI.
 */
import express from "express";
import DashboardResearch from "../models/DashboardResearch.js";
import { PARTNERSHIP_SCOUT_STATUSES } from "../config/syraPartnershipScoutConfig.js";
import {
  runSyraPartnershipScoutPipeline,
  listPartnershipLeads,
  updatePartnershipLead,
  partnershipLeadStatusCounts,
  SYRA_PARTNERSHIP_SCOUT_DB_ID,
} from "../libs/syraPartnershipScoutPipeline.js";

export function createInternalPartnershipScoutRouter() {
  const router = express.Router();

  router.get("/partnership-scout/leads", async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : "all";
      const kind = typeof req.query.kind === "string" ? req.query.kind : "all";
      const limit = Number(req.query.limit) || 50;
      const skip = Number(req.query.skip) || 0;
      const { items, total } = await listPartnershipLeads({ status, kind, limit, skip });
      const counts = await partnershipLeadStatusCounts();
      return res.json({ success: true, items, total, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to list partnership leads",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.patch("/partnership-scout/leads/:id", async (req, res) => {
    try {
      const { status, notes } = req.body || {};
      if (status && !PARTNERSHIP_SCOUT_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Use: ${PARTNERSHIP_SCOUT_STATUSES.join(", ")}`,
        });
      }
      const doc = await updatePartnershipLead(req.params.id, { status, notes });
      if (!doc) {
        return res.status(404).json({ success: false, error: "Lead not found" });
      }
      const counts = await partnershipLeadStatusCounts();
      return res.json({ success: true, data: doc, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to update lead",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/partnership-scout/latest-run", async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: SYRA_PARTNERSHIP_SCOUT_DB_ID }).lean();
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

  router.post("/partnership-scout/run", async (_req, res) => {
    try {
      const out = await runSyraPartnershipScoutPipeline();
      const counts = await partnershipLeadStatusCounts();
      return res.json({ ...out, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Syra partnership scout pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
