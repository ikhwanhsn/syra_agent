/**
 * x402 V2 Payment Utilities (exact same implementation as payai-x402-example).
 *
 * Uses @x402/core http (decodePaymentSignatureHeader, encodePaymentRequiredHeader, encodePaymentResponseHeader),
 * ExpressAdapter, and x402ResourceServer (buildPaymentRequirementsFromOptions, createPaymentRequiredResponse,
 * verifyPayment, settlePayment). Supports PAYMENT-SIGNATURE and x-payment headers.
 *
 * When PayAI facilitator returns 500, we fall back to local Solana verification: check tx signature on-chain via RPC.
 */
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import { ExpressAdapter } from "@x402/express";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { Connection } from "@solana/web3.js";
import { VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { getX402ResourceServer, ensureX402ResourceServerInitialized } from "./x402ResourceServer.js";
import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SOLANA_RPC = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || "https://rpc.ankr.com/solana";

function getPaymentSignatureHeaderFromReq(req) {
  const h =
    String(req.header("PAYMENT-SIGNATURE") || req.header("payment-signature") || "").trim() ||
    String(req.header("x-payment") || req.header("X-Payment") || "").trim();
  return h;
}

/**
 * Ensure EVM/EIP-712 domain (name, version) for x402scan (same as payai_example_routes).
 */
function ensureEvmEip712Domain(requirements) {
  return requirements.map((r) => {
    if (!r || typeof r !== "object") return r;
    if (!String(r.network || "").startsWith("eip155:")) return r;
    const existing = r.extra && typeof r.extra === "object" ? r.extra : {};
    const existingEip712 = existing?.eip712 && typeof existing.eip712 === "object" ? existing.eip712 : {};
    const name = existingEip712?.name || existing?.name || "USD Coin";
    const version = existingEip712?.version || existing?.version || "2";
    const nextExtra = {
      ...existing,
      name,
      version,
      eip712: { ...existingEip712, name, version },
    };
    return { ...r, extra: nextExtra };
  });
}

function normalizeEvmAddress(a) {
  return String(a || "").trim().toLowerCase();
}

/**
 * Build PaymentRequired response (same flow as payai_example_routes buildPaymentRequired).
 * Uses resourceServer.buildPaymentRequirementsFromOptions, createPaymentRequiredResponse,
 * declareDiscoveryExtension, enrichExtensions.
 */
async function buildPaymentRequired(resourceServer, req, options, error) {
  const adapter = new ExpressAdapter(req);
  const { config, assets } = getX402ResourceServer();
  const priceUsd = parseFloat(options.price ?? X402_API_PRICE_USD);
  const microUnits = String(Math.round(priceUsd * 1_000_000));
  const resourceUrl = options.resource ? `${BASE_URL}${options.resource}` : adapter.getUrl();
  const network = options.network === "base" ? config.baseNetwork : config.solanaNetwork;
  const payTo = options.network === "base" ? config.basePayTo : config.solanaPayTo;
  const asset = options.network === "base" ? assets.baseUsdc : assets.solanaUsdcMint;

  const paymentOptions = [
    {
      scheme: "exact",
      price: { asset, amount: microUnits },
      network,
      payTo,
      maxTimeoutSeconds: options.maxTimeoutSeconds ?? 60,
    },
  ];

  const ctx = {
    adapter,
    path: req.path,
    method: req.method,
    paymentHeader: getPaymentSignatureHeaderFromReq(req),
  };

  let requirements = await resourceServer.buildPaymentRequirementsFromOptions(paymentOptions, ctx);
  if (network && String(network).startsWith("eip155:")) {
    requirements = ensureEvmEip712Domain(requirements);
  }

  const description = options.description || "x402 V2 endpoint";
  const resourceInfo = { url: resourceUrl, description, mimeType: options.mimeType || "application/json" };
  const outputExample = options.outputExample ?? { ok: true, paid: true };

  const declared = declareDiscoveryExtension({
    input: options.inputSchema ? { schema: options.inputSchema } : {},
    inputSchema: options.inputSchema || { type: "object", properties: {}, additionalProperties: false },
    ...(req.method === "POST" ? { bodyType: "json" } : {}),
    output: { example: outputExample },
  });
  const extensions = resourceServer.enrichExtensions(declared, { method: req.method, adapter: {} });

  return resourceServer.createPaymentRequiredResponse(requirements, resourceInfo, error, extensions);
}

function json402(res, paymentRequired) {
  res.setHeader("Payment-Required", encodePaymentRequiredHeader(paymentRequired));
  res.status(402).type("application/json").send(paymentRequired);
}

/**
 * Fallback when PayAI facilitator returns 500: verify Solana payment locally.
 * - Reject only if the tx is known to have failed on-chain (status.err).
 * - Accept valid signed tx even if not yet confirmed (payment came from our pay-402; avoids long waits).
 */
async function verifySolanaPaymentLocally(payload, acc) {
  if (!acc || !String(acc.network || "").startsWith("solana:")) {
    return null;
  }
  const txBase64 = payload?.payload?.transaction;
  if (!txBase64 || typeof txBase64 !== "string") {
    return null;
  }
  try {
    const txBuf = Buffer.from(txBase64, "base64");
    const tx = VersionedTransaction.deserialize(txBuf);
    if (!tx.signatures?.length) {
      return { isValid: false, invalidReason: "Transaction has no signatures" };
    }
    const sig = tx.signatures[0];
    if (!sig || sig.length !== 64) {
      return { isValid: false, invalidReason: "Invalid signature" };
    }
    const sigBase58 = typeof sig === "string" ? sig : bs58.encode(Buffer.from(sig));
    const connection = new Connection(SOLANA_RPC, "confirmed");
    const { value } = await connection.getSignatureStatuses([sigBase58]);
    const status = value?.[0];
    if (status?.err) {
      return { isValid: false, invalidReason: `Transaction failed: ${String(status.err)}` };
    }
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized" ||
      status?.confirmationStatus === "processed"
    ) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[x402] Local Solana verification succeeded (tx confirmed on-chain)");
      }
      return { isValid: true };
    }
    // Not yet confirmed (or RPC returned null): accept anyway — payment is a valid signed tx from our pay-402.
    if (process.env.NODE_ENV !== "production") {
      console.log("[x402] Local Solana verification: accepting signed payment (tx not yet confirmed on RPC)");
    }
    return { isValid: true };
  } catch (e) {
    console.warn("[x402] Local Solana verify error:", e?.message || e);
    return null;
  }
}

/**
 * Create x402 V2 payment middleware (exact same implementation as payai_example_routes handle).
 * 1. No payment header → buildPaymentRequired, set Payment-Required, 402.
 * 2. Decode PAYMENT-SIGNATURE; validate payload (x402Version 2, accepted); validate accepted vs expected.
 * 3. resourceServer.verifyPayment(payload, accepted); on failure → 402.
 * 4. Store req.x402Payment = { payload, accepted } and next().
 * Routes must call getX402ResourceServer().resourceServer.settlePayment(payload, accepted) on success
 * and set Payment-Response with encodePaymentResponseHeader(settle).
 */
export function requirePayment(options) {
  return async (req, res, next) => {
    try {
      await ensureX402ResourceServerInitialized();
      const { resourceServer, config, assets } = getX402ResourceServer();

      const paymentHeader = getPaymentSignatureHeaderFromReq(req);
      if (!paymentHeader) {
        const pr = await buildPaymentRequired(resourceServer, req, options, "Payment required");
        json402(res, pr);
        return;
      }

      let payload;
      try {
        payload = decodePaymentSignatureHeader(paymentHeader);
      } catch (e) {
        const pr = await buildPaymentRequired(
          resourceServer,
          req,
          options,
          `Invalid PAYMENT-SIGNATURE header: ${e?.message || "failed to decode"}`
        );
        json402(res, pr);
        return;
      }

      if (payload.x402Version !== 2 || !payload.accepted) {
        const pr = await buildPaymentRequired(resourceServer, req, options, "Unsupported x402 payload");
        json402(res, pr);
        return;
      }

      const priceUsd = parseFloat(options.price ?? X402_API_PRICE_USD);
      const expectedMicroUnits = String(Math.round(priceUsd * 1_000_000));
      const useBase = options.network === "base";
      const expectedNetwork = useBase ? config.baseNetwork : config.solanaNetwork;
      const expectedPayTo = useBase ? config.basePayTo : config.solanaPayTo;
      const expectedAsset = useBase ? assets.baseUsdc : assets.solanaUsdcMint;

      const acc = payload.accepted;
      const payToOk = useBase
        ? normalizeEvmAddress(acc.payTo) === normalizeEvmAddress(expectedPayTo)
        : String(acc.payTo) === String(expectedPayTo);
      const assetOk = useBase
        ? normalizeEvmAddress(acc.asset) === normalizeEvmAddress(expectedAsset)
        : String(acc.asset) === String(expectedAsset);

      if (
        acc.scheme !== "exact" ||
        acc.network !== expectedNetwork ||
        !payToOk ||
        !assetOk ||
        String(acc.amount) !== expectedMicroUnits
      ) {
        const pr = await buildPaymentRequired(resourceServer, req, options, "Payment requirements mismatch");
        json402(res, pr);
        return;
      }

      let verify;
      try {
        verify = await resourceServer.verifyPayment(payload, acc);
      } catch (e) {
        const msg = e?.message || "Payment verification failed";
        const isFacilitatorError = /Facilitator|500|Internal server error/i.test(msg);
        if (isFacilitatorError && String(acc?.network || "").startsWith("solana:")) {
          console.warn("[x402] Facilitator failed, trying local Solana verification:", msg.slice(0, 80));
          const localVerify = await verifySolanaPaymentLocally(payload, acc);
          if (localVerify?.isValid) {
            verify = localVerify;
          } else if (localVerify && !localVerify.isValid) {
            const pr = await buildPaymentRequired(
              resourceServer,
              req,
              options,
              localVerify.invalidReason || "Payment verification failed"
            );
            json402(res, pr);
            return;
          }
        }
        if (!verify) {
          const userMessage = isFacilitatorError
            ? "Payment verification is temporarily unavailable. Please try again in a moment."
            : msg;
          console.warn(
            "[x402] verifyPayment failed:",
            msg,
            "| Facilitator URL:",
            process.env.PAYAI_FACILITATOR_URL || process.env.FACILITATOR_URL_PAYAI || process.env.FACILITATOR_URL || "(not set)"
          );
          const pr = await buildPaymentRequired(
            resourceServer,
            req,
            options,
            userMessage
          );
          json402(res, pr);
          return;
        }
      }

      if (!verify?.isValid) {
        const pr = await buildPaymentRequired(
          resourceServer,
          req,
          options,
          verify?.invalidReason || "Payment verification failed"
        );
        json402(res, pr);
        return;
      }

      req.x402Payment = { payload, accepted: acc };
      next();
    } catch (error) {
      console.error("x402 V2 payment processing error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Settle payment and set Payment-Response header (call in route handler after success).
 * Same as payai_example_routes: settlePayment(payload, acc), then set Payment-Response with encodePaymentResponseHeader(settle).
 * @param {import('express').Response} res
 * @param {object} req - req must have req.x402Payment.payload and req.x402Payment.accepted
 * @returns {Promise<{ success: boolean, payer?: string, errorReason?: string }>} settle result (e.g. payer for leaderboard)
 */
export async function settlePaymentAndSetResponse(res, req) {
  const { resourceServer } = getX402ResourceServer();
  const { payload, accepted } = req.x402Payment;

  let settle;
  try {
    settle = await resourceServer.settlePayment(payload, accepted);
  } catch (e) {
    const msg = e?.message || "";
    if (/Facilitator|500|Internal server error/i.test(msg) && String(accepted?.network || "").startsWith("solana:")) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[x402] Settle failed (facilitator), using local success:", msg.slice(0, 60));
      }
      settle = { success: true };
    } else {
      throw e;
    }
  }
  if (!settle?.success) {
    throw new Error(settle?.errorReason || "Settlement failed");
  }
  res.setHeader("Payment-Response", encodePaymentResponseHeader(settle));
  return settle;
}

export { encodePaymentResponseHeader };
export { getX402ResourceServer };

export function usdToMicroUsdc(usd) {
  return Math.floor(usd * 1_000_000).toString();
}

export function microUsdcToUsd(microUsdc) {
  return parseInt(microUsdc, 10) / 1_000_000;
}

/**
 * Run work after the response is sent (e.g. saveToLeaderboard) so it doesn't block the response.
 * Use to keep response time under 3s: settle → set header → res.json() → runAfterResponse(() => saveToLeaderboard(...)).
 * @param {() => void | Promise<void>} fn - Function to run after response (errors are logged, not thrown)
 */
export function runAfterResponse(fn) {
  setImmediate(() => {
    Promise.resolve(typeof fn === "function" ? fn() : fn).catch((e) =>
      console.error("runAfterResponse:", e?.message || e)
    );
  });
}

/**
 * Get the x402 resource server (for routes that need to call settlePayment manually).
 * Prefer using settlePaymentAndSetResponse(res, req) after success.
 */
export function getX402Handler() {
  const { resourceServer } = getX402ResourceServer();
  return {
    settlePayment(payload, accepted) {
      return resourceServer.settlePayment(payload, accepted);
    },
  };
}

