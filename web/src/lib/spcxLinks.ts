/** Explorer and registry deep links for SPCX venue mints. */

export function solscanAccountUrl(mint: string): string {
  return `https://solscan.io/account/${encodeURIComponent(mint)}`;
}

export function solscanTxUrl(signature: string): string {
  return `https://solscan.io/tx/${encodeURIComponent(signature)}`;
}

export function dexScreenerTokenUrl(mint: string): string {
  return `https://dexscreener.com/solana/${encodeURIComponent(mint)}`;
}

export function xstocksAssetUrl(symbol: string): string {
  const normalized = symbol.replace(/x$/i, "").toUpperCase();
  return `https://xstocks.fi/assets/${encodeURIComponent(normalized)}`;
}
