/**
 * Pact Network — x402 refund / risk layer for agent outbound paid calls.
 * Default: off. Set PACT_ENABLED=true to wrap agent fetch with @q3labs/pact-sdk.
 * @see https://www.pactnetwork.io/docs
 */

/** @typedef {'mainnet' | 'devnet' | 'localnet'} PactNetwork */
/** @typedef {'network' | 'market'} PactMode */

function trimEnv(name) {
  return String(process.env[name] || '').trim();
}

/**
 * Whether Pact refund coverage is active for agent outbound x402 calls.
 */
export function isPactEnabled() {
  const raw = trimEnv('PACT_ENABLED').toLowerCase();
  return raw === 'true' || raw === '1';
}

/**
 * Optional beta / proxy API key (maps to createPact apiKey).
 */
export function getPactApiKey() {
  return trimEnv('PACT_API_KEY') || undefined;
}

/**
 * @returns {PactNetwork}
 */
export function getPactNetwork() {
  const raw = trimEnv('PACT_NETWORK').toLowerCase();
  if (raw === 'devnet' || raw === 'localnet') return raw;
  return 'mainnet';
}

/**
 * network = protocol rails; market = curated proxy (default proxyBaseUrl).
 * @returns {PactMode}
 */
export function getPactMode() {
  const raw = trimEnv('PACT_MODE').toLowerCase();
  return raw === 'network' ? 'network' : 'market';
}

export function getPactRpcUrl() {
  return (
    trimEnv('PACT_RPC_URL') ||
    trimEnv('SOLANA_RPC_BLOCKCHAIN_URL') ||
    trimEnv('SOLANA_RPC_URL') ||
    undefined
  );
}

export function getPactProxyBaseUrl() {
  const explicit = trimEnv('PACT_PROXY_BASE_URL');
  if (explicit) return explicit;
  if (getPactMode() === 'market') {
    return trimEnv('PACT_MARKET_URL') || 'https://market.pactnetwork.io';
  }
  return undefined;
}

export function getPactIndexerBaseUrl() {
  return trimEnv('PACT_INDEXER_BASE_URL') || undefined;
}

export function getPactProject() {
  return trimEnv('PACT_PROJECT') || 'syra';
}

export function getPactDefaultAllowanceUsdc() {
  const n = Number(trimEnv('PACT_DEFAULT_ALLOWANCE_USDC') || '5');
  return Number.isFinite(n) && n > 0 ? n : 5;
}

/**
 * Estimated per-call premium (USDC) added to balance checks when Pact is on.
 * Override via PACT_PREMIUM_USD_DEFAULT; actual premium is endpoint-fixed on-chain.
 */
export function getPactPremiumUsdDefault() {
  const n = Number(trimEnv('PACT_PREMIUM_USD_DEFAULT') || '0.001');
  return Number.isFinite(n) && n >= 0 ? n : 0.001;
}

/**
 * Comma-separated hostnames for phased rollout (e.g. api.nansen.ai).
 * Empty = all registered providers when Pact is enabled.
 * @returns {string[]}
 */
export function getPactProviderAllowlist() {
  const raw = trimEnv('PACT_PROVIDER_ALLOWLIST');
  if (!raw) return [];
  return raw
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export function isPactAutoSetupEnabled() {
  const raw = trimEnv('PACT_AUTO_SETUP').toLowerCase();
  return raw === 'true' || raw === '1';
}

/**
 * @param {string} hostname
 */
export function isHostnamePactEligible(hostname) {
  if (!isPactEnabled()) return false;
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  const allowlist = getPactProviderAllowlist();
  if (!allowlist.length) return true;
  return allowlist.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

/**
 * Resolved config snapshot for createPact().
 */
export function getPactResolvedConfig() {
  return {
    network: getPactNetwork(),
    apiKey: getPactApiKey(),
    rpcUrl: getPactRpcUrl(),
    proxyBaseUrl: getPactProxyBaseUrl(),
    indexerBaseUrl: getPactIndexerBaseUrl(),
    project: getPactProject(),
    defaultAllowanceUsdc: getPactDefaultAllowanceUsdc(),
    premiumUsdDefault: getPactPremiumUsdDefault(),
    providerAllowlist: getPactProviderAllowlist(),
    autoSetup: isPactAutoSetupEnabled(),
    mode: getPactMode(),
  };
}
