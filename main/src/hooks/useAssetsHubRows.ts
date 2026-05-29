import { useQuery } from "@tanstack/react-query";
import { ASSET_PRESETS } from "@/lib/assetPresets";
import type { AssetClass, AssetTableRow } from "@/lib/assetsHub";
import { fetchMintDossier } from "@/lib/tokensDossierApi";

export const ASSETS_HUB_QUERY_KEY = ["assets-hub", "table-v2"] as const;

function classifyAsset(category: string | undefined, fallback: AssetClass): AssetClass {
  const c = category?.toLowerCase() ?? "";
  if (c.includes("stock") || c.includes("equity")) return "equity";
  return fallback;
}

export function useAssetsHubRows() {
  return useQuery({
    queryKey: ASSETS_HUB_QUERY_KEY,
    queryFn: async (): Promise<AssetTableRow[]> => {
      const settled = await Promise.allSettled(
        ASSET_PRESETS.map(async (preset) => {
          const payload = await fetchMintDossier({ ref: preset.ref });
          const stats = payload.asset?.stats;
          return {
            key: payload.assetId,
            ref: preset.ref,
            name: payload.asset?.name || preset.label,
            symbol: payload.asset?.symbol || preset.ref.toUpperCase(),
            assetClass: classifyAsset(payload.asset?.category, preset.assetClass),
            price: stats?.price ?? payload.asset?.canonicalMarket?.price,
            change24h: stats?.priceChange24hPercent,
            marketCap: stats?.marketCap ?? payload.asset?.canonicalMarket?.marketCap,
            volume24h: stats?.volume24hUSD ?? payload.asset?.canonicalMarket?.volume24hUSD,
            liquidity: stats?.liquidity,
            imageUrl: payload.asset?.imageUrl,
            payload,
          } satisfies AssetTableRow;
        }),
      );
      return settled
        .filter((item): item is PromiseFulfilledResult<AssetTableRow> => item.status === "fulfilled")
        .map((item) => item.value);
    },
    staleTime: 120_000,
  });
}
