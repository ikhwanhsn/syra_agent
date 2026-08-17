/**
 * GET /agent/refunds — read-only ledger of in-house x402 refunds.
 * Also mounted at /agent/pact for back-compat (GET /refunds, GET /status).
 */
import express from "express";
import RefundLedger from "../../models/RefundLedger.js";
import { getRefundResolvedConfig, isRefundEnabled } from "../../config/refund.js";
import { requireSession } from "../../utils/requireSession.js";

const router = express.Router();

async function listRefunds(req, res) {
  try {
    const anonymousId =
      typeof req.query.anonymousId === "string"
        ? req.query.anonymousId.trim()
        : req.user?.anonymousId?.trim?.() || "";

    if (!anonymousId) {
      return res.status(400).json({ success: false, error: "anonymousId is required" });
    }

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

    const refunds = await RefundLedger.find({ anonymousId })
      .sort({ settledAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: {
        enabled: isRefundEnabled(),
        config: getRefundResolvedConfig(),
        refunds,
        count: refunds.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

router.get("/", listRefunds);
router.get("/refunds", listRefunds);

router.get("/status", async (_req, res) => {
  return res.json({
    success: true,
    data: getRefundResolvedConfig(),
  });
});

export function createAgentRefundsRouter() {
  return router;
}

/** @deprecated alias for Pact-era callers / route factory smoke tests */
export function createAgentPactRouter() {
  return router;
}

export default router;
