/**
 * Inbound refund: client paid Syra, handler then returned 5xx after eager settle.
 */
import {
  clampRefundAmountUsd,
  getMaxRefundUsd,
  isInboundRefundEnabled,
  networkToRefundChain,
} from "../../config/refund.js";
import { executeRefund } from "./refundService.js";

/**
 * Pure decision for inbound handler-failure refunds.
 * @param {{
 *   statusCode?: number;
 *   settle?: { success?: boolean; payer?: string; transaction?: string } | null;
 *   priceUsd?: number;
 *   network?: string;
 * }} input
 */
export function evaluateInboundRefund(input = {}) {
  const statusCode = Number(input.statusCode);
  if (!Number.isFinite(statusCode) || statusCode < 500) {
    return { refundable: false, reason: "not_server_error" };
  }
  if (!input.settle?.success) {
    return { refundable: false, reason: "settle_not_success" };
  }
  const payer = String(input.settle.payer || "").trim();
  if (!payer) {
    return { refundable: false, reason: "no_payer" };
  }
  const chain = networkToRefundChain(input.network);
  if (!chain) {
    return { refundable: false, reason: "unsupported_chain" };
  }
  const amountUsd = clampRefundAmountUsd(input.priceUsd, getMaxRefundUsd());
  if (amountUsd <= 0) {
    return { refundable: false, reason: "amount_zero" };
  }
  return {
    refundable: true,
    reason: "handler_5xx_after_settle",
    payer,
    chain,
    amountUsd,
    paymentTxSignature: typeof input.settle.transaction === "string" ? input.settle.transaction : null,
  };
}

/**
 * Attach a fire-and-forget finish listener. Never throws into the request path.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function registerInboundRefundGuard(req, res) {
  if (!isInboundRefundEnabled()) return;
  if (typeof res?.on !== "function") return;
  if (!req?.x402Payment?.settlePromise) return;
  if (req._syraInboundRefundGuard) return;
  req._syraInboundRefundGuard = true;

  res.on("finish", () => {
    maybeRefundInbound(req, res).catch((e) => {
      console.warn("[refund] inbound guard failed:", e?.message || e);
    });
  });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function maybeRefundInbound(req, res) {
  if (!isInboundRefundEnabled()) return { ok: false, skipped: true, reason: "disabled" };

  let settle = null;
  try {
    settle = await req.x402Payment.settlePromise;
  } catch {
    return { ok: false, skipped: true, reason: "settle_rejected" };
  }

  const decision = evaluateInboundRefund({
    statusCode: res.statusCode,
    settle,
    priceUsd: req.x402Payment?.priceUsd,
    network: req.x402Payment?.accepted?.network,
  });
  if (!decision.refundable) {
    return { ok: false, skipped: true, reason: decision.reason };
  }

  const path = String(req.path || req.url || "");
  const tx = decision.paymentTxSignature || "";
  const idempotencyKey = tx
    ? `inbound:${tx}`
    : `inbound:${path}:${decision.payer}:${req.x402Payment?.settleStartedAt || ""}`;

  return executeRefund({
    direction: "inbound",
    chain: decision.chain,
    toWallet: decision.payer,
    amountUsd: decision.amountUsd,
    reason: decision.reason,
    paymentTxSignature: decision.paymentTxSignature,
    payer: decision.payer,
    path,
    httpStatus: res.statusCode,
    idempotencyKey,
  });
}
