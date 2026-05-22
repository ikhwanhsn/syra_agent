/**
 * Privy Server Wallets adapter.
 *
 * Custody mode is selected per-wallet via AgentWallet.custody:
 *   - 'legacy'      → keys live encrypted in MongoDB (P0 path; signing via getAgentKeypair)
 *   - 'privy'       → keys live in Privy's TEE; we hold only privyWalletId + public address
 *   - 'retired'     → wallet is retired (after sweep migration); no signing allowed
 *
 * Env:
 *   PRIVY_APP_ID         (required for privy mode)
 *   PRIVY_APP_SECRET     (required for privy mode)
 *   PRIVY_BASE_URL       (default: https://auth.privy.io)
 *   PRIVY_DEFAULT_POLICY (optional policy id assigned to new wallets)
 *   SYRA_CUSTODY_MODE    ('privy' | 'legacy', default 'legacy' until ops cuts over)
 *
 * NOTE: this module is the SOLE module allowed to talk to Privy. The broker uses these named
 * exports; no other code in the repo should import the privy SDK directly.
 */
import crypto from 'node:crypto';

const PRIVY_BASE = (process.env.PRIVY_BASE_URL || 'https://auth.privy.io').replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 12_000;

function getPrivyAuthHeader() {
  const appId = (process.env.PRIVY_APP_ID || '').trim();
  const appSecret = (process.env.PRIVY_APP_SECRET || '').trim();
  if (!appId || !appSecret) return null;
  const basic = Buffer.from(`${appId}:${appSecret}`).toString('base64');
  return {
    Authorization: `Basic ${basic}`,
    'privy-app-id': appId,
    'Content-Type': 'application/json',
  };
}

/**
 * @returns {boolean}
 */
export function isPrivyConfigured() {
  return getPrivyAuthHeader() !== null;
}

/**
 * @returns {'privy'|'legacy'}
 */
export function getDefaultCustodyMode() {
  const m = String(process.env.SYRA_CUSTODY_MODE || 'legacy').toLowerCase().trim();
  return m === 'privy' && isPrivyConfigured() ? 'privy' : 'legacy';
}

async function privyFetch(path, options = {}) {
  const headers = getPrivyAuthHeader();
  if (!headers) throw new Error('privy_not_configured');
  const url = `${PRIVY_BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: { ...headers, ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) {
      const msg = (body && (body.error || body.message)) || `privy_http_${res.status}`;
      const err = new Error(String(msg));
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Provision a new Privy server wallet for a user.
 *
 * @param {Object} input
 * @param {'solana'|'base'} input.chain
 * @param {string} input.anonymousId
 * @returns {Promise<{ privyWalletId: string; agentAddress: string }>}
 */
export async function createPrivyServerWallet({ chain, anonymousId }) {
  if (!isPrivyConfigured()) throw new Error('privy_not_configured');
  const chainType = chain === 'base' ? 'ethereum' : 'solana';
  const body = {
    chain_type: chainType,
    ...(process.env.PRIVY_DEFAULT_POLICY
      ? { policy_ids: [process.env.PRIVY_DEFAULT_POLICY] }
      : {}),
    metadata: { anonymousId, source: 'syra-agent-wallet' },
  };
  const out = await privyFetch('/v1/wallets', { method: 'POST', body });
  const privyWalletId = String(out?.id || '').trim();
  const agentAddress = String(out?.address || '').trim();
  if (!privyWalletId || !agentAddress) {
    throw new Error('privy_create_wallet_invalid_response');
  }
  return { privyWalletId, agentAddress };
}

/**
 * Ask Privy to sign and (optionally) send a Solana transaction.
 *
 * @param {Object} input
 * @param {string} input.privyWalletId
 * @param {string} input.serializedTxBase64
 * @param {boolean=} input.submit  When true, Privy submits via its RPC; else returns signed tx for the caller to submit.
 * @returns {Promise<{ signedTxBase64?: string; signature?: string }>}
 */
export async function privySignSolanaTx({ privyWalletId, serializedTxBase64, submit = true }) {
  if (!privyWalletId) throw new Error('missing_privy_wallet_id');
  const method = submit ? 'signAndSendTransaction' : 'signTransaction';
  const body = {
    method,
    caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // mainnet-beta
    params: { transaction: serializedTxBase64, encoding: 'base64' },
  };
  const out = await privyFetch(`/v1/wallets/${encodeURIComponent(privyWalletId)}/rpc`, {
    method: 'POST',
    body,
  });
  return {
    signedTxBase64: out?.data?.signed_transaction || undefined,
    signature: out?.data?.hash || out?.data?.signature || undefined,
  };
}

/**
 * Ask Privy to sign a message (used for x402 wallet-proof / SIWS).
 *
 * @param {Object} input
 * @param {string} input.privyWalletId
 * @param {string} input.message
 * @param {'solana'|'base'} input.chain
 * @returns {Promise<{ signature: string }>}
 */
export async function privySignMessage({ privyWalletId, message, chain }) {
  if (!privyWalletId) throw new Error('missing_privy_wallet_id');
  const caip2 = chain === 'base' ? 'eip155:8453' : 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  const body = {
    method: chain === 'base' ? 'personal_sign' : 'signMessage',
    caip2,
    params: { message, encoding: 'utf-8' },
  };
  const out = await privyFetch(`/v1/wallets/${encodeURIComponent(privyWalletId)}/rpc`, {
    method: 'POST',
    body,
  });
  const sig = String(out?.data?.signature || '').trim();
  if (!sig) throw new Error('privy_sign_message_empty');
  return { signature: sig };
}

/**
 * Hash a serialized tx for the intent payload (so we can prove user signed exactly what we executed).
 * @param {string} serializedTxBase64
 */
export function hashSerializedTx(serializedTxBase64) {
  return crypto
    .createHash('sha256')
    .update(Buffer.from(serializedTxBase64, 'base64'))
    .digest('hex');
}
