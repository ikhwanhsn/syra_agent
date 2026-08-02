/**
 * Public + authenticated $SYRA usage rewards routes.
 *
 * GET  /rewards/me?wallet=...     — wallet rewards status (read-only)
 * POST /rewards/claim             — session-bound claim of claimable $SYRA
 * POST /internal/rewards/fund     — epoch fund (cron / admin)
 */
import { Router } from "express";
import {
  getRewardsForWallet,
  claimRewards,
  fundRewardsEpoch,
  buildPublicRewardsSnapshot,
} from "../libs/syraUsageRewards.js";
import { requireSession } from "../utils/requireSession.js";

export function createSyraRewardsRouter() {
  const router = Router();

  router.get("/summary", async (_req, res) => {
    try {
      const data = await buildPublicRewardsSnapshot();
      res.setHeader("Cache-Control", "public, max-age=30");
      return res.json({ success: true, ...data });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.get("/me", async (req, res) => {
    try {
      const wallet =
        (typeof req.query.wallet === "string" && req.query.wallet.trim()) ||
        (req.get("x-connected-wallet") || "").trim() ||
        "";
      if (!wallet) {
        return res.status(400).json({ success: false, error: "wallet_required" });
      }
      const data = await getRewardsForWallet(wallet);
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * SECURITY: claim must be bound to a verified session wallet.
   * Body/header wallet fields are ignored to prevent unauthorized treasury drains.
   */
  router.post("/claim", requireSession({ requireOwnership: false }), async (req, res) => {
    try {
      if (!req.user || req.user.guest || !req.user.walletAddress) {
        return res.status(401).json({ success: false, error: "auth_required" });
      }
      const wallet = String(req.user.walletAddress).trim();
      const amountSyra =
        req.body?.amountSyra != null ? Number(req.body.amountSyra) : undefined;
      const out = await claimRewards(wallet, amountSyra);
      const status = out.success ? 200 : 400;
      return res.status(status).json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}

export function createInternalRewardsRouter() {
  const router = Router();

  router.post("/rewards/fund", async (req, res) => {
    try {
      const secret = (process.env.BUYBACK_CRON_SECRET || process.env.CRON_SECRET || "").trim();
      const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production";
      // SECURITY: fail closed in production when secret is unset
      if (!secret) {
        if (isProd) {
          return res.status(403).json({ success: false, error: "cron_secret_not_configured" });
        }
      } else {
        const got = (req.get("x-buyback-cron-secret") || req.get("x-cron-secret") || "").trim();
        if (got !== secret) {
          return res.status(401).json({ success: false, error: "unauthorized" });
        }
      }
      const pointsToSyra =
        req.body?.pointsToSyra != null ? Number(req.body.pointsToSyra) : undefined;
      const maxSyraToFund =
        req.body?.maxSyraToFund != null ? Number(req.body.maxSyraToFund) : undefined;
      const out = await fundRewardsEpoch({ pointsToSyra, maxSyraToFund });
      return res.json(out);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}

export default createSyraRewardsRouter;
