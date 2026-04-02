/**
 * SAP on-chain escrow (X-Payment-Protocol: SAP-x402) alongside PayAI exact USDC (PAYMENT-SIGNATURE).
 * When clients fund an escrow via Synapse SAP, they send X-Payment-* headers; we verify on-chain
 * and settle with client.x402.settle after serving.
 */
import { createRequire } from "node:module";
import { PublicKey } from "@solana/web3.js";
import { encodePaymentResponseHeader } from "@x402/core/http";
import { getSapClientBundle } from "./sapAgentClient.js";
import { settlePaymentAndSetResponse } from "./x402PaymentV2.js";
import { getEffectivePriceUsd } from "../config/x402Pricing.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { recordPaidApiCall } from "./recordPaidApiCall.js";
import { buybackAndBurnSYRA } from "./buybackAndBurnSYRA.js";

const require = createRequire(import.meta.url);
const { deriveAgent, deriveEscrow } = require("@oobe-protocol-labs/synapse-sap-sdk/pda");
const { SAP_PROGRAM_ADDRESS } = require("@oobe-protocol-labs/synapse-sap-sdk/constants");

function header(req, name) {
  const v = req.headers[name.toLowerCase()];
  return typeof v === "string" ? v.trim() : Array.isArray(v) ? String(v[0] ?? "").trim() : "";
}

function isSapEscrowRequest(req) {
  return header(req, "x-payment-protocol") === "SAP-x402";
}

/**
 * Verify SAP escrow headers against on-chain state for this agent wallet.
 * @returns {Promise<{ ok: boolean; depositor?: PublicKey; reason?: string }>}
 */
export async function verifySapEscrowRequest(req) {
  if (!isSapEscrowRequest(req)) {
    return { ok: false, reason: "not_sap" };
  }
  const bundle = await getSapClientBundle();
  if (!bundle) {
    return { ok: false, reason: "sap_signer_not_configured" };
  }
  const { client, keypair } = bundle;

  let escrowPk;
  let agentPdaPk;
  let depositorPk;
  try {
    escrowPk = new PublicKey(header(req, "x-payment-escrow"));
    agentPdaPk = new PublicKey(header(req, "x-payment-agent"));
    depositorPk = new PublicKey(header(req, "x-payment-depositor"));
  } catch {
    return { ok: false, reason: "invalid_public_key_in_headers" };
  }

  const programIdFromHeader = header(req, "x-payment-program");
  if (programIdFromHeader && programIdFromHeader !== SAP_PROGRAM_ADDRESS) {
    return { ok: false, reason: "program_mismatch" };
  }

  const [derivedAgentPda] = deriveAgent(keypair.publicKey);
  if (!derivedAgentPda.equals(agentPdaPk)) {
    return { ok: false, reason: "agent_pda_mismatch" };
  }

  const [expectedEscrow] = deriveEscrow(agentPdaPk, depositorPk);
  if (!expectedEscrow.equals(escrowPk)) {
    return { ok: false, reason: "escrow_pda_mismatch" };
  }

  const bal = await client.x402.getBalance(keypair.publicKey, depositorPk);
  if (!bal) {
    return { ok: false, reason: "no_escrow_account" };
  }
  const canServe =
    (!bal.isExpired && bal.callsRemaining > 0) || (bal.affordableCalls ?? 0) > 0;
  if (!canServe) {
    return { ok: false, reason: "escrow_exhausted_or_expired" };
  }

  return { ok: true, depositor: depositorPk };
}

/**
 * Express middleware: SAP escrow OR @x402/exact (existing requirePayment).
 * @param {import('./x402PaymentV2.js').requirePayment} requirePaymentFn - from getV2Payment()
 * @param {object} options - same as requirePayment(options)
 */
export function requirePaymentSapEscrowOrExact(requirePaymentFn, options) {
  return async (req, res, next) => {
    if (!isSapEscrowRequest(req)) {
      return requirePaymentFn(options)(req, res, next);
    }
    const v = await verifySapEscrowRequest(req);
    if (!v.ok) {
      return requirePaymentFn(options)(req, res, next);
    }
    const rawPrice = parseFloat(options.price ?? X402_API_PRICE_USD);
    const priceUsd = getEffectivePriceUsd(rawPrice, req.header("X-Payer-Address") || req.header("x-payer-address"));
    req.x402Payment = {
      kind: "sap-escrow",
      depositor: v.depositor,
      priceUsd,
      sapReason: null,
    };
    return next();
  };
}

function runAfterResponse(fn) {
  setImmediate(() => {
    Promise.resolve(typeof fn === "function" ? fn() : fn).catch(() => {});
  });
}

/**
 * After a successful handler: settle SAP escrow on-chain or PayAI facilitator.
 * @param {import('express').Response} res
 * @param {import('express').Request} req
 * @param {string} serviceData - hashed for on-chain service_hash (e.g. JSON with route + idempotency)
 */
export async function settleSapEscrowOrFacilitator(res, req, serviceData) {
  if (req.x402Payment?.kind !== "sap-escrow") {
    return settlePaymentAndSetResponse(res, req);
  }
  const bundle = await getSapClientBundle();
  if (!bundle || !req.x402Payment.depositor) {
    return settlePaymentAndSetResponse(res, req);
  }
  const { client } = bundle;
  const depositor = req.x402Payment.depositor;
  const receipt = await client.x402.settle(depositor, 1, serviceData);
  let slot = null;
  try {
    const conn = client.program.provider.connection;
    const st = await conn.getTransaction(receipt.txSignature, { maxSupportedTransactionVersion: 0 });
    slot = st?.slot ?? null;
  } catch {
    try {
      slot = await client.program.provider.connection.getSlot("confirmed");
    } catch {
      slot = null;
    }
  }

  const payload = {
    success: true,
    scheme: "sap-escrow",
    transaction: receipt.txSignature,
    serviceHash: receipt.serviceHash,
    callsSettled: receipt.callsSettled,
    slot,
  };
  try {
    res.setHeader("Payment-Response", encodePaymentResponseHeader(payload));
  } catch {
    res.setHeader(
      "Payment-Response",
      Buffer.from(JSON.stringify(payload), "utf8").toString("base64")
    );
  }
  res.setHeader(
    "SAP-X402-Settlement",
    JSON.stringify({
      txSignature: receipt.txSignature,
      serviceHash: Array.from(receipt.serviceHash || []),
      slot,
    })
  );
  req._requestInsightPaid = true;
  runAfterResponse(() => recordPaidApiCall(req));
  const priceUsd = req.x402Payment?.priceUsd;
  if (typeof priceUsd === "number" && priceUsd > 0 && process.env.NODE_ENV === "production") {
    runAfterResponse(() => buybackAndBurnSYRA(priceUsd).catch(() => {}));
  }
  return receipt;
}
