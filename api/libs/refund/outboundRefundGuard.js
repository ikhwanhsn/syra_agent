/**
 * Outbound refund wrap: drop-in replacement for wrapFetchWithPact.
 * Golden rule: refunds must never break a working call (fire-and-forget).
 */
import { classifyCallOutcome } from "./failureClassifier.js";
import { executeRefund } from "./refundService.js";
import {
  clampRefundAmountUsd,
  getMaxRefundUsd,
  isHostnameRefundEligible,
  isOutboundRefundEnabled,
  microUsdcToUsd,
  networkToRefundChain,
} from "../../config/refund.js";

function hostnameFromFetchInput(input) {
  try {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input?.url || String(input);
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function pathFromFetchInput(input) {
  try {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input?.url || String(input);
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return "";
  }
}

function headerValue(headers, name) {
  if (!headers) return "";
  const want = String(name).toLowerCase();
  if (typeof headers.get === "function") {
    return (
      headers.get(name) ||
      headers.get(want) ||
      headers.get(name.toUpperCase()) ||
      headers.get(name.toLowerCase()) ||
      ""
    );
  }
  for (const [k, v] of Object.entries(headers)) {
    if (String(k).toLowerCase() === want) return v == null ? "" : String(v);
  }
  return "";
}

function decodePaymentHeader(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  try {
    const json = Buffer.from(s, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function decodeX402Headers(paymentSig, paymentResponse) {
  let decodedRes = null;
  let decodedReq = null;
  try {
    const { decodePaymentResponseHeader, decodePaymentSignatureHeader } = await import(
      "@x402/core/http"
    );
    if (paymentResponse) {
      try {
        decodedRes = decodePaymentResponseHeader(paymentResponse);
      } catch {
        decodedRes = decodePaymentHeader(paymentResponse);
      }
    }
    if (paymentSig) {
      try {
        decodedReq = decodePaymentSignatureHeader(paymentSig);
      } catch {
        decodedReq = decodePaymentHeader(paymentSig);
      }
    }
  } catch {
    decodedRes = decodePaymentHeader(paymentResponse);
    decodedReq = decodePaymentHeader(paymentSig);
  }
  return { decodedRes, decodedReq };
}

export async function paymentMetaFromHeaders(reqHeaders, resHeaders) {
  const paymentSig =
    headerValue(reqHeaders, "payment-signature") ||
    headerValue(reqHeaders, "PAYMENT-SIGNATURE") ||
    headerValue(reqHeaders, "x-payment");
  const paymentResponse =
    headerValue(resHeaders, "payment-response") ||
    headerValue(resHeaders, "PAYMENT-RESPONSE") ||
    headerValue(resHeaders, "x-payment-response");

  const { decodedRes, decodedReq } = await decodeX402Headers(paymentSig, paymentResponse);

  const settleSuccess =
    decodedRes && typeof decodedRes === "object" ? decodedRes.success !== false : null;
  const paymentTx =
    (typeof decodedRes?.transaction === "string" && decodedRes.transaction) ||
    (typeof decodedRes?.txSignature === "string" && decodedRes.txSignature) ||
    (typeof decodedReq?.payload?.signature === "string" && decodedReq.payload.signature) ||
    null;
  const amountMicro =
    decodedRes?.amount ??
    decodedReq?.accepted?.amount ??
    decodedReq?.payload?.amount ??
    null;
  const network =
    decodedRes?.network ??
    decodedReq?.accepted?.network ??
    decodedReq?.network ??
    null;

  return {
    hadPayment: Boolean(paymentSig) || Boolean(paymentResponse && settleSuccess !== false),
    settleSuccess,
    paymentTx: paymentTx ? String(paymentTx) : null,
    amountUsd: microUsdcToUsd(amountMicro),
    network: network ? String(network) : null,
    payer:
      (typeof decodedReq?.accepted?.payTo === "string" && decodedReq.accepted.payTo) ||
      (typeof decodedReq?.payload?.from === "string" && decodedReq.payload.from) ||
      (typeof decodedRes?.payer === "string" && decodedRes.payer) ||
      null,
  };
}

/**
 * @param {typeof fetch} baseFetch
 * @param {{ agentId: string; keypair: import('@solana/web3.js').Keypair | null }} opts
 * @returns {Promise<typeof fetch>}
 */
export async function wrapFetchWithRefundGuard(baseFetch, { agentId, keypair }) {
  if (!isOutboundRefundEnabled() || !keypair) {
    return baseFetch;
  }

  /** @type {typeof fetch} */
  const guarded = async (input, init) => {
    const host = hostnameFromFetchInput(input);
    if (host && !isHostnameRefundEligible(host)) {
      return baseFetch(input, init);
    }

    const reqHeaders = init?.headers;
    try {
      const res = await baseFetch(input, init);
      maybeRefundOutbound({
        agentId,
        keypair,
        host,
        input,
        reqHeaders,
        res,
      }).catch((e) => {
        console.warn("[refund] outbound guard failed:", e?.message || e);
      });
      return res;
    } catch (e) {
      maybeRefundOutbound({
        agentId,
        keypair,
        host,
        input,
        reqHeaders,
        error: e,
      }).catch((err) => {
        console.warn("[refund] outbound guard failed:", err?.message || err);
      });
      throw e;
    }
  };

  return guarded;
}

/**
 * @param {{
 *   agentId: string;
 *   keypair: import('@solana/web3.js').Keypair | null;
 *   host: string;
 *   input: RequestInfo | URL;
 *   reqHeaders?: HeadersInit;
 *   res?: Response;
 *   error?: unknown;
 * }} args
 */
export async function maybeRefundOutbound(args) {
  if (!isOutboundRefundEnabled()) return { ok: false, skipped: true, reason: "disabled" };

  const resHeaders = args.res?.headers;
  const meta = await paymentMetaFromHeaders(args.reqHeaders, resHeaders);
  const httpStatus = args.res ? args.res.status : null;
  const errorMessage = args.error instanceof Error ? args.error.message : args.error ? String(args.error) : "";

  const classified = classifyCallOutcome({
    httpStatus,
    errorMessage,
    hadPayment: meta.hadPayment,
  });
  if (!classified.refundable) {
    return { ok: false, skipped: true, reason: classified.reason };
  }

  if (meta.settleSuccess === false) {
    return { ok: false, skipped: true, reason: "settle_not_success" };
  }

  const toWallet = args.keypair?.publicKey?.toBase58?.() || "";
  if (!toWallet) {
    return { ok: false, skipped: true, reason: "no_agent_wallet" };
  }

  const chain = networkToRefundChain(meta.network) || "solana";
  const amountUsd = clampRefundAmountUsd(meta.amountUsd, getMaxRefundUsd());
  if (amountUsd <= 0) {
    return { ok: false, skipped: true, reason: "amount_unknown" };
  }

  const path = pathFromFetchInput(args.input);
  const tx = meta.paymentTx || "";
  const idempotencyKey = tx
    ? `outbound:${tx}`
    : `outbound:${args.agentId}:${path}:${httpStatus || "throw"}`;

  return executeRefund({
    direction: "outbound",
    chain,
    toWallet,
    amountUsd,
    reason: classified.reason,
    paymentTxSignature: meta.paymentTx,
    payer: toWallet,
    providerHost: args.host || null,
    anonymousId: args.agentId || null,
    agentPubkey: toWallet,
    path,
    httpStatus,
    idempotencyKey,
  });
}
