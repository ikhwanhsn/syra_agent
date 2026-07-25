/**
 * Crossmint onramp configuration.
 *
 * Env:
 *   CROSSMINT_ONRAMP_ENABLED=true|false
 *   CROSSMINT_SERVER_API_KEY=sk_...
 *   CROSSMINT_CLIENT_API_KEY=ck_...   (returned to web for Embedded Checkout)
 *   CROSSMINT_ENV=staging|production (default staging)
 *   CROSSMINT_WEBHOOK_SECRET=whsec_... (Svix signing secret)
 *   CROSSMINT_DEFAULT_AMOUNT_USD=10
 *   CROSSMINT_MIN_AMOUNT_USD=10
 *   CROSSMINT_MAX_AMOUNT_USD=500
 */

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

function envFlag(name) {
  const v = String(process.env[name] || '')
    .trim()
    .toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function parseUsd(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getCrossmintEnv() {
  const raw = String(process.env.CROSSMINT_ENV || 'staging')
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
  return String(process.env.CROSSMINT_SERVER_API_KEY || '').trim();
}

export function getCrossmintClientApiKey() {
  return String(process.env.CROSSMINT_CLIENT_API_KEY || '').trim();
}

export function getCrossmintWebhookSecret() {
  return String(process.env.CROSSMINT_WEBHOOK_SECRET || '').trim();
}

export function isCrossmintOnrampEnabled() {
  if (!envFlag('CROSSMINT_ONRAMP_ENABLED')) return false;
  return Boolean(getCrossmintServerApiKey() && getCrossmintClientApiKey());
}

export function getUsdcTokenLocator(chain = 'solana') {
  const env = getCrossmintEnv();
  const key = chain === 'base' ? 'base' : 'solana';
  return USDC_TOKEN_LOCATORS[env][key];
}

export function getOnrampAmountLimits() {
  return {
    defaultUsd: parseUsd('CROSSMINT_DEFAULT_AMOUNT_USD', 10),
    minUsd: parseUsd('CROSSMINT_MIN_AMOUNT_USD', 10),
    maxUsd: parseUsd('CROSSMINT_MAX_AMOUNT_USD', 500),
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
