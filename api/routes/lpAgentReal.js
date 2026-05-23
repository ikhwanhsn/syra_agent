import express from "express";
import { requireSession, optionalWalletSession } from "../utils/requireSession.js";
import {
  disableLpReal,
  enableLpReal,
  getLpRealState,
  getLpRealSummary,
  listLpRealPositions,
  resolveLpRealPositions,
  runLpRealSignalCycle,
} from "../libs/lpRealService.js";

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

export function createLpAgentRealRouter() {
  const router = express.Router();

  router.get("/state", optionalWalletSession(), async (req, res) => {
    try {
      const data = await getLpRealState({
        viewerAnonymousId: req.user?.anonymousId ?? null,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/summary", async (_req, res) => {
    try {
      const data = await getLpRealSummary();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/positions", async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const experimentId =
        typeof req.query.experimentId === "string" && req.query.experimentId.trim() !== ""
          ? req.query.experimentId.trim()
          : undefined;
      const data = await listLpRealPositions({ limit, offset, status, experimentId });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/enable", requireSession({ allowGuest: false }), async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId;
      if (!anonymousId) {
        return res.status(401).json({ success: false, error: "auth_required" });
      }
      const data = await enableLpReal({ anonymousId, enabledBy: anonymousId });
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      let status = 500;
      if (
        msg === "not_owner_of_lp_real_agent" ||
        e?.code === "not_owner_of_lp_real_agent" ||
        msg === "lp_real_wallet_not_allowlisted" ||
        e?.code === "lp_real_wallet_not_allowlisted"
      ) {
        status = 403;
      } else if (e?.code === "insufficient_balance" || msg.startsWith("insufficient_balance")) status = 400;
      res.status(status).json({
        success: false,
        error: msg,
        ...(e?.onChainBalanceSol != null ? { onChainBalanceSol: e.onChainBalanceSol } : {}),
        ...(e?.minBankSol != null ? { minBankSol: e.minBankSol } : {}),
      });
    }
  });

  router.post("/disable", requireSession({ allowGuest: false }), async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId;
      if (!anonymousId) {
        return res.status(401).json({ success: false, error: "auth_required" });
      }
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const closeAll = Boolean(body.closeAll);
      const data = await disableLpReal({ anonymousId, closeAll });
      res.json({ success: true, data });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      let status = 500;
      if (
        msg === "not_owner_of_lp_real_agent" ||
        e?.code === "not_owner_of_lp_real_agent" ||
        msg === "lp_real_wallet_not_allowlisted" ||
        e?.code === "lp_real_wallet_not_allowlisted"
      ) {
        status = 403;
      }
      res.status(status).json({ success: false, error: msg });
    }
  });

  router.post("/signal-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runLpRealSignalCycle();
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
      const data = await resolveLpRealPositions();
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
