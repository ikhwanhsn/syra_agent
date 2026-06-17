/**
 * Solana HTTP RPC selection for server-side code (withdraw, balances, holder reads, etc.).
 * Some providers return 403 / -32052 "not allowed to access blockchain" (Alchemy read-only keys,
 * Ankr without an API key in the URL). We try env URLs in priority order, then a public fallback.
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { startupVerbose, startupWarn } from '../utils/startupLog.js';

const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 30_000;
const DEFAULT_PUBLIC_SOLANA_HTTP = 'https://api.mainnet-beta.solana.com';

/** Sticky URL after first successful read in this process. */
let preferredRpcUrl = null;

function trimEnv(name) {
  return typeof process.env[name] === 'string' ? process.env[name].trim() : '';
}

export function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal || controller.signal }).finally(() => clearTimeout(id));
}

/** True when RPC refuses chain reads (Alchemy read-only, Ankr without key, etc.). */
export function isSolanaRpcAccessDeniedError(e) {
  const msg = e?.message || String(e);
  return /not allowed to access blockchain|json-rpc code:\s*-32052|403 Forbidden|API key is not allowed to access blockchain/i.test(
    msg,
  );
}

/** Transient / overload errors — try the next RPC URL. */
export function isSolanaRpcRetryableError(e) {
  const msg = e?.message || String(e);
  return (
    isSolanaRpcAccessDeniedError(e) ||
    /503|502|504|-32001|-32005|Unable to complete request|rate limit|too many requests|timeout|timed out|ECONNRESET|fetch failed|429/i.test(
      msg,
    )
  );
}

function pushUnique(out, seen, url) {
  if (!url || seen.has(url)) return;
  seen.add(url);
  out.push(url);
}

/**
 * Ordered list of RPC URLs to try (deduped).
 * Blockchain-capable env URLs first; read-only Alchemy last; one public mainnet fallback only.
 */
export function getSolanaRpcUrlCandidates() {
  const fromEnv = [
    trimEnv('SOLANA_RPC_BLOCKCHAIN_URL'),
    trimEnv('QUICKNODE_SOLANA_RPC_URL'),
    trimEnv('SOLANA_RPC_URL'),
    trimEnv('VITE_SOLANA_RPC_URL'),
    trimEnv('ANKR_SOLANA_RPC_URL'),
    trimEnv('SOLANA_RPC_FALLBACK_URL'),
    trimEnv('HELIUS_RPC_URL'),
  ];

  const extraRaw = trimEnv('SOLANA_RPC_EXTRA_URLS');
  if (extraRaw) {
    for (const part of extraRaw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean)) {
      fromEnv.push(part);
    }
  }

  fromEnv.push(trimEnv('SOLANA_RPC_READ_ONLY_URL'));

  const out = [];
  const seen = new Set();
  for (const u of fromEnv) {
    pushUnique(out, seen, u);
  }

  pushUnique(out, seen, DEFAULT_PUBLIC_SOLANA_HTTP);

  return out;
}

/** @param {string} [stickyFirst] */
function getOrderedCandidates(stickyFirst) {
  const base = getSolanaRpcUrlCandidates();
  if (!stickyFirst || !base.includes(stickyFirst)) return base;
  return [stickyFirst, ...base.filter((u) => u !== stickyFirst)];
}

/** @param {string} rpcUrl */
export function createSolanaConnection(rpcUrl) {
  return new Connection(rpcUrl, {
    commitment: 'confirmed',
    fetch: fetchWithTimeout,
  });
}

function safeHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '(invalid-url)';
  }
}

function formatRpcFailureSummary(failures) {
  if (!failures.length) return '';
  return failures.map(({ host, message }) => `${host}: ${message}`).join('; ');
}

function buildSolanaRpcExhaustedError(lastErr, failures, context) {
  const tried = formatRpcFailureSummary(failures);
  const alchemyHint =
    'If you use Alchemy: create a Solana Mainnet app (not Ethereum), set SOLANA_RPC_BLOCKCHAIN_URL=https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY, ' +
    'and disable IP/origin allowlist on that app (server-side calls have no browser origin).';
  const fallbackHint =
    'Public RPCs often block getTokenLargestAccounts (429/403). Set a dedicated fallback such as HELIUS_RPC_URL or QUICKNODE_SOLANA_RPC_URL.';
  const lines = [
    `Solana RPC failed for ${context}.`,
    alchemyHint,
    fallbackHint,
  ];
  if (tried) lines.push(`Tried: ${tried}`);
  if (lastErr instanceof Error && lastErr.message) {
    lines.push(`Last error: ${lastErr.message}`);
  }
  return lines.join(' ');
}

/**
 * Pick first RPC that can answer a lightweight read for `pubkey` (getBalance).
 * @param {import('@solana/web3.js').PublicKey} pubkey
 * @returns {Promise<{ connection: import('@solana/web3.js').Connection; rpcUrl: string; lamports: number }>}
 */
export async function pickSolanaConnectionForReads(pubkey) {
  const candidates = getOrderedCandidates(preferredRpcUrl);
  /** @type {Array<{ host: string; message: string }>} */
  const failures = [];
  let lastErr;
  for (const rpcUrl of candidates) {
    const connection = createSolanaConnection(rpcUrl);
    try {
      const lamports = await connection.getBalance(pubkey, 'confirmed');
      preferredRpcUrl = rpcUrl;
      return { connection, rpcUrl, lamports };
    } catch (e) {
      lastErr = e;
      failures.push({
        host: safeHost(rpcUrl),
        message: e instanceof Error ? e.message.slice(0, 120) : String(e).slice(0, 120),
      });
      if (isSolanaRpcRetryableError(e)) {
        console.warn(`[solanaServerRpc] RPC failed, trying next: ${safeHost(rpcUrl)}`);
        continue;
      }
      throw e;
    }
  }
  throw new Error(buildSolanaRpcExhaustedError(lastErr, failures, 'getBalance'));
}

/**
 * Run `fn(connection, rpcUrl)` against RPC candidates until one succeeds.
 * @template T
 * @param {(connection: import('@solana/web3.js').Connection, rpcUrl: string) => Promise<T>} fn
 * @param {string} [context]
 * @returns {Promise<T>}
 */
export async function withSolanaRpcFallback(fn, context = 'rpc read') {
  const candidates = getOrderedCandidates(preferredRpcUrl);
  /** @type {Array<{ host: string; message: string }>} */
  const failures = [];
  /** @type {unknown} */
  let lastErr;
  for (const rpcUrl of candidates) {
    const connection = createSolanaConnection(rpcUrl);
    try {
      const result = await fn(connection, rpcUrl);
      preferredRpcUrl = rpcUrl;
      return result;
    } catch (e) {
      lastErr = e;
      failures.push({
        host: safeHost(rpcUrl),
        message: e instanceof Error ? e.message.slice(0, 120) : String(e).slice(0, 120),
      });
      if (isSolanaRpcRetryableError(e)) {
        console.warn(
          `[solanaServerRpc] ${context} failed on ${safeHost(rpcUrl)}, trying next:`,
          e instanceof Error ? e.message : String(e),
        );
        continue;
      }
      throw e;
    }
  }
  throw new Error(buildSolanaRpcExhaustedError(lastErr, failures, context));
}

/** Log configured RPC hosts and probe the primary with a lightweight mint read. */
export async function logSolanaRpcStartupProbe() {
  const candidates = getSolanaRpcUrlCandidates();
  const hosts = candidates.map((u) => safeHost(u));
  startupVerbose(`[solanaServerRpc] candidates (${hosts.length}): ${hosts.join(' → ')}`);

  const probeMint = trimEnv('SOLANA_RPC_PROBE_MINT') || 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
  let mintPk;
  try {
    mintPk = new PublicKey(probeMint);
  } catch {
    startupWarn('[solanaServerRpc] invalid SOLANA_RPC_PROBE_MINT, skipping probe');
    return;
  }

  for (const rpcUrl of candidates.slice(0, 3)) {
    try {
      await createSolanaConnection(rpcUrl).getAccountInfo(mintPk, 'confirmed');
      preferredRpcUrl = rpcUrl;
      startupVerbose(`[solanaServerRpc] probe OK on ${safeHost(rpcUrl)}`);
      return;
    } catch (e) {
      startupWarn(
        `[solanaServerRpc] probe failed on ${safeHost(rpcUrl)}:`,
        e instanceof Error ? e.message.slice(0, 140) : String(e),
      );
    }
  }
  startupWarn(
    '[solanaServerRpc] no RPC passed startup probe — holder/on-chain reads may fail until SOLANA_RPC_BLOCKCHAIN_URL is fixed',
  );
}
