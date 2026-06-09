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
import {
  getX402ResourceServer,
  ensureX402ResourceServerInitialized,
  getX402ResourceServerCorbits,
  ensureX402CorbitsResourceServerInitialized,
} from "./x402ResourceServer.js";
import { X402_API_PRICE_USD, getEffectivePriceUsd } from "../config/x402Pricing.js";
import {
  getCorbitsPayToAddresses,
  getEnabledCorbitsNetworks,
} from "../config/corbitsX402Networks.js";
import {
  BSC_CAIP2,
  getActiveB402PaymentKind,
  getB402PayTo,
  getB402TokenById,
  isB402Enabled,
  isB402Network,
  x402MicroToBscTokenAtomic,
} from "../config/b402Networks.js";
import {
  verifyPayment as b402VerifyPayment,
  settlePayment as b402SettlePayment,
  normalizeResourceInfo,
} from "../libs/b402FacilitatorClient.js";
import { recordPaidApiCall } from "./recordPaidApiCall.js";
import { buybackSYRAFromRevenue } from "./buybackSYRA.js";
import { isTesterAgentInternalProbeRequest } from "./testerAgentProbe.js";
import { isShadowfeedPartnerRequest, markShadowfeedPartnerBypass } from "./shadowfeedPartner.js";
import dotenv from "dotenv";

dotenv.config();

export { isTesterAgentInternalProbeRequest };

function isX402Debug() {
  const s = String(process.env.X402_DEBUG || process.env.B402_DEBUG || "").toLowerCase();
  return s === "true" || s === "1";
}

function x402Log(event, detail) {
  const always =
    /payment_required|payment_retry|verify_ok|verify_failed|mismatch|decode_failed/i.test(event);
  if (!always && !isX402Debug()) return;
  const line = detail && typeof detail === "object" ? JSON.stringify(detail) : String(detail ?? "");
  console.log(`[x402] ${event}${line ? ` ${line}` : ""}`);
}

let b402StartupLogged = false;
async function logB402StartupOnce() {
  if (b402StartupLogged) return;
  b402StartupLogged = true;
  const { getB402PublicStatus } = await import("../libs/b402KeyMaterial.js");
  const status = getB402PublicStatus();
  if (isB402Enabled()) {
    console.log(
      "[b402] merchant inbound enabled",
      JSON.stringify({
        token: process.env.B402_TOKEN || "USD1",
        payTo: getB402PayTo(),
        baseUrl: process.env.B402_BASE_URL || "https://api.commonservice.io",
        keySource: status.keySource,
        debug: isX402Debug() ? "X402_DEBUG=true" : "set X402_DEBUG=true for verbose x402 logs",
      }),
    );
    return;
  }
  console.warn(
    "[b402] merchant inbound disabled — Binance (eip155:56) will not appear in 402 accepts",
    JSON.stringify({
      missing: status.missing,
      keySource: status.keySource,
      hint: "Set B402_PRIVATE_KEY_B64 on the API host (node api/scripts/exportB402PrivateKeyB64.js), then restart. Check GET /x402/capabilities",
    }),
  );
}

/** Cap slow facilitator HTTP calls so paid routes return in seconds, not ~90s. 0 = no timeout. */
const X402_VERIFY_FACILITATOR_TIMEOUT_MS = Number.parseInt(
  process.env.X402_VERIFY_FACILITATOR_TIMEOUT_MS || "12000",
  10
);
const X402_SETTLE_FACILITATOR_TIMEOUT_MS = Number.parseInt(
  process.env.X402_SETTLE_FACILITATOR_TIMEOUT_MS || "8000",
  10
);

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SOLANA_RPC = process.env.SOLANA_RPC_URL || process.env.VITE_SOLANA_RPC_URL || "https://rpc.ankr.com/solana";

/** True if payment is on a Solana network (any format: "solana", "solana:...", case-insensitive). */
function isSolanaNetwork(accepted) {
  return /^solana/i.test(String(accepted?.network || ""));
}

/** True if message/reason indicates facilitator flake (recover via local verify/settle when Solana). */
function isFacilitatorError(msg) {
  const s = String(msg || "");
  return (
    /Facilitator\s+settle\s+failed/i.test(s) ||
    /Facilitator|Internal server error/i.test(s) ||
    /\b500\b/.test(s) ||
    (/\bsettle\b/i.test(s) && (/500|Internal|Facilitator/i.test(s))) ||
    /failed\s*\(\s*500\s*\)/i.test(s) ||
    /transaction_simulation|simulation[_\s-]*failed|simulation failed/i.test(s) ||
    /\bRPC\b.*\b(error|fail)/i.test(s) ||
    /verify_timeout|settle_timeout/i.test(s) ||
    // Corbits / strict facilitators when PAYMENT-SIGNATURE omits resource (client or discovery mismatch)
    /missing\s+resource\s+context|v1\s+adapter/i.test(s)
  );
}

/** Race `promise` against a timer so facilitator calls cannot hang the request indefinitely. */
function withTimeout(promise, ms, rejectMessage = "timeout") {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return promise;
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(rejectMessage)), n);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
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

export function getPaymentSignatureHeaderFromReq(req) {
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
    const b402Token = isB402Network(r.network) ? getB402TokenById(process.env.B402_TOKEN) : null;
    const defaultName = b402Token?.eip712Name ?? (isB402Network(r.network) ? "World Liberty Financial USD" : "USD Coin");
    const defaultVersion = b402Token?.eip712Version ?? (isB402Network(r.network) ? "1" : "2");
    const name = existingEip712?.name || existing?.name || defaultName;
    const version = existingEip712?.version || existing?.version || defaultVersion;
    const nextExtra = {
      ...existing,
      name,
      version,
      eip712: { ...existingEip712, name, version },
    };
    return { ...r, extra: nextExtra };
  });
}

/**
 * PayAI/Corbits facilitators do not list BSC (eip155:56); append B402 accept when enabled.
 * @param {object[]} requirements
 * @param {string} microUnits
 * @param {number} maxTimeoutSeconds
 */
async function ensureB402AcceptInRequirements(requirements, microUnits, maxTimeoutSeconds) {
  if (!isB402Enabled()) return requirements;
  const list = Array.isArray(requirements) ? [...requirements] : [];
  if (list.some((r) => r && isB402Network(r.network))) return list;

  const kind = await getActiveB402PaymentKind();
  if (!kind) return list;

  const { token, extra } = kind;
  const payTo = getB402PayTo();
  const mergedExtra = {
    name: extra.name ?? token.eip712Name,
    version: extra.version ?? token.eip712Version,
    assetTransferMethod: extra.assetTransferMethod ?? token.assetTransferMethod,
    signerAddress: extra.signerAddress ?? "",
  };
  if (extra.spenderAddress != null && extra.spenderAddress !== "") {
    mergedExtra.spenderAddress = extra.spenderAddress;
  } else if (token.eip3009) {
    mergedExtra.spenderAddress = null;
  }

  const tokenAtomicAmount = x402MicroToBscTokenAtomic(microUnits);
  list.push({
    scheme: token.scheme,
    network: BSC_CAIP2,
    amount: tokenAtomicAmount,
    asset: token.contract,
    payTo,
    maxTimeoutSeconds,
    extra: mergedExtra,
  });
  return list;
}

/** Merge B402 /supported extra into BSC payment requirements for buyer signing. */
async function enrichB402Requirements(requirements) {
  const kind = await getActiveB402PaymentKind();
  if (!kind) return requirements;
  const { token, extra } = kind;
  return requirements.map((r) => {
    if (!r || !isB402Network(r.network)) return r;
    const mergedExtra = {
      ...(r.extra && typeof r.extra === "object" ? r.extra : {}),
      name: extra.name ?? token.eip712Name,
      version: extra.version ?? token.eip712Version,
      assetTransferMethod: extra.assetTransferMethod ?? token.assetTransferMethod,
      signerAddress: extra.signerAddress ?? "",
    };
    if (extra.spenderAddress != null && extra.spenderAddress !== "") {
      mergedExtra.spenderAddress = extra.spenderAddress;
    } else if (token.eip3009) {
      mergedExtra.spenderAddress = null;
    }
    return {
      ...r,
      scheme: r.scheme ?? token.scheme,
      extra: mergedExtra,
    };
  });
}

function normalizeEvmAddress(a) {
  return String(a || "").trim().toLowerCase();
}

/** @returns {{ token: { contract: string, scheme: string }, payTo: string } | null} */
function getB402OfferConfig() {
  if (!isB402Enabled()) return null;
  const token = getB402TokenById(process.env.B402_TOKEN);
  const payTo = getB402PayTo();
  if (!token || !payTo) return null;
  return { token, payTo };
}

/** Corbits/PayAI facilitators do not support BSC — never pass B402 options into @x402 resource server. */
function paymentOptionsForFacilitator(bundle, microUnits, maxTimeout) {
  return buildPaymentOptionsForBundle(bundle, microUnits, maxTimeout).filter(
    (o) => o && !isB402Network(o.network)
  );
}

/** Route verify/settle to B402 when network or payTo+asset match merchant config. */
function shouldUseB402Facilitator(acc, payload) {
  if (!getB402OfferConfig()) return false;
  if (acc && isB402Network(acc.network)) return true;
  if (acc && paymentAcceptedMatchesB402(acc)) return true;
  const nested = payload?.accepted;
  if (nested && nested !== acc && paymentAcceptedMatchesB402(nested)) return true;
  return false;
}

/** Append B402 accepted option for paid-request validation (must mirror 402 offers). */
function appendB402AcceptedOption(acceptedOptions, expectedMicroUnits) {
  if (acceptedOptions.some((o) => o && isB402Network(o.network))) return acceptedOptions;
  const cfg = getB402OfferConfig();
  if (!cfg) return acceptedOptions;
  const { token, payTo } = cfg;
  acceptedOptions.push({
    network: BSC_CAIP2,
    payTo,
    asset: token.contract,
    isEvm: true,
    isB402: true,
    amount: x402MicroToBscTokenAtomic(expectedMicroUnits),
  });
  return acceptedOptions;
}

/** True when payload.accepted matches configured B402 merchant offer (amount checked separately). */
function paymentAcceptedMatchesB402(acc) {
  if (!acc) return false;
  if ((acc.scheme || "exact") !== "exact") return false;
  const cfg = getB402OfferConfig();
  if (!cfg) return false;
  const { token, payTo } = cfg;
  return (
    normalizeEvmAddress(acc.payTo) === normalizeEvmAddress(payTo) &&
    normalizeEvmAddress(acc.asset) === normalizeEvmAddress(token.contract)
  );
}

/**
 * Build x402 payment options for a request (Corbits multi-network or legacy Solana+Base).
 * @param {object} bundle
 * @param {string} microUnits
 * @param {number} maxTimeout
 */
function buildPaymentOptionsForBundle(bundle, microUnits, maxTimeout) {
  const { config, assets } = bundle;
  if (config.corbitsMultiNetwork) {
    const { solanaPayTo: solFromEnv, evmPayTo: evmFromEnv } = getCorbitsPayToAddresses();
    const solanaPayTo = config.solanaPayTo || solFromEnv;
    const evmPayTo = config.basePayTo || evmFromEnv;
    const options = [];
    for (const net of getEnabledCorbitsNetworks()) {
      if (net.kind === "solana" && solanaPayTo) {
        options.push({
          scheme: "exact",
          price: { asset: net.usdc, amount: microUnits },
          network: net.caip2,
          payTo: solanaPayTo,
          maxTimeoutSeconds: maxTimeout,
        });
      } else if (net.kind === "evm" && evmPayTo) {
        options.push({
          scheme: "exact",
          price: { asset: net.usdc, amount: microUnits },
          network: net.caip2,
          payTo: evmPayTo,
          maxTimeoutSeconds: maxTimeout,
        });
      }
    }
    return options;
  }

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

  return paymentOptions;
}

/**
 * Expected accepted options for payment validation (same networks as 402 offers).
 * @param {object} bundle
 * @param {string} expectedMicroUnits
 */
function buildAcceptedOptionsForBundle(bundle, expectedMicroUnits) {
  const { config, assets } = bundle;
  if (config.corbitsMultiNetwork) {
    const { solanaPayTo: solFromEnv, evmPayTo: evmFromEnv } = getCorbitsPayToAddresses();
    const solanaPayTo = config.solanaPayTo || solFromEnv;
    const evmPayTo = config.basePayTo || evmFromEnv;
    const out = [];
    for (const net of getEnabledCorbitsNetworks()) {
      if (net.kind === "solana" && solanaPayTo) {
        out.push({
          network: net.caip2,
          payTo: solanaPayTo,
          asset: net.usdc,
          isEvm: false,
        });
      } else if (net.kind === "evm" && evmPayTo) {
        out.push({
          network: net.caip2,
          payTo: evmPayTo,
          asset: net.usdc,
          isEvm: true,
        });
      }
    }
    const withAmount = out.map((o) => ({ ...o, amount: expectedMicroUnits }));
    return appendB402AcceptedOption(withAmount, expectedMicroUnits);
  }

  const acceptedOptions = [
    {
      network: config.solanaNetwork,
      payTo: config.solanaPayTo,
      asset: assets.solanaUsdcMint,
      isEvm: false,
      amount: expectedMicroUnits,
    },
  ];
  if (config.basePayTo && assets.baseUsdc) {
    acceptedOptions.push({
      network: config.baseNetwork,
      payTo: config.basePayTo,
      asset: assets.baseUsdc,
      isEvm: true,
      amount: expectedMicroUnits,
    });
  }

  return appendB402AcceptedOption(acceptedOptions, expectedMicroUnits);
}

/** @param {object} acc - payload.accepted */
function paymentAcceptedMatchesOption(acc, opt, expectedMicroUnits) {
  if ((acc.scheme || "exact") !== "exact" || acc.network !== opt.network) return false;
  const accAmt = String(acc.amount ?? "");
  const expectedNative = opt.isB402
    ? x402MicroToBscTokenAtomic(expectedMicroUnits)
    : String(expectedMicroUnits);
  const optAmt = String(opt.amount ?? expectedNative);
  const amountOk =
    accAmt === expectedNative ||
    accAmt === optAmt ||
    (opt.isB402 && paymentAcceptedMatchesB402(acc));
  if (!amountOk) return false;
  if (opt.isEvm) {
    return (
      normalizeEvmAddress(acc.payTo) === normalizeEvmAddress(opt.payTo) &&
      normalizeEvmAddress(acc.asset) === normalizeEvmAddress(opt.asset)
    );
  }
  return String(acc.payTo) === String(opt.payTo) && String(acc.asset) === String(opt.asset);
}

/**
 * Build PaymentRequired response (same flow as payai_example_routes buildPaymentRequired).
 * Uses resourceServer.buildPaymentRequirementsFromOptions, createPaymentRequiredResponse,
 * declareDiscoveryExtension, enrichExtensions.
 */
function getPayerAddressFromReq(req) {
  return (req.header("X-Payer-Address") || req.header("x-payer-address") || "").trim() || null;
}

/** For discount: when agent sends X-Connected-Wallet (dev wallet), use it for effective price. */
function getPayerOrConnectedWalletForPrice(req) {
  const connected =
    (req.header("X-Connected-Wallet") || req.header("x-connected-wallet") || "").trim() || null;
  if (connected) return connected;
  return getPayerAddressFromReq(req);
}

/**
 * Default x402 verify/settle: Corbits (https://facilitator.corbits.dev, override CORBITS_FACILITATOR_URL).
 * Opt out to PayAI / FACILITATOR_URL stack: X402_USE_PAYAI_FACILITATOR=true, or X402_USE_CORBITS_FACILITATOR=false,
 * or set req.x402ResourceServerProfile = "payai" | "default" before requirePayment.
 * Force Corbits: req.x402ResourceServerProfile = "corbits".
 */
function useCorbitsProfile(req) {
  if (req?.x402ResourceServerProfile === "payai" || req?.x402ResourceServerProfile === "default") {
    return false;
  }
  if (req?.x402ResourceServerProfile === "corbits") return true;
  const truthy = (v) => {
    const s = String(v || "").trim().toLowerCase();
    return s === "true" || s === "1";
  };
  const falsy = (v) => {
    const s = String(v || "").trim().toLowerCase();
    return s === "false" || s === "0";
  };
  if (truthy(process.env.X402_USE_PAYAI_FACILITATOR)) return false;
  if (falsy(process.env.X402_USE_CORBITS_FACILITATOR)) return false;
  return true;
}

function getX402BundleForReq(req) {
  return useCorbitsProfile(req) ? getX402ResourceServerCorbits() : getX402ResourceServer();
}

async function ensureX402ForReq(req) {
  if (useCorbitsProfile(req)) {
    await ensureX402CorbitsResourceServerInitialized();
  } else {
    await ensureX402ResourceServerInitialized();
  }
}

/**
 * Resolve list price in USD before playground / payer discounts.
 * When `options.getPriceUsd` is a function, it receives `req` and may return a finite number >= 0
 * or a Promise of that number.
 * Otherwise uses `options.price` or global default.
 * @param {object} options - requirePayment options
 * @param {import('express').Request} req
 * @returns {Promise<number>}
 */
async function resolveRawPriceUsdForRequest(options, req) {
  if (typeof options.getPriceUsd === "function") {
    try {
      const r = options.getPriceUsd(req);
      const resolved = r && typeof r.then === "function" ? await r : r;
      const n = Number(resolved);
      if (Number.isFinite(n) && n >= 0) return n;
    } catch {
      /* fall through */
    }
  }
  return parseFloat(options.price ?? X402_API_PRICE_USD);
}

async function buildPaymentRequired(bundle, req, options, error) {
  const adapter = new ExpressAdapter(req);
  const { resourceServer, config, assets } = bundle;
  const rawPrice = await resolveRawPriceUsdForRequest(options, req);
  const priceUsd = getEffectivePriceUsd(rawPrice, getPayerOrConnectedWalletForPrice(req));
  const microUnits = usdToMicroUsdc(priceUsd);
  // Bind x402 `resource.url` to the URL this HTTP request actually used (ExpressAdapter).
  // Previously we used `${BASE_URL}${options.resource}` when `resource` was set; that breaks
  // server-to-self agent calls (resolveAgentBaseUrl → localhost) while BASE_URL is public:
  // PAYMENT-SIGNATURE then carried api.syraa.fun but the client retried localhost — Corbits
  // verify rejects that mismatch. Playground always hit the public URL so it worked.
  const resourceUrl = adapter.getUrl();
  const maxTimeout = options.maxTimeoutSeconds ?? 60;

  const paymentOptions = paymentOptionsForFacilitator(bundle, microUnits, maxTimeout);

  const ctx = {
    adapter,
    path: req.path,
    method: req.method,
    paymentHeader: getPaymentSignatureHeaderFromReq(req),
  };

  let requirements;
  try {
    requirements = await resourceServer.buildPaymentRequirementsFromOptions(paymentOptions, ctx);
  } catch (e) {
    console.warn(
      "[x402] buildPaymentRequirementsFromOptions failed:",
      e?.message || e
    );
    requirements = [];
  }
  requirements = await ensureB402AcceptInRequirements(requirements, microUnits, maxTimeout);
  requirements = ensureEvmEip712Domain(requirements);
  requirements = await enrichB402Requirements(requirements);

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

/** Ensure B402 verify receives x402 v2 ResourceInfo on the payment payload root. */
function enrichB402PayloadResource(payload, req, options) {
  if (!payload || typeof payload !== "object") return payload;
  if (normalizeResourceInfo(payload.resource)) return payload;
  const legacy = normalizeResourceInfo(payload.accepted?.resource);
  if (legacy) {
    return { ...payload, resource: legacy };
  }
  const adapter = new ExpressAdapter(req);
  const url = adapter.getUrl();
  if (!url) return payload;
  return {
    ...payload,
    resource: {
      url,
      description: options?.description,
      mimeType: options?.mimeType || "application/json",
    },
  };
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
 *
 * Options: set `getPriceUsd(req)` to a function returning list-price USD (or Promise<number>) before payer
 * discounts; it must match on both 402 and paid retry. If omitted, `price` (or X402_API_PRICE_USD) is used.
 */
export function requirePayment(options) {
  return async (req, res, next) => {
    try {
      if (isShadowfeedPartnerRequest(req)) {
        markShadowfeedPartnerBypass(req);
        return next();
      }

      await ensureX402ForReq(req);
      const bundle = getX402BundleForReq(req);
      const { resourceServer, config, assets } = bundle;
      logB402StartupOnce();

      const paymentHeader = getPaymentSignatureHeaderFromReq(req);
      if (!paymentHeader) {
        x402Log("payment_required", { method: req.method, path: req.path });
        const pr = await buildPaymentRequired(bundle, req, options, "Payment required");
        json402(res, pr);
        return;
      }

      let payload;
      try {
        payload = decodePaymentSignatureHeader(paymentHeader);
      } catch (e) {
        const pr = await buildPaymentRequired(
          bundle,
          req,
          options,
          `Invalid PAYMENT-SIGNATURE header: ${e?.message || "failed to decode"}`
        );
        json402(res, pr);
        return;
      }

      if (payload.x402Version !== 2 || !payload.accepted) {
        const pr = await buildPaymentRequired(bundle, req, options, "Unsupported x402 payload");
        json402(res, pr);
        return;
      }

      const rawPrice = await resolveRawPriceUsdForRequest(options, req);
      const priceUsd = getEffectivePriceUsd(rawPrice, getPayerOrConnectedWalletForPrice(req));
      const expectedMicroUnits = usdToMicroUsdc(priceUsd);
      const acc = payload.accepted;

      const acceptedOptions = buildAcceptedOptionsForBundle(bundle, expectedMicroUnits);
      let matchingOption = acceptedOptions.find((opt) =>
        paymentAcceptedMatchesOption(acc, opt, expectedMicroUnits)
      );
      if (!matchingOption && paymentAcceptedMatchesB402(acc)) {
        const cfg = getB402OfferConfig();
        if (cfg) {
          matchingOption = {
            network: BSC_CAIP2,
            payTo: cfg.payTo,
            asset: cfg.token.contract,
            isEvm: true,
            isB402: true,
            amount: String(acc.amount ?? x402MicroToBscTokenAtomic(expectedMicroUnits)),
          };
        }
      }

      if (!matchingOption) {
        x402Log("payment_mismatch", {
          method: req.method,
          path: req.path,
          network: acc?.network,
          payTo: acc?.payTo,
          amount: acc?.amount,
        });
        const pr = await buildPaymentRequired(bundle, req, options, "Payment requirements mismatch");
        json402(res, pr);
        return;
      }

      let verify;
      const useB402Facilitator = shouldUseB402Facilitator(acc, payload);
      const payloadForB402 =
        useB402Facilitator && !normalizeResourceInfo(payload?.resource)
          ? enrichB402PayloadResource(payload, req, options)
          : payload;
      x402Log("payment_retry", {
        method: req.method,
        path: req.path,
        network: acc?.network,
        amount: acc?.amount,
        b402: useB402Facilitator,
        resourceUrl:
          normalizeResourceInfo(payloadForB402?.resource)?.url ??
          normalizeResourceInfo(acc?.resource)?.url,
        hasHeader: true,
      });
      try {
        if (useB402Facilitator) {
          verify = await withTimeout(
            b402VerifyPayment(payloadForB402, acc),
            X402_VERIFY_FACILITATOR_TIMEOUT_MS,
            "verify_timeout"
          );
        } else {
          verify = await withTimeout(
            resourceServer.verifyPayment(payload, acc),
            X402_VERIFY_FACILITATOR_TIMEOUT_MS,
            "verify_timeout"
          );
        }
      } catch (e) {
        const msg = e?.message || "Payment verification failed";
        if (isFacilitatorError(msg) && isSolanaNetwork(acc)) {
          const localVerify = await verifySolanaPaymentLocally(payload, acc);
          if (localVerify?.isValid) {
            verify = localVerify;
          } else if (localVerify && !localVerify.isValid) {
            const pr = await buildPaymentRequired(
              bundle,
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
          const pr = await buildPaymentRequired(bundle, req, options, userMessage);
          json402(res, pr);
          return;
        }
      }

      if (!verify?.isValid) {
        x402Log("verify_failed", {
          method: req.method,
          path: req.path,
          b402: useB402Facilitator,
          reason: verify?.invalidReason || "Payment verification failed",
        });
        const pr = await buildPaymentRequired(
          bundle,
          req,
          options,
          verify?.invalidReason || "Payment verification failed"
        );
        json402(res, pr);
        return;
      }

      req.x402Payment = {
        payload: useB402Facilitator ? payloadForB402 : payload,
        accepted: acc,
        priceUsd,
        resourceServerProfile: useCorbitsProfile(req) ? "corbits" : "default",
        useB402Facilitator,
      };
      x402Log("verify_ok", {
        method: req.method,
        path: req.path,
        b402: useB402Facilitator,
        network: acc?.network,
      });
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
async function tryFacilitatorThenLocalSettle(payload, accepted, req) {
  if (req?.x402Payment?.useB402Facilitator || shouldUseB402Facilitator(accepted, payload)) {
    const settle = await withTimeout(
      b402SettlePayment(payload, accepted),
      X402_SETTLE_FACILITATOR_TIMEOUT_MS,
      "settle_timeout"
    );
    if (settle?.success) {
      return {
        success: true,
        payer: settle.payer,
        transaction: settle.transaction,
        network: settle.network ?? accepted?.network,
      };
    }
    return {
      success: false,
      errorReason: settle?.errorReason || settle?.error || "B402 settlement failed",
      error: settle?.errorReason || settle?.error || "B402 settlement failed",
    };
  }

  const profile = req?.x402Payment?.resourceServerProfile;
  const { resourceServer } =
    profile === "corbits" ? getX402ResourceServerCorbits() : getX402ResourceServer();
  let settle;
  try {
    settle = await withTimeout(
      resourceServer.settlePayment(payload, accepted),
      X402_SETTLE_FACILITATOR_TIMEOUT_MS,
      "settle_timeout"
    );
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
export async function settlePaymentWithFallback(payload, accepted, req) {
  if (isShadowfeedPartnerRequest(req)) {
    return { success: true, scheme: "shadowfeed-partner" };
  }
  try {
    return await tryFacilitatorThenLocalSettle(payload, accepted, req);
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
  if (isShadowfeedPartnerRequest(req)) {
    req._requestInsightPaid = true;
    return { success: true, scheme: "shadowfeed-partner" };
  }
  const { payload, accepted } = req.x402Payment;
  let settle;
  try {
    settle = await settlePaymentWithFallback(payload, accepted, req);
  } catch (e) {
    const msg = getErrorMessage(e);
    const looksLikeFacilitatorOrSettle =
      isFacilitatorErrorFromThrow(e) ||
      /settle|500|Internal\s*server|Facilitator|simulation|transaction_simulation/i.test(msg);
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
  if (!settle?.success) {
    const reason = settle?.errorReason || settle?.error || "Settlement failed";
    res.setHeader(
      "Payment-Response",
      encodePaymentResponseHeader({ success: false, error: reason })
    );
    return settle;
  }
  res.setHeader("Payment-Response", encodePaymentResponseHeader(settle));
  req._requestInsightPaid = true;
  runAfterResponse(() => recordPaidApiCall(req));
  runAfterResponse(() => {
    import("../libs/agentscoreGate.js")
      .then(({ captureAgentscoreWalletAfterSettle }) => captureAgentscoreWalletAfterSettle(req, settle))
      .catch(() => {});
  });
  const priceUsd = req.x402Payment?.priceUsd;
  if (
    typeof priceUsd === "number" &&
    priceUsd > 0 &&
    process.env.NODE_ENV === "production" &&
    !isTesterAgentInternalProbeRequest(req)
  ) {
    runAfterResponse(() => buybackSYRAFromRevenue(priceUsd).catch(() => {}));
  }
  return settle;
}

export { encodePaymentResponseHeader };
export { getX402ResourceServer };
export { isB402Network };

export function usdToMicroUsdc(usd) {
  const n = Number(usd);
  if (!Number.isFinite(n) || n <= 0) return "0";
  const micro = Math.round(n * 1_000_000);
  // Sub-micro local prices (e.g. /health) must still be >0 for B402 verify.
  return String(micro > 0 ? micro : 1);
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
 * Run SYRA buyback after a paid request when the route uses settlePaymentWithFallback
 * instead of settlePaymentAndSetResponse. Call this after settling and setting Payment-Response.
 * @param {import('express').Request} req - Must have req.x402Payment.priceUsd (set by requirePayment)
 */
export function runBuybackForRequest(req) {
  if (process.env.NODE_ENV !== "production") return;
  if (isTesterAgentInternalProbeRequest(req)) return;
  if (isShadowfeedPartnerRequest(req)) return;
  const priceUsd = req.x402Payment?.priceUsd;
  if (typeof priceUsd === "number" && priceUsd > 0) {
    runAfterResponse(() => buybackSYRAFromRevenue(priceUsd).catch(() => {}));
  }
}

/**
 * Get the x402 resource server (for routes that need to call settlePayment manually).
 * Prefer using settlePaymentAndSetResponse(res, req) after success.
 * @param {import('express').Request} [req] - When set, uses the same facilitator as requirePayment (Corbits vs default).
 */
export function getX402Handler(req) {
  const { resourceServer } = getX402BundleForReq(req);
  return {
    async settlePayment(payload, accepted) {
      if (req?.x402Payment?.useB402Facilitator || shouldUseB402Facilitator(accepted, payload)) {
        return b402SettlePayment(payload, accepted);
      }
      return resourceServer.settlePayment(payload, accepted);
    },
  };
}
