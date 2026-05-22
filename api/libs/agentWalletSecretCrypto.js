/**
 * Envelope encryption for AgentWallet.agentSecretKey at rest.
 * - Per-record random DEK (AES-256-GCM); DEK wrapped with master key from env (KMS-style operational pattern: keep master outside DB).
 * - As of v2 security upgrade (P0.1), encryption is MANDATORY: a missing master key now refuses to encrypt and the
 *   server refuses to boot (see assertAgentWalletSecretEncryptionConfigured() used in api/index.js).
 *
 * Env: AGENT_WALLET_SECRET_ENCRYPTION_KEY — 32 bytes as 64-char hex or base64.
 */
import crypto from 'crypto';

const PREFIX = 'enc:v1:';
const VERSION = 1;
const IV_LEN = 12;
const TAG_LEN = 16;
const DEK_LEN = 32;

/** @returns {Buffer | null} */
export function getAgentWalletSecretMasterKey() {
  const raw = process.env.AGENT_WALLET_SECRET_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === DEK_LEN) return buf;
  } catch {
    /* ignore */
  }
  return null;
}

export function isAgentWalletSecretEncryptionConfigured() {
  return getAgentWalletSecretMasterKey() != null;
}

/**
 * Boot-time assertion: refuses to start the server if encryption is not configured.
 * Required as of P0.1 — we never want to silently store plaintext private keys again.
 * @returns {void}
 * @throws {Error} when AGENT_WALLET_SECRET_ENCRYPTION_KEY is missing or malformed
 */
export function assertAgentWalletSecretEncryptionConfigured() {
  if (!isAgentWalletSecretEncryptionConfigured()) {
    throw new Error(
      'FATAL: AGENT_WALLET_SECRET_ENCRYPTION_KEY is missing or malformed. ' +
        'Refusing to start: agent wallet private keys must never be stored unencrypted. ' +
        'Set AGENT_WALLET_SECRET_ENCRYPTION_KEY to a 32-byte hex (64 chars) or base64 value.'
    );
  }
}

/**
 * @param {string} stored
 * @returns {boolean}
 */
export function isEncryptedAgentWalletSecret(stored) {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}

/**
 * Encrypt plaintext secret for DB storage. Refuses to operate if master key unset.
 * @param {string} plaintext
 * @returns {string}
 * @throws {Error} when master key missing or plaintext invalid
 */
export function encryptAgentSecretForStorage(plaintext) {
  if (plaintext == null || typeof plaintext !== 'string') {
    throw new Error('encryptAgentSecretForStorage: plaintext must be a string');
  }
  const masterKey = getAgentWalletSecretMasterKey();
  if (!masterKey) {
    throw new Error(
      'encryptAgentSecretForStorage: AGENT_WALLET_SECRET_ENCRYPTION_KEY is not set — refusing to store plaintext key'
    );
  }

  const dek = crypto.randomBytes(DEK_LEN);
  const ivWrap = crypto.randomBytes(IV_LEN);
  const wrapCipher = crypto.createCipheriv('aes-256-gcm', masterKey, ivWrap);
  const encDek = Buffer.concat([wrapCipher.update(dek), wrapCipher.final()]);
  const wrapTag = wrapCipher.getAuthTag();
  const wrapBlob = Buffer.concat([encDek, wrapTag]);

  const ivPay = crypto.randomBytes(IV_LEN);
  const payCipher = crypto.createCipheriv('aes-256-gcm', dek, ivPay);
  const encPay = Buffer.concat([payCipher.update(plaintext, 'utf8'), payCipher.final()]);
  const payTag = payCipher.getAuthTag();
  const payBlob = Buffer.concat([encPay, payTag]);

  const buf = Buffer.concat([
    Buffer.from([VERSION]),
    ivWrap,
    wrapBlob,
    ivPay,
    payBlob,
  ]);
  return PREFIX + buf.toString('base64');
}

/**
 * Decrypt DB value to the same plaintext string format as historically stored (Solana base58 / Base hex).
 * @param {string} stored
 * @returns {string}
 */
export function decryptAgentSecretFromStorage(stored) {
  if (stored == null || typeof stored !== 'string') {
    throw new Error('decryptAgentSecretFromStorage: invalid stored value');
  }
  if (!isEncryptedAgentWalletSecret(stored)) {
    return stored;
  }
  const masterKey = getAgentWalletSecretMasterKey();
  if (!masterKey) {
    throw new Error(
      'Encrypted agent wallet secrets are present but AGENT_WALLET_SECRET_ENCRYPTION_KEY is not set'
    );
  }

  const raw = Buffer.from(stored.slice(PREFIX.length), 'base64');
  if (raw.length < 1 + IV_LEN + DEK_LEN + TAG_LEN + IV_LEN + TAG_LEN) {
    throw new Error('decryptAgentSecretFromStorage: truncated ciphertext');
  }
  if (raw[0] !== VERSION) {
    throw new Error('decryptAgentSecretFromStorage: unsupported envelope version');
  }

  let o = 1;
  const ivWrap = raw.subarray(o, o + IV_LEN);
  o += IV_LEN;
  const wrapBlob = raw.subarray(o, o + DEK_LEN + TAG_LEN);
  o += DEK_LEN + TAG_LEN;
  const ivPay = raw.subarray(o, o + IV_LEN);
  o += IV_LEN;
  const payBlob = raw.subarray(o);

  const wrapCt = wrapBlob.subarray(0, DEK_LEN);
  const wrapTag = wrapBlob.subarray(DEK_LEN);
  const unwrap = crypto.createDecipheriv('aes-256-gcm', masterKey, ivWrap);
  unwrap.setAuthTag(wrapTag);
  const dek = Buffer.concat([unwrap.update(wrapCt), unwrap.final()]);

  const payTag = payBlob.subarray(payBlob.length - TAG_LEN);
  const payCt = payBlob.subarray(0, payBlob.length - TAG_LEN);
  const dec = crypto.createDecipheriv('aes-256-gcm', dek, ivPay);
  dec.setAuthTag(payTag);
  return Buffer.concat([dec.update(payCt), dec.final()]).toString('utf8');
}
