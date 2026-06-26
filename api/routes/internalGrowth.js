/**
 * Internal admin: S3Labs growth metrics dashboard.
 */
import express from "express";
import { getAdminDashboardWallets, isAdminWalletAddress } from "../libs/adminWallet.js";
import { requireMongooseConnection } from "../config/mongoose.js";
import { optionalWalletSession } from "../utils/requireSession.js";
import { getGrowthMetrics } from "../libs/growth/growthMetricsAggregator.js";

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

export function createInternalGrowthRouter() {
  const router = express.Router();

  router.get(
    "/growth-metrics",
    optionalWalletSession(),
    requireAdminWallet,
    requireMongooseConnection,
    async (_req, res) => {
      try {
        const data = await getGrowthMetrics();
        return res.json({ success: true, data });
      } catch (error) {
        console.error("[internal/growth-metrics] failed:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to load growth metrics",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  return router;
}
