/**
 * Public + authenticated $SYRA usage rewards routes.
 *
 * GET  /rewards/me?wallet=...     — wallet rewards status
 * POST /rewards/claim             — { wallet, amountSyra? } claim claimable $SYRA
 * POST /internal/rewards/fund     — epoch fund (cron / admin)
 */
import { Router } from "express";
import {
  getRewardsForWallet,
  claimRewards,
  fundRewardsEpoch,
  buildPublicRewardsSnapshot,
} from "../libs/syraUsageRewards.js";

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

  router.post("/claim", async (req, res) => {
    try {
      const wallet =
        (typeof req.body?.wallet === "string" && req.body.wallet.trim()) ||
        (req.get("x-connected-wallet") || "").trim() ||
        "";
      const amountSyra =
        req.body?.amountSyra != null ? Number(req.body.amountSyra) : undefined;
      if (!wallet) {
        return res.status(400).json({ success: false, error: "wallet_required" });
      }
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
      if (secret) {
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
