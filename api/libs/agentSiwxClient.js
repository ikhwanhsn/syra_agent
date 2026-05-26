/**
 * SIWX (Sign-In With X) helpers for x402-protected polling endpoints (e.g. StableSocial /api/jobs).
 * Uses @x402/extensions/sign-in-with-x — same stack as agentcash.
 */
import nacl from 'tweetnacl';
import { createSIWxPayload, encodeSIWxHeader } from '@x402/extensions/sign-in-with-x';

const SIGN_IN_WITH_X = 'SIGN-IN-WITH-X';

/**
 * Adapt a Solana Keypair to the SIWX Solana signer interface.
 * @param {import('@solana/web3.js').Keypair} keypair
 */
export function keypairToSiwxSigner(keypair) {
  return {
    publicKey: keypair.publicKey,
    address: keypair.publicKey.toBase58(),
    signMessage(messageBytes) {
      return nacl.sign.detached(messageBytes, keypair.secretKey);
    },
  };
}

/**
 * Parse sign-in-with-x challenge from a 401/402/403 response body.
 * @param {unknown} body
 * @returns {Record<string, unknown> | null}
 */
export function parseSiwxServerInfo(body) {
  if (!body || typeof body !== 'object') return null;
  const ext = /** @type {Record<string, unknown>} */ (body).extensions;
  if (!ext || typeof ext !== 'object') return null;
  const siwx = /** @type {Record<string, unknown>} */ (ext)['sign-in-with-x'];
  if (!siwx || typeof siwx !== 'object') return null;
  const info = /** @type {Record<string, unknown>} */ (siwx).info;
  return info && typeof info === 'object' ? info : null;
}

/**
 * Build SIGN-IN-WITH-X header value for a jobs URL challenge.
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {Record<string, unknown>} serverInfo — from extensions['sign-in-with-x'].info
 */
export async function buildSiwxHeader(keypair, serverInfo) {
  const signer = keypairToSiwxSigner(keypair);
  const payload = await createSIWxPayload(
    /** @type {import('@x402/extensions/sign-in-with-x').SIWxServerExtension} */ (
      /** @type {unknown} */ (serverInfo)
    ),
    signer
  );
  return encodeSIWxHeader(payload);
}

/**
 * GET with SIWX: fetches challenge if needed, signs, retries with SIGN-IN-WITH-X.
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {string} url
 * @param {RequestInit} [init]
 */
export async function fetchWithSiwx(keypair, url, init = {}) {
  const baseHeaders = {
    Accept: 'application/json',
    ...(init.headers && typeof init.headers === 'object' ? init.headers : {}),
  };

  let res = await fetch(url, { ...init, method: init.method || 'GET', headers: baseHeaders });
  let data = await res.json().catch(() => ({}));

  const needsAuth =
    res.status === 401 ||
    res.status === 403 ||
    (res.headers.get('payment-required') && parseSiwxServerInfo(data));

  let serverInfo = parseSiwxServerInfo(data);
  if (!serverInfo && needsAuth) {
    res = await fetch(url, { ...init, method: 'GET', headers: baseHeaders });
    data = await res.json().catch(() => ({}));
    serverInfo = parseSiwxServerInfo(data);
  }

  if (!serverInfo) {
    return { ok: res.ok, status: res.status, data };
  }

  const siwxHeader = await buildSiwxHeader(keypair, serverInfo);
  const authHeaders = {
    ...baseHeaders,
    [SIGN_IN_WITH_X]: siwxHeader,
  };
  res = await fetch(url, { ...init, method: init.method || 'GET', headers: authHeaders });
  data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
