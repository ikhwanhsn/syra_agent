/** DexScreener public API — https://docs.dexscreener.com/api/reference */

const DEXSCREENER_TOKENS_V1 = "https://api.dexscreener.com/tokens/v1";

export interface DexScreenerTokenRef {
  address: string;
  name: string;
  symbol: string;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: DexScreenerTokenRef;
  quoteToken: DexScreenerTokenRef;
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: { h24: number; h6: number; h1: number; m5: number };
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  liquidity: { usd: number; base: number; quote: number };
  fdv: number;
  marketCap: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    header?: string;
    openGraph?: string;
    websites?: { url: string; label?: string }[];
    socials?: { url: string; type?: string }[];
  };
}

function isDexScreenerPair(value: unknown): value is DexScreenerPair {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  const base = o.baseToken;
  if (typeof base !== "object" || base === null) return false;
  const addr = (base as Record<string, unknown>).address;
  return typeof addr === "string" && typeof o.dexId === "string" && typeof o.url === "string";
}

/**
 * Fetches pair stats for one or more Solana token mints (comma-separated in one request).
 */
export async function fetchSolanaTokenPairs(mints: readonly string[]): Promise<DexScreenerPair[]> {
  if (mints.length === 0) return [];
  const path = mints.map((m) => encodeURIComponent(m)).join(",");
  const res = await fetch(`${DEXSCREENER_TOKENS_V1}/solana/${path}`);
  if (!res.ok) {
    throw new Error(`DexScreener request failed (${res.status})`);
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("DexScreener returned an unexpected shape");
  }
  return data.filter(isDexScreenerPair);
}

/**
 * When multiple pairs exist for the same base mint, keep the one with highest USD liquidity.
 */
export function bestPairByMint(pairs: readonly DexScreenerPair[]): Map<string, DexScreenerPair> {
  const map = new Map<string, DexScreenerPair>();
  for (const p of pairs) {
    const mint = p.baseToken.address;
    const prev = map.get(mint);
    if (!prev || (p.liquidity?.usd ?? 0) > (prev.liquidity?.usd ?? 0)) {
      map.set(mint, p);
    }
  }
  return map;
}
