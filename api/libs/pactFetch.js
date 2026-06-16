/**
 * Pact Network fetch wrapper — composes on top of Sentinel/base fetch.
 * Golden rule: Pact must never break a working call; init failures degrade to baseFetch.
 */
import { createPact } from '@q3labs/pact-sdk';
import {
  isPactEnabled,
  isHostnamePactEligible,
  isPactAutoSetupEnabled,
  getPactResolvedConfig,
} from './pactConfig.js';
import { registerPactEventHandlers } from './pactRefundService.js';

/** @type {Map<string, import('@q3labs/pact-sdk').PactInstance>} */
const pactInstanceCache = new Map();

/** @type {Set<string>} */
const setupAttempted = new Set();

/**
 * @param {string} agentId
 * @param {import('@solana/web3.js').Keypair} keypair
 */
async function getOrCreatePactInstance(agentId, keypair) {
  const pubkey = keypair.publicKey.toBase58();
  const cacheKey = `${agentId}:${pubkey}`;
  if (pactInstanceCache.has(cacheKey)) {
    return pactInstanceCache.get(cacheKey);
  }

  const cfg = getPactResolvedConfig();
  try {
    const pact = await createPact({
      network: cfg.network,
      signer: keypair,
      rpcUrl: cfg.rpcUrl,
      proxyBaseUrl: cfg.proxyBaseUrl,
      indexerBaseUrl: cfg.indexerBaseUrl,
      project: cfg.project,
      defaultAllowanceUsdc: cfg.defaultAllowanceUsdc,
    });

    registerPactEventHandlers(pact, { agentId, agentPubkey: pubkey });
    pactInstanceCache.set(cacheKey, pact);

    if (isPactAutoSetupEnabled() && !setupAttempted.has(cacheKey)) {
      setupAttempted.add(cacheKey);
      pact
        .setup({ allowanceUsdc: cfg.defaultAllowanceUsdc })
        .then((r) => {
          console.info(`[pact] setup ok agent=${agentId} tx=${r.txSignature}`);
        })
        .catch((e) => {
          console.warn(`[pact] setup failed agent=${agentId}:`, e?.message || e);
        });
    }

    return pact;
  } catch (e) {
    console.warn(`[pact] createPact failed agent=${agentId}:`, e?.message || e);
    return null;
  }
}

/**
 * @param {string} input
 */
function hostnameFromFetchInput(input) {
  try {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : String(input);
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Wrap base fetch with Pact coverage when enabled and agent has a signer.
 * @param {typeof fetch} baseFetch
 * @param {{ agentId: string; keypair: import('@solana/web3.js').Keypair | null }} opts
 * @returns {Promise<typeof fetch>}
 */
export async function wrapFetchWithPact(baseFetch, { agentId, keypair }) {
  if (!isPactEnabled() || !keypair) {
    return baseFetch;
  }

  const pact = await getOrCreatePactInstance(agentId, keypair);
  if (!pact) {
    return baseFetch;
  }

  let wrapped;
  try {
    wrapped = pact.wrap(baseFetch);
  } catch (e) {
    console.warn(`[pact] wrap failed agent=${agentId}:`, e?.message || e);
    return baseFetch;
  }

  const cfg = getPactResolvedConfig();
  const allowlistActive = cfg.providerAllowlist.length > 0;

  /** @type {typeof fetch} */
  const selectiveFetch = async (input, init) => {
    const host = hostnameFromFetchInput(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input?.url
    );
    if (allowlistActive && !isHostnamePactEligible(host)) {
      return baseFetch(input, init);
    }
    return wrapped(input, init);
  };

  return selectiveFetch;
}

/**
 * Clear cached Pact instances (tests / hot reload).
 */
export function clearPactFetchCache() {
  pactInstanceCache.clear();
  setupAttempted.clear();
}

/**
 * @param {string} agentId
 * @param {import('@solana/web3.js').Keypair} keypair
 */
export async function getPactInstanceForAgent(agentId, keypair) {
  if (!isPactEnabled() || !keypair) return null;
  return getOrCreatePactInstance(agentId, keypair);
}
