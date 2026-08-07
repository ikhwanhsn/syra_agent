/**
 * Privy Server Wallets adapter.
 *
 * Custody mode is selected per-wallet via AgentWallet.custody:
 *   - 'legacy'      → keys live encrypted in MongoDB (P0 path; signing via getAgentKeypair)
 *   - 'privy'       → keys live in Privy's TEE; we hold only privyWalletId + public address
 *   - 'retired'     → wallet is retired (after sweep migration); no signing allowed
 *
 * Secrets (env):
 *   PRIVY_APP_SECRET     (required for privy mode)
 *   PRIVY_DEFAULT_POLICY (optional policy id assigned to new wallets)
 * Config (runtime.js):
 *   PRIVY_APP_ID via getPrivyAppId()
 *   SYRA_CUSTODY_MODE via getSyraCustodyMode()
 *
 * NOTE: this module is the SOLE module allowed to talk to Privy. The broker uses these named
 * exports; no other code in the repo should import the privy SDK directly.
 */
import crypto from 'node:crypto';
import { getPrivyAppId, getSyraCustodyMode } from '../config/runtime.js';
import { alertPrivyFailure } from '../libs/privyAlert.js';

const PRIVY_BASE = (process.env.PRIVY_BASE_URL || 'https://auth.privy.io').replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 12_000;

function getPrivyAuthHeader() {
  const appId = String(getPrivyAppId() || '').trim();
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
  const m = String(getSyraCustodyMode() || 'legacy').toLowerCase().trim();
  return m === 'privy' && isPrivyConfigured() ? 'privy' : 'legacy';
}

/**
 * Map Privy HTTP failures to stable error codes.
 * @param {number} status
 * @param {unknown} body
 * @returns {string}
 */
export function classifyPrivyHttpError(status, body) {
  const rawMsg = String(
    (body && typeof body === 'object' && (body.error || body.message)) ||
      (typeof body === 'string' ? body : '') ||
      '',
  ).toLowerCase();
  if (
    /quota|plan.?limit|usage.?limit|mau|monthly.?active|signature.?limit|rate.?limit.?exceeded/.test(
      rawMsg,
    )
  ) {
    return 'privy_quota_exceeded';
  }
  if (status === 429) return 'privy_rate_limited';
  if (status === 401 || status === 403) return 'privy_auth_failed';
  if (typeof status === 'number' && status >= 500) return 'privy_unavailable';
  return `privy_http_${status || 'unknown'}`;
}

/**
 * @param {number} status
 * @param {unknown} body
 * @param {string} path
 * @returns {Error & { status?: number; body?: unknown; code?: string }}
 */
function makePrivyHttpError(status, body, path) {
  const code = classifyPrivyHttpError(status, body);
  const msg =
    (body && typeof body === 'object' && (body.error || body.message)) ||
    code;
  const err = new Error(String(msg));
  err.status = status;
  err.body = body;
  err.code = code;
  console.warn('[privy]', code, status, path);
  void alertPrivyFailure({
    code,
    status,
    path,
    message: String(msg),
  }).catch(() => {});
  return err;
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
      throw makePrivyHttpError(res.status, body, path);
    }
    return body;
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('privy_unavailable');
      timeoutErr.code = 'privy_unavailable';
      timeoutErr.status = 504;
      console.warn('[privy]', 'privy_unavailable', 'timeout', path);
      void alertPrivyFailure({
        code: 'privy_unavailable',
        status: 504,
        path,
        message: 'request_timeout',
      }).catch(() => {});
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Privy external_id: URL-safe [a-zA-Z0-9_-], max 64 chars (write-once).
 * @param {string} anonymousId
 * @returns {string | undefined}
 */
function privyExternalIdFromAnonymousId(anonymousId) {
  const raw = String(anonymousId || '').trim();
  if (!raw) return undefined;
  let safe = raw.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (safe.length > 64) {
    safe = `syra_${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 56)}`;
  }
  return safe || undefined;
}

/**
 * Find an existing Privy server wallet by external_id (e.g. after a prior DB write failed).
 * @param {string} externalId
 * @returns {Promise<{ privyWalletId: string; agentAddress: string } | null>}
 */
async function findPrivyServerWalletByExternalId(externalId) {
  if (!externalId || !isPrivyConfigured()) return null;
  try {
    const out = await privyFetch(
      `/v1/wallets?external_id=${encodeURIComponent(externalId)}`,
      { method: 'GET' },
    );
    const row = out?.data?.[0];
    const privyWalletId = String(row?.id || '').trim();
    const agentAddress = String(row?.address || '').trim();
    if (!privyWalletId || !agentAddress) return null;
    return { privyWalletId, agentAddress };
  } catch {
    return null;
  }
}

/**
 * Provision a new Privy server wallet for a user.
 *
 * @param {Object} input
 * @param {'solana'|'base'|'bsc'|'robinhood'} input.chain
 * @param {string} input.anonymousId
 * @returns {Promise<{ privyWalletId: string; agentAddress: string }>}
 */
export async function createPrivyServerWallet({ chain, anonymousId }) {
  if (!isPrivyConfigured()) throw new Error('privy_not_configured');
  const chainType =
    chain === 'base' || chain === 'bsc' || chain === 'robinhood' ? 'ethereum' : 'solana';
  const externalId = privyExternalIdFromAnonymousId(
    chain === 'robinhood' && anonymousId
      ? `${String(anonymousId).trim()}:rh_lp`
      : anonymousId,
  );

  // Re-link wallets orphaned in Privy when a prior Mongo write failed (e.g. stale unique index).
  if (externalId) {
    const existing = await findPrivyServerWalletByExternalId(externalId);
    if (existing) return existing;
  }

  const body = {
    chain_type: chainType,
    ...(process.env.PRIVY_DEFAULT_POLICY
      ? { policy_ids: [process.env.PRIVY_DEFAULT_POLICY] }
      : {}),
    ...(externalId ? { external_id: externalId } : {}),
  };
  try {
    const out = await privyFetch('/v1/wallets', { method: 'POST', body });
    const privyWalletId = String(out?.id || '').trim();
    const agentAddress = String(out?.address || '').trim();
    if (!privyWalletId || !agentAddress) {
      throw new Error('privy_create_wallet_invalid_response');
    }
    return { privyWalletId, agentAddress };
  } catch (err) {
    // Concurrent create or orphan from a failed DB insert — recover if Privy already has the wallet.
    if (externalId) {
      const existing = await findPrivyServerWalletByExternalId(externalId);
      if (existing) return existing;
    }
    throw err;
  }
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
    params: { transaction: serializedTxBase64, encoding: 'base64' },
  };
  // caip2 is required for signAndSendTransaction only — Privy rejects it on signTransaction.
  if (submit) {
    body.caip2 = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'; // mainnet-beta
  }
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
 * @param {'solana'|'base'|'bsc'|'robinhood'} input.chain
 * @returns {Promise<{ signature: string }>}
 */
export async function privySignMessage({ privyWalletId, message, chain }) {
  if (!privyWalletId) throw new Error('missing_privy_wallet_id');
  const caip2 =
    chain === 'base'
      ? 'eip155:8453'
      : chain === 'robinhood'
        ? 'eip155:4663'
        : 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  const body = {
    method: chain === 'base' || chain === 'robinhood' ? 'personal_sign' : 'signMessage',
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
 * Sign and broadcast an EVM transaction via Privy server wallet (eth_sendTransaction).
 *
 * @param {Object} input
 * @param {string} input.privyWalletId
 * @param {string} input.to
 * @param {string=} input.data
 * @param {string|number|bigint=} input.value  Wei as hex string, number, or bigint
 * @param {number=} input.chainId  Defaults to Robinhood mainnet 4663
 * @param {string=} input.gas
 * @param {string=} input.maxFeePerGas
 * @param {string=} input.maxPriorityFeePerGas
 * @returns {Promise<{ hash: string; caip2: string }>}
 */
export async function privySendEvmTx({
  privyWalletId,
  to,
  data,
  value,
  chainId = 4663,
  gas,
  maxFeePerGas,
  maxPriorityFeePerGas,
}) {
  if (!privyWalletId) throw new Error('missing_privy_wallet_id');
  const toAddr = String(to || '').trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(toAddr)) throw new Error('invalid_evm_tx_to');

  const caip2 = `eip155:${Number(chainId) || 4663}`;
  /** @type {Record<string, string>} */
  const transaction = { to: toAddr };
  if (data != null && String(data).trim()) {
    transaction.data = String(data).trim();
  }
  if (value != null && value !== '' && value !== 0n && value !== 0) {
    if (typeof value === 'bigint') {
      transaction.value = `0x${value.toString(16)}`;
    } else if (typeof value === 'number') {
      transaction.value = `0x${BigInt(Math.floor(value)).toString(16)}`;
    } else {
      const v = String(value).trim();
      transaction.value = v.startsWith('0x') ? v : `0x${BigInt(v).toString(16)}`;
    }
  }
  if (gas) transaction.gas = String(gas);
  if (maxFeePerGas) transaction.max_fee_per_gas = String(maxFeePerGas);
  if (maxPriorityFeePerGas) transaction.max_priority_fee_per_gas = String(maxPriorityFeePerGas);

  const out = await privyFetch(`/v1/wallets/${encodeURIComponent(privyWalletId)}/rpc`, {
    method: 'POST',
    body: {
      method: 'eth_sendTransaction',
      caip2,
      params: { transaction },
    },
    timeoutMs: 45_000,
  });
  const hash = String(out?.data?.hash || '').trim();
  if (!hash) throw new Error('privy_send_evm_tx_empty_hash');
  return { hash, caip2: String(out?.data?.caip2 || caip2) };
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
