/**
 * Crossmint onramp configuration.
 * Product flags live in config/settlement.js; API keys stay in env (secrets).
 */

import { CROSSMINT_ONRAMP } from '../../config/settlement.js';
import { optionalSecret } from '../../config/secrets.js';

const USDC_TOKEN_LOCATORS = {
  staging: {
    solana: 'solana:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    base: 'base-sepolia:0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  production: {
    solana: 'solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    base: 'base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
};

export function getCrossmintEnv() {
  const raw = String(CROSSMINT_ONRAMP.env || 'staging')
    .trim()
    .toLowerCase();
  return raw === 'production' || raw === 'prod' ? 'production' : 'staging';
}

export function getCrossmintApiBaseUrl() {
  return getCrossmintEnv() === 'production'
    ? 'https://www.crossmint.com/api'
    : 'https://staging.crossmint.com/api';
}

export function getCrossmintServerApiKey() {
  return optionalSecret('CROSSMINT_SERVER_API_KEY');
}

export function getCrossmintClientApiKey() {
  return optionalSecret('CROSSMINT_CLIENT_API_KEY');
}

export function getCrossmintWebhookSecret() {
  return optionalSecret('CROSSMINT_WEBHOOK_SECRET');
}

export function isCrossmintOnrampEnabled() {
  if (!CROSSMINT_ONRAMP.enabled) return false;
  return Boolean(getCrossmintServerApiKey() && getCrossmintClientApiKey());
}

export function getUsdcTokenLocator(chain = 'solana') {
  const env = getCrossmintEnv();
  const key = chain === 'base' ? 'base' : 'solana';
  return USDC_TOKEN_LOCATORS[env][key];
}

export function getOnrampAmountLimits() {
  return {
    defaultUsd: CROSSMINT_ONRAMP.defaultAmountUsd,
    minUsd: CROSSMINT_ONRAMP.minAmountUsd,
    maxUsd: CROSSMINT_ONRAMP.maxAmountUsd,
  };
}

export function getCrossmintPublicStatus() {
  const enabled = isCrossmintOnrampEnabled();
  const limits = getOnrampAmountLimits();
  return {
    enabled,
    env: getCrossmintEnv(),
    clientApiKeyConfigured: Boolean(getCrossmintClientApiKey()),
    defaultAmountUsd: limits.defaultUsd,
    minAmountUsd: limits.minUsd,
    maxAmountUsd: limits.maxUsd,
    supportedChains: ['solana', 'base'],
    fundingSource: 'crossmint_onramp',
  };
}
