/**
 * Public bridge buyback reporter.
 *
 * POST /bridge/buyback/report { requestId }
 * Verifies paid app fees via Relay GET /requests/v2, then queues USD into the
 * existing 24h SYRA buyback accumulator (never swaps immediately).
 */
import { Router } from "express";
import { BASE_PAYTO, EVM_PAYTO } from "../config/settlement.js";
import { queueBuybackRevenue } from "../libs/buybackScheduler.js";
import BridgeFeeReceipt from "../models/BridgeFeeReceipt.js";
import { isMongooseConnected } from "../config/mongoose.js";

const RELAY_REQUESTS_URL = "https://api.relay.link/requests/v2";

function normalizeEvm(addr) {
  return String(addr || "")
    .trim()
    .toLowerCase();
}

/** Resolve claim address: env override, else BASE_PAYTO, else EVM_PAYTO. */
export function resolveRelayAppFeeRecipient() {
  const fromEnv = (process.env.RELAY_APP_FEE_RECIPIENT || "").trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(fromEnv)) return fromEnv;
  if (/^0x[a-fA-F0-9]{40}$/.test(BASE_PAYTO)) return BASE_PAYTO;
  if (/^0x[a-fA-F0-9]{40}$/.test(EVM_PAYTO)) return EVM_PAYTO;
  return null;
}

function parseFeeUsd(value) {
  const n = Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Fetch a Relay request and sum paidAppFees matching our claim address.
 * @returns {Promise<{ ok: true, feeUsd: number, status: string, recipient: string } | { ok: false, error: string, httpStatus?: number }>}
 */
export async function verifyRelayPaidAppFee(requestId) {
  const recipient = resolveRelayAppFeeRecipient();
  if (!recipient) {
    return { ok: false, error: "relay_fee_recipient_not_configured", httpStatus: 503 };
  }

  const url = `${RELAY_REQUESTS_URL}?id=${encodeURIComponent(requestId)}`;
  const headers = { Accept: "application/json" };
  const apiKey = (process.env.RELAY_API_KEY || "").trim();
  if (apiKey) headers["x-api-key"] = apiKey;

  let res;
  try {
    res = await fetch(url, { headers });
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "relay_fetch_failed",
      httpStatus: 502,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `relay_http_${res.status}`,
      httpStatus: 502,
    };
  }

  let body;
  try {
    body = await res.json();
  } catch {
    return { ok: false, error: "relay_invalid_json", httpStatus: 502 };
  }

  const request = Array.isArray(body?.requests) ? body.requests[0] : null;
  if (!request) {
    return { ok: false, error: "request_not_found", httpStatus: 404 };
  }

  const status = String(request.status || "").toLowerCase();
  if (status !== "success") {
    return {
      ok: false,
      error: `request_not_success:${status || "unknown"}`,
      httpStatus: 409,
    };
  }

  const paid = Array.isArray(request.data?.paidAppFees)
    ? request.data.paidAppFees
    : [];
  const ours = paid.filter(
    (fee) => normalizeEvm(fee?.recipient) === normalizeEvm(recipient),
  );

  if (ours.length === 0) {
    return { ok: false, error: "no_matching_paid_app_fee", httpStatus: 422 };
  }

  let feeUsd = 0;
  for (const fee of ours) {
    feeUsd += parseFeeUsd(fee.amountUsd ?? fee.amountUsdCurrent);
  }
  if (!(feeUsd > 0)) {
    return { ok: false, error: "zero_fee_usd", httpStatus: 422 };
  }

  return { ok: true, feeUsd, status, recipient };
}

export function createBridgeBuybackRouter() {
  const router = Router();

  router.post("/buyback/report", async (req, res) => {
    try {
      const requestId = String(req.body?.requestId || "").trim();
      if (!requestId || requestId.length < 8 || requestId.length > 200) {
        return res.status(400).json({ success: false, error: "invalid_request_id" });
      }

      if (!isMongooseConnected()) {
        return res.status(503).json({ success: false, error: "mongodb_not_connected" });
      }

      const existing = await BridgeFeeReceipt.findOne({ requestId }).lean();
      if (existing) {
        return res.json({
          success: true,
          duplicate: true,
          requestId,
          feeUsd: existing.feeUsd,
        });
      }

      const verified = await verifyRelayPaidAppFee(requestId);
      if (!verified.ok) {
        return res.status(verified.httpStatus || 400).json({
          success: false,
          error: verified.error,
        });
      }

      try {
        await BridgeFeeReceipt.create({
          requestId,
          feeUsd: verified.feeUsd,
          recipient: verified.recipient,
          status: verified.status,
        });
      } catch (e) {
        // Race: another concurrent report won the unique index.
        if (e && (e.code === 11000 || String(e.message || "").includes("duplicate"))) {
          const again = await BridgeFeeReceipt.findOne({ requestId }).lean();
          return res.json({
            success: true,
            duplicate: true,
            requestId,
            feeUsd: again?.feeUsd ?? verified.feeUsd,
          });
        }
        throw e;
      }

      await queueBuybackRevenue(verified.feeUsd);

      return res.json({
        success: true,
        requestId,
        feeUsd: verified.feeUsd,
        queued: true,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  return router;
}
