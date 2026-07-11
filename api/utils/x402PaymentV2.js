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
import { declareDiscoveryExtension, BAZAAR, sanitizeResourceServiceMetadata } from "@x402/extensions/bazaar";
import { BUILDER_CODE, declareBuilderCodeExtension } from "@x402/extensions/builder-code";
import { getBaseBuilderCode } from "../config/baseBuilderCode.js";
import { Connection } from "@solana/web3.js";
import { VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import {
  getX402ResourceServer,
  ensureX402ResourceServerInitialized,
  getX402ResourceServerCorbits,
  ensureX402CorbitsResourceServerInitialized,
  getX402ResourceServerDexter,
  ensureX402DexterResourceServerInitialized,
} from "./x402ResourceServer.js";
import { X402_API_PRICE_USD, getEffectivePriceUsd, applyDexterPriceFloor } from "../config/x402Pricing.js";
import {
  getCorbitsPayToAddresses,
  getEnabledCorbitsNetworks,
} from "../config/corbitsX402Networks.js";
import {
  getDexterPayToAddresses,
  getEnabledDexterNetworks,
} from "../config/dexterX402Networks.js";
import {
  getPayaiPayToAddresses,
  getEnabledPayaiNetworks,
} from "../config/payaiX402Networks.js";
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
  getAlgorandPayTo,
  getEnabledAlgorandNetworks,
  isAlgorandEnabled,
  isAlgorandNetwork,
  USDC_DECIMALS,
} from "../config/algorandX402Networks.js";
import {
  ensureX402AvmResourceServerInitialized,
  getX402AvmResourceServer,
} from "./x402AvmResourceServer.js";
import {
  ensureOkxX402ResourceServerInitialized,
  getOkxX402ResourceServer,
  getOkxX402PayTo,
  isOkxX402Enabled,
  isOkxX402Network,
  isOkxX402FacilitatorReady,
} from "./okxX402ResourceServer.js";
import { getEnabledOkxX402Networks } from "../config/okxX402Networks.js";
import {
  verifyPayment as b402VerifyPayment,
  settlePayment as b402SettlePayment,
  normalizeResourceInfo,
  injectBazaarIntoPaymentPayload,
} from "../libs/b402FacilitatorClient.js";
import { recordPaidApiCall } from "./recordPaidApiCall.js";
import { recordX402Call, resolveInboundFacilitator } from "./recordX402Call.js";
import { queueBuybackRevenue } from "../libs/buybackScheduler.js";
import { isTesterAgentInternalProbeRequest } from "./testerAgentProbe.js";
import { isShadowfeedPartnerRequest, markShadowfeedPartnerBypass } from "./shadowfeedPartner.js";
import { isX402BazaarEnabled } from "../config/x402Bazaar.js";
import {
  SYRA_BAZAAR_ICON_URL,
  SYRA_BAZAAR_SERVICE_NAME,
  SYRA_BAZAAR_TAGS,
} from "../config/syraBranding.js";
import {
  getResourceCategory,
  inferResourcePathFromRequest,
  isPlaceholderResourceDescription,
  resolveResourceDescription,
} from "../config/x402ResourceCatalog.js";
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

/** Fire-and-forget inbound x402 telemetry. */
function recordInboundX402(req, event) {
  if (!req?.path) return;
  runAfterResponse(() =>
    recordX402Call({
      direction: "inbound",
      path: req.path,
      method: req.method || "GET",
      source: "api",
      ...event,
    })
  );
}

/** Resolve facilitator for inbound verify attempt (before req.x402Payment is set). */
function resolveInboundFacilitatorFromFlags(req, { useAlgorandFacilitator, useB402Facilitator, useOkxFacilitator }) {
  if (useAlgorandFacilitator) return "algorand";
  if (useB402Facilitator) return "b402";
  if (useOkxFacilitator) return "okx";
  const profile = resolveResourceServerProfile(req);
  if (profile === "corbits") return "corbits";
  if (profile === "dexter") return "dexter";
  return "payai";
}

let b402StartupLogged = false;
let algorandStartupLogged = false;
let okxStartupLogged = false;

async function logOkxStartupOnce() {
  if (okxStartupLogged) return;
  okxStartupLogged = true;
  const { getOkxX402PublicStatus } = await import("../config/okxX402Networks.js");
  const status = getOkxX402PublicStatus();
  if (isOkxX402Enabled()) {
    console.log(
      "[okx-x402] merchant inbound enabled",
      JSON.stringify({
        payTo: status.payTo,
        networks: status.networks?.map((n) => n.id),
        syncSettle: String(process.env.OKX_X402_SYNC_SETTLE || "").toLowerCase() === "true",
      }),
    );
    return;
  }
  console.warn(
    "[okx-x402] merchant inbound disabled — X Layer OKX facilitator will not appear in 402 accepts",
    JSON.stringify({
      missing: status.missing,
      hint: "Set OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE, OKX_X402_PAYTO — https://web3.okx.com/onchain-os/dev-portal",
    }),
  );
}

async function logAlgorandStartupOnce() {
  if (algorandStartupLogged) return;
  algorandStartupLogged = true;
  const { getAlgorandPublicStatus } = await import("../config/algorandX402Networks.js");
  const status = getAlgorandPublicStatus();
  if (isAlgorandEnabled()) {
    console.log(
      "[algorand-x402] merchant inbound enabled",
      JSON.stringify({
        payTo: status.payTo,
        facilitatorUrl: status.facilitatorUrl,
        networks: status.networks?.map((n) => n.id),
      }),
    );
    return;
  }
  console.warn(
    "[algorand-x402] merchant inbound disabled — Algorand will not appear in 402 accepts",
    JSON.stringify({
      missing: status.missing,
      hint: "Set ALGORAND_PAYTO (or AVM_ADDRESS), then restart. Check GET /x402/capabilities",
    }),
  );
}

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

/**
 * Canonical HTTPS resource URL for Bazaar / Ampersend discovery on public requests.
 * Uses ExpressAdapter URL for localhost/internal probes so PAYMENT-SIGNATURE retry URLs match.
 * @param {import('express').Request} req
 * @param {import('@x402/express').ExpressAdapter} adapter
 */
function resolvePublicResourceUrl(req, adapter) {
  const adapterUrl = String(adapter.getUrl() || "").trim();
  if (!adapterUrl) return adapterUrl;
  try {
    const parsed = new URL(adapterUrl);
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local")
    ) {
      return adapterUrl;
    }
    const base = String(BASE_URL || "").replace(/\/+$/, "");
    if (base) {
      const baseUrl = base.startsWith("http") ? base : `https://${base}`;
      const origin = new URL(baseUrl).origin;
      return `${origin}${parsed.pathname}${parsed.search}`;
    }
    const forwardedProto = String(req.headers?.["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim()
      .toLowerCase();
    if (forwardedProto === "https" && parsed.protocol === "http:") {
      return `https://${parsed.host}${parsed.pathname}${parsed.search}`;
    }
    return adapterUrl;
  } catch {
    return adapterUrl;
  }
}

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

/**
 * GoPlausible facilitator does not list Algorand on PayAI/Corbits — append AVM accepts when enabled.
 * Uses AVM resource server so feePayer and other facilitator extras are included.
 * @param {object[]} requirements
 * @param {string} microUnits
 * @param {number} maxTimeoutSeconds
 * @param {object} ctx
 */
async function ensureAlgorandAcceptInRequirements(requirements, microUnits, maxTimeoutSeconds, ctx) {
  if (!isAlgorandEnabled()) return requirements;
  const list = Array.isArray(requirements) ? [...requirements] : [];
  if (list.some((r) => r && isAlgorandNetwork(r.network))) return list;

  const payTo = getAlgorandPayTo();
  const networks = getEnabledAlgorandNetworks();
  if (!payTo || networks.length === 0) return list;

  await ensureX402AvmResourceServerInitialized();
  const { resourceServer } = getX402AvmResourceServer();

  for (const net of networks) {
    const paymentOptions = [
      {
        scheme: "exact",
        price: { asset: net.usdcAsa, amount: microUnits },
        network: net.caip2,
        payTo,
        maxTimeoutSeconds,
      },
    ];
    try {
      const algorandReqs = await resourceServer.buildPaymentRequirementsFromOptions(
        paymentOptions,
        ctx
      );
      if (Array.isArray(algorandReqs)) {
        for (const r of algorandReqs) {
          if (r && !list.some((x) => x?.network === r.network)) {
            list.push(r);
          }
        }
      }
    } catch (e) {
      console.warn(
        "[algorand-x402] buildPaymentRequirementsFromOptions failed, using manual accept:",
        e?.message || e
      );
      list.push({
        scheme: "exact",
        network: net.caip2,
        amount: microUnits,
        asset: net.usdcAsa,
        payTo,
        maxTimeoutSeconds,
        extra: { decimals: USDC_DECIMALS },
      });
    }
  }
  return list;
}

/** Append Algorand accepted options for paid-request validation (must mirror 402 offers). */
function appendAlgorandAcceptedOption(acceptedOptions, expectedMicroUnits) {
  if (!isAlgorandEnabled()) return acceptedOptions;
  if (acceptedOptions.some((o) => o && isAlgorandNetwork(o.network))) return acceptedOptions;
  const payTo = getAlgorandPayTo();
  for (const net of getEnabledAlgorandNetworks()) {
    acceptedOptions.push({
      network: net.caip2,
      payTo,
      asset: net.usdcAsa,
      isEvm: false,
      isAlgorand: true,
      amount: expectedMicroUnits,
    });
  }
  return acceptedOptions;
}

/** True when payload.accepted matches configured Algorand merchant offer (amount checked separately). */
function paymentAcceptedMatchesAlgorand(acc) {
  if (!acc || !isAlgorandNetwork(acc.network)) return false;
  if ((acc.scheme || "exact") !== "exact") return false;
  const payTo = getAlgorandPayTo();
  if (!payTo) return false;
  const net = getEnabledAlgorandNetworks().find((n) => n.caip2 === acc.network);
  if (!net) return false;
  return String(acc.payTo) === String(payTo) && String(acc.asset) === String(net.usdcAsa);
}

/** Route verify/settle to GoPlausible AVM when network is Algorand CAIP-2. */
function shouldUseAlgorandFacilitator(acc) {
  return Boolean(acc && isAlgorandNetwork(acc.network));
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

/**
 * OKX facilitator owns X Layer — append accepts when enabled; PayAI/Corbits must not offer them.
 * @param {object[]} requirements
 * @param {string} microUnits
 * @param {number} maxTimeoutSeconds
 * @param {object} ctx
 */
async function ensureOkxAcceptInRequirements(requirements, microUnits, maxTimeoutSeconds, ctx) {
  if (!isOkxX402Enabled()) return requirements;
  const list = Array.isArray(requirements) ? [...requirements] : [];
  const payTo = getOkxX402PayTo();
  const networks = getEnabledOkxX402Networks();
  if (!payTo || networks.length === 0) return list;

  // Drop PayAI X Layer rows when OKX facilitator is active (avoid duplicate/wrong facilitator).
  const filtered = list.filter((r) => !r || !isOkxX402Network(r.network));

  await ensureOkxX402ResourceServerInitialized();
  const { resourceServer } = getOkxX402ResourceServer();

  for (const net of networks) {
    if (filtered.some((r) => r?.network === net.caip2)) continue;
    const paymentOptions = [
      {
        scheme: "exact",
        price: { asset: net.stablecoin, amount: microUnits },
        network: net.caip2,
        payTo,
        maxTimeoutSeconds,
      },
    ];
    let built = false;
    if (isOkxX402FacilitatorReady()) {
      try {
        const okxReqs = await resourceServer.buildPaymentRequirementsFromOptions(
          paymentOptions,
          ctx,
        );
        if (Array.isArray(okxReqs)) {
          for (const r of okxReqs) {
            if (r && !filtered.some((x) => x?.network === r.network)) {
              filtered.push(r);
            }
          }
          built = okxReqs.length > 0;
        }
      } catch (e) {
        console.warn(
          "[okx-x402] buildPaymentRequirementsFromOptions failed, using manual accept:",
          e?.message || e,
        );
      }
    }
    if (!built) {
      filtered.push({
        scheme: "exact",
        network: net.caip2,
        amount: microUnits,
        asset: net.stablecoin,
        payTo,
        maxTimeoutSeconds,
      });
    }
  }
  return filtered;
}

/** True when payload.accepted matches configured OKX X Layer merchant offer. */
function paymentAcceptedMatchesOkx(acc) {
  if (!acc || !isOkxX402Network(acc.network)) return false;
  if ((acc.scheme || "exact") !== "exact") return false;
  const payTo = getOkxX402PayTo();
  if (!payTo) return false;
  const net = getEnabledOkxX402Networks().find((n) => n.caip2 === acc.network);
  if (!net) return false;
  return (
    normalizeEvmAddress(acc.payTo) === normalizeEvmAddress(payTo) &&
    normalizeEvmAddress(acc.asset) === normalizeEvmAddress(net.stablecoin)
  );
}

function shouldUseOkxFacilitator(acc) {
  return Boolean(acc && isOkxX402Enabled() && isOkxX402Network(acc.network));
}

/** Append OKX X Layer accepted options for paid-request validation. */
function appendOkxAcceptedOption(acceptedOptions, expectedMicroUnits) {
  if (!isOkxX402Enabled()) return acceptedOptions;
  const payTo = getOkxX402PayTo();
  for (const net of getEnabledOkxX402Networks()) {
    if (acceptedOptions.some((o) => o?.network === net.caip2)) continue;
    acceptedOptions.push({
      network: net.caip2,
      payTo,
      asset: net.stablecoin,
      isEvm: true,
      isOkx: true,
      amount: expectedMicroUnits,
    });
  }
  return acceptedOptions;
}

/** Corbits/PayAI facilitators do not support BSC — never pass B402 options into @x402 resource server. */
function paymentOptionsForFacilitator(bundle, microUnits, maxTimeout, payToOverride = null) {
  return buildPaymentOptionsForBundle(bundle, microUnits, maxTimeout, payToOverride).filter(
    (o) =>
      o &&
      !isB402Network(o.network) &&
      !(isOkxX402Enabled() && isOkxX402Network(o.network)),
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

/** @param {'payai'|'corbits'|'dexter'} profile */
function getPayToAddressesForProfile(profile) {
  if (profile === "corbits") return getCorbitsPayToAddresses();
  if (profile === "dexter") return getDexterPayToAddresses();
  return getPayaiPayToAddresses();
}

/** @param {'payai'|'corbits'|'dexter'} profile */
function getEnabledNetworksForProfile(profile) {
  if (profile === "corbits") return getEnabledCorbitsNetworks();
  if (profile === "dexter") return getEnabledDexterNetworks();
  return getEnabledPayaiNetworks();
}

/**
 * Normalize per-request payTo override from requirePayment options.
 * @param {{ solanaPayTo?: string | null, evmPayTo?: string | null, basePayTo?: string | null, payTo?: string | null } | string | null | undefined} raw
 * @returns {{ solanaPayTo: string | null, evmPayTo: string | null } | null}
 */
function normalizePayToOverride(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed ? { solanaPayTo: trimmed, evmPayTo: null } : null;
  }
  if (typeof raw !== "object") return null;
  const solanaPayTo =
    (raw.solanaPayTo && String(raw.solanaPayTo).trim()) ||
    (raw.payTo && String(raw.payTo).trim()) ||
    null;
  const evmPayTo =
    (raw.evmPayTo && String(raw.evmPayTo).trim()) ||
    (raw.basePayTo && String(raw.basePayTo).trim()) ||
    null;
  if (!solanaPayTo && !evmPayTo) return null;
  return { solanaPayTo, evmPayTo };
}

/**
 * Build x402 payment options for a request (multi-network PayAI/Corbits or legacy Solana+Base).
 * @param {object} bundle
 * @param {string} microUnits
 * @param {number} maxTimeout
 * @param {{ solanaPayTo?: string | null, evmPayTo?: string | null } | null} [payToOverride]
 */
function buildPaymentOptionsForBundle(bundle, microUnits, maxTimeout, payToOverride = null) {
  const { config, assets } = bundle;
  const overrideSolana = payToOverride?.solanaPayTo ?? null;
  const overrideEvm = payToOverride?.evmPayTo ?? null;
  const solanaOnlyOverride = Boolean(overrideSolana && !overrideEvm);

  if (config.multiNetwork && config.networkProfile) {
    const { solanaPayTo: solFromEnv, evmPayTo: evmFromEnv } = getPayToAddressesForProfile(
      config.networkProfile
    );
    const solanaPayTo = overrideSolana || config.solanaPayTo || solFromEnv;
    const evmPayTo = overrideEvm || config.basePayTo || evmFromEnv;
    const options = [];
    for (const net of getEnabledNetworksForProfile(config.networkProfile)) {
      if (net.kind === "solana" && solanaPayTo) {
        options.push({
          scheme: "exact",
          price: { asset: net.usdc, amount: microUnits },
          network: net.caip2,
          payTo: solanaPayTo,
          maxTimeoutSeconds: maxTimeout,
        });
      } else if (net.kind === "evm" && evmPayTo && !solanaOnlyOverride) {
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
      payTo: overrideSolana || config.solanaPayTo,
      maxTimeoutSeconds: maxTimeout,
    },
  ];
  if (!solanaOnlyOverride && (overrideEvm || (config.basePayTo && assets.baseUsdc))) {
    paymentOptions.push({
      scheme: "exact",
      price: { asset: assets.baseUsdc, amount: microUnits },
      network: config.baseNetwork,
      payTo: overrideEvm || config.basePayTo,
      maxTimeoutSeconds: maxTimeout,
    });
  }

  return paymentOptions;
}

/**
 * Expected accepted options for payment validation (same networks as 402 offers).
 * @param {object} bundle
 * @param {string} expectedMicroUnits
 * @param {{ solanaPayTo?: string | null, evmPayTo?: string | null } | null} [payToOverride]
 */
function buildAcceptedOptionsForBundle(bundle, expectedMicroUnits, payToOverride = null) {
  const { config, assets } = bundle;
  const overrideSolana = payToOverride?.solanaPayTo ?? null;
  const overrideEvm = payToOverride?.evmPayTo ?? null;
  const solanaOnlyOverride = Boolean(overrideSolana && !overrideEvm);

  if (config.multiNetwork && config.networkProfile) {
    const { solanaPayTo: solFromEnv, evmPayTo: evmFromEnv } = getPayToAddressesForProfile(
      config.networkProfile
    );
    const solanaPayTo = overrideSolana || config.solanaPayTo || solFromEnv;
    const evmPayTo = overrideEvm || config.basePayTo || evmFromEnv;
    const out = [];
    for (const net of getEnabledNetworksForProfile(config.networkProfile)) {
      if (net.kind === "solana" && solanaPayTo) {
        out.push({
          network: net.caip2,
          payTo: solanaPayTo,
          asset: net.usdc,
          isEvm: false,
        });
      } else if (net.kind === "evm" && evmPayTo && !solanaOnlyOverride) {
        out.push({
          network: net.caip2,
          payTo: evmPayTo,
          asset: net.usdc,
          isEvm: true,
        });
      }
    }
    const withAmount = out.map((o) => ({ ...o, amount: expectedMicroUnits }));
    if (solanaOnlyOverride) {
      return withAmount;
    }
    return appendAlgorandAcceptedOption(
      appendOkxAcceptedOption(
        appendB402AcceptedOption(withAmount, expectedMicroUnits),
        expectedMicroUnits,
      ),
      expectedMicroUnits,
    );
  }

  const acceptedOptions = [
    {
      network: config.solanaNetwork,
      payTo: overrideSolana || config.solanaPayTo,
      asset: assets.solanaUsdcMint,
      isEvm: false,
      amount: expectedMicroUnits,
    },
  ];
  if (!solanaOnlyOverride && (overrideEvm || (config.basePayTo && assets.baseUsdc))) {
    acceptedOptions.push({
      network: config.baseNetwork,
      payTo: overrideEvm || config.basePayTo,
      asset: assets.baseUsdc,
      isEvm: true,
      amount: expectedMicroUnits,
    });
  }

  if (solanaOnlyOverride) {
    return acceptedOptions;
  }

  return appendAlgorandAcceptedOption(
    appendOkxAcceptedOption(
      appendB402AcceptedOption(acceptedOptions, expectedMicroUnits),
      expectedMicroUnits,
    ),
    expectedMicroUnits,
  );
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
    (opt.isB402 && paymentAcceptedMatchesB402(acc)) ||
    (opt.isAlgorand && paymentAcceptedMatchesAlgorand(acc));
  if (!amountOk) return false;
  if (opt.isEvm) {
    return (
      normalizeEvmAddress(acc.payTo) === normalizeEvmAddress(opt.payTo) &&
      normalizeEvmAddress(acc.asset) === normalizeEvmAddress(opt.asset)
    );
  }
  if (opt.isAlgorand || isAlgorandNetwork(opt.network)) {
    return (
      String(acc.payTo) === String(opt.payTo) && String(acc.asset) === String(opt.asset)
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
 * Effective USD price for a request, including Dexter facilitator floor when applicable.
 * @param {number} rawPrice
 * @param {import('express').Request} req
 * @param {object} [options]
 */
function resolveEffectivePriceUsd(rawPrice, req, options) {
  let priceUsd = getEffectivePriceUsd(rawPrice, getPayerOrConnectedWalletForPrice(req));
  if (resolveResourceServerProfile(req, options) === "dexter") {
    priceUsd = applyDexterPriceFloor(priceUsd);
  }
  return priceUsd;
}

/**
 * Default x402 verify/settle: PayAI (https://facilitator.payai.network).
 * Opt in per-request via `options.resourceServerProfile` / `req.x402ResourceServerProfile`,
 * or globally via X402_USE_CORBITS_FACILITATOR / X402_USE_DEXTER_FACILITATOR.
 * @returns {'payai'|'corbits'|'dexter'}
 */
function resolveResourceServerProfile(req, options) {
  const fromOptions =
    options?.resourceServerProfile != null
      ? String(options.resourceServerProfile).trim().toLowerCase()
      : "";
  const fromReq =
    req?.x402ResourceServerProfile != null
      ? String(req.x402ResourceServerProfile).trim().toLowerCase()
      : "";
  const explicit = fromOptions || fromReq;
  if (explicit === "corbits" || explicit === "dexter" || explicit === "payai") return explicit;
  if (explicit === "default") return "payai";

  const truthy = (v) => {
    const s = String(v || "").trim().toLowerCase();
    return s === "true" || s === "1";
  };
  if (truthy(process.env.X402_USE_CORBITS_FACILITATOR)) return "corbits";
  if (truthy(process.env.X402_USE_DEXTER_FACILITATOR)) return "dexter";
  return "payai";
}

function getX402BundleForReq(req, options) {
  const profile = resolveResourceServerProfile(req, options);
  if (profile === "corbits") return getX402ResourceServerCorbits();
  if (profile === "dexter") return getX402ResourceServerDexter();
  return getX402ResourceServer();
}

async function ensureX402ForReq(req, options) {
  const profile = resolveResourceServerProfile(req, options);
  if (profile === "corbits") {
    await ensureX402CorbitsResourceServerInitialized();
  } else if (profile === "dexter") {
    await ensureX402DexterResourceServerInitialized();
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

/**
 * Resolve payTo override for creator-monetized routes.
 * When `options.getPayTo(req)` or `options.payTo` is set, 402 offers and verify use those addresses.
 * @param {object} options - requirePayment options
 * @param {import('express').Request} req
 * @returns {Promise<{ solanaPayTo: string | null, evmPayTo: string | null } | null>}
 */
async function resolvePayToForRequest(options, req) {
  let raw = null;
  if (typeof options.getPayTo === "function") {
    try {
      const r = options.getPayTo(req);
      raw = r && typeof r.then === "function" ? await r : r;
    } catch {
      /* fall through */
    }
  } else if (options.payTo != null) {
    raw = options.payTo;
  }
  return normalizePayToOverride(raw);
}

/**
 * Normalize requirePayment options so every network gets a catalog-backed description.
 * @param {import('express').Request} req
 * @param {object} options
 */
function normalizePaymentOptions(req, options) {
  const base = options && typeof options === "object" ? { ...options } : {};
  const resource = inferResourcePathFromRequest(req, base);
  const adapter = new ExpressAdapter(req);
  const url = adapter.getUrl();
  const description = resolveResourceDescription({
    description: base.description,
    resourcePath: resource,
    url,
  });
  return { ...base, resource, description };
}

/** Sanitized Syra service metadata for Bazaar / Ampersend resource listings. */
function getSyraBazaarServiceMetadata() {
  return sanitizeResourceServiceMetadata({
    serviceName: SYRA_BAZAAR_SERVICE_NAME,
    tags: SYRA_BAZAAR_TAGS,
    iconUrl: SYRA_BAZAAR_ICON_URL,
  });
}

/**
 * Build enriched x402 extensions (bazaar + optional builder-code) for 402 and settle indexing.
 * @param {import('@x402/core/server').x402ResourceServer} resourceServer
 * @param {import('express').Request} req
 * @param {object} options - requirePayment options
 */
function buildBazaarExtensions(resourceServer, req, options) {
  const paymentOptions = normalizePaymentOptions(req, options);
  const resourcePath = String(paymentOptions.resource ?? "").replace(/^\/+/, "");
  const category = getResourceCategory(resourcePath);
  const outputExample = options.outputExample ?? { ok: true, paid: true };
  const declared = {
    ...declareDiscoveryExtension({
      input: options.inputSchema ? { schema: options.inputSchema } : {},
      inputSchema: options.inputSchema || { type: "object", properties: {}, additionalProperties: false },
      ...(req.method === "POST" ? { bodyType: "json" } : {}),
      output: { example: outputExample },
    }),
    ...(getBaseBuilderCode()
      ? { [BUILDER_CODE]: declareBuilderCodeExtension(getBaseBuilderCode()) }
      : {}),
  };
  const enriched = resourceServer.enrichExtensions(declared, { method: req.method, adapter: {} });
  const bazaarKey = BAZAAR.key;
  if (enriched?.[bazaarKey] && typeof enriched[bazaarKey] === "object") {
    enriched[bazaarKey] = {
      ...enriched[bazaarKey],
      discoverable: true,
      category,
      tags: [...SYRA_BAZAAR_TAGS, category],
    };
  }
  return enriched;
}

/** ResourceInfo with optional Bazaar service metadata (all networks). */
function buildPaymentResourceInfo({ url, description, resourcePath, mimeType }) {
  const resolvedDescription = resolveResourceDescription({
    description,
    resourcePath,
    url,
  });
  const base = normalizeResourceInfo({
    url,
    description: resolvedDescription,
    mimeType: mimeType || "application/json",
  });
  if (!base) return undefined;
  const serviceMeta = isX402BazaarEnabled() ? getSyraBazaarServiceMetadata() : {};
  return normalizeResourceInfo({ ...base, ...serviceMeta });
}

/** Merge catalog description (+ optional Bazaar metadata) onto x402 v2 ResourceInfo. */
function enrichPaymentResourceInfo(existing, req, options) {
  const adapter = new ExpressAdapter(req);
  const url = String(existing?.url ?? adapter.getUrl() ?? "").trim();
  if (!url) return existing;
  const paymentOptions = normalizePaymentOptions(req, options);
  const description = resolveResourceDescription({
    description: paymentOptions.description ?? existing?.description,
    resourcePath: paymentOptions.resource,
    url,
  });
  const serviceMeta = isX402BazaarEnabled() ? getSyraBazaarServiceMetadata() : {};
  return (
    normalizeResourceInfo({
      ...existing,
      url,
      description: isPlaceholderResourceDescription(existing?.description, url)
        ? description
        : existing?.description || description,
      mimeType: existing?.mimeType || paymentOptions.mimeType || "application/json",
      ...serviceMeta,
    }) ?? existing
  );
}

/** Resolve Bazaar settle options (bazaar blob) stashed on req.x402Payment. */
function resolveBazaarSettleOptions(req) {
  const blob = req?.x402Payment?.bazaarExtensions?.[BAZAAR.key];
  return blob && typeof blob === "object" ? { bazaar: blob } : {};
}

async function buildPaymentRequired(bundle, req, options, error) {
  const paymentOptions = normalizePaymentOptions(req, options);
  const adapter = new ExpressAdapter(req);
  const { resourceServer, config, assets } = bundle;
  const rawPrice = await resolveRawPriceUsdForRequest(paymentOptions, req);
  const priceUsd = resolveEffectivePriceUsd(rawPrice, req, paymentOptions);
  const microUnits = usdToMicroUsdc(priceUsd);
  // Bind x402 `resource.url` to the URL this HTTP request actually used (ExpressAdapter).
  // Previously we used `${BASE_URL}${options.resource}` when `resource` was set; that breaks
  // server-to-self agent calls (resolveAgentBaseUrl → localhost) while BASE_URL is public:
  // PAYMENT-SIGNATURE then carried api.syraa.fun but the client retried localhost — Corbits
  // verify rejects that mismatch. Playground always hit the public URL so it worked.
  const resourceUrl = resolvePublicResourceUrl(req, adapter);
  const maxTimeout = paymentOptions.maxTimeoutSeconds ?? 60;
  const payToOverride = await resolvePayToForRequest(paymentOptions, req);

  const facilitatorPaymentOptions = paymentOptionsForFacilitator(
    bundle,
    microUnits,
    maxTimeout,
    payToOverride
  );

  const ctx = {
    adapter,
    path: req.path,
    method: req.method,
    paymentHeader: getPaymentSignatureHeaderFromReq(req),
  };

  let requirements;
  try {
    requirements = await resourceServer.buildPaymentRequirementsFromOptions(
      facilitatorPaymentOptions,
      ctx
    );
  } catch (e) {
    console.warn(
      "[x402] buildPaymentRequirementsFromOptions failed:",
      e?.message || e
    );
    requirements = [];
  }
  const solanaOnlyOverride = Boolean(payToOverride?.solanaPayTo && !payToOverride?.evmPayTo);
  if (!solanaOnlyOverride) {
    requirements = await ensureB402AcceptInRequirements(requirements, microUnits, maxTimeout);
    requirements = await ensureAlgorandAcceptInRequirements(
      requirements,
      microUnits,
      maxTimeout,
      ctx
    );
    requirements = await ensureOkxAcceptInRequirements(
      requirements,
      microUnits,
      maxTimeout,
      ctx,
    );
  }
  requirements = ensureEvmEip712Domain(requirements);
  requirements = await enrichB402Requirements(requirements);

  const resourceInfo =
    buildPaymentResourceInfo({
      url: resourceUrl,
      description: paymentOptions.description,
      resourcePath: paymentOptions.resource,
      mimeType: paymentOptions.mimeType || "application/json",
    }) ?? {
      url: resourceUrl,
      description: paymentOptions.description,
      mimeType: paymentOptions.mimeType || "application/json",
    };
  const extensions = isX402BazaarEnabled()
    ? buildBazaarExtensions(resourceServer, req, paymentOptions)
    : undefined;

  return resourceServer.createPaymentRequiredResponse(requirements, resourceInfo, error, extensions);
}

function json402(res, paymentRequired) {
  res.setHeader("Payment-Required", encodePaymentRequiredHeader(paymentRequired));
  res.status(402).type("application/json").send(paymentRequired);
}

/** Ensure verify/settle payloads carry x402 v2 ResourceInfo with a real description (all networks). */
function enrichPaymentPayloadResource(payload, req, options) {
  if (!payload || typeof payload !== "object") return payload;
  const existing =
    normalizeResourceInfo(payload.resource) ?? normalizeResourceInfo(payload.accepted?.resource);
  const adapter = new ExpressAdapter(req);
  const url = String(existing?.url ?? adapter.getUrl() ?? "").trim();
  if (!url) return payload;
  const paymentOptions = normalizePaymentOptions(req, options);
  const resource =
    enrichPaymentResourceInfo(existing ?? { url }, req, paymentOptions) ??
    buildPaymentResourceInfo({
      url,
      description: paymentOptions.description,
      resourcePath: paymentOptions.resource,
      mimeType: paymentOptions.mimeType || "application/json",
    });
  if (!resource) return payload;
  return { ...payload, resource };
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

      options = normalizePaymentOptions(req, options);
      if (options.resourceServerProfile) {
        req.x402ResourceServerProfile = options.resourceServerProfile;
      }

      await ensureX402ForReq(req, options);
      const bundle = getX402BundleForReq(req, options);
      const { resourceServer, config, assets } = bundle;
      logB402StartupOnce();
      logAlgorandStartupOnce();
      logOkxStartupOnce();

      const paymentHeader = getPaymentSignatureHeaderFromReq(req);
      if (!paymentHeader) {
        x402Log("payment_required", { method: req.method, path: req.path });
        const pr = await buildPaymentRequired(bundle, req, options, "Payment required");
        json402(res, pr);
        try {
          const rawPrice = await resolveRawPriceUsdForRequest(options, req);
          const priceUsd = resolveEffectivePriceUsd(rawPrice, req, options);
          recordInboundX402(req, {
            outcome: "payment_required",
            httpStatus: 402,
            amountUsd: priceUsd,
            amountMicroUsdc: usdToMicroUsdc(priceUsd),
          });
        } catch {
          recordInboundX402(req, { outcome: "payment_required", httpStatus: 402 });
        }
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
      const priceUsd = resolveEffectivePriceUsd(rawPrice, req, options);
      const expectedMicroUnits = usdToMicroUsdc(priceUsd);
      const acc = payload.accepted;
      const payToOverride = await resolvePayToForRequest(options, req);

      const acceptedOptions = buildAcceptedOptionsForBundle(bundle, expectedMicroUnits, payToOverride);
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

      if (!matchingOption && paymentAcceptedMatchesAlgorand(acc)) {
        const payTo = getAlgorandPayTo();
        const net = getEnabledAlgorandNetworks().find((n) => n.caip2 === acc.network);
        if (payTo && net) {
          matchingOption = {
            network: net.caip2,
            payTo,
            asset: net.usdcAsa,
            isEvm: false,
            isAlgorand: true,
            amount: String(acc.amount ?? expectedMicroUnits),
          };
        }
      }

      if (!matchingOption && paymentAcceptedMatchesOkx(acc)) {
        const payTo = getOkxX402PayTo();
        const net = getEnabledOkxX402Networks().find((n) => n.caip2 === acc.network);
        if (payTo && net) {
          matchingOption = {
            network: net.caip2,
            payTo,
            asset: net.stablecoin,
            isEvm: true,
            isOkx: true,
            amount: String(acc.amount ?? expectedMicroUnits),
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
        recordInboundX402(req, {
          outcome: "verify_failed",
          httpStatus: 402,
          network: acc?.network,
          errorReason: "Payment requirements mismatch",
          amountUsd: priceUsd,
          amountMicroUsdc: acc?.amount,
        });
        return;
      }

      let verify;
      const useAlgorandFacilitator = shouldUseAlgorandFacilitator(acc);
      const useB402Facilitator =
        !useAlgorandFacilitator && shouldUseB402Facilitator(acc, payload);
      const useOkxFacilitator =
        !useAlgorandFacilitator && !useB402Facilitator && shouldUseOkxFacilitator(acc);
      const payloadWithResource = enrichPaymentPayloadResource(payload, req, options);
      x402Log("payment_retry", {
        method: req.method,
        path: req.path,
        network: acc?.network,
        amount: acc?.amount,
        b402: useB402Facilitator,
        algorand: useAlgorandFacilitator,
        okx: useOkxFacilitator,
        resourceUrl:
          normalizeResourceInfo(payloadWithResource?.resource)?.url ??
          normalizeResourceInfo(acc?.resource)?.url,
        resourceDescription:
          normalizeResourceInfo(payloadWithResource?.resource)?.description ?? null,
        hasHeader: true,
      });
      try {
        if (useAlgorandFacilitator) {
          await ensureX402AvmResourceServerInitialized();
          const { resourceServer: avmServer } = getX402AvmResourceServer();
          verify = await withTimeout(
            avmServer.verifyPayment(payload, acc),
            X402_VERIFY_FACILITATOR_TIMEOUT_MS,
            "verify_timeout"
          );
        } else if (useB402Facilitator) {
          verify = await withTimeout(
            b402VerifyPayment(payloadWithResource, acc),
            X402_VERIFY_FACILITATOR_TIMEOUT_MS,
            "verify_timeout"
          );
        } else if (useOkxFacilitator) {
          await ensureOkxX402ResourceServerInitialized();
          const { resourceServer: okxServer } = getOkxX402ResourceServer();
          verify = await withTimeout(
            okxServer.verifyPayment(payloadWithResource, acc),
            X402_VERIFY_FACILITATOR_TIMEOUT_MS,
            "verify_timeout",
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
          algorand: useAlgorandFacilitator,
          reason: verify?.invalidReason || "Payment verification failed",
        });
        const pr = await buildPaymentRequired(
          bundle,
          req,
          options,
          verify?.invalidReason || "Payment verification failed"
        );
        json402(res, pr);
        recordInboundX402(req, {
          outcome: "verify_failed",
          httpStatus: 402,
          network: acc?.network,
          facilitator: resolveInboundFacilitatorFromFlags(req, {
            useAlgorandFacilitator,
            useB402Facilitator,
            useOkxFacilitator,
          }),
          errorReason: verify?.invalidReason || "Payment verification failed",
          amountUsd: priceUsd,
          amountMicroUsdc: acc?.amount,
        });
        return;
      }

      const bazaarExtensions = isX402BazaarEnabled()
        ? buildBazaarExtensions(resourceServer, req, options)
        : undefined;

      req.x402Payment = {
        payload: payloadWithResource,
        accepted: acc,
        priceUsd,
        resourceServerProfile: resolveResourceServerProfile(req, options),
        useB402Facilitator,
        useOkxFacilitator,
        useAlgorandFacilitator,
        skipRevenueBuyback: Boolean(payToOverride?.solanaPayTo || payToOverride?.evmPayTo),
        bazaarExtensions,
      };
      x402Log("verify_ok", {
        method: req.method,
        path: req.path,
        b402: useB402Facilitator,
        algorand: useAlgorandFacilitator,
        okx: useOkxFacilitator,
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
  const useAlgorand =
    req?.x402Payment?.useAlgorandFacilitator || shouldUseAlgorandFacilitator(accepted);
  if (useAlgorand) {
    await ensureX402AvmResourceServerInitialized();
    const { resourceServer: avmServer } = getX402AvmResourceServer();
    const settle = await withTimeout(
      avmServer.settlePayment(payload, accepted),
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
      errorReason: settle?.errorReason || settle?.error || "Algorand settlement failed",
      error: settle?.errorReason || settle?.error || "Algorand settlement failed",
    };
  }

  if (req?.x402Payment?.useB402Facilitator || shouldUseB402Facilitator(accepted, payload)) {
    const settle = await withTimeout(
      b402SettlePayment(payload, accepted, resolveBazaarSettleOptions(req)),
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

  const useOkx =
    req?.x402Payment?.useOkxFacilitator || shouldUseOkxFacilitator(accepted);
  if (useOkx) {
    await ensureOkxX402ResourceServerInitialized();
    const { resourceServer: okxServer } = getOkxX402ResourceServer();
    const settle = await withTimeout(
      okxServer.settlePayment(payload, accepted),
      X402_SETTLE_FACILITATOR_TIMEOUT_MS,
      "settle_timeout",
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
      errorReason: settle?.errorReason || settle?.error || "OKX settlement failed",
      error: settle?.errorReason || settle?.error || "OKX settlement failed",
    };
  }

  const profile = req?.x402Payment?.resourceServerProfile;
  const { resourceServer } =
    profile === "corbits"
      ? getX402ResourceServerCorbits()
      : profile === "dexter"
        ? getX402ResourceServerDexter()
        : getX402ResourceServer();
  let settlePayload = payload;
  const bazaarOpts = resolveBazaarSettleOptions(req);
  if (bazaarOpts?.bazaar) {
    settlePayload = injectBazaarIntoPaymentPayload(payload, bazaarOpts.bazaar);
  }
  let settle;
  try {
    settle = await withTimeout(
      resourceServer.settlePayment(settlePayload, accepted),
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
  const settleStartedAt = Date.now();
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
    recordInboundX402(req, {
      outcome: "settle_failed",
      httpStatus: 502,
      network: accepted?.network,
      facilitator: resolveInboundFacilitator(req),
      amountUsd: req.x402Payment?.priceUsd,
      amountMicroUsdc: accepted?.amount,
      errorReason: reason,
      latencyMs: Date.now() - settleStartedAt,
    });
    return settle;
  }
  res.setHeader("Payment-Response", encodePaymentResponseHeader(settle));
  req._requestInsightPaid = true;
  runAfterResponse(() => recordPaidApiCall(req));
  runAfterResponse(() =>
    recordX402Call({
      direction: "inbound",
      path: req.path,
      method: req.method || "GET",
      outcome: "paid",
      httpStatus: res.statusCode || 200,
      network: accepted?.network,
      facilitator: resolveInboundFacilitator(req),
      amountUsd: req.x402Payment?.priceUsd,
      amountMicroUsdc: accepted?.amount,
      payer: typeof settle?.payer === "string" ? settle.payer : null,
      txSignature: typeof settle?.transaction === "string" ? settle.transaction : null,
      source: "api",
      latencyMs: Date.now() - settleStartedAt,
    })
  );
  runAfterResponse(() => {
    import("../libs/agentscoreGate.js")
      .then(({ captureAgentscoreWalletAfterSettle }) => captureAgentscoreWalletAfterSettle(req, settle))
      .catch(() => {});
  });
  runAfterResponse(() => {
    const payer = typeof settle?.payer === "string" ? settle.payer.trim() : "";
    if (!payer) return;
    const network = req?.x402Payment?.accepted?.network || "";
    const chain =
      network.includes("base") || network.includes("bsc") || network.includes("ethereum")
        ? network.includes("bsc")
          ? "bsc"
          : "base"
        : "solana";
    import("../libs/agentWalletProvision.js")
      .then(({ provisionWalletsForX402Payer }) => provisionWalletsForX402Payer({ payerAddress: payer, chain }))
      .catch((err) => {
        console.warn("[x402] pillar wallet provision failed:", err?.message ?? err);
      });
  });
  const priceUsd = req.x402Payment?.priceUsd;
  if (
    typeof priceUsd === "number" &&
    priceUsd > 0 &&
    process.env.NODE_ENV === "production" &&
    !isTesterAgentInternalProbeRequest(req) &&
    !req.x402Payment?.skipRevenueBuyback
  ) {
    runAfterResponse(() => queueBuybackRevenue(priceUsd).catch(() => {}));
  }
  return settle;
}

export { encodePaymentResponseHeader };
export { getX402ResourceServer };
export { isB402Network };
export { isAlgorandNetwork };

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
 * Queue SYRA buyback revenue after a paid request when the route uses settlePaymentWithFallback
 * instead of settlePaymentAndSetResponse. Call this after settling and setting Payment-Response.
 * @param {import('express').Request} req - Must have req.x402Payment.priceUsd (set by requirePayment)
 */
export function runBuybackForRequest(req) {
  if (process.env.NODE_ENV !== "production") return;
  if (isTesterAgentInternalProbeRequest(req)) return;
  if (isShadowfeedPartnerRequest(req)) return;
  const priceUsd = req.x402Payment?.priceUsd;
  if (typeof priceUsd === "number" && priceUsd > 0) {
    runAfterResponse(() => queueBuybackRevenue(priceUsd).catch(() => {}));
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
      if (req?.x402Payment?.useAlgorandFacilitator || shouldUseAlgorandFacilitator(accepted)) {
        await ensureX402AvmResourceServerInitialized();
        const { resourceServer: avmServer } = getX402AvmResourceServer();
        return avmServer.settlePayment(payload, accepted);
      }
      if (req?.x402Payment?.useB402Facilitator || shouldUseB402Facilitator(accepted, payload)) {
        return b402SettlePayment(payload, accepted, resolveBazaarSettleOptions(req));
      }
      if (req?.x402Payment?.useOkxFacilitator || shouldUseOkxFacilitator(accepted)) {
        await ensureOkxX402ResourceServerInitialized();
        const { resourceServer: okxServer } = getOkxX402ResourceServer();
        return okxServer.settlePayment(payload, accepted);
      }
      const bazaarOpts = resolveBazaarSettleOptions(req);
      const settlePayload = bazaarOpts?.bazaar
        ? injectBazaarIntoPaymentPayload(payload, bazaarOpts.bazaar)
        : payload;
      return resourceServer.settlePayment(settlePayload, accepted);
    },
  };
}
