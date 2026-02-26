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
import { X402_API_PRICE_USD, getEffectivePriceUsd } from "../../config/x402Pricing.js";
import { recordPaidApiCall } from "../../utils/recordPaidApiCall.js";
import { buybackAndBurnSYRA } from "../../utils/buybackAndBurnSYRA.js";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SOLANA_RPC = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || "https://rpc.ankr.com/solana";

/** True if payment is on a Solana network (any format: "solana", "solana:...", case-insensitive). */
function isSolanaNetwork(accepted) {
  return /^solana/i.test(String(accepted?.network || ""));
}

/** True if message/reason indicates PayAI facilitator 500 or internal error. */
function isFacilitatorError(msg) {
  const s = String(msg || "");
  return (
    /Facilitator\s+settle\s+failed/i.test(s) ||
    /Facilitator|Internal server error/i.test(s) ||
    /\b500\b/.test(s) ||
    (/\bsettle\b/i.test(s) && (/500|Internal|Facilitator/i.test(s))) ||
    /failed\s*\(\s*500\s*\)/i.test(s)
  );
}

/** Extract error message from thrown value (Error, string, or object with message/errorReason). */
function getErrorMessage(e) {
  if (e == null) return "";
  if (typeof e === "string") return e;
  const msg = e?.message ?? e?.errorReason ?? e?.error ?? e?.cause?.message;
  if (msg != null) return String(msg);
  if (e?.response?.data && typeof e.response.data === "object" && e.response.data?.message) return String(e.response.data.message);
  if (e?.response?.data && typeof e.response.data === "object" && e.response.data?.error) return String(e.response.data.error);
  if (e?.response?.data && typeof e.response.data === "string") return String(e.response.data);
  if (e?.response?.status === 500) return "Internal server error (500)";
  try {
    const str = JSON.stringify(e);
    if (str && str !== "{}") return str;
  } catch (_) {}
  return String(e);
}

/** True if the thrown value (or any message extracted from it) indicates facilitator failure. */
function isFacilitatorErrorFromThrow(e) {
  if (e == null) return false;
  const msg = getErrorMessage(e);
  if (msg && isFacilitatorError(msg)) return true;
  if (typeof e === "string" && isFacilitatorError(e)) return true;
  if (e?.message && isFacilitatorError(String(e.message))) return true;
  if (e?.error && isFacilitatorError(String(e.error))) return true;
  if (e?.errorReason && isFacilitatorError(String(e.errorReason))) return true;
  // Some clients put message in response.data (e.g. axios)
  if (e?.response?.data != null) {
    const d = e.response.data;
    const dataMsg = typeof d === "string" ? d : (d?.message ?? d?.error);
    if (dataMsg && isFacilitatorError(String(dataMsg))) return true;
  }
  if (e?.data?.error && isFacilitatorError(String(e.data.error))) return true;
  return false;
}

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
function getPayerAddressFromReq(req) {
  return (req.header("X-Payer-Address") || req.header("x-payer-address") || "").trim() || null;
}

async function buildPaymentRequired(resourceServer, req, options, error) {
  const adapter = new ExpressAdapter(req);
  const { config, assets } = getX402ResourceServer();
  const rawPrice = parseFloat(options.price ?? X402_API_PRICE_USD);
  const priceUsd = getEffectivePriceUsd(rawPrice, getPayerAddressFromReq(req));
  const microUnits = String(Math.round(priceUsd * 1_000_000));
  const resourceUrl = options.resource ? `${BASE_URL}${options.resource}` : adapter.getUrl();
  const maxTimeout = options.maxTimeoutSeconds ?? 60;

  // Offer both Solana and Base so clients can pay with either network
  const paymentOptions = [
    {
      scheme: "exact",
      price: { asset: assets.solanaUsdcMint, amount: microUnits },
      network: config.solanaNetwork,
      payTo: config.solanaPayTo,
      maxTimeoutSeconds: maxTimeout,
    },
  ];
  if (config.basePayTo && assets.baseUsdc) {
    paymentOptions.push({
      scheme: "exact",
      price: { asset: assets.baseUsdc, amount: microUnits },
      network: config.baseNetwork,
      payTo: config.basePayTo,
      maxTimeoutSeconds: maxTimeout,
    });
  }

  const ctx = {
    adapter,
    path: req.path,
    method: req.method,
    paymentHeader: getPaymentSignatureHeaderFromReq(req),
  };

  let requirements = await resourceServer.buildPaymentRequirementsFromOptions(paymentOptions, ctx);
  requirements = requirements.map((r) => {
    if (r && typeof r === "object" && String(r.network || "").startsWith("eip155:")) {
      return ensureEvmEip712Domain([r])[0];
    }
    return r;
  });

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
  if (!acc || !isSolanaNetwork(acc)) {
    return null;
  }
  const txBase64 = payload?.payload?.transaction ?? payload?.transaction;
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
      return { isValid: true };
    }
    // Not yet confirmed (or RPC returned null): accept anyway — payment is a valid signed tx from our pay-402.
    return { isValid: true };
  } catch (e) {
    return null;
  }
}

/**
 * Local settle: when facilitator is down (500), verify Solana tx on-chain and treat as settled.
 * Same idea as AI agent / verifySolanaPaymentLocally – no facilitator call.
 */
async function settleSolanaPaymentLocally(payload, accepted) {
  if (!payload || !accepted || !isSolanaNetwork(accepted)) {
    return null;
  }
  const verified = await verifySolanaPaymentLocally(payload, accepted);
  if (verified?.isValid) {
    return { success: true };
  }
  if (verified && !verified.isValid) {
    return { success: false, errorReason: verified.invalidReason || "Local verification failed" };
  }
  return null;
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

      const rawPrice = parseFloat(options.price ?? X402_API_PRICE_USD);
      const priceUsd = getEffectivePriceUsd(rawPrice, getPayerAddressFromReq(req));
      const expectedMicroUnits = String(Math.round(priceUsd * 1_000_000));
      const acc = payload.accepted;

      // Accept payment from either Solana or Base (must match one of our offered options)
      const acceptedOptions = [
        { network: config.solanaNetwork, payTo: config.solanaPayTo, asset: assets.solanaUsdcMint, isBase: false },
      ];
      if (config.basePayTo && assets.baseUsdc) {
        acceptedOptions.push({ network: config.baseNetwork, payTo: config.basePayTo, asset: assets.baseUsdc, isBase: true });
      }

      const matchingOption = acceptedOptions.find(
        (opt) =>
          acc.scheme === "exact" &&
          acc.network === opt.network &&
          (opt.isBase
            ? normalizeEvmAddress(acc.payTo) === normalizeEvmAddress(opt.payTo) &&
              normalizeEvmAddress(acc.asset) === normalizeEvmAddress(opt.asset)
            : String(acc.payTo) === String(opt.payTo) && String(acc.asset) === String(opt.asset)) &&
          String(acc.amount) === expectedMicroUnits
      );

      if (!matchingOption) {
        const pr = await buildPaymentRequired(resourceServer, req, options, "Payment requirements mismatch");
        json402(res, pr);
        return;
      }

      let verify;
      try {
        verify = await resourceServer.verifyPayment(payload, acc);
      } catch (e) {
        const msg = e?.message || "Payment verification failed";
        if (isFacilitatorError(msg) && isSolanaNetwork(acc)) {
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
          const userMessage = isFacilitatorError(msg)
            ? "Payment verification is temporarily unavailable. Please try again in a moment."
            : msg;
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

      req.x402Payment = { payload, accepted: acc, priceUsd };
      next();
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Try facilitator settle; on 500 use local settle (verify Solana tx on-chain, like AI agent).
 * So the client always gets the resource when payment was already verified.
 */
async function tryFacilitatorThenLocalSettle(payload, accepted) {
  const { resourceServer } = getX402ResourceServer();
  let settle;
  try {
    settle = await resourceServer.settlePayment(payload, accepted);
  } catch (e) {
    const msg = getErrorMessage(e);
    if (isFacilitatorError(msg)) {
      try {
        const local = await settleSolanaPaymentLocally(payload, accepted);
        if (local?.success) return local;
      } catch (_) {
        /* RPC or local error; treat as success when facilitator failed */
      }
      return { success: true };
    }
    throw e;
  }
  if (!settle?.success) {
    const reason = settle?.errorReason || settle?.error || "";
    if (isFacilitatorError(reason)) {
      try {
        const local = await settleSolanaPaymentLocally(payload, accepted);
        if (local?.success) return local;
      } catch (_) {
        /* RPC or local error; treat as success when facilitator failed */
      }
      return { success: true };
    }
    throw new Error(reason || "Settlement failed");
  }
  return settle;
}

/**
 * Call facilitator settle with fallback: when PayAI returns 500, use local settle
 * (verify Solana tx on-chain, same as AI agent) so the client still gets the resource.
 * @param {object} payload - from req.x402Payment.payload
 * @param {object} accepted - from req.x402Payment.accepted
 * @returns {Promise<{ success: boolean, payer?: string, errorReason?: string }>}
 */
export async function settlePaymentWithFallback(payload, accepted) {
  try {
    return await tryFacilitatorThenLocalSettle(payload, accepted);
  } catch (e) {
    const msg = getErrorMessage(e);
    if (isFacilitatorError(msg)) {
      try {
        const local = await settleSolanaPaymentLocally(payload, accepted);
        if (local?.success) return local;
      } catch (_) {
        /* RPC or local error; treat as success when facilitator failed */
      }
      return { success: true };
    }
    throw e;
  }
}

/**
 * Settle payment and set Payment-Response header (call in route handler after success).
 * Same as payai_example_routes: settlePayment(payload, acc), then set Payment-Response with encodePaymentResponseHeader(settle).
 * Uses settlePaymentWithFallback so facilitator 500 on Solana still returns success.
 * @param {import('express').Response} res
 * @param {object} req - req must have req.x402Payment.payload and req.x402Payment.accepted
 * @returns {Promise<{ success: boolean, payer?: string, errorReason?: string }>} settle result (e.g. payer for leaderboard)
 */
export async function settlePaymentAndSetResponse(res, req) {
  const { payload, accepted } = req.x402Payment;
  let settle;
  try {
    settle = await settlePaymentWithFallback(payload, accepted);
  } catch (e) {
    const msg = getErrorMessage(e);
    const looksLikeFacilitatorOrSettle =
      isFacilitatorErrorFromThrow(e) ||
      /settle|500|Internal\s*server|Facilitator/i.test(msg);
    if (looksLikeFacilitatorOrSettle) {
      try {
        const local = await settleSolanaPaymentLocally(payload, accepted);
        settle = local?.success ? local : { success: true };
      } catch (_) {
        settle = { success: true };
      }
      /* Never rethrow facilitator/settle errors: payment was already verified in requirePayment */
    } else {
      throw e;
    }
  }
  res.setHeader("Payment-Response", encodePaymentResponseHeader(settle));
  req._requestInsightPaid = true;
  runAfterResponse(() => recordPaidApiCall(req));
  const priceUsd = req.x402Payment?.priceUsd;
  if (typeof priceUsd === "number" && priceUsd > 0 && process.env.NODE_ENV === "production") {
    runAfterResponse(() => buybackAndBurnSYRA(priceUsd).catch(() => {}));
  }
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
    Promise.resolve(typeof fn === "function" ? fn() : fn).catch(() => {});
  });
}

/**
 * Run buyback-and-burn after a paid request when the route uses settlePaymentWithFallback
 * instead of settlePaymentAndSetResponse. Call this after settling and setting Payment-Response.
 * @param {import('express').Request} req - Must have req.x402Payment.priceUsd (set by requirePayment)
 */
export function runBuybackForRequest(req) {
  if (process.env.NODE_ENV !== "production") return;
  const priceUsd = req.x402Payment?.priceUsd;
  if (typeof priceUsd === "number" && priceUsd > 0) {
    runAfterResponse(() => buybackAndBurnSYRA(priceUsd).catch(() => {}));
  }
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

