import { useQuery } from "@tanstack/react-query";
import type { AssetTableRow } from "@/lib/assetsHub";
import {
  fetchAssetsBoard,
  type AssetsBoardItem,
  type TokensDossierPayload,
} from "@/lib/tokensDossierApi";

export const ASSETS_HUB_QUERY_KEY = ["assets-hub", "board-v1"] as const;

function boardItemToRow(item: AssetsBoardItem): AssetTableRow {
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

export function useAssetsHubRows() {
  return useQuery({
    queryKey: ASSETS_HUB_QUERY_KEY,
    queryFn: async ({ signal }): Promise<AssetTableRow[]> => {
      const board = await fetchAssetsBoard({ list: "all", groupBy: "asset", signal });
      return board.items.map(boardItemToRow);
    },
    staleTime: 120_000,
  });
}
