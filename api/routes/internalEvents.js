/**
 * Internal admin: event tracker — list, update status/notes, trigger scout pipeline.
 */
import express from "express";
import DashboardResearch from "../models/DashboardResearch.js";
import { EVENT_STATUSES } from "../config/eventScoutConfig.js";
import { getAdminDashboardWallets, isAdminWalletAddress } from "../libs/adminWallet.js";
import { optionalWalletSession } from "../utils/requireSession.js";
import {
  runEventScoutPipeline,
  listEvents,
  updateEvent,
  eventStatusCounts,
  EVENT_SCOUT_DB_ID,
} from "../libs/events/eventScoutPipeline.js";

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

export function createInternalEventsRouter() {
  const router = express.Router();

  router.get("/events", optionalWalletSession(), requireAdminWallet, async (req, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : "all";
      const region = typeof req.query.region === "string" ? req.query.region : "all";
      const source = typeof req.query.source === "string" ? req.query.source : "all";
      const category = typeof req.query.category === "string" ? req.query.category : "all";
      const search = typeof req.query.search === "string" ? req.query.search : "";
      const limit = Number(req.query.limit) || 50;
      const skip = Number(req.query.skip) || 0;

      const { items, total } = await listEvents({
        status,
        region,
        source,
        category,
        search,
        limit,
        skip,
      });
      const counts = await eventStatusCounts();

      return res.json({ success: true, items, total, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to list events",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.patch("/events/:id", optionalWalletSession(), requireAdminWallet, async (req, res) => {
    try {
      const { status, notes } = req.body || {};
      if (status && !EVENT_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Use: ${EVENT_STATUSES.join(", ")}`,
        });
      }
      const doc = await updateEvent(req.params.id, { status, notes });
      if (!doc) {
        return res.status(404).json({ success: false, error: "Event not found" });
      }
      const counts = await eventStatusCounts();
      return res.json({ success: true, data: doc, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Failed to update event",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/events/latest-run", optionalWalletSession(), requireAdminWallet, async (_req, res) => {
    try {
      const doc = await DashboardResearch.findOne({ id: EVENT_SCOUT_DB_ID }).lean();
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

  router.post("/events/run", async (_req, res) => {
    try {
      const out = await runEventScoutPipeline();
      const counts = await eventStatusCounts();
      return res.json({ ...out, counts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "Event scout pipeline failed",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}

export default createInternalEventsRouter;
