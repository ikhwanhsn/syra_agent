/**
 * Dexter facilitator health for Labs x402 (Solana + Base).
 *
 * Dexter stays the primary facilitator. When unhealthy for a given chain, Labs
 * `/insights/*` fall back to PayAI until Dexter recovers.
 *
 * Solana: Exact SVM payments are gas-sponsored by Dexter's fee payer. When that
 * wallet is ~rent-exempt only, every payment fails with InsufficientFundsForRent.
 *
 * Base: EVM settle does not use the Solana fee payer. We probe Dexter GET /supported
 * for a live Base (eip155:8453) exact kind — unreachable facilitator or missing Base
 * means PayAI failover.
 */
import { PublicKey } from '@solana/web3.js';
import { pickSolanaConnectionForReads } from '../libs/solanaServerRpc.js';

/** Known Dexter mainnet fee payer (from https://x402.dexter.cash/supported). */
export const DEXTER_SOLANA_FEE_PAYER_DEFAULT = 'DeXterR2kQm8AvRHnNPatWkE46TfAcMeBDjb6FySoAb8';

export const DEXTER_BASE_CAIP2 = 'eip155:8453';

/** Rent-exempt system account is ~0.00089 SOL; keep a working buffer for many sponsored txs. */
const DEFAULT_MIN_SOL = 0.05;
const CACHE_TTL_MS = 60_000;
const FAIL_OPEN_CACHE_TTL_MS = 15_000;
/** Fail fast so cold probes never drag the hot path; background refresh keeps cache warm. */
const SUPPORTED_TIMEOUT_MS = Number.parseInt(
  process.env.DEXTER_SUPPORTED_TIMEOUT_MS || '3000',
  10,
) || 3000;
/** Refresh slightly before TTL so hot-path reads almost always hit a fresh cache. */
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
 * }} DexterFeePayerHealth
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
 * }} DexterSupportedHealth
 */

/** @type {DexterFeePayerHealth | null} */
let feePayerCache = null;
/** @type {DexterSupportedHealth | null} */
let supportedCache = null;

function envFloat(name, fallback) {
  const raw = String(process.env[name] ?? '').trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function getDexterFacilitatorUrl() {
  return (
    String(process.env.DEXTER_FACILITATOR_URL || '').trim().replace(/\/+$/, '') ||
    'https://x402.dexter.cash'
  );
}

export function getDexterSolanaFeePayerAddress() {
  const fromEnv = String(process.env.DEXTER_SOLANA_FEE_PAYER || '').trim();
  return fromEnv || DEXTER_SOLANA_FEE_PAYER_DEFAULT;
}

export function getDexterSolanaFeePayerMinSol() {
  return envFloat('DEXTER_FEE_PAYER_MIN_SOL', DEFAULT_MIN_SOL);
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
 * @returns {Promise<DexterFeePayerHealth>}
 */
export async function getDexterSolanaFeePayerHealth(forceRefresh = false) {
  if (!forceRefresh && feePayerCache && cacheStillFresh({
    checkedAt: feePayerCache.checkedAt,
    softFail: feePayerCache.solBalance == null,
  })) {
    return feePayerCache;
  }

  const feePayer = getDexterSolanaFeePayerAddress();
  const minSol = getDexterSolanaFeePayerMinSol();
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
        `[dexter-health] Solana fee payer underfunded: ${feePayer} has ${solBalance.toFixed(6)} SOL (need ≥ ${minSol}). Labs Solana will fall back to PayAI.`,
      );
    }
    return feePayerCache;
  } catch (e) {
    // Fail open: keep Dexter if RPC is flaky so we don't flap facilitators on transient reads.
    feePayerCache = {
      healthy: true,
      solBalance: null,
      feePayer,
      minSol,
      reason: `rpc_unavailable:${e?.message || e}`,
      checkedAt,
    };
    console.warn(
      '[dexter-health] Solana fee payer probe failed — keeping Dexter until next check:',
      e?.message || e,
    );
    return feePayerCache;
  }
}

/**
 * @param {boolean} [forceRefresh]
 * @returns {Promise<boolean>}
 */
export async function isDexterSolanaFeePayerHealthy(forceRefresh = false) {
  const status = await getDexterSolanaFeePayerHealth(forceRefresh);
  return status.healthy;
}

/**
 * Probe Dexter GET /supported (cached). Used for Base (and shared reachability).
 * @param {boolean} [forceRefresh]
 * @returns {Promise<DexterSupportedHealth>}
 */
export async function getDexterSupportedHealth(forceRefresh = false) {
  if (!forceRefresh && supportedCache && cacheStillFresh({
    checkedAt: supportedCache.checkedAt,
    softFail: !supportedCache.reachable,
  })) {
    return supportedCache;
  }

  const checkedAt = Date.now();
  const url = `${getDexterFacilitatorUrl()}/supported`;
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
        `[dexter-health] GET /supported returned ${res.status} — Labs Base will fall back to PayAI.`,
      );
      return supportedCache;
    }

    const body = await res.json().catch(() => ({}));
    const kinds = Array.isArray(body?.kinds) ? body.kinds : [];
    const hasBaseExact = kinds.some(
      (k) =>
        k?.scheme === 'exact' &&
        String(k?.network || '').trim() === DEXTER_BASE_CAIP2,
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
        '[dexter-health] Dexter /supported missing Base exact (eip155:8453) — Labs Base will fall back to PayAI.',
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
      '[dexter-health] Dexter /supported probe failed — keeping Dexter until next check:',
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
export async function isDexterBaseHealthy(forceRefresh = false) {
  const status = await getDexterSupportedHealth(forceRefresh);
  return status.healthy;
}

/**
 * Chain-aware Dexter health for Labs failover (Dexter remains primary when healthy).
 * @param {'solana' | 'base' | string} chain
 * @param {boolean} [forceRefresh]
 * @returns {Promise<{ healthy: boolean; reason: string; chain: string }>}
 */
export async function getDexterHealthForLabChain(chain, forceRefresh = false) {
  const c = String(chain || 'solana').trim().toLowerCase();
  if (c === 'base') {
    const status = await getDexterSupportedHealth(forceRefresh);
    return { healthy: status.healthy, reason: status.reason, chain: 'base' };
  }
  const status = await getDexterSolanaFeePayerHealth(forceRefresh);
  return { healthy: status.healthy, reason: status.reason, chain: 'solana' };
}

/**
 * @param {'solana' | 'base' | string} chain
 * @param {boolean} [forceRefresh]
 * @returns {Promise<boolean>}
 */
export async function isDexterHealthyForLabChain(chain, forceRefresh = false) {
  const status = await getDexterHealthForLabChain(chain, forceRefresh);
  return status.healthy;
}

/**
 * Force-refresh Solana fee-payer + Base /supported caches in parallel.
 * Safe to call on boot and from the background interval.
 * @returns {Promise<void>}
 */
export async function warmDexterHealthCaches() {
  if (backgroundRefreshInFlight) return backgroundRefreshInFlight;
  backgroundRefreshInFlight = Promise.all([
    getDexterSolanaFeePayerHealth(true).catch((e) => {
      console.warn('[dexter-health] Solana warm failed:', e?.message || e);
    }),
    getDexterSupportedHealth(true).catch((e) => {
      console.warn('[dexter-health] Base /supported warm failed:', e?.message || e);
    }),
  ]).then(() => undefined).finally(() => {
    backgroundRefreshInFlight = null;
  });
  return backgroundRefreshInFlight;
}

/**
 * Warm Dexter health on boot and refresh in the background so Labs `/insights/*`
 * never pays an inline cold probe (up to SUPPORTED_TIMEOUT_MS) on the request path.
 * Idempotent — safe to call once from server startup.
 * @returns {void}
 */
export function startDexterHealthBackgroundRefresh() {
  if (backgroundRefreshTimer) return;
  warmDexterHealthCaches().catch(() => {});
  backgroundRefreshTimer = setInterval(() => {
    warmDexterHealthCaches().catch(() => {});
  }, BACKGROUND_REFRESH_MS);
  if (typeof backgroundRefreshTimer.unref === 'function') {
    backgroundRefreshTimer.unref();
  }
}

/** Stop background refresh (tests / graceful shutdown). */
export function stopDexterHealthBackgroundRefresh() {
  if (backgroundRefreshTimer) {
    clearInterval(backgroundRefreshTimer);
    backgroundRefreshTimer = null;
  }
}

/** Test helper — reset sticky caches between unit tests. */
export function resetDexterSolanaFeePayerHealthCache() {
  feePayerCache = null;
  supportedCache = null;
}

/** @deprecated alias — prefer resetDexterSolanaFeePayerHealthCache */
export function resetDexterFacilitatorHealthCache() {
  resetDexterSolanaFeePayerHealthCache();
}
