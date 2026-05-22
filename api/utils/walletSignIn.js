/**
 * Sign-In-With-Solana (SIWS) and Sign-In-With-Ethereum (SIWE) verifier.
 *
 * Used by:
 *  - POST /agent/auth/sign-in  (initial session issuance)
 *  - POST /agent/wallet/intent/:id/confirm (per-intent confirmation)
 *
 * Nonce store: in-memory with 5-minute TTL. P1.7 upgrades this to Redis when SYRA_REDIS_URL is set.
 *
 * Domain binding: the signed message includes the API host so a signature from another origin
 * cannot be replayed against Syra.
 */
import crypto from 'node:crypto';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { getAddress, verifyMessage as evmVerifyMessage } from 'viem';

const NONCE_TTL_MS = 5 * 60 * 1000;
const _nonces = new Map(); // nonce -> { expiresAt, used }
const _cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _nonces.entries()) {
    if (v.expiresAt < now) _nonces.delete(k);
  }
}, 60_000);
_cleanupTimer.unref?.();

/**
 * Issue a fresh nonce. Single-use, expires in 5 min.
 * @returns {string}
 */
export function issueNonce() {
  const n = crypto.randomBytes(16).toString('hex');
  _nonces.set(n, { expiresAt: Date.now() + NONCE_TTL_MS, used: false });
  return n;
}

/**
 * Mark a nonce as used. Returns true iff the nonce was valid and unused.
 * @param {string} nonce
 */
function consumeNonce(nonce) {
  const row = _nonces.get(nonce);
  if (!row) return false;
  if (row.used) return false;
  if (row.expiresAt < Date.now()) {
    _nonces.delete(nonce);
    return false;
  }
  row.used = true;
  return true;
}

/**
 * Standard Syra sign-in message template. Locked to a single format so we can re-derive client-side.
 *
 * @param {Object} input
 * @param {string} input.domain       e.g. "api.syraa.fun"
 * @param {string} input.address      base58 (Solana) or 0x (EVM)
 * @param {string} input.nonce
 * @param {string=} input.statement
 * @param {string=} input.purpose     "sign-in" | "confirm-intent:<intentId>" | etc.
 * @returns {string}
 */
export function buildSignInMessage({ domain, address, nonce, statement, purpose = 'sign-in' }) {
  const lines = [
    `${domain} wants you to sign in to Syra with your wallet:`,
    address,
    '',
    statement || 'I authorize this session for Syra.',
    '',
    `Purpose: ${purpose}`,
    `Nonce: ${nonce}`,
    `Issued: ${new Date().toISOString()}`,
  ];
  return lines.join('\n');
}

/**
 * Verify a Solana SIWS signature (Ed25519).
 *
 * @param {Object} input
 * @param {string} input.address    base58 pubkey
 * @param {string} input.message    UTF-8 string the user signed
 * @param {string} input.signature  base58 64-byte signature
 * @returns {boolean}
 */
export function verifySolanaSignature({ address, message, signature }) {
  try {
    const pubkey = bs58.decode(address);
    const sig = bs58.decode(signature);
    if (pubkey.length !== 32 || sig.length !== 64) return false;
    const msgBytes = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msgBytes, sig, pubkey);
  } catch {
    return false;
  }
}

/**
 * Verify an EVM SIWE signature.
 *
 * @param {Object} input
 * @param {string} input.address    0x address
 * @param {string} input.message    UTF-8 string the user signed
 * @param {string} input.signature  hex signature
 * @returns {Promise<boolean>}
 */
export async function verifyEvmSignature({ address, message, signature }) {
  try {
    const checksum = getAddress(address);
    return await evmVerifyMessage({ address: checksum, message, signature });
  } catch {
    return false;
  }
}

/**
 * Verify a sign-in / intent message and consume its nonce. Returns the verified address (or null).
 *
 * @param {Object} input
 * @param {string} input.message
 * @param {string} input.signature
 * @param {'solana'|'base'} input.chain
 * @param {string} input.expectedDomain
 * @param {string} input.expectedPurpose
 */
export async function verifySignInMessage(input) {
  const lines = input.message.split('\n');
  if (lines.length < 8) return { ok: false, reason: 'bad_format' };
  if (!lines[0].startsWith(`${input.expectedDomain} wants you to sign in to Syra`)) {
    return { ok: false, reason: 'domain_mismatch' };
  }
  const address = lines[1].trim();
  const purposeLine = lines.find((l) => l.startsWith('Purpose: '));
  const nonceLine = lines.find((l) => l.startsWith('Nonce: '));
  if (!purposeLine || !nonceLine) return { ok: false, reason: 'missing_fields' };
  const purpose = purposeLine.slice('Purpose: '.length).trim();
  if (purpose !== input.expectedPurpose) return { ok: false, reason: 'purpose_mismatch' };
  const nonce = nonceLine.slice('Nonce: '.length).trim();
  if (!consumeNonce(nonce)) return { ok: false, reason: 'nonce_invalid_or_used' };

  let ok = false;
  if (input.chain === 'solana') {
    ok = verifySolanaSignature({ address, message: input.message, signature: input.signature });
  } else if (input.chain === 'base') {
    ok = await verifyEvmSignature({ address, message: input.message, signature: input.signature });
  }
  if (!ok) return { ok: false, reason: 'signature_invalid' };
  return { ok: true, address };
}
