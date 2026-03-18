/**
 * PayAI facilitator auth beyond free tier (1k settlements/mo).
 * @see https://docs.payai.network/x402/facilitators/authentication
 * @see https://docs.payai.network/x402/facilitators/pricing
 *
 * Set PAYAI_API_KEY_ID and PAYAI_API_KEY_SECRET (secret may include payai_sk_ prefix).
 * HTTPFacilitatorClient receives createAuthHeaders that adds Authorization: Bearer <jwt>.
 */

import crypto from "node:crypto";

const JWT_TTL_SEC = 120;
const REFRESH_BEFORE_EXPIRY_SEC = 30;

function base64UrlEncode(data) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlEncodeString(str) {
  return base64UrlEncode(Buffer.from(str, "utf8"));
}

function normalizeSecret(secret) {
  const s = String(secret || "").trim();
  return s.startsWith("payai_sk_") ? s.slice("payai_sk_".length) : s;
}

/**
 * @param {string} apiKeyId
 * @param {string} apiKeySecretBase64 - PKCS#8 DER Ed25519, base64 (optional payai_sk_ prefix)
 * @returns {Promise<string>} JWT
 */
export async function generatePayAiJwt(apiKeyId, apiKeySecretBase64) {
  const now = Math.floor(Date.now() / 1000);
  const header = JSON.stringify({
    alg: "EdDSA",
    typ: "JWT",
    kid: apiKeyId,
  });
  const payload = JSON.stringify({
    sub: apiKeyId,
    iss: "payai-merchant",
    iat: now,
    exp: now + JWT_TTL_SEC,
    jti: crypto.randomUUID(),
  });

  const headerB64 = base64UrlEncodeString(header);
  const payloadB64 = base64UrlEncodeString(payload);
  const message = `${headerB64}.${payloadB64}`;

  const keyDer = Buffer.from(normalizeSecret(apiKeySecretBase64), "base64");
  const privateKey = crypto.createPrivateKey({
    key: keyDer,
    format: "der",
    type: "pkcs8",
  });

  const signature = crypto.sign(null, Buffer.from(message, "utf8"), privateKey);
  return `${message}.${base64UrlEncode(signature)}`;
}

/**
 * Returns async factory for HTTPFacilitatorClient: createAuthHeaders callback.
 * Caches JWT until ~30s before expiry to avoid signing every request.
 *
 * @param {string} apiKeyId
 * @param {string} apiKeySecret
 * @returns {() => Promise<Record<string, Record<string, string>>>}
 */
export function createPayAiFacilitatorAuthHeaders(apiKeyId, apiKeySecret) {
  let cachedJwt = "";
  let cachedExp = 0;

  return async function payAiCreateAuthHeaders() {
    const now = Math.floor(Date.now() / 1000);
    if (!cachedJwt || now >= cachedExp - REFRESH_BEFORE_EXPIRY_SEC) {
      cachedJwt = await generatePayAiJwt(apiKeyId, apiKeySecret);
      cachedExp = now + JWT_TTL_SEC;
    }
    const auth = { Authorization: `Bearer ${cachedJwt}` };
    return {
      verify: auth,
      settle: auth,
      supported: auth,
    };
  };
}
