/**
 * TopLedger Solana DeFi intelligence — pay-per-call via MPP at api.topledger.xyz/pay.
 * @see https://api.topledger.xyz/.well-known/x402
 */

export const TOPLEDGER_PAY_BASE_URL =
  (process.env.TOPLEDGER_API_BASE_URL || 'https://api.topledger.xyz/pay').replace(/\/$/, '');

/** Upstream MPP price per call (USD). */
export const TOPLEDGER_UPSTREAM_PRICE_USD = 0.0004;

export const TOPLEDGER_CACHE_TTL_MS = Number.parseInt(
  process.env.TOPLEDGER_CACHE_TTL_MS || String(5 * 60_000),
  10,
);

/** @type {Readonly<Record<string, string>>} */
export const TOPLEDGER_WALLET_PATHS = Object.freeze({
  analyze: '/api/wallets/{wallet}/analyze',
  holdings: '/api/wallets/{wallet}/holdings',
  lending: '/api/wallets/{wallet}/all-lending',
  perps: '/api/wallets/{wallet}/all-perps',
  staking: '/api/wallets/{wallet}/all-staking',
  lp: '/api/wallets/{wallet}/all-lp',
  yield: '/api/wallets/{wallet}/all-yield',
  rewards: '/api/wallets/{wallet}/all-rewards',
  dex: '/api/wallets/{wallet}/all-dex',
});
