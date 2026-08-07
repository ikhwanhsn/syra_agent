/**
 * Control plane + read API for the OKX.AI Trading Hackathon agent.
 *
 * Read endpoints (state/positions/trades/snapshots) are public (no secrets are
 * ever returned). Mutating endpoints (enable/disable/kill/resume/tick) require
 * the admin/cron secret `OKX_TRADING_CRON_SECRET` via the `x-okx-trading-secret`
 * header. If the secret is unset, mutations are refused in production and only
 * allowed in non-production for local testing.
 */
import express from "express";
import {
  enableOkxTrading,
  disableOkxTrading,
  killOkxTrading,
  resumeOkxTrading,
  getOkxTradingState,
  runOkxTradingCycle,
} from "../libs/okxTrading/okxTradingService.js";
import {
  okxTradingTradeRepo,
  okxTradingPositionRepo,
  okxTradingSnapshotRepo,
} from "../repositories/okxTrading/index.js";
import { rankUniverse } from "../libs/okxTrading/decisionEngine.js";
import { getTradingConfig } from "../libs/okxTrading/tradingConfig.js";

function requireAdminSecret(req, res, next) {
  const secret = (process.env.OKX_TRADING_CRON_SECRET || "").trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        error: "OKX_TRADING_CRON_SECRET is not configured; refusing mutation in production",
      });
    }
    return next();
  }
  const got = (req.get("x-okx-trading-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({ success: false, error: "Invalid or missing x-okx-trading-secret" });
  }
  return next();
}

function ok(res, data) {
  res.json({ success: true, data });
}
function fail(res, e) {
  res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
}

export function createOkxTradingRouter() {
  const router = express.Router();

  router.get("/state", async (_req, res) => {
    try {
      ok(res, await getOkxTradingState());
    } catch (e) {
      fail(res, e);
    }
  });

  router.get("/positions", async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      ok(res, await okxTradingPositionRepo.listRecent(limit));
    } catch (e) {
      fail(res, e);
    }
  });

  router.get("/trades", async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      ok(res, await okxTradingTradeRepo.list({ limit, offset, status }));
    } catch (e) {
      fail(res, e);
    }
  });

  router.get("/snapshots", async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 100;
      ok(res, await okxTradingSnapshotRepo.listRecent(limit));
    } catch (e) {
      fail(res, e);
    }
  });

  // Dry read-only preview of the ranked universe (no orders, no persistence).
  router.get("/decide", async (_req, res) => {
    try {
      const cfg = getTradingConfig();
      let sentimentFn;
      try {
        const m = await import("../libs/internalNewsAgent.js");
        sentimentFn = typeof m.fetchSentimentTicker === "function" ? m.fetchSentimentTicker : undefined;
      } catch {
        sentimentFn = undefined;
      }
      const candidates = await rankUniverse({
        universe: cfg.universe,
        source: cfg.signalSource,
        bars: cfg.bars,
        sentimentFn,
      });
      ok(res, { candidates });
    } catch (e) {
      fail(res, e);
    }
  });

  router.post("/enable", requireAdminSecret, async (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      ok(
        res,
        await enableOkxTrading({
          agentWalletAddress:
            typeof body.agentWalletAddress === "string" ? body.agentWalletAddress : undefined,
          live: typeof body.live === "boolean" ? body.live : undefined,
        }),
      );
    } catch (e) {
      fail(res, e);
    }
  });

  router.post("/disable", requireAdminSecret, async (_req, res) => {
    try {
      ok(res, await disableOkxTrading());
    } catch (e) {
      fail(res, e);
    }
  });

  router.post("/kill", requireAdminSecret, async (req, res) => {
    try {
      const reason = req.body?.reason ? String(req.body.reason) : "manual_kill";
      ok(res, await killOkxTrading(reason));
    } catch (e) {
      fail(res, e);
    }
  });

  router.post("/resume", requireAdminSecret, async (_req, res) => {
    try {
      ok(res, await resumeOkxTrading());
    } catch (e) {
      fail(res, e);
    }
  });

  // Manual cycle trigger (also driven by the internal cron).
  router.post("/tick", requireAdminSecret, async (req, res) => {
    try {
      const force = req.body?.force === true;
      ok(res, await runOkxTradingCycle({ force }));
    } catch (e) {
      fail(res, e);
    }
  });

  return router;
}
