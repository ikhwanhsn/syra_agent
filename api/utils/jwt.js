/**
 * JWT issuance + verification.
 *
 * P1.7 implements asymmetric (RS256) tokens via `jose`. Until the ops team mints an RSA keypair,
 * the code falls back to symmetric HS256 with a server secret — still safe for short-lived access
 * tokens but rotate-once-a-week recommended.
 *
 * Tokens:
 *   - access:  15 minutes, audience `syra-agent-api`, used as Authorization: Bearer for state-changing routes.
 *   - refresh: 24 hours, single-family rotation, stored as httpOnly cookie `syra_refresh`.
 *
 * Family ID lets us revoke entire device families on a detected replay (refresh used twice).
 */
import crypto from 'node:crypto';
import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';

const ISSUER = 'syra-agent-api';
const AUDIENCE = 'syra-agent-api';
const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 24 * 60 * 60;

let _privateKeyPromise = null;
let _publicKeyPromise = null;

function getAlgo() {
  return process.env.JWT_PRIVATE_KEY_PEM ? 'RS256' : 'HS256';
}

function getHsSecret() {
  const raw = (process.env.JWT_HS_SECRET || process.env.RECEIPT_SECRET || '').trim();
  if (!raw || raw.length < 32) {
    throw new Error('JWT_HS_SECRET must be set to a value >= 32 chars');
  }
  return new TextEncoder().encode(raw);
}

async function getPrivateKey() {
  if (getAlgo() === 'HS256') return getHsSecret();
  if (!_privateKeyPromise) {
    _privateKeyPromise = importPKCS8(process.env.JWT_PRIVATE_KEY_PEM, 'RS256');
  }
  return _privateKeyPromise;
}

async function getPublicKey() {
  if (getAlgo() === 'HS256') return getHsSecret();
  if (!_publicKeyPromise) {
    const pem = process.env.JWT_PUBLIC_KEY_PEM || process.env.JWT_PRIVATE_KEY_PEM;
    if (!pem) throw new Error('JWT_PUBLIC_KEY_PEM must be set when JWT_PRIVATE_KEY_PEM is set');
    _publicKeyPromise = importSPKI(pem, 'RS256');
  }
  return _publicKeyPromise;
}

/**
 * @typedef {Object} SessionClaims
 * @property {string} sub        Connected user wallet address
 * @property {'solana'|'base'} chain
 * @property {string} aid        anonymousId of the agent wallet
 * @property {string} sid        session id
 * @property {string} fid        family id (refresh rotation)
 * @property {boolean=} guest
 */

/**
 * Issue an access token (short-lived, Bearer).
 * @param {SessionClaims} claims
 */
export async function signAccessToken(claims) {
  const key = await getPrivateKey();
  return new SignJWT({ ...claims, typ: 'access' })
    .setProtectedHeader({ alg: getAlgo(), typ: 'JWT' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .setJti(crypto.randomUUID())
    .sign(key);
}

/**
 * Issue a refresh token (httpOnly cookie).
 * @param {SessionClaims} claims
 */
export async function signRefreshToken(claims) {
  const key = await getPrivateKey();
  return new SignJWT({ ...claims, typ: 'refresh' })
    .setProtectedHeader({ alg: getAlgo(), typ: 'JWT' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SEC}s`)
    .setJti(crypto.randomUUID())
    .sign(key);
}

/**
 * Verify a token and return its payload, or throw.
 * @param {string} token
 * @param {'access'|'refresh'} expectedTyp
 */
export async function verifyToken(token, expectedTyp) {
  const key = await getPublicKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: '5s',
  });
  if (expectedTyp && payload.typ !== expectedTyp) {
    throw new Error(`unexpected_token_type:${payload.typ}`);
  }
  return /** @type {SessionClaims & { jti: string; typ: string }} */ (payload);
}

export const TOKEN_CONFIG = { ACCESS_TTL_SEC, REFRESH_TTL_SEC, ISSUER, AUDIENCE };
