/**
 * Solana HTTP RPC selection for server-side code (withdraw, balances, etc.).
 * Some providers (e.g. restricted Alchemy keys) return 403 / -32032 "not allowed to access blockchain".
 * We try env URLs in priority order, then optional fallback env, then public endpoints.
 */
import { Connection } from '@solana/web3.js';

const RPC_TIMEOUT_MS = Number(process.env.SOLANA_RPC_TIMEOUT_MS) || 30_000;

export function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);
  return fetch(url, { ...init, signal: init.signal || controller.signal }).finally(() => clearTimeout(id));
}

/** True when RPC refuses chain reads (Alchemy -32052, etc.). */
export function isSolanaRpcAccessDeniedError(e) {
  const msg = e?.message || String(e);
  return /not allowed to access blockchain|json-rpc code:\s*-32052|403 Forbidden|API key is not allowed to access blockchain/i.test(
    msg,
  );
}

/**
 * Ordered list of RPC URLs to try (deduped).
 * Mirrors agentX402Client priority: blockchain URL first, then read-only, then generic env.
 */
export function getSolanaRpcUrlCandidates() {
  const fromEnv = [
    process.env.SOLANA_RPC_BLOCKCHAIN_URL,
    process.env.SOLANA_RPC_READ_ONLY_URL,
    process.env.SOLANA_RPC_URL,
    process.env.VITE_SOLANA_RPC_URL,
  ]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);

  const out = [];
  const seen = new Set();
  for (const u of fromEnv) {
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }

  const fallbackEnv = typeof process.env.SOLANA_RPC_FALLBACK_URL === 'string' ? process.env.SOLANA_RPC_FALLBACK_URL.trim() : '';
  if (fallbackEnv && !seen.has(fallbackEnv)) {
    seen.add(fallbackEnv);
    out.push(fallbackEnv);
  }

  for (const u of ['https://api.mainnet-beta.solana.com', 'https://rpc.ankr.com/solana']) {
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }

  return out;
}

/** @param {string} rpcUrl */
export function createSolanaConnection(rpcUrl) {
  return new Connection(rpcUrl, {
    commitment: 'confirmed',
    fetch: fetchWithTimeout,
  });
}

/**
 * Pick first RPC that can answer a lightweight read for `pubkey` (getBalance).
 * @param {import('@solana/web3.js').PublicKey} pubkey
 * @returns {Promise<{ connection: import('@solana/web3.js').Connection; rpcUrl: string; lamports: number }>}
 */
export async function pickSolanaConnectionForReads(pubkey) {
  const candidates = getSolanaRpcUrlCandidates();
  let lastErr;
  for (const rpcUrl of candidates) {
    const connection = createSolanaConnection(rpcUrl);
    try {
      const lamports = await connection.getBalance(pubkey, 'confirmed');
      return { connection, rpcUrl, lamports };
    } catch (e) {
      lastErr = e;
      if (isSolanaRpcAccessDeniedError(e)) {
        console.warn(`[solanaServerRpc] RPC blocked chain access, trying next: ${safeHost(rpcUrl)}`);
        continue;
      }
      throw e;
    }
  }
  const hint =
    'Set SOLANA_RPC_BLOCKCHAIN_URL or SOLANA_RPC_URL in api/.env to an RPC that allows blockchain access (e.g. Helius, QuickNode, or public https://api.mainnet-beta.solana.com).';
  throw new Error(
    lastErr?.message ? `${hint} Last error: ${lastErr.message}` : hint,
  );
}

function safeHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '(invalid-url)';
  }
}
