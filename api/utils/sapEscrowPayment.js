/**
 * SAP on-chain escrow (X-Payment-Protocol: SAP-x402) alongside PayAI exact USDC (PAYMENT-SIGNATURE).
 * SPL/USDC escrows need `remainingAccounts` on settleCalls (EscrowModule.settle); X402Registry.settle
 * omits them and triggers SplTokenRequired on-chain.
 */
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotent,
} from "@solana/spl-token";
import { encodePaymentResponseHeader } from "@x402/core/http";
import { getSapClientBundle } from "./sapAgentClient.js";
import { settlePaymentAndSetResponse } from "./x402PaymentV2.js";
import { getEffectivePriceUsd } from "../config/x402Pricing.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { recordPaidApiCall } from "./recordPaidApiCall.js";
import { buybackAndBurnSYRA } from "./buybackAndBurnSYRA.js";
import { isTesterAgentInternalProbeRequest } from "./testerAgentProbe.js";

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

function optionalHeaderPubkey(req, headerName) {
  const s = header(req, headerName);
  if (!s) return null;
  try {
    return new PublicKey(s);
  } catch {
    return null;
  }
}

/** 32-byte service hash as number[] for EscrowModule.settle */
function serviceHashArray(serviceData) {
  const buf = createHash("sha256")
    .update(typeof serviceData === "string" ? serviceData : Buffer.from(serviceData))
    .digest();
  return Array.from(buf);
}

async function tokenProgramForMint(connection, mint) {
  const info = await connection.getAccountInfo(mint);
  if (!info) return TOKEN_PROGRAM_ID;
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  return TOKEN_PROGRAM_ID;
}

/**
 * SPL remaining accounts for settleCalls — same 4-account layout as EscrowModule.create/deposit:
 * `[depositorAta, escrowAta, tokenMint, tokenProgram]` (@oobe-protocol-labs/synapse-sap-sdk escrow.ts).
 * Optional headers: X-Payment-Depositor-Token, X-Payment-Escrow-Vault (must match on-chain vault ATA).
 */
async function buildSplAccountsForSapSettle(connection, req, escrowPda, depositorWallet, mint) {
  const tokenProgram = await tokenProgramForMint(connection, mint);
  const depositorAtaFromHeader = optionalHeaderPubkey(req, "x-payment-depositor-token");
  const vaultFromHeader = optionalHeaderPubkey(req, "x-payment-escrow-vault");

  const depositorAta =
    depositorAtaFromHeader ??
    getAssociatedTokenAddressSync(mint, depositorWallet, false, tokenProgram, ASSOCIATED_TOKEN_PROGRAM_ID);
  const escrowVaultAta =
    vaultFromHeader ??
    getAssociatedTokenAddressSync(mint, escrowPda, true, tokenProgram, ASSOCIATED_TOKEN_PROGRAM_ID);

  return [
    { pubkey: depositorAta, isWritable: true, isSigner: false },
    { pubkey: escrowVaultAta, isWritable: true, isSigner: false },
    { pubkey: mint, isWritable: false, isSigner: false },
    { pubkey: tokenProgram, isWritable: false, isSigner: false },
  ];
}

async function ensureAgentRecipientAta(connection, payer, mint, agentWallet) {
  const tokenProgram = await tokenProgramForMint(connection, mint);
  await createAssociatedTokenAccountIdempotent(
    connection,
    payer,
    mint,
    agentWallet,
    { commitment: "confirmed" },
    tokenProgram,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    false
  );
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
  const { client, keypair } = bundle;
  const depositor = req.x402Payment.depositor;
  const conn = client.program.provider.connection;

  const [agentPda] = deriveAgent(keypair.publicKey);
  const [escrowPda] = deriveEscrow(agentPda, depositor);

  const escrowData = await client.escrow.fetchNullable(agentPda, depositor);
  if (!escrowData) {
    const e = new Error("SAP escrow: account missing at settlement (verify passed but fetch returned null)");
    e.code = "SAP_ESCROW_FETCH_NULL";
    throw e;
  }
  const hashArr = serviceHashArray(serviceData);

  let txSignature;
  let serviceHashOut = hashArr;
  let callsSettled = 1;

  if (escrowData.tokenMint != null) {
    const mint =
      escrowData.tokenMint instanceof PublicKey
        ? escrowData.tokenMint
        : new PublicKey(escrowData.tokenMint);
    await ensureAgentRecipientAta(conn, keypair, mint, keypair.publicKey);
    const splAccounts = await buildSplAccountsForSapSettle(conn, req, escrowPda, depositor, mint);
    txSignature = await client.escrow.settle(depositor, 1, hashArr, splAccounts);
  } else {
    const receipt = await client.x402.settle(depositor, 1, serviceData);
    txSignature = receipt.txSignature;
    serviceHashOut = receipt.serviceHash;
    callsSettled = receipt.callsSettled;
  }

  let slot = null;
  try {
    const st = await conn.getTransaction(txSignature, { maxSupportedTransactionVersion: 0 });
    slot = st?.slot ?? null;
  } catch {
    try {
      slot = await conn.getSlot("confirmed");
    } catch {
      slot = null;
    }
  }

  const payload = {
    success: true,
    scheme: "sap-escrow",
    transaction: txSignature,
    serviceHash: serviceHashOut,
    callsSettled,
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
      txSignature,
      serviceHash: Array.from(serviceHashOut || []),
      slot,
    })
  );
  req._requestInsightPaid = true;
  runAfterResponse(() => recordPaidApiCall(req));
  const priceUsd = req.x402Payment?.priceUsd;
  if (
    typeof priceUsd === "number" &&
    priceUsd > 0 &&
    process.env.NODE_ENV === "production" &&
    !isTesterAgentInternalProbeRequest(req)
  ) {
    runAfterResponse(() => buybackAndBurnSYRA(priceUsd).catch(() => {}));
  }
  return { txSignature, serviceHash: serviceHashOut, callsSettled, slot };
}
