import { useQuery } from "@tanstack/react-query";
import type { AssetTableRow } from "@/lib/assetsHub";
import {
  fetchAssetsBoard,
  type AssetsBoardItem,
  type TokensDossierPayload,
  type TokensDossierQuery,
} from "@/lib/tokensDossierApi";

export const ASSETS_HUB_QUERY_KEY = ["assets-hub", "board-v1"] as const;

export function boardItemToRow(item: AssetsBoardItem): AssetTableRow {
  const payload: TokensDossierPayload = {
    query: { ref: item.ref, ...(item.mint && { mint: item.mint }), assetId: item.assetId },
    assetId: item.assetId,
    chartMint: item.mint ?? null,
    asset: {
      assetId: item.assetId,
      name: item.name,
      symbol: item.symbol,
      category: item.category,
      imageUrl: item.imageUrl,
      stats: {
        price: item.price,
        marketCap: item.marketCap,
        volume24hUSD: item.volume24h,
        priceChange24hPercent: item.change24h,
        liquidity: item.liquidity,
      },
    },
    includes: null,
    ohlcv: { interval: "1H", mint: item.mint ?? null, candles: [] },
    fetchedAt: new Date().toISOString(),
  };

  return {
    key: item.key,
    ref: item.ref,
    name: item.name,
    symbol: item.symbol,
    assetClass: item.assetClass,
    price: item.price,
    change24h: item.change24h,
    marketCap: item.marketCap,
    volume24h: item.volume24h,
    liquidity: item.liquidity,
    imageUrl: item.imageUrl,
    payload,
  };
}

/** Instant detail paint when navigating from the assets board. */
export function findBoardPlaceholder(
  rows: readonly AssetTableRow[] | undefined,
  lookup: TokensDossierQuery | null,
): TokensDossierPayload | undefined {
  if (!rows?.length || !lookup) return undefined;

  const assetId = lookup.assetId?.trim().toLowerCase();
  const mint = lookup.mint?.trim();
  const ref = lookup.ref?.trim().toLowerCase();
  const q = lookup.q?.trim().toLowerCase();

  const hit = rows.find((row) => {
    if (assetId && row.payload.assetId.toLowerCase() === assetId) return true;
    if (mint && (row.payload.chartMint === mint || row.payload.query.mint === mint)) return true;
    if (ref && (row.ref.toLowerCase() === ref || row.symbol.toLowerCase() === ref)) return true;
    if (q) {
      return (
        row.name.toLowerCase().includes(q) ||
        row.symbol.toLowerCase() === q ||
        row.ref.toLowerCase() === q ||
        row.payload.assetId.toLowerCase() === q
      );
    }
    return false;
  });

  return hit?.payload;
}

export function useAssetsHubRows() {
  return useQuery({
    queryKey: ASSETS_HUB_QUERY_KEY,
    queryFn: async ({ signal }): Promise<AssetTableRow[]> => {
      const board = await fetchAssetsBoard({ list: "all", groupBy: "asset", signal });
      return board.items.map(boardItemToRow);
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
