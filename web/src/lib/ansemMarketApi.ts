import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/chatApi";
import {
  ANSEM,
  ANSEM_LIVE_REFETCH_MS,
  ANSEM_LOGO_URL,
  ANSEM_MINT,
} from "@/lib/ansem";

export interface AnsemMarketSnapshot {
  name: string;
  symbol: string;
  imageUrl: string;
  description: string | null;
  graduated: boolean | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  priceChange1hPercent: number | null;
  priceChange24hPercent: number | null;
  holderCount: number | null;
  dexUrl: string | null;
  fetchedAt: string;
  sources: string[];
}

interface DexScreenerPair {
  chainId?: string;
  dexId?: string;
  url?: string;
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h1?: number; h24?: number };
  baseToken?: { name?: string; symbol?: string };
  info?: { imageUrl?: string };
}

interface SyraPumpfunCoinResponse {
  success?: boolean;
  name?: string;
  symbol?: string;
  imageUri?: string;
  complete?: boolean;
}

function parseNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickBestDexPair(pairs: DexScreenerPair[]): DexScreenerPair | null {
  if (!pairs.length) return null;
  return [...pairs].sort((a, b) => {
    const la = a.liquidity?.usd ?? 0;
    const lb = b.liquidity?.usd ?? 0;
    return lb - la;
  })[0];
}

async function fetchDexScreenerMarket(signal?: AbortSignal): Promise<Partial<AnsemMarketSnapshot>> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${ANSEM_MINT}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Dexscreener ${res.status}`);
  const body = (await res.json()) as { pairs?: DexScreenerPair[] };
  const pair = pickBestDexPair(body.pairs ?? []);
  if (!pair) return {};

  return {
    name: pair.baseToken?.name?.trim() || undefined,
    symbol: pair.baseToken?.symbol?.trim() || undefined,
    imageUrl: pair.info?.imageUrl?.trim() || undefined,
    priceUsd: parseNum(pair.priceUsd),
    marketCapUsd: pair.marketCap ?? pair.fdv ?? null,
    liquidityUsd: pair.liquidity?.usd ?? null,
    volume24hUsd: pair.volume?.h24 ?? null,
    priceChange1hPercent: pair.priceChange?.h1 ?? null,
    priceChange24hPercent: pair.priceChange?.h24 ?? null,
    dexUrl: pair.url ?? null,
    sources: ["dexscreener"],
  };
}

async function fetchPumpfunMeta(signal?: AbortSignal): Promise<Partial<AnsemMarketSnapshot>> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const res = await fetch(`${base}/agent/pumpfun/coin/${ANSEM_MINT}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`pump.fun proxy ${res.status}`);
  const body = (await res.json()) as SyraPumpfunCoinResponse;
  if (body.success !== true) throw new Error("pump.fun metadata unavailable");

  return {
    name: body.name?.trim() || ANSEM.name,
    symbol: body.symbol?.trim() || ANSEM.symbol,
    imageUrl: body.imageUri?.trim() || undefined,
    graduated: body.complete ?? null,
    sources: ["pumpfun"],
  };
}

export async function fetchAnsemMarket(signal?: AbortSignal): Promise<AnsemMarketSnapshot> {
  const [dexResult, pumpResult] = await Promise.allSettled([
    fetchDexScreenerMarket(signal),
    fetchPumpfunMeta(signal),
  ]);

  const dex = dexResult.status === "fulfilled" ? dexResult.value : {};
  const pump = pumpResult.status === "fulfilled" ? pumpResult.value : {};

  const sources = [...new Set([...(dex.sources ?? []), ...(pump.sources ?? [])])];

  return {
    name: pump.name ?? dex.name ?? ANSEM.name,
    symbol: pump.symbol ?? dex.symbol ?? ANSEM.symbol,
    imageUrl: pump.imageUrl ?? dex.imageUrl ?? ANSEM_LOGO_URL,
    description: null,
    graduated: pump.graduated ?? null,
    priceUsd: dex.priceUsd ?? null,
    marketCapUsd: dex.marketCapUsd ?? null,
    liquidityUsd: dex.liquidityUsd ?? null,
    volume24hUsd: dex.volume24hUsd ?? null,
    priceChange1hPercent: dex.priceChange1hPercent ?? null,
    priceChange24hPercent: dex.priceChange24hPercent ?? null,
    holderCount: null,
    dexUrl: dex.dexUrl ?? null,
    fetchedAt: new Date().toISOString(),
    sources,
  };
}

export function useAnsemMarket() {
  return useQuery({
    queryKey: ["ansem-market", ANSEM_MINT],
    queryFn: ({ signal }) => fetchAnsemMarket(signal),
    staleTime: 30_000,
    refetchInterval: ANSEM_LIVE_REFETCH_MS,
    retry: 2,
  });
}
