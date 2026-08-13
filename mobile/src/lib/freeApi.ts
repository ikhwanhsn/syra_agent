import {apiGetJson, type ApiEnvelope} from './api';

export type FreePriceMap = Record<
  string,
  {usd?: number; usd_24h_change?: number} | number
>;

export type FreeDossierBasic = {
  symbol?: string;
  name?: string;
  mint?: string;
  priceUsd?: number;
  marketCapUsd?: number;
  volume24hUsd?: number;
  holders?: number;
  imageUrl?: string;
};

export type PumpfunTrendingCoin = {
  mint?: string;
  name?: string;
  symbol?: string;
  priceUsd?: number | string;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  imageUri?: string;
  uri?: string;
};

export async function fetchFreePrices(
  ids = 'bitcoin,ethereum,solana',
): Promise<FreePriceMap> {
  const {status, json} = await apiGetJson<any>(
    `/free/coingecko/price?ids=${encodeURIComponent(ids)}`,
  );
  if (status >= 400) throw new Error('Failed to load free prices');
  // Endpoint may return CoinGecko map or { success, data }
  if (json?.data && typeof json.data === 'object') return json.data as FreePriceMap;
  return (json || {}) as FreePriceMap;
}

export async function fetchFreeDossierBasic(
  mint: string,
): Promise<FreeDossierBasic | null> {
  const {status, json} = await apiGetJson<ApiEnvelope<FreeDossierBasic>>(
    `/free/dossier/basic?mint=${encodeURIComponent(mint)}`,
  );
  if (status >= 400) return null;
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as ApiEnvelope<FreeDossierBasic>).data ?? null;
  }
  return (json as FreeDossierBasic) ?? null;
}

export async function fetchPumpfunTrending(
  limit = 12,
): Promise<PumpfunTrendingCoin[]> {
  const {status, json} = await apiGetJson<any>(
    `/pumpfun/trending?limit=${limit}`,
  );
  // Trending is paid ($0.001) in catalog; fall back gracefully if 402.
  if (status === 402) return [];
  if (status >= 400) throw new Error('Failed to load trending');
  const coins = json?.coins ?? json?.data?.coins ?? json?.data ?? [];
  return Array.isArray(coins) ? coins : [];
}

export async function fetchFreeAssets(limit = 20): Promise<any[]> {
  const {status, json} = await apiGetJson<any>(`/free/assets?limit=${limit}`);
  if (status >= 400) return [];
  const items = json?.data?.items ?? json?.items ?? json?.data ?? [];
  return Array.isArray(items) ? items : [];
}
