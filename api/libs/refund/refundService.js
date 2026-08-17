/**
 * Orchestrate classify -> cap -> idempotent ledger -> on-chain send.
 */
import RefundLedger from "../../models/RefundLedger.js";
import {
  clampRefundAmountUsd,
  getMaxRefundUsd,
  isRefundEnabled,
} from "../../config/refund.js";
import { sendUsdcRefund } from "./refundSender.js";

const PENDING_STALE_MS = 120_000;

/**
 * @param {{
 *   direction: 'inbound' | 'outbound';
 *   chain: 'solana' | 'base' | 'xlayer' | 'algorand';
 *   toWallet: string;
 *   amountUsd: number;
 *   reason: string;
 *   paymentTxSignature?: string | null;
 *   payer?: string | null;
 *   providerHost?: string | null;
 *   toolId?: string | null;
 *   anonymousId?: string | null;
 *   agentPubkey?: string | null;
 *   path?: string | null;
 *   httpStatus?: number | null;
 *   idempotencyKey: string;
 *   source?: string | null;
 *   premiumUsd?: number | null;
 *   premiumTx?: string | null;
 *   coveredUrl?: string | null;
 *   payerWallet?: string | null;
 *   mode?: 'relay' | 'reprobe' | null;
 * }} input
 */
export async function executeRefund(input) {
  if (!isRefundEnabled()) {
    return { ok: false, skipped: true, reason: "disabled" };
  }

  const toWallet = String(input.toWallet || "").trim();
  const amountUsd = clampRefundAmountUsd(input.amountUsd, getMaxRefundUsd());
  const idempotencyKey = String(input.idempotencyKey || "").trim();
  if (!toWallet || !idempotencyKey || amountUsd <= 0) {
    return { ok: false, skipped: true, reason: "invalid" };
  }

  const now = new Date();
  const fields = {
    direction: input.direction,
    chain: input.chain,
    anonymousId: input.anonymousId || null,
    agentPubkey: input.agentPubkey || null,
    payer: input.payer || null,
    toWallet,
    amountUsd,
    paymentTxSignature: input.paymentTxSignature || null,
    reason: input.reason || null,
    providerHost: input.providerHost || null,
    toolId: input.toolId || null,
    path: input.path || null,
    httpStatus: Number.isFinite(input.httpStatus) ? input.httpStatus : null,
    source: input.source || "syra-refund",
    premiumUsd: Number.isFinite(input.premiumUsd) ? input.premiumUsd : null,
    premiumTx: input.premiumTx || null,
    coveredUrl: input.coveredUrl || null,
    payerWallet: input.payerWallet || input.payer || null,
    mode: input.mode || null,
  };

  let doc;
  try {
    doc = await RefundLedger.create({
      ...fields,
      idempotencyKey,
      status: "pending",
      settledAt: now,
    });
  } catch (e) {
    const isDup = e?.code === 11000 || /duplicate/i.test(String(e?.message || ""));
    if (!isDup) throw e;
    doc = await RefundLedger.findOne({ idempotencyKey });
    if (!doc) throw e;
    if (doc.status === "sent") {
      return { ok: true, skipped: true, reason: "already_sent", signature: doc.refundTxSignature };
    }
    const age = Date.now() - new Date(doc.updatedAt || doc.createdAt || 0).getTime();
    if (doc.status === "pending" && Number.isFinite(age) && age < PENDING_STALE_MS) {
      return { ok: true, skipped: true, reason: "in_flight", signature: null };
    }
  }

  try {
    const sent = await sendUsdcRefund({
      chain: input.chain,
      toAddress: toWallet,
      amountUsd,
    });
    if (!sent?.signature) {
      await RefundLedger.updateOne(
        { idempotencyKey },
        { $set: { status: "failed", error: "send_returned_null" } },
      );
      return { ok: false, reason: "send_returned_null" };
    }
    await RefundLedger.updateOne(
      { idempotencyKey },
      {
        $set: {
          status: "sent",
          refundTxSignature: sent.signature,
          amountUsd: sent.amountUsdc ?? amountUsd,
          settledAt: new Date(),
          error: null,
        },
      },
    );
    console.info(
      `[refund] sent direction=${input.direction} chain=${input.chain} usd=${amountUsd} to=${toWallet.slice(0, 8)}… tx=${sent.signature}`,
    );
    return { ok: true, signature: sent.signature, amountUsd: sent.amountUsdc ?? amountUsd };
  } catch (e) {
    const msg = e?.message || String(e);
    await RefundLedger.updateOne(
      { idempotencyKey },
      { $set: { status: "failed", error: msg.slice(0, 500) } },
    );
    console.warn(`[refund] send failed key=${idempotencyKey}:`, msg);
    return { ok: false, reason: "send_failed", error: msg };
  }
}
