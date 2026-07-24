/**
 * GoPlausible facilitator health for Labs x402 Solana/Base failover.
 *
 * When Dexter is unhealthy, Labs falls back to GoPlausible if healthy, else PayAI.
 *
 * Solana: Exact SVM payments are gas-sponsored by GoPlausible's fee payer.
 * Base: Probe GET /supported for live Base (eip155:8453) exact kind.
 *
 * @see https://facilitator.goplausible.xyz/supported
 */
import { PublicKey } from '@solana/web3.js';
import { pickSolanaConnectionForReads } from '../libs/solanaServerRpc.js';
import { getGoplausibleFacilitatorUrl } from '../config/goplausibleX402Networks.js';

/** Known GoPlausible mainnet Solana fee payer (from GET /supported). */
export const GOPLAUSIBLE_SOLANA_FEE_PAYER_DEFAULT =
  '8a8fFNfk2AGS7rgVv1BoqPUWnzQuoCrShJV8tSE6RAYi';

export const GOPLAUSIBLE_BASE_CAIP2 = 'eip155:8453';

/** Rent-exempt system account is ~0.00089 SOL; keep a working buffer for sponsored txs. */
const DEFAULT_MIN_SOL = 0.05;
const CACHE_TTL_MS = 60_000;
const FAIL_OPEN_CACHE_TTL_MS = 15_000;
const SUPPORTED_TIMEOUT_MS = Number.parseInt(
  process.env.GOPLAUSIBLE_SUPPORTED_TIMEOUT_MS || '3000',
  10,
) || 3000;
const BACKGROUND_REFRESH_MS = Math.max(10_000, CACHE_TTL_MS - 10_000);

/** @type {ReturnType<typeof setInterval> | null} */
let backgroundRefreshTimer = null;
/** @type {Promise<void> | null} */
let backgroundRefreshInFlight = null;

/**
 * @typedef {{
 *   healthy: boolean;
 *   solBalance: number | null;
 *   feePayer: string;
 *   minSol: number;
 *   reason: string;
 *   checkedAt: number;
 * }} GoplausibleFeePayerHealth
 */

/**
 * @typedef {{
 *   healthy: boolean;
 *   reachable: boolean;
 *   hasBaseExact: boolean;
 *   hasSolanaExact: boolean;
 *   kindsCount: number;
 *   reason: string;
 *   checkedAt: number;
 * }} GoplausibleSupportedHealth
 */

/** @type {GoplausibleFeePayerHealth | null} */
let feePayerCache = null;
/** @type {GoplausibleSupportedHealth | null} */
let supportedCache = null;

function envFloat(name, fallback) {
  const raw = String(process.env[name] ?? '').trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getGoplausibleSolanaFeePayerAddress() {
  const fromEnv = String(process.env.GOPLAUSIBLE_SOLANA_FEE_PAYER || '').trim();
  return fromEnv || GOPLAUSIBLE_SOLANA_FEE_PAYER_DEFAULT;
}

export function getGoplausibleSolanaFeePayerMinSol() {
  return envFloat('GOPLAUSIBLE_FEE_PAYER_MIN_SOL', DEFAULT_MIN_SOL);
}

/**
 * @param {{ checkedAt: number; softFail?: boolean }} status
 * @returns {boolean}
 */
function cacheStillFresh(status) {
  const ttl = status.softFail ? FAIL_OPEN_CACHE_TTL_MS : CACHE_TTL_MS;
  return Date.now() - status.checkedAt < ttl;
}

/**
 * @param {boolean} [forceRefresh]
 * @returns {Promise<GoplausibleFeePayerHealth>}
 */
export async function getGoplausibleSolanaFeePayerHealth(forceRefresh = false) {
  if (!forceRefresh && feePayerCache && cacheStillFresh({
    checkedAt: feePayerCache.checkedAt,
    softFail: feePayerCache.solBalance == null,
  })) {
    return feePayerCache;
  }

  const feePayer = getGoplausibleSolanaFeePayerAddress();
  const minSol = getGoplausibleSolanaFeePayerMinSol();
  const checkedAt = Date.now();

  try {
    const pk = new PublicKey(feePayer);
    const { connection, lamports } = await pickSolanaConnectionForReads(pk);
    const balanceLamports =
      typeof lamports === 'number'
        ? lamports
        : await connection.getBalance(pk, 'confirmed');
    const solBalance = Number(balanceLamports) / 1e9;
    const healthy = Number.isFinite(solBalance) && solBalance >= minSol;
    feePayerCache = {
      healthy,
      solBalance,
      feePayer,
      minSol,
      reason: healthy
        ? 'ok'
        : `underfunded:${solBalance.toFixed(6)}<${minSol}`,
      checkedAt,
    };
    if (!healthy) {
      console.warn(
        `[goplausible-health] Solana fee payer underfunded: ${feePayer} has ${solBalance.toFixed(6)} SOL (need ≥ ${minSol}). Labs may fall back to PayAI.`,
      );
    }
    return feePayerCache;
  } catch (e) {
    // Fail open: keep GoPlausible if RPC is flaky so we don't flap facilitators on transient reads.
    feePayerCache = {
      healthy: true,
      solBalance: null,
      feePayer,
      minSol,
      reason: `rpc_unavailable:${e?.message || e}`,
      checkedAt,
    };
    console.warn(
      '[goplausible-health] Solana fee payer probe failed — keeping GoPlausible until next check:',
      e?.message || e,
    );
    return feePayerCache;
  }
}

/**
 * @param {boolean} [forceRefresh]
 * @returns {Promise<boolean>}
 */
export async function isGoplausibleSolanaFeePayerHealthy(forceRefresh = false) {
  const status = await getGoplausibleSolanaFeePayerHealth(forceRefresh);
  return status.healthy;
}

/**
 * Probe GoPlausible GET /supported (cached). Used for Base (and shared reachability).
 * @param {boolean} [forceRefresh]
 * @returns {Promise<GoplausibleSupportedHealth>}
 */
export async function getGoplausibleSupportedHealth(forceRefresh = false) {
  if (!forceRefresh && supportedCache && cacheStillFresh({
    checkedAt: supportedCache.checkedAt,
    softFail: !supportedCache.reachable,
  })) {
    return supportedCache;
  }

  const checkedAt = Date.now();
  const url = `${getGoplausibleFacilitatorUrl().replace(/\/+$/, '')}/supported`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SUPPORTED_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      supportedCache = {
        healthy: false,
        reachable: false,
        hasBaseExact: false,
        hasSolanaExact: false,
        kindsCount: 0,
        reason: `supported_http_${res.status}`,
        checkedAt,
      };
      console.warn(
        `[goplausible-health] GET /supported returned ${res.status} — Labs Base may fall back to PayAI.`,
      );
      return supportedCache;
    }

    const body = await res.json().catch(() => ({}));
    const kinds = Array.isArray(body?.kinds) ? body.kinds : [];
    const hasBaseExact = kinds.some(
      (k) =>
        k?.scheme === 'exact' &&
        String(k?.network || '').trim() === GOPLAUSIBLE_BASE_CAIP2,
    );
    const hasSolanaExact = kinds.some(
      (k) =>
        k?.scheme === 'exact' &&
        String(k?.network || '').startsWith('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'),
    );
    const healthy = hasBaseExact;
    supportedCache = {
      healthy,
      reachable: true,
      hasBaseExact,
      hasSolanaExact,
      kindsCount: kinds.length,
      reason: healthy ? 'ok' : 'missing_base_exact',
      checkedAt,
    };
    if (!healthy) {
      console.warn(
        '[goplausible-health] GoPlausible /supported missing Base exact (eip155:8453) — Labs Base may fall back to PayAI.',
      );
    }
    return supportedCache;
  } catch (e) {
    // Fail open on transient network errors so we don't flap to PayAI on blips.
    supportedCache = {
      healthy: true,
      reachable: false,
      hasBaseExact: false,
      hasSolanaExact: false,
      kindsCount: 0,
      reason: `supported_unreachable:${e?.message || e}`,
      checkedAt,
    };
    console.warn(
      '[goplausible-health] GoPlausible /supported probe failed — keeping GoPlausible until next check:',
      e?.message || e,
    );
    return supportedCache;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {boolean} [forceRefresh]
 * @returns {Promise<boolean>}
 */
export async function isGoplausibleBaseHealthy(forceRefresh = false) {
  const status = await getGoplausibleSupportedHealth(forceRefresh);
  return status.healthy;
}

/**
 * Chain-aware GoPlausible health for Labs failover.
 * @param {'solana' | 'base' | string} chain
 * @param {boolean} [forceRefresh]
 * @returns {Promise<{ healthy: boolean; reason: string; chain: string }>}
 */
export async function getGoplausibleHealthForLabChain(chain, forceRefresh = false) {
  const c = String(chain || 'solana').trim().toLowerCase();
  if (c === 'base') {
    const status = await getGoplausibleSupportedHealth(forceRefresh);
    return { healthy: status.healthy, reason: status.reason, chain: 'base' };
  }
  const status = await getGoplausibleSolanaFeePayerHealth(forceRefresh);
  return { healthy: status.healthy, reason: status.reason, chain: 'solana' };
}

/**
 * @param {'solana' | 'base' | string} chain
 * @param {boolean} [forceRefresh]
 * @returns {Promise<boolean>}
 */
export async function isGoplausibleHealthyForLabChain(chain, forceRefresh = false) {
  const status = await getGoplausibleHealthForLabChain(chain, forceRefresh);
  return status.healthy;
}

/**
 * Force-refresh Solana fee-payer + Base /supported caches in parallel.
 * @returns {Promise<void>}
 */
export async function warmGoplausibleHealthCaches() {
  if (backgroundRefreshInFlight) return backgroundRefreshInFlight;
  backgroundRefreshInFlight = Promise.all([
    getGoplausibleSolanaFeePayerHealth(true).catch((e) => {
      console.warn('[goplausible-health] Solana warm failed:', e?.message || e);
    }),
    getGoplausibleSupportedHealth(true).catch((e) => {
      console.warn('[goplausible-health] Base /supported warm failed:', e?.message || e);
    }),
  ]).then(() => undefined).finally(() => {
    backgroundRefreshInFlight = null;
  });
  return backgroundRefreshInFlight;
}

/**
 * Warm GoPlausible health on boot and refresh in the background.
 * Idempotent — safe to call once from server startup.
 * @returns {void}
 */
export function startGoplausibleHealthBackgroundRefresh() {
  if (backgroundRefreshTimer) return;
  warmGoplausibleHealthCaches().catch(() => {});
  backgroundRefreshTimer = setInterval(() => {
    warmGoplausibleHealthCaches().catch(() => {});
  }, BACKGROUND_REFRESH_MS);
  if (typeof backgroundRefreshTimer.unref === 'function') {
    backgroundRefreshTimer.unref();
  }
}

/** Stop background refresh (tests / graceful shutdown). */
export function stopGoplausibleHealthBackgroundRefresh() {
  if (backgroundRefreshTimer) {
    clearInterval(backgroundRefreshTimer);
    backgroundRefreshTimer = null;
  }
}

/** Test helper — reset sticky caches between unit tests. */
export function resetGoplausibleFacilitatorHealthCache() {
  feePayerCache = null;
  supportedCache = null;
}
