/**
 * Pact Network — x402 refund / risk layer for agent outbound paid calls.
 * Always enabled; no API key required (V1 proxy uses ed25519 request signing only).
 * @see https://www.pactnetwork.io/docs
 */

/** @typedef {'mainnet' | 'devnet' | 'localnet'} PactNetwork */
/** @typedef {'network' | 'market'} PactMode */

/** Pact refund coverage is always on for agent outbound x402 calls. */
export function isPactEnabled() {
  return true;
}

/** @returns {PactNetwork} */
export function getPactNetwork() {
  return 'mainnet';
}

/** @returns {PactMode} */
export function getPactMode() {
  return 'market';
}

/** Solana RPC for on-chain setup/top-up — reuse server blockchain RPC when set. */
export function getPactRpcUrl() {
  return (
    String(process.env.SOLANA_RPC_BLOCKCHAIN_URL || '').trim() ||
    String(process.env.SOLANA_RPC_URL || '').trim() ||
    undefined
  );
}

export function getPactProxyBaseUrl() {
  return 'https://market.pactnetwork.io';
}

export function getPactIndexerBaseUrl() {
  return 'https://indexer.pactnetwork.io';
}

export function getPactProject() {
  return 'syra';
}

export function getPactDefaultAllowanceUsdc() {
  return 5;
}

/** Estimated per-call premium (USDC) for balance checks; actual premium is endpoint-fixed on-chain. */
export function getPactPremiumUsdDefault() {
  return 0.001;
}

/** Empty = all registered providers. */
export function getPactProviderAllowlist() {
  return [];
}

/** Auto-run pact.setup() SPL approve on first covered fetch per agent. */
export function isPactAutoSetupEnabled() {
  return true;
}

/**
 * @param {string} hostname
 */
export function isHostnamePactEligible(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  if (!host) return false;
  const allowlist = getPactProviderAllowlist();
  if (!allowlist.length) return true;
  return allowlist.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

/** Resolved config snapshot for createPact(). */
export function getPactResolvedConfig() {
  return {
    network: getPactNetwork(),
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
