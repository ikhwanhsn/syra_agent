import { useQuery } from "@tanstack/react-query";
import {
  fetchAssetIntelligence,
  type AssetIntelligencePayload,
  type TokensDossierQuery,
} from "@/lib/tokensDossierApi";

export const ASSET_INTELLIGENCE_QUERY_KEY = ["asset-intelligence"] as const;

export function useAssetIntelligence(lookup: TokensDossierQuery | null) {
  return useQuery({
    queryKey: [...ASSET_INTELLIGENCE_QUERY_KEY, lookup],
    queryFn: ({ signal }): Promise<AssetIntelligencePayload> =>
      fetchAssetIntelligence(lookup!, { signal }),
    enabled: lookup != null,
    staleTime: 120_000,
    retry: 1,
  });
}
