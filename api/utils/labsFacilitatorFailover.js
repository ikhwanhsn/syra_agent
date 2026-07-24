/**
 * Labs `/insights/*` facilitator profile selection for Solana/Base.
 *
 * Offer-time chain: Dexter → GoPlausible → PayAI.
 * Algorand keeps Dexter profile (AVM accepts appended separately via GoPlausible AVM).
 *
 * Settle-time cross-facilitator retry is intentionally NOT done — Exact SVM payments
 * bind to each facilitator's fee payer.
 */
import { isDexterHealthyForLabChain as defaultIsDexterHealthy } from './dexterSolanaFeePayerHealth.js';
import { isGoplausibleHealthyForLabChain as defaultIsGoplausibleHealthy } from './goplausibleFacilitatorHealth.js';

/** @typedef {'dexter' | 'goplausible' | 'payai'} LabsFacilitatorProfile */

/**
 * @typedef {object} LabsFacilitatorFailoverDeps
 * @property {(chain: string) => Promise<boolean>} [isDexterHealthyForLabChain]
 * @property {(chain: string) => Promise<boolean>} [isGoplausibleHealthyForLabChain]
 */

let loggedDexterFallback = false;
let loggedGoplausibleFallback = false;

/**
 * @param {import('express').Request | { get?: (name: string) => string | undefined }} req
 * @param {LabsFacilitatorFailoverDeps} [deps]
 * @returns {Promise<LabsFacilitatorProfile>}
 */
export async function resolveLabsFacilitatorProfile(req, deps = {}) {
  const isDexterHealthy = deps.isDexterHealthyForLabChain || defaultIsDexterHealthy;
  const isGoplausibleHealthy = deps.isGoplausibleHealthyForLabChain || defaultIsGoplausibleHealthy;

  const labChain = String(req?.get?.('x-lab-x402-chain') || '').trim().toLowerCase();
  // Algorand settles via GoPlausible AVM (appended accepts). Profile is unused for
  // accept building when x-lab-x402-chain=algorand (see buildPaymentRequired), but
  // keep Dexter so non-Algorand middleware paths stay consistent.
  if (labChain === 'algorand') return 'dexter';

  const healthChain = labChain === 'base' ? 'base' : 'solana';
  const dexterOk = await isDexterHealthy(healthChain);
  if (dexterOk) return 'dexter';

  if (!loggedDexterFallback) {
    loggedDexterFallback = true;
    console.warn(
      `[insights] Dexter unhealthy for Labs ${healthChain} — trying GoPlausible (Dexter remains primary when healthy)`,
    );
  }

  const goplausibleOk = await isGoplausibleHealthy(healthChain);
  if (goplausibleOk) return 'goplausible';

  if (!loggedGoplausibleFallback) {
    loggedGoplausibleFallback = true;
    console.warn(
      `[insights] GoPlausible unhealthy for Labs ${healthChain} — falling back to PayAI`,
    );
  }
  return 'payai';
}

/** Test helper — reset one-shot log flags. */
export function resetLabsFacilitatorFailoverLogFlags() {
  loggedDexterFallback = false;
  loggedGoplausibleFallback = false;
}
