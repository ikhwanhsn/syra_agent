/**
 * In-house x402 refund layer (replaces Pact Network).
 * Kill switch: REFUND_ENABLED=false
 */

function env(name) {
  return String(process.env[name] || "").trim();
}

function envFlag(name, defaultValue) {
  const raw = env(name).toLowerCase();
  if (!raw) return defaultValue;
  if (raw === "false" || raw === "0" || raw === "off" || raw === "no") return false;
  if (raw === "true" || raw === "1" || raw === "on" || raw === "yes") return true;
  return defaultValue;
}

/** Master kill switch. Default on (replaces always-on Pact coverage). */
export function isRefundEnabled() {
  return envFlag("REFUND_ENABLED", true);
}

export function isInboundRefundEnabled() {
  return isRefundEnabled() && envFlag("REFUND_COVER_INBOUND", true);
}

export function isOutboundRefundEnabled() {
  return isRefundEnabled() && envFlag("REFUND_COVER_OUTBOUND", true);
}

/**
 * Hosted Refund-as-a-Service for external agents.
 * Default off until an allowlist and pool caps are set.
 */
export function isHostedRefundEnabled() {
  return isRefundEnabled() && envFlag("REFUND_HOSTED_ENABLED", false);
}

/** Per-wallet daily hosted payout cap in USDC. Default $5. */
export function getPerWalletDailyRefundCapUsd() {
  const n = Number(env("REFUND_HOSTED_PER_WALLET_DAILY_USD") || "5");
  if (!Number.isFinite(n) || n <= 0) return 5;
  return n;
}

/** Global hosted daily payout cap in USDC. Default $50. */
export function getHostedDailyCapUsd() {
  const n = Number(env("REFUND_HOSTED_DAILY_USD") || "50");
  if (!Number.isFinite(n) || n <= 0) return 50;
  return n;
}

/**
 * Skip a hosted payout when remaining pool (ledger-estimated) would fall below this.
 * Default $10. Used with the daily cap; live on-chain balance is optional.
 */
export function getPoolMinBalanceUsd() {
  const n = Number(env("REFUND_POOL_MIN_BALANCE_USD") || "10");
  if (!Number.isFinite(n) || n < 0) return 10;
  return n;
}

/**
 * Hosted coverage allowlist. Empty = deny all (unlike internal outbound, which allows all).
 * Comma-separated hostnames.
 */
export function getHostedRefundAllowlist() {
  const raw = env("REFUND_HOSTED_ALLOWLIST");
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * @param {string} hostname
 */
export function isHostedHostnameEligible(hostname) {
  const host = String(hostname || "")
    .trim()
    .toLowerCase();
  if (!host) return false;
  const allowlist = getHostedRefundAllowlist();
  if (!allowlist.length) return false;
  return allowlist.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

/** Per-call cap in USDC. x402 calls are tiny; default $1. */
export function getMaxRefundUsd() {
  const n = Number(env("REFUND_MAX_USD") || "1");
  if (!Number.isFinite(n) || n <= 0) return 1;
  return n;
}

/** Empty = all hosts. Comma-separated hostnames when set. */
export function getRefundProviderAllowlist() {
  const raw = env("REFUND_PROVIDER_ALLOWLIST");
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * @param {string} hostname
 */
export function isHostnameRefundEligible(hostname) {
  const host = String(hostname || "")
    .trim()
    .toLowerCase();
  if (!host) return false;
  const allowlist = getRefundProviderAllowlist();
  if (!allowlist.length) return true;
  return allowlist.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

/**
 * Clamp a requested refund to the per-call cap.
 * @param {number} requestedUsd
 * @param {number} [maxUsd]
 */
export function clampRefundAmountUsd(requestedUsd, maxUsd = getMaxRefundUsd()) {
  const requested = Number(requestedUsd);
  if (!Number.isFinite(requested) || requested <= 0) return 0;
  const cap = Number(maxUsd);
  const limit = Number.isFinite(cap) && cap > 0 ? cap : requested;
  return Math.min(requested, limit);
}

/**
 * Map x402 accepted.network / CAIP-2 to a refund rail.
 * @param {string | null | undefined} network
 * @returns {'solana' | 'base' | 'xlayer' | 'algorand' | null}
 */
export function networkToRefundChain(network) {
  const n = String(network || "")
    .trim()
    .toLowerCase();
  if (!n) return null;
  if (n === "solana" || n.startsWith("solana:")) return "solana";
  if (n === "base" || n === "eip155:8453") return "base";
  if (n === "xlayer" || n === "eip155:196") return "xlayer";
  if (n === "algorand" || n.startsWith("algorand:")) return "algorand";
  return null;
}

/**
 * @param {number | string | bigint | null | undefined} micro
 * @returns {number | null}
 */
export function microUsdcToUsd(micro) {
  if (micro == null) return null;
  const n = typeof micro === "bigint" ? Number(micro) : Number(micro);
  if (!Number.isFinite(n)) return null;
  return n / 1_000_000;
}

export function getRefundResolvedConfig() {
  return {
    enabled: isRefundEnabled(),
    coverInbound: isInboundRefundEnabled(),
    coverOutbound: isOutboundRefundEnabled(),
    hosted: isHostedRefundEnabled(),
    maxRefundUsd: getMaxRefundUsd(),
    perWalletDailyCapUsd: getPerWalletDailyRefundCapUsd(),
    hostedDailyCapUsd: getHostedDailyCapUsd(),
    poolMinBalanceUsd: getPoolMinBalanceUsd(),
    providerAllowlist: getRefundProviderAllowlist(),
    hostedAllowlist: getHostedRefundAllowlist(),
    source: "syra-refund",
  };
}
