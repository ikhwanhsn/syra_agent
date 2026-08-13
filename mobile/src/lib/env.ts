const PRODUCTION_API_DEFAULT = 'https://api.syraa.fun';

/** Override at build time via Metro env if needed. */
const API_OVERRIDE: string | undefined = undefined;

export function getApiBaseUrl(): string {
  const raw = (API_OVERRIDE || PRODUCTION_API_DEFAULT).trim().replace(/\/$/, '');
  return raw || PRODUCTION_API_DEFAULT;
}

/** Solana mainnet RPC. Prefer a dedicated RPC in production. */
export function getSolanaRpcUrl(): string {
  return 'https://api.mainnet-beta.solana.com';
}

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const SOLANA_MAINNET_CAIP2 = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
