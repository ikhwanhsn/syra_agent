/**
 * Agent x402 client: call x402 API v2 using agent keypair (pay automatically).
 * Uses the same stack as the internal tester agent (`@x402/fetch` + `x402Client` + `ExactSvmScheme` from `@x402/svm`)
 * so payment txs match facilitator expectations (fee payer from `accepts[0].extra.feePayer`, @solana/kit wire format).
 * Internal requests to our own API include X-API-Key; self-API uses raw fetch (no Sentinel) when chosen via chooseFetch.
 */
import { Connection } from '@solana/web3.js';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { randomBytes } from 'node:crypto';
import { getAgentKeypair } from './agentWallet.js';
import { getSentinelFetch, SentinelBudgetError } from './sentinelFetch.js';

/** Server API key (first of API_KEYS or API_KEY) for internal x402 requests so they are not rejected with 403. */
function getServerApiKey() {
  const raw = (process.env.API_KEYS || process.env.API_KEY || '').trim();
  if (!raw) return null;
  const first = raw.split(',')[0].trim();
  return first || null;
}

/** Our API base URL (no trailing slash). When set, requests to this host get X-API-Key. */
function getOwnApiBaseUrl() {
  const base = (process.env.BASE_URL || '').trim().replace(/\/$/, '');
  return base || null;
}

/** Hosts we treat as our own API (internal tool calls). Add X-API-Key so proxies/auth allow server-to-server. */
const OWN_API_HOSTS = new Set([
  'api.syraa.fun',
  'www.api.syraa.fun',
  'localhost',
  '127.0.0.1',
  ...[process.env.INTERNAL_BASE_URL, ...(process.env.CORS_EXTRA_ORIGINS || '').split(',')]
    .map((o) => {
      try {
        return o && new URL(o.trim()).hostname;
      } catch {
        return null;
      }
    })
    .filter(Boolean),
]);

/** True when the URL targets our own API (self-call). */
function isOwnApiUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    const baseUrl = getOwnApiBaseUrl();
    const isOwnByBase = baseUrl && (url.startsWith(baseUrl) || u.origin === new URL(baseUrl).origin);
    const isOwnByHost = OWN_API_HOSTS.has(u.hostname);
    return !!(isOwnByBase || isOwnByHost);
  } catch {
    const baseUrl = getOwnApiBaseUrl();
    return !!(baseUrl && url.startsWith(baseUrl));
  }
}

/** Add X-API-Key to headers when the request URL is our own API (avoids 403 from proxies/auth that block server-to-server). */
function addInternalApiKeyIfOwnUrl(url, headers) {
  const key = getServerApiKey();
  if (!key || typeof url !== 'string' || !headers || typeof headers !== 'object') return;
  if (isOwnApiUrl(url)) {
    headers['X-API-Key'] = key;
  }
}

/**
 * Choose the right fetch for the URL: raw globalThis.fetch for self-API calls (avoids
 * Sentinel budget/audit interference on internal tool calls), sentinel-wrapped for external.
 */
function chooseFetch(url, sentinelFetch) {
  return isOwnApiUrl(url) ? globalThis.fetch : sentinelFetch;
}

/**
 * Get treasury keypair from AGENT_PRIVATE_KEY (base58). Used to pay for tool calls when user is a 1M+ SYRA holder.
 * @returns {import('@solana/web3.js').Keypair | null}
 */
export function getTreasuryKeypair() {
  const raw = process.env.AGENT_PRIVATE_KEY;
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const secretKey = bs58.decode(raw.trim());
    return Keypair.fromSecretKey(secretKey);
  } catch {
    return null;
  }
}

// Prefer RPC that allows blockchain access (getAccountInfo, sendRawTransaction, etc.).
// Alchemy / some providers return 403 + -32052 when the key is not allowed to use "blockchain" JSON-RPC
// on that hostname — see https://docs.alchemy.com/reference/throughput (use a full-access endpoint or
// set SOLANA_RPC_BLOCKCHAIN_URL). Same for Helius: use a URL that allows getAccountInfo / sendTransaction.
const DEFAULT_PUBLIC_SOLANA_HTTP = 'https://api.mainnet-beta.solana.com';

function trimEnv(name) {
  return String(process.env[name] || '').trim();
}

/** Effective primary: first env in priority order, else Solana public mainnet-beta. */
function getEffectivePrimaryRpcUrl() {
  return (
    trimEnv('SOLANA_RPC_BLOCKCHAIN_URL') ||
    trimEnv('SOLANA_RPC_READ_ONLY_URL') ||
    trimEnv('SOLANA_RPC_URL') ||
    trimEnv('VITE_SOLANA_RPC_URL') ||
    DEFAULT_PUBLIC_SOLANA_HTTP
  );
}

const RPC_PRIMARY_URL = getEffectivePrimaryRpcUrl();

// Fallback must never equal the effective primary. Previously we compared only to SOLANA_RPC_URL,
// so when primary came from SOLANA_RPC_READ_ONLY_URL (Alchemy) and SOLANA_RPC_FALLBACK_URL matched
// SOLANA_RPC_URL (empty), we incorrectly set fallback to the same Alchemy URL — switch "to fallback"
// did nothing and getMint kept returning 403.
const _fallbackCandidate = trimEnv('SOLANA_RPC_FALLBACK_URL');
const RPC_FALLBACK_URL = (() => {
  if (_fallbackCandidate && _fallbackCandidate !== RPC_PRIMARY_URL) {
    return _fallbackCandidate;
  }
  // Never use the same URL as primary (switch would be a no-op).
  if (RPC_PRIMARY_URL === DEFAULT_PUBLIC_SOLANA_HTTP) {
    return 'https://rpc.ankr.com/solana';
  }
  return DEFAULT_PUBLIC_SOLANA_HTTP;
})();

const RPC_URL = RPC_PRIMARY_URL;

/**
 * RPC for @x402/svm ExactSvmScheme (fetchMint, blockhash). Must allow blockchain JSON-RPC.
 * Never prefer SOLANA_RPC_READ_ONLY_URL here — Alchemy "Data" / read-only endpoints return 403 / -32052
 * for getAccountInfo (USDC mint), breaking Corbits-paid calls. Internal tester uses ExactSvmScheme(signer)
 * with no rpcUrl → public mainnet-beta; we mirror that when no full blockchain URL is set.
 */
const RPC_X402_EXACT_PRIMARY =
  trimEnv('SOLANA_RPC_BLOCKCHAIN_URL') ||
  trimEnv('SOLANA_RPC_URL') ||
  trimEnv('VITE_SOLANA_RPC_URL') ||
  DEFAULT_PUBLIC_SOLANA_HTTP;

const RPC_X402_EXACT_FALLBACK = (() => {
  const c = trimEnv('SOLANA_RPC_FALLBACK_URL');
  if (c && c !== RPC_X402_EXACT_PRIMARY) return c;
  if (RPC_X402_EXACT_PRIMARY === DEFAULT_PUBLIC_SOLANA_HTTP) {
    return 'https://rpc.ankr.com/solana';
  }
  return DEFAULT_PUBLIC_SOLANA_HTTP;
})();

/** True if error is Alchemy "not allowed to access blockchain" or similar RPC access restriction. */
function isRpcBlockchainAccessError(e) {
  const parts = [e?.message, e?.cause?.message, typeof e === 'string' ? e : ''];
  if (e && typeof e === 'object' && Array.isArray(e.errors)) {
    for (const sub of e.errors) {
      if (typeof sub === 'string') parts.push(sub);
      else if (sub && typeof sub === 'object') parts.push(sub.message, sub.cause?.message);
    }
  }
  let msg = parts.filter(Boolean).join(' ');
  try {
    if (msg.length < 20 && e && typeof e === 'object') {
      msg += JSON.stringify(e).slice(0, 500);
    }
  } catch {
    /* ignore */
  }
  return (
    /not allowed to access blockchain|json-rpc code:\s*-32052|403 Forbidden|-32052/i.test(msg) ||
    /failed to get info about account.*403/i.test(msg)
  );
}

/** Get a Connection, falling back if the primary RPC blocks blockchain access. */
let _useFallbackRpc = false;
function getConnection() {
  const url = _useFallbackRpc ? RPC_FALLBACK_URL : RPC_URL;
  return new Connection(url, 'confirmed');
}

/** Switch to fallback RPC for subsequent calls (sticky per process). */
function switchToFallbackRpc() {
  if (!_useFallbackRpc) {
    _useFallbackRpc = true;
    const fallbackHost = (RPC_FALLBACK_URL && (() => { try { return new URL(RPC_FALLBACK_URL).hostname; } catch { return '(fallback)'; } })()) || '(fallback)';
    console.warn(`[agentX402] Primary RPC blocked blockchain access → switching to fallback: ${fallbackHost}`);
  }
}

/** Poll interval for confirmation (ms). */
const CONFIRM_POLL_MS = 1500;
/** Max time to wait for confirmation (ms). Gives slow RPCs time to confirm. */
const CONFIRM_TIMEOUT_MS = 90_000;

/**
 * Wait for transaction confirmation using HTTP-only RPC (getSignatureStatuses).
 * Does not use signatureSubscribe, so it works with RPCs that don't support WebSocket subscriptions.
 * @param {import('@solana/web3.js').Connection} connection
 * @param {string} signature
 * @param {number} lastValidBlockHeight
 * @param {number} [maxWaitMs] - Max ms to wait (default CONFIRM_TIMEOUT_MS). Use shorter value for pay-402 so we return header sooner; facilitator verifies by signature.
 * @returns {Promise<{ confirmed: boolean; error?: string }>}
 */
async function confirmTransactionByPolling(connection, signature, lastValidBlockHeight, maxWaitMs = CONFIRM_TIMEOUT_MS) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const currentBlockHeight = await connection.getBlockHeight('confirmed');
      if (currentBlockHeight > lastValidBlockHeight) {
        return { confirmed: false, error: 'Signature has expired: block height exceeded' };
      }
      const { value } = await connection.getSignatureStatuses([signature]);
      const status = value?.[0];
      if (status?.err) {
        return { confirmed: false, error: String(status.err) };
      }
      if (
        status?.confirmationStatus === 'confirmed' ||
        status?.confirmationStatus === 'finalized' ||
        status?.confirmationStatus === 'processed'
      ) {
        return { confirmed: true };
      }
    } catch (e) {
      // Transient RPC error; keep polling
    }
    await new Promise((r) => setTimeout(r, CONFIRM_POLL_MS));
  }
  return { confirmed: false, error: 'Confirmation timeout' };
}

/** RPC URL passed into @x402/svm ExactSvmScheme (must allow getAccountInfo / getLatestBlockhash). */
function getSvmRpcUrlForX402() {
  return _useFallbackRpc ? RPC_X402_EXACT_FALLBACK : RPC_X402_EXACT_PRIMARY;
}

/** Corbits facilitator may return 429 under burst — same backoff idea as libs/testerAgent/tests.js */
const FACILITATOR_429_MAX_ATTEMPTS = 6;
const FACILITATOR_429_BASE_DELAY_MS = 2000;

/** Second-hop retries for transient facilitator races (stale blockhash, CDP 400 "account not found", duplicate tx). */
const FACILITATOR_PAID_402_MAX_RETRIES = 2;
const FACILITATOR_PAID_402_BASE_DELAY_MS = 1200;

/**
 * Identify transient facilitator failures that are worth retrying with a fresh payment payload.
 * A paid x402 call can bounce back with a 402 body when: the facilitator's fee-payer expired,
 * CDP is momentarily rate-limited, blockhash expired, or the resource server hasn't observed
 * settlement yet. In all cases, rebuilding the payload (new blockhash, new payment-identifier)
 * and retrying tends to succeed.
 * @param {number} status
 * @param {string} msg
 */
function isTransientPaidFacilitatorError(status, msg) {
  if (status !== 402 && status !== 400) return false;
  if (/budget|sentinel/i.test(msg)) return false;
  return (
    /payment required/i.test(msg) ||
    /blockhash|block height/i.test(msg) ||
    /account not found among transaction's account keys/i.test(msg) ||
    /x402 payment rejected/i.test(msg) ||
    /invalid[_\s-]?payload/i.test(msg) ||
    /failed to sign transaction via cdp/i.test(msg) ||
    /rate limit|temporarily unavailable|try again/i.test(msg)
  );
}

function facilitatorErrorLooks429(e) {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    /\b429\b/i.test(msg) &&
    (/too many requests/i.test(msg) || /rate limit/i.test(msg) || /HTTP error \(429\)/i.test(msg))
  );
}

function sleepBackoffMs(ms, signal) {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(t);
      reject(signal?.reason instanceof Error ? signal.reason : new Error('aborted'));
    };
    const t = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    if (signal) {
      if (signal.aborted) {
        clearTimeout(t);
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

/**
 * @param {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>} paymentFetch
 */
async function paidFetchWithCorbits429Backoff(paymentFetch, url, init) {
  for (let attempt = 0; attempt < FACILITATOR_429_MAX_ATTEMPTS; attempt++) {
    try {
      return await paymentFetch(url, init);
    } catch (e) {
      if (!facilitatorErrorLooks429(e) || attempt === FACILITATOR_429_MAX_ATTEMPTS - 1) {
        throw e;
      }
      const delay = Math.round(FACILITATOR_429_BASE_DELAY_MS * 2 ** attempt + Math.random() * 400);
      await sleepBackoffMs(delay, init?.signal);
    }
  }
  throw new Error('Corbits payment fetch: retries exhausted');
}

/**
 * Generate an idempotent payment identifier matching Birdeye's schema
 * (`^pay_[a-zA-Z0-9_-]{10,120}$`). Used for header-based 402 flows that advertise the
 * `payment-identifier` extension (e.g. Birdeye). No-op for servers that don't request it.
 * @returns {string}
 */
function generatePaymentIdentifier() {
  return `pay_${randomBytes(16).toString('hex')}`;
}

/**
 * x402 v2 extension schema is `info + schema (JSON Schema)`. Returns true when the schema
 * requires a client-supplied field (e.g. Birdeye's `payment-identifier.id`).
 * Detects two common shapes: top-level `required: [...]` and `info.required: true`.
 */
function isExtensionRequired(extSpec) {
  if (!extSpec || typeof extSpec !== 'object') return false;
  if (extSpec.info && extSpec.info.required === true) return true;
  const top = extSpec.schema?.required;
  if (Array.isArray(top) && top.length > 0) return true;
  return false;
}

/**
 * Populate required x402 v2 extensions in the payment payload just before encoding the
 * PAYMENT-SIGNATURE header. Currently supports:
 * - `payment-identifier`: generates a unique `pay_<hex>` id (idempotency for Birdeye).
 *
 * Registered as an `onAfterPaymentCreation` hook on the x402Client. Mutates a per-call
 * copy of `paymentPayload.extensions` (does not mutate the shared paymentRequired object).
 *
 * @param {import('@x402/core/client').x402Client} client
 */
function registerRequiredExtensionsHook(client) {
  client.onAfterPaymentCreation((context) => {
    const payload = context?.paymentPayload;
    const ext = payload?.extensions;
    if (!payload || !ext || typeof ext !== 'object') return;

    /** @type {Record<string, any>} */
    const nextExt = { ...ext };
    let changed = false;

    const payIdSpec = ext['payment-identifier'];
    if (payIdSpec && isExtensionRequired(payIdSpec)) {
      const existingId = payIdSpec.info?.id;
      if (typeof existingId !== 'string' || existingId.trim() === '') {
        nextExt['payment-identifier'] = {
          ...payIdSpec,
          info: { ...(payIdSpec.info || {}), id: generatePaymentIdentifier() },
        };
        changed = true;
      }
    }

    if (changed) {
      payload.extensions = nextExt;
    }
  });
  return client;
}

/**
 * Same stack as the internal tester agent (`getNansenPaymentFetch`): @x402/fetch + x402Client + ExactSvmScheme.
 * Uses facilitator-provided `extra.feePayer` and @solana/kit wire format so Corbits verify matches (avoids "Invalid transaction" from hand-built web3.js txs).
 * Also populates required v2 extensions (e.g. Birdeye's `payment-identifier.id`) before encoding the PAYMENT-SIGNATURE header.
 */
async function createX402WrapFetch(keypair, fetchFn) {
  const { wrapFetchWithPayment } = await import('@x402/fetch');
  const { x402Client } = await import('@x402/core/client');
  const { ExactSvmScheme } = await import('@x402/svm/exact/client');
  const { createKeyPairSignerFromBytes } = await import('@solana/kit');
  const signer = await createKeyPairSignerFromBytes(keypair.secretKey);
  const scheme = new ExactSvmScheme(signer, { rpcUrl: getSvmRpcUrlForX402() });
  const client = x402Client.fromConfig({ schemes: [{ network: 'solana:*', client: scheme }] });
  registerRequiredExtensionsHook(client);
  return wrapFetchWithPayment(fetchFn, client);
}

export { registerRequiredExtensionsHook, generatePaymentIdentifier };

/**
 * Call an x402 v2 API using the agent wallet (pay automatically with agent keypair).
 * Uses @x402/fetch (402 → pay → retry), same as `getNansenPaymentFetch` / tester paid probes.
 *
 * @param {object} opts
 * @param {string} opts.anonymousId - Agent wallet anonymousId
 * @param {string} opts.url - Full URL (e.g. BASE_URL + /news)
 * @param {string} opts.method - GET or POST
 * @param {Record<string, string>} [opts.query] - Query params for GET
 * @param {object} [opts.body] - JSON body for POST
 * @param {string} [opts.connectedWalletAddress] - When set, sent as X-Connected-Wallet so API can apply dev pricing for that wallet
 * @returns {Promise<{ success: true; data: any } | { success: false; error: string }>}
 */
export async function callX402V2WithAgent(opts) {
  try {
    const { anonymousId, url, method = 'GET', query = {}, body, connectedWalletAddress } = opts;
    const keypair = await getAgentKeypair(anonymousId);
    if (!keypair) {
      return { success: false, error: 'Agent wallet not found for this user' };
    }
    const sentinelFetch = getSentinelFetch(anonymousId);
    const fetchFn = chooseFetch(url, sentinelFetch);
    return await callX402V2WithKeypair(keypair, { url, method, query, body, connectedWalletAddress }, fetchFn);
  } catch (e) {
    const msg = e?.message || String(e);
    console.error(`[agentX402] callX402V2WithAgent threw:`, e?.name || 'Error', msg);
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      return { success: false, error: msg, budgetExceeded: true };
    }
    return { success: false, error: msg };
  }
}

/**
 * Call x402 v2 API using the treasury wallet (AGENT_PRIVATE_KEY). Used when user is a 1M+ SYRA holder (free tools).
 * @param {object} opts - { url, method?, query?, body? }
 * @returns {Promise<{ success: true; data: any } | { success: false; error: string }>}
 */
export async function callX402V2WithTreasury(opts) {
  try {
    const keypair = getTreasuryKeypair();
    if (!keypair) {
      return { success: false, error: 'Treasury wallet not configured (AGENT_PRIVATE_KEY)' };
    }
    const sentinelFetch = getSentinelFetch('treasury');
    const fetchFn = chooseFetch(opts.url, sentinelFetch);
    return await callX402V2WithKeypair(keypair, opts, fetchFn);
  } catch (e) {
    const msg = e?.message || String(e);
    console.error(`[agentX402] callX402V2WithTreasury threw:`, e?.name || 'Error', msg);
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      return { success: false, error: msg, budgetExceeded: true };
    }
    return { success: false, error: msg };
  }
}

async function callX402V2WithKeypair(keypair, opts, fetchFn = globalThis.fetch) {
  const { url, method = 'GET', query = {}, body, connectedWalletAddress } = opts;

  const buildUrl = () => {
    const u = new URL(url);
    Object.entries(query).forEach(([k, v]) => {
      if (v != null && v !== '') u.searchParams.set(k, String(v));
    });
    return u.toString();
  };

  const initialUrl = buildUrl();
  const initHeaders = { Accept: 'application/json' };
  if (method === 'POST' || (body && method !== 'GET' && method !== 'HEAD')) {
    initHeaders['Content-Type'] = 'application/json';
  }
  if (connectedWalletAddress && typeof connectedWalletAddress === 'string' && connectedWalletAddress.trim()) {
    initHeaders['X-Connected-Wallet'] = connectedWalletAddress.trim();
  }
  addInternalApiKeyIfOwnUrl(initialUrl, initHeaders);
  const initOpts = {
    method,
    headers: initHeaders,
    redirect: 'manual',
    ...(body && method === 'POST' ? { body: JSON.stringify(body) } : {}),
  };

  async function fetchPaidOnce() {
    const paymentFetch = await createX402WrapFetch(keypair, fetchFn);
    const res = await paidFetchWithCorbits429Backoff(paymentFetch, initialUrl, initOpts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg =
        data?.error ||
        data?.message ||
        (typeof data?.detail === 'string' ? data.detail : '') ||
        res.statusText ||
        `Request failed: ${res.status}`;
      const safeUrl = (() => {
        try {
          const u = new URL(initialUrl);
          return u.origin + u.pathname;
        } catch {
          return '(url)';
        }
      })();
      const safeMsg = typeof errMsg === 'string' ? (errMsg.length > 200 ? errMsg.slice(0, 200) + '…' : errMsg) : 'non-string error';
      console.error(`[agentX402] x402 paid request failed: ${res.status} ${res.statusText} → ${safeUrl}`, safeMsg);
      return {
        ok: false,
        status: res.status,
        result: {
          success: false,
          error: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
          ...(res.status === 402 && /budget|sentinel/i.test(String(errMsg)) ? { budgetExceeded: true } : {}),
        },
      };
    }
    return { ok: true, status: res.status, result: { success: true, data } };
  }

  async function fetchPaid() {
    let last;
    for (let i = 0; i <= FACILITATOR_PAID_402_MAX_RETRIES; i++) {
      last = await fetchPaidOnce();
      if (last.ok) return last.result;
      const msg = last.result?.error || '';
      if (i >= FACILITATOR_PAID_402_MAX_RETRIES) break;
      if (!isTransientPaidFacilitatorError(last.status, msg)) break;
      const delay = Math.round(FACILITATOR_PAID_402_BASE_DELAY_MS * 2 ** i + Math.random() * 300);
      await new Promise((r) => setTimeout(r, delay));
    }
    return last.result;
  }

  try {
    return await fetchPaid();
  } catch (e) {
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      const msg = e?.message || String(e);
      return { success: false, error: msg, budgetExceeded: true };
    }
    if (isRpcBlockchainAccessError(e)) {
      switchToFallbackRpc();
      try {
        return await fetchPaid();
      } catch (e2) {
        if (e2 && (e2.name === 'SentinelBudgetError' || e2 instanceof SentinelBudgetError)) {
          return { success: false, error: e2.message || String(e2), budgetExceeded: true };
        }
        const msg = e2?.message || String(e2);
        console.error(`[agentX402] callX402V2WithKeypair (after RPC fallback):`, e2?.name || 'Error', msg);
        return { success: false, error: msg };
      }
    }
    const msg = e?.message || String(e);
    console.error(`[agentX402] callX402V2WithKeypair threw:`, e?.name || 'Error', msg);
    return { success: false, error: msg };
  }
}

/**
 * Execute paid request (402 handled inside @x402/fetch). Used by Nansen / Zerion / Purch Vault.
 * `opts.accepts` / `resource` / `extensions` are ignored — kept for call-site compatibility.
 * @param {import('@solana/web3.js').Keypair} keypair
 * @param {{ url: string; method?: string; body?: object; accepts?: object[]; connectedWalletAddress?: string }} opts
 * @returns {Promise<{ success: true; data: any } | { success: false; error: string; budgetExceeded?: boolean }>}
 */
export async function pay402AndRetry(keypair, opts, fetchFn = globalThis.fetch) {
  const { url, method = 'POST', body, connectedWalletAddress } = opts;
  const headers = { Accept: 'application/json' };
  if (method === 'POST' || (body && method !== 'GET' && method !== 'HEAD')) {
    headers['Content-Type'] = 'application/json';
  }
  if (connectedWalletAddress && typeof connectedWalletAddress === 'string' && connectedWalletAddress.trim()) {
    headers['X-Connected-Wallet'] = connectedWalletAddress.trim();
  }
  addInternalApiKeyIfOwnUrl(url, headers);
  const init = {
    method,
    headers,
    redirect: 'manual',
    ...(body != null && method !== 'GET' && method !== 'HEAD'
      ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
      : {}),
  };

  async function attemptOnce() {
    const paymentFetch = await createX402WrapFetch(keypair, fetchFn);
    const res = await paidFetchWithCorbits429Backoff(paymentFetch, url, init);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err =
        data?.error ||
        data?.message ||
        (typeof data?.detail === 'string' ? data.detail : '') ||
        res.statusText ||
        `Request failed: ${res.status}`;
      const msg = typeof err === 'string' ? err : JSON.stringify(err);
      return {
        ok: false,
        status: res.status,
        result: {
          success: false,
          error: msg,
          ...(res.status === 402 && /budget|sentinel/i.test(msg) ? { budgetExceeded: true } : {}),
        },
      };
    }
    return { ok: true, status: res.status, result: { success: true, data } };
  }

  async function attemptWithPaidRetry() {
    /** @type {ReturnType<typeof attemptOnce> extends Promise<infer T> ? T : never} */
    let last;
    for (let i = 0; i <= FACILITATOR_PAID_402_MAX_RETRIES; i++) {
      last = await attemptOnce();
      if (last.ok) return last.result;
      const msg = last.result?.error || '';
      if (i >= FACILITATOR_PAID_402_MAX_RETRIES) break;
      if (!isTransientPaidFacilitatorError(last.status, msg)) break;
      const delay = Math.round(FACILITATOR_PAID_402_BASE_DELAY_MS * 2 ** i + Math.random() * 300);
      await new Promise((r) => setTimeout(r, delay));
    }
    return last.result;
  }

  try {
    return await attemptWithPaidRetry();
  } catch (e) {
    if (e && (e.name === 'SentinelBudgetError' || e instanceof SentinelBudgetError)) {
      return { success: false, error: e.message || String(e), budgetExceeded: true };
    }
    if (isRpcBlockchainAccessError(e)) {
      switchToFallbackRpc();
      try {
        return await attemptWithPaidRetry();
      } catch (e2) {
        if (e2 && (e2.name === 'SentinelBudgetError' || e2 instanceof SentinelBudgetError)) {
          return { success: false, error: e2.message || String(e2), budgetExceeded: true };
        }
        return { success: false, error: e2?.message || String(e2) };
      }
    }
    return { success: false, error: e?.message || String(e) };
  }
}

/**
 * Build payment header from a 402 response body (for frontend pay-then-retry flow).
 * Same path as tester: x402Client.createPaymentPayload + encodePaymentSignatureHeader.
 * @param {string} anonymousId - Agent wallet anonymousId
 * @param {object} paymentRequired - The 402 response body (must have accepts[] and optionally x402Version)
 * @returns {Promise<{ paymentHeader: string; signature?: string }>}
 */
export async function buildPaymentHeaderFrom402Body(anonymousId, paymentRequired) {
  if (!paymentRequired || !Array.isArray(paymentRequired.accepts) || paymentRequired.accepts.length === 0) {
    throw new Error('paymentRequired must have non-empty accepts array');
  }
  const keypair = await getAgentKeypair(anonymousId);
  if (!keypair) {
    throw new Error('Agent wallet not found for this user');
  }

  const { x402Client } = await import('@x402/core/client');
  const { ExactSvmScheme } = await import('@x402/svm/exact/client');
  const { createKeyPairSignerFromBytes } = await import('@solana/kit');
  const { encodePaymentSignatureHeader } = await import('@x402/core/http');

  async function makePayload() {
    const signer = await createKeyPairSignerFromBytes(keypair.secretKey);
    const scheme = new ExactSvmScheme(signer, { rpcUrl: getSvmRpcUrlForX402() });
    const client = x402Client.fromConfig({ schemes: [{ network: 'solana:*', client: scheme }] });
    registerRequiredExtensionsHook(client);
    return client.createPaymentPayload(paymentRequired);
  }

  let paymentPayload;
  try {
    paymentPayload = await makePayload();
  } catch (e) {
    if (isRpcBlockchainAccessError(e)) {
      switchToFallbackRpc();
      paymentPayload = await makePayload();
    } else {
      throw e;
    }
  }

  const paymentHeader = encodePaymentSignatureHeader(paymentPayload);
  const sig = paymentPayload?.payload?.signature;
  return {
    paymentHeader,
    ...(typeof sig === 'string' && sig ? { signature: sig } : {}),
  };
}

/**
 * Sign and submit a Jupiter swap transaction with the agent wallet.
 * Used after getting a swap order so the agent's token balance is actually reduced (swap executed).
 * @param {string} anonymousId - Agent wallet anonymousId
 * @param {string} serializedTxBase64 - Base64-encoded transaction from Jupiter order response
 * @returns {Promise<{ signature: string }>} Transaction signature (base58)
 */
/**
 * Sign and submit a base64 Solana transaction (v0 / versioned or legacy) with the agent wallet.
 * Used for Jupiter (v0) and pump.fun fun-block responses (may be legacy Transaction bytes).
 * @param {string} anonymousId
 * @param {string} serializedTxBase64
 * @returns {Promise<{ signature: string }>}
 */
export async function signAndSubmitSerializedTransaction(anonymousId, serializedTxBase64) {
  const keypair = await getAgentKeypair(anonymousId);
  if (!keypair) {
    throw new Error('Agent wallet not found for this user');
  }
  let connection = getConnection();
  const txBuf = Buffer.from(serializedTxBase64, 'base64');

  /** @type {Uint8Array} */
  let serialized;
  try {
    const vtx = VersionedTransaction.deserialize(txBuf);
    vtx.sign([keypair]);
    const sig0 = vtx.signatures[0];
    if (!sig0 || sig0.length !== 64) {
      throw new Error('Failed to sign versioned transaction');
    }
    serialized = vtx.serialize();
  } catch {
    const legacy = Transaction.from(txBuf);
    legacy.partialSign(keypair);
    serialized = legacy.serialize({ requireAllSignatures: false });
  }

  const sendOnce = async () =>
    connection.sendRawTransaction(serialized, {
      skipPreflight: false,
      maxRetries: 3,
    });

  try {
    const signature = await sendOnce();
    return { signature };
  } catch (sendErr) {
    if (isRpcBlockchainAccessError(sendErr)) {
      switchToFallbackRpc();
      connection = getConnection();
      const signature = await sendOnce();
      return { signature };
    }
    const rawMsg = sendErr?.message || 'Failed to submit transaction to Solana';
    const isDebitNoCredit =
      /debit an account but found no record of a prior credit/i.test(rawMsg) ||
      /insufficient funds/i.test(rawMsg);
    const err = isDebitNoCredit
      ? 'Agent wallet needs SOL for transaction fees. Send a small amount of SOL (e.g. 0.01) to the agent wallet.'
      : rawMsg;
    throw new Error(err);
  }
}

export async function signAndSubmitSwapTransaction(anonymousId, serializedTxBase64) {
  return signAndSubmitSerializedTransaction(anonymousId, serializedTxBase64);
}
