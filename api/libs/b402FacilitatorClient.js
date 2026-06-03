/**
 * Binance B402 (OnchainPay x402) facilitator adapter.
 * Auth: X-Tesla-* headers with RSA-SHA256 over (rawJsonBody + timestampMs).
 * @see https://developers.binance.com/docs/onchainpay-x402/basics
 */
import crypto from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PRIVATE_KEY_FILE = path.resolve(__dirname, "../.keys/b402_private.pem");

function env(name) {
  return String(process.env[name] || "").trim();
}

function truthy(name) {
  const s = env(name).toLowerCase();
  return s === "true" || s === "1";
}

function isB402Debug() {
  return truthy("B402_DEBUG") || truthy("X402_DEBUG");
}

function b402Log(event, detail) {
  if (!isB402Debug() && event !== "verify_failed" && event !== "settle_failed" && event !== "http_error") {
    return;
  }
  const line = detail && typeof detail === "object" ? JSON.stringify(detail) : String(detail ?? "");
  console.log(`[b402] ${event}${line ? ` ${line}` : ""}`);
}

/** @returns {number | null} RSA modulus length of the configured private key. */
export function getB402PrivateKeyModulusBits() {
  const pem = loadPrivateKeyPem();
  if (!pem) return null;
  try {
    return crypto.createPrivateKey(pem).asymmetricKeyDetails?.modulusLength ?? null;
  } catch {
    return null;
  }
}

/**
 * B402 Tesla signing expects a 1024-bit RSA key (128-byte signatures).
 * @returns {{ ok: boolean, error?: string, modulusBits?: number | null }}
 */
export function validateB402SigningKey() {
  const bits = getB402PrivateKeyModulusBits();
  if (!bits) {
    return { ok: false, error: "B402 private key missing or invalid", modulusBits: bits };
  }
  if (bits !== B402_REQUIRED_RSA_BITS) {
    return {
      ok: false,
      modulusBits: bits,
      error:
        `B402 requires a ${B402_REQUIRED_RSA_BITS}-bit RSA private key (signature ${B402_REQUIRED_RSA_BITS / 8} bytes); configured key is ${bits}-bit. ` +
        "Use the 1024-bit key registered with Binance, or run `node api/scripts/generateB402Keypair.js`, register the new public key, and set B402_PRIVATE_KEY_FILE.",
    };
  }
  return { ok: true, modulusBits: bits };
}

/** Credentials present (402 offers). Does not validate RSA key size. */
export function hasB402MerchantCredentials() {
  return (
    truthy("X402_B402_ENABLED") &&
    Boolean(env("B402_CLIENT_ID")) &&
    Boolean(env("B402_ACCESS_TOKEN")) &&
    Boolean(loadPrivateKeyPem())
  );
}

/** Ready for /supported, /verify, /settle (includes 1024-bit RSA key check). */
export function isB402Configured() {
  return hasB402MerchantCredentials() && validateB402SigningKey().ok;
}

function loadPrivateKeyPem() {
  const fallbackSyra =
    process.env.USERPROFILE || process.env.HOME
      ? path.join(process.env.USERPROFILE || process.env.HOME, ".syra", "qa-api-rsa", "private.pem")
      : "";
  const fromFile =
    env("B402_PRIVATE_KEY_FILE") ||
    (fallbackSyra && existsSync(fallbackSyra) ? fallbackSyra : "") ||
    DEFAULT_PRIVATE_KEY_FILE;
  if (existsSync(fromFile)) {
    try {
      const pem = readFileSync(fromFile, "utf8").trim();
      if (pem.includes("BEGIN")) return pem;
    } catch {
      /* fall through */
    }
  }

  const pem = env("B402_PRIVATE_KEY_PEM");
  if (pem) {
    if (pem.includes("BEGIN")) {
      return pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
    }
    // Single-line base64 PKCS#8 body (no PEM headers) — common in .env
    try {
      const der = Buffer.from(pem.replace(/\s/g, ""), "base64");
      const keyObject = crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" });
      return keyObject.export({ type: "pkcs8", format: "pem" });
    } catch {
      /* fall through to B64 env */
    }
  }

  const b64 = env("B402_PRIVATE_KEY_B64");
  if (!b64) return "";
  try {
    const der = Buffer.from(b64.replace(/\s/g, ""), "base64");
    const keyObject = crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" });
    return keyObject.export({ type: "pkcs8", format: "pem" });
  } catch {
    return "";
  }
}

/**
 * @param {string} bodyJson - Exact JSON string sent as request body
 * @param {string} timestampMs
 */
export function signTeslaPayload(bodyJson, timestampMs) {
  const pem = loadPrivateKeyPem();
  if (!pem) {
    throw new Error("B402 private key not configured (B402_PRIVATE_KEY_PEM or B402_PRIVATE_KEY_B64)");
  }
  const payload = `${bodyJson}${timestampMs}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(payload, "utf8");
  signer.end();
  return signer.sign(pem, "base64");
}

/**
 * @param {string} bodyJson
 * @returns {Record<string, string>}
 */
export function buildTeslaHeaders(bodyJson) {
  const clientId = env("B402_CLIENT_ID");
  const accessToken = env("B402_ACCESS_TOKEN");
  if (!clientId || !accessToken) {
    throw new Error("B402_CLIENT_ID and B402_ACCESS_TOKEN are required");
  }
  const timestamp = String(Date.now());
  const signature = signTeslaPayload(bodyJson, timestamp);
  return {
    "Content-Type": "application/json",
    "X-Tesla-ClientId": clientId,
    "X-Tesla-SignAccessToken": accessToken,
    "X-Tesla-Timestamp": timestamp,
    "X-Tesla-Signature": signature,
  };
}

/** Onboarding base URL (see Binance docs). cb.binanceapi.com is not the B402 host and returns CloudFront 403 HTML. */
const DEFAULT_BASE = "https://api.commonservice.io";
const B402_REQUIRED_RSA_BITS = 1024;
const BSC_RPC = env("BSC_RPC_URL") || "https://bsc-rpc.publicnode.com";

function normalizeHexAddress(addr) {
  const a = String(addr || "").trim().toLowerCase();
  if (!a.startsWith("0x") || a.length !== 42) return null;
  return a;
}

/** @returns {Promise<bigint | null>} */
async function getErc20BalanceWei(holder, token) {
  const holderHex = normalizeHexAddress(holder);
  const tokenHex = normalizeHexAddress(token);
  if (!holderHex || !tokenHex) return null;
  const data = `0x70a08231${holderHex.slice(2).padStart(64, "0")}`;
  try {
    const res = await fetch(BSC_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: tokenHex, data }, "latest"],
      }),
    });
    const json = await res.json();
    if (!json?.result) return null;
    return BigInt(json.result);
  } catch {
    return null;
  }
}

/**
 * @param {string} reason
 * @param {{ payer?: string, asset?: string, required?: string }} ctx
 */
function humanizeB402SettleFailure(reason, ctx = {}) {
  const r = String(reason || "").trim();
  if (r === "invalid_transaction_state") {
    const payer = ctx.payer ? ` (${ctx.payer})` : "";
    const asset = ctx.asset ? ` on token ${ctx.asset}` : "";
    return (
      `On-chain B402 transfer failed${payer}${asset}. ` +
      `Fund the wallet with enough USD1 (or U) on BSC mainnet, then pay again with a new signature. ` +
      `Do not reuse an old payment header.`
    );
  }
  return r || "B402 settle failed";
}
const VERIFY_TIMEOUT_MS = Number.parseInt(process.env.B402_VERIFY_TIMEOUT_MS || "15000", 10);
const SETTLE_TIMEOUT_MS = Number.parseInt(process.env.B402_SETTLE_TIMEOUT_MS || "60000", 10);

let supportedCache = null;
let supportedCacheAt = 0;
const SUPPORTED_TTL_MS = Number.parseInt(process.env.B402_SUPPORTED_CACHE_MS || "3600000", 10);

/**
 * @param {unknown} json
 * @returns {{ success: boolean, data?: unknown, error?: string, code?: string }}
 */
function normalizeB402Response(json) {
  if (!json || typeof json !== "object") {
    return { success: false, error: "Invalid B402 response" };
  }
  const code = String(json.code ?? "");
  const message = String(json.message ?? json.msg ?? "");
  if (code && code !== "000000") {
    return { success: false, error: message || `B402 error ${code}`, code };
  }
  return { success: true, data: json.data ?? json };
}

/**
 * @param {string} path
 * @param {object} bodyObj
 * @param {number} timeoutMs
 */
async function b402Post(path, bodyObj, timeoutMs) {
  const base = env("B402_BASE_URL") || DEFAULT_BASE;
  const bodyJson = JSON.stringify(bodyObj ?? {});
  const url = `${base.replace(/\/$/, "")}${path}`;
  const headers = buildTeslaHeaders(bodyJson);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: bodyJson,
      signal: controller.signal,
    });
    const text = await res.text();
    let parsed;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      const plain = String(text || "").trim();
      if (/cloudfront|could not be satisfied|request blocked/i.test(plain)) {
        return {
          success: false,
          error:
            `B402 endpoint blocked (${res.status}). Set B402_BASE_URL to the URL from Binance onboarding (typically https://api.commonservice.io), not cb.binanceapi.com.`,
        };
      }
      if (/signature invalid/i.test(plain)) {
        return {
          success: false,
          error:
            `${plain} — ensure api/.keys/b402_private.pem matches the public key registered with Binance (run scripts/restoreB402RegisteredKey.js).`,
        };
      }
      if (/bad signature length|expecting 128/i.test(plain)) {
        const bits = getB402PrivateKeyModulusBits();
        return {
          success: false,
          error:
            plain +
            (bits
              ? ` — use a ${B402_REQUIRED_RSA_BITS}-bit RSA private key (yours is ${bits}-bit).`
              : ""),
        };
      }
      return {
        success: false,
        error: plain ? plain.slice(0, 500) : `B402 non-JSON response (${res.status})`,
      };
    }
    const norm = normalizeB402Response(parsed);
    if (!res.ok || isB402Debug()) {
      b402Log(res.ok ? "http_ok" : "http_error", {
        path,
        status: res.status,
        code: parsed?.code,
        message: parsed?.message ?? parsed?.msg,
        invalidReason: parsed?.data?.invalidReason ?? parsed?.data?.reason,
      });
    }
    if (!res.ok && norm.success) {
      return { success: false, error: messageFromHttp(res.status, parsed), code: parsed?.code };
    }
    if (!res.ok) {
      return {
        success: false,
        error: norm.error || messageFromHttp(res.status, parsed),
        code: norm.code ?? parsed?.code,
      };
    }
    return norm;
  } catch (e) {
    const msg = e?.name === "AbortError" ? "B402 request timeout" : e?.message || "B402 request failed";
    console.error("[b402]", path, msg);
    return { success: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

function messageFromHttp(status, parsed) {
  const m = parsed?.message ?? parsed?.msg;
  return m ? String(m) : `B402 HTTP ${status}`;
}

/**
 * POST /papi/v2/b402/supported — cached ~1h by default.
 */
export async function getSupported({ forceRefresh = false } = {}) {
  const keyCheck = validateB402SigningKey();
  if (!keyCheck.ok) {
    return { success: false, error: keyCheck.error };
  }
  const now = Date.now();
  if (!forceRefresh && supportedCache && now - supportedCacheAt < SUPPORTED_TTL_MS) {
    return { success: true, data: supportedCache };
  }
  const result = await b402Post("/papi/v2/b402/supported", {}, VERIFY_TIMEOUT_MS);
  if (result.success && result.data) {
    supportedCache = result.data;
    supportedCacheAt = now;
  }
  return result;
}

/**
 * x402 v2 ResourceInfo — object with url (not a bare URL string in `accepted`).
 * @param {unknown} resource
 * @returns {{ url: string, description?: string, mimeType?: string } | undefined}
 */
/** B402 JSON omits null fields (e.g. spenderAddress for eip3009). */
function sanitizeB402Extra(extra) {
  if (!extra || typeof extra !== "object") return extra;
  const out = { ...extra };
  if (out.spenderAddress == null) delete out.spenderAddress;
  // B402 /supported uses flat name+version; nested eip712 confuses verify/settle.
  delete out.eip712;
  return out;
}

/**
 * settleAmount is only valid for permit2-upto (Binance docs). Omit for eip3009 / permit2-exact.
 * @param {object} [accepted]
 * @returns {string | undefined}
 */
export function resolveB402SettleAmount(accepted) {
  if (!accepted || typeof accepted !== "object") return undefined;
  const method = String(accepted.extra?.assetTransferMethod || "").trim();
  if (method === "permit2-upto" || accepted.scheme === "upto") {
    const amt = accepted.amount;
    return amt != null && String(amt).trim() !== "" ? String(amt) : undefined;
  }
  return undefined;
}

export function normalizeResourceInfo(resource) {
  if (!resource) return undefined;
  if (typeof resource === "object" && resource !== null && resource.url) {
    const out = { url: String(resource.url).trim() };
    if (resource.description) out.description = String(resource.description);
    if (resource.mimeType) out.mimeType = String(resource.mimeType);
    return out.url ? out : undefined;
  }
  if (typeof resource === "string" && resource.trim()) {
    return { url: resource.trim() };
  }
  return undefined;
}

/**
 * Build paymentRequirements for B402 verify/settle from decoded x402 payment + accepted option.
 * @param {object} decoded - decodePaymentSignatureHeader result
 * @param {object} accepted - payload.accepted
 */
export function buildPaymentRequirementsForB402(decoded, accepted) {
  const acc = accepted && typeof accepted === "object" ? accepted : decoded?.accepted;
  if (!acc || typeof acc !== "object") {
    throw new Error("Missing accepted payment requirements for B402");
  }
  const extra =
    acc.extra && typeof acc.extra === "object"
      ? { ...acc.extra }
      : decoded?.accepted?.extra && typeof decoded.accepted.extra === "object"
        ? { ...decoded.accepted.extra }
        : {};
  const req = {
    scheme: acc.scheme ?? "exact",
    network: acc.network,
    amount: String(acc.amount ?? ""),
    asset: acc.asset,
    payTo: acc.payTo,
    maxTimeoutSeconds: acc.maxTimeoutSeconds ?? 300,
    extra: sanitizeB402Extra(extra),
  };
  const resource =
    normalizeResourceInfo(decoded?.resource) ?? normalizeResourceInfo(acc.resource);
  if (resource) req.resource = resource;
  return req;
}

/**
 * Build B402 paymentPayload from decoded PAYMENT-SIGNATURE header.
 * @param {object} decoded
 */
export function buildPaymentPayloadForB402(decoded) {
  if (!decoded || typeof decoded !== "object") {
    throw new Error("Invalid payment payload for B402");
  }
  const accepted =
    decoded.accepted && typeof decoded.accepted === "object"
      ? { ...decoded.accepted }
      : decoded.accepted;
  if (accepted && typeof accepted === "object") {
    if ("resource" in accepted) delete accepted.resource;
    if (accepted.extra && typeof accepted.extra === "object") {
      accepted.extra = sanitizeB402Extra(accepted.extra);
    }
  }
  const out = {
    x402Version: decoded.x402Version ?? 2,
    accepted,
    payload: decoded.payload,
  };
  const resource =
    normalizeResourceInfo(decoded.resource) ??
    normalizeResourceInfo(decoded.accepted?.resource);
  if (resource) out.resource = resource;
  if (decoded.extensions) out.extensions = decoded.extensions;
  return out;
}

/**
 * @param {object} decoded - Full decoded PAYMENT-SIGNATURE
 * @param {object} [acceptedOverride]
 */
export async function verifyPayment(decoded, acceptedOverride) {
  const accepted = acceptedOverride ?? decoded?.accepted;
  const paymentPayload = buildPaymentPayloadForB402(decoded);
  const paymentRequirements = buildPaymentRequirementsForB402(decoded, accepted);
  const body = {
    x402Version: 2,
    paymentPayload,
    paymentRequirements,
  };
  b402Log("verify_request", {
    network: accepted?.network,
    amount: accepted?.amount,
    resourceUrl: paymentPayload?.resource?.url ?? paymentRequirements?.resource?.url,
    asset: accepted?.asset,
    extraName: accepted?.extra?.name,
  });
  const result = await b402Post("/papi/v2/b402/verify", body, VERIFY_TIMEOUT_MS);
  if (!result.success) {
    b402Log("verify_failed", { reason: result.error, code: result.code });
    return { isValid: false, invalidReason: result.error };
  }
  const data = result.data && typeof result.data === "object" ? result.data : {};
  const valid =
    data.isValid === true ||
    data.valid === true ||
    data.verified === true ||
    data.success === true;
  if (valid) {
    b402Log("verify_ok", { payer: data.payer ?? data.from });
    return { isValid: true, payer: data.payer ?? data.from };
  }
  const invalidReason =
    data.invalidReason ?? data.reason ?? data.errorMessage ?? data.message ?? "B402 verify rejected";
  b402Log("verify_failed", {
    invalidReason,
    invalidMessage: data.invalidMessage,
    data,
  });
  return {
    isValid: false,
    invalidReason,
  };
}

/**
 * @param {object} decoded
 * @param {object} [acceptedOverride]
 * @param {string} [settleAmount] - For permit2-upto only
 */
export async function settlePayment(decoded, acceptedOverride, settleAmount) {
  const keyCheck = validateB402SigningKey();
  if (!keyCheck.ok) {
    return { success: false, errorReason: keyCheck.error };
  }
  const accepted = acceptedOverride ?? decoded?.accepted;
  const paymentPayload = buildPaymentPayloadForB402(decoded);
  const paymentRequirements = buildPaymentRequirementsForB402(decoded, accepted);
  const auth = paymentPayload?.payload?.authorization;
  if (auth?.from && accepted?.asset && auth?.value != null) {
    let need;
    try {
      need = BigInt(String(auth.value));
    } catch {
      need = null;
    }
    if (need != null && need > 0n) {
      const balance = await getErc20BalanceWei(auth.from, accepted.asset);
      if (balance != null && balance < need) {
        const msg = humanizeB402SettleFailure("invalid_transaction_state", {
          payer: auth.from,
          asset: accepted.asset,
        });
        b402Log("settle_failed", {
          errorReason: "insufficient_token_balance",
          payer: auth.from,
          balance: balance.toString(),
          required: String(auth.value),
        });
        return { success: false, errorReason: msg, error: msg };
      }
    }
  }
  const body = {
    x402Version: 2,
    paymentPayload,
    paymentRequirements,
  };
  const resolvedSettleAmount = resolveB402SettleAmount(accepted);
  if (resolvedSettleAmount) {
    body.settleAmount = resolvedSettleAmount;
  }
  const result = await b402Post("/papi/v2/b402/settle", body, SETTLE_TIMEOUT_MS);
  if (!result.success) {
    b402Log("settle_failed", { reason: result.error, code: result.code });
    return { success: false, errorReason: result.error };
  }
  const data = result.data && typeof result.data === "object" ? result.data : {};
  const ok = data.success === true || Boolean(data.transaction);
  if (ok) {
    b402Log("settle_ok", { tx: data.transaction ?? data.txHash ?? data.hash });
  } else {
    b402Log("settle_failed", {
      errorReason: data.errorReason ?? data.error ?? data.message,
      data,
    });
  }
  const failReason = data.errorReason ?? data.error ?? data.reason ?? data.message;
  const payer = data.payer ?? auth?.from;
  const friendly = ok
    ? undefined
    : humanizeB402SettleFailure(failReason, { payer, asset: accepted?.asset });
  return {
    success: ok,
    payer,
    transaction: data.transaction ?? data.txHash ?? data.hash,
    network: data.network ?? accepted?.network,
    errorReason: friendly || "B402 settle failed",
    error: friendly || "B402 settle failed",
  };
}

/** Clear cached /supported (tests). */
export function clearB402SupportedCache() {
  supportedCache = null;
  supportedCacheAt = 0;
}
