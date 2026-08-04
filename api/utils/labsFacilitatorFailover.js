/**
 * Facilitator profile selection: Dexter → GoPlausible → PayAI.
 *
 * Used as the global default for all paid x402 routes (when
 * X402_DEFAULT_FACILITATOR_FAILOVER is enabled, which is the default),
 * and by Labs `/insights/*` via resolveLabsFacilitatorProfile.
 *
 * Solana settle-time cross-facilitator retry is intentionally NOT done — Exact SVM
 * payments bind to each facilitator's fee payer (local on-chain confirm is used instead).
 * EVM verify/settle may retry Dexter → GoPlausible → PayAI (same merchant payTo).
 */
import { isDexterHealthyForLabChain as defaultIsDexterHealthy } from './dexterSolanaFeePayerHealth.js';
import { isGoplausibleHealthyForLabChain as defaultIsGoplausibleHealthy } from './goplausibleFacilitatorHealth.js';

/** @typedef {'dexter' | 'goplausible' | 'payai'} FacilitatorFailoverProfile */

/**
 * @typedef {object} FacilitatorFailoverDeps
 * @property {(chain: string) => Promise<boolean>} [isDexterHealthyForLabChain]
 * @property {(chain: string) => Promise<boolean>} [isGoplausibleHealthyForLabChain]
 */

let loggedDexterFallback = false;
let loggedGoplausibleFallback = false;

/**
 * Kill switch: when false/0, callers skip health-based default and keep PayAI.
 * Default: enabled (true).
 * @returns {boolean}
 */
export function isDefaultFacilitatorFailoverEnabled() {
  const raw = String(process.env.X402_DEFAULT_FACILITATOR_FAILOVER ?? '').trim().toLowerCase();
  if (raw === 'false' || raw === '0' || raw === 'off' || raw === 'no') return false;
  // Explicit true, empty (default on), or any other truthy-ish value → enabled
  return true;
}

/**
 * Resolve health-check chain hint from request headers / options.
 * Defaults to solana (Dexter gas-sponsored flagship).
 * @param {import('express').Request | { get?: (name: string) => string | undefined } | null | undefined} req
 * @param {{ healthChain?: string }} [options]
 * @returns {'solana' | 'base'}
 */
export function resolveFacilitatorHealthChain(req, options = {}) {
  const fromOptions = String(options?.healthChain || '').trim().toLowerCase();
  if (fromOptions === 'base') return 'base';
  if (fromOptions === 'solana') return 'solana';

  const labChain = String(req?.get?.('x-lab-x402-chain') || '').trim().toLowerCase();
  if (labChain === 'base') return 'base';

  const hint = String(req?.get?.('x-x402-health-chain') || '').trim().toLowerCase();
  if (hint === 'base') return 'base';

  return 'solana';
}

/**
 * Offer-time facilitator selection: Dexter → GoPlausible → PayAI.
 * @param {import('express').Request | { get?: (name: string) => string | undefined } | null | undefined} [req]
 * @param {FacilitatorFailoverDeps & { healthChain?: string; logContext?: string }} [deps]
 * @returns {Promise<FacilitatorFailoverProfile>}
 */
export async function resolveDefaultFacilitatorProfile(req, deps = {}) {
  const isDexterHealthy = deps.isDexterHealthyForLabChain || defaultIsDexterHealthy;
  const isGoplausibleHealthy = deps.isGoplausibleHealthyForLabChain || defaultIsGoplausibleHealthy;
  const logCtx = deps.logContext || 'x402';

  const healthChain = resolveFacilitatorHealthChain(req, deps);
  const dexterOk = await isDexterHealthy(healthChain);
  if (dexterOk) return 'dexter';

  if (!loggedDexterFallback) {
    loggedDexterFallback = true;
    console.warn(
      `[${logCtx}] Dexter unhealthy for ${healthChain} — trying GoPlausible (Dexter remains primary when healthy)`,
    );
  }

  const goplausibleOk = await isGoplausibleHealthy(healthChain);
  if (goplausibleOk) return 'goplausible';

  if (!loggedGoplausibleFallback) {
    loggedGoplausibleFallback = true;
    console.warn(
      `[${logCtx}] GoPlausible unhealthy for ${healthChain} — falling back to PayAI`,
    );
  }
  return 'payai';
}

/**
 * Labs `/insights/*` facilitator profile selection for Solana/Base/Algorand/X Layer.
 *
 * Algorand and X Layer build accepts on dedicated rails (GoPlausible AVM / OKX), but the
 * selected profile still drives `ensureX402ForReq` + `createPaymentRequiredResponse`.
 * Pinning Dexter when its API is down makes every Labs tab return HTTP 500 before those
 * rails run — use the same Dexter→GoPlausible→PayAI health failover as Solana/Base.
 *
 * @param {import('express').Request | { get?: (name: string) => string | undefined }} req
 * @param {FacilitatorFailoverDeps} [deps]
 * @returns {Promise<FacilitatorFailoverProfile>}
 */
export async function resolveLabsFacilitatorProfile(req, deps = {}) {
  const labChain = String(req?.get?.('x-lab-x402-chain') || '').trim().toLowerCase();
  // AVM/OKX accepts ignore the SVM/EVM profile, but init must still hit a live facilitator.
  // Prefer Base /supported health so a Dexter Solana-fee-payer-only blip does not matter here.
  if (
    labChain === 'algorand' ||
    labChain === 'xlayer' ||
    labChain === 'x-layer' ||
    labChain === 'okx' ||
    labChain === '196'
  ) {
    return resolveDefaultFacilitatorProfile(req, {
      ...deps,
      healthChain: 'base',
      logContext: 'insights',
    });
  }

  return resolveDefaultFacilitatorProfile(req, {
    ...deps,
    logContext: 'insights',
  });
}

/** Test helper — reset one-shot log flags. */
export function resetLabsFacilitatorFailoverLogFlags() {
  loggedDexterFallback = false;
  loggedGoplausibleFallback = false;
}

/** @deprecated alias — prefer resetLabsFacilitatorFailoverLogFlags */
export function resetFacilitatorFailoverLogFlags() {
  resetLabsFacilitatorFailoverLogFlags();
}
