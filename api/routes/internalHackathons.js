/**
 * Internal admin: hackathon tracker — list, update status/notes, trigger scout pipeline.
 */
import express from "express";
import DashboardResearch from "../models/DashboardResearch.js";
import { HACKATHON_STATUSES } from "../config/hackathonScoutConfig.js";
import { getAdminDashboardWallets, isAdminWalletAddress } from "../libs/adminWallet.js";
import { optionalWalletSession } from "../utils/requireSession.js";
import {
  runHackathonScoutPipeline,
  listHackathons,
  updateHackathon,
  hackathonStatusCounts,
  HACKATHON_SCOUT_DB_ID,
} from "../libs/hackathon/hackathonScoutPipeline.js";

function requireAdminWallet(req, res, next) {
  const allow = getAdminDashboardWallets();
  if (allow.length === 0) {
    return res.status(403).json({ success: false, error: "admin_disabled" });
  }

  let walletAddress = req.user?.walletAddress ?? null;
  if (!walletAddress) {
    const fromHeader = req.get("x-admin-wallet") || req.get("x-wallet-address");
    if (typeof fromHeader === "string" && fromHeader.trim()) {
      walletAddress = fromHeader.trim();
    }
  }

  if (!walletAddress) {
    return res.status(403).json({ success: false, error: "admin_required" });
  }
  if (!isAdminWalletAddress(walletAddress)) {
    return res.status(403).json({ success: false, error: "not_admin" });
  }

  req.user = { ...(req.user || {}), walletAddress, guest: false };
  next();
}

export function createInternalHackathonsRouter() {
  const router = express.Router();

  router.get("/hackathons", optionalWalletSession(), async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : "all";
      const region = typeof req.query.region === "string" ? req.query.region : "all";
      const source = typeof req.query.source === "string" ? req.query.source : "all";
      const openState = typeof req.query.openState === "string" ? req.query.openState : "all";
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const limit = Number(req.query.limit) || 50;
      const skip = Number(req.query.skip) || 0;

      const { items, total } = await listHackathons({
        status,
        region,
        source,
        openState,
        search,
        limit,
        skip,
      });
      const counts = await hackathonStatusCounts();

      return res.json({ success: true, items, total, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to list hackathons",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.patch("/hackathons/:id", optionalWalletSession(), requireAdminWallet, async (req, res) => {
    try {
      const { status, notes } = req.body || {};
      if (status && !HACKATHON_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Use: ${HACKATHON_STATUSES.join(", ")}`,
        });
      }
      const doc = await updateHackathon(req.params.id, { status, notes });
      if (!doc) {
        return res.status(404).json({ success: false, error: "Hackathon not found" });
      }
      const counts = await hackathonStatusCounts();
      return res.json({ success: true, data: doc, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to update hackathon",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/hackathons/latest-run", optionalWalletSession(), async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: HACKATHON_SCOUT_DB_ID }).lean();
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

  router.post("/hackathons/run", async (_req, res) => {
    try {
      const out = await runHackathonScoutPipeline();
      const counts = await hackathonStatusCounts();
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

export default createInternalHackathonsRouter;
