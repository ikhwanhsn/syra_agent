import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAssetIntelligence,
  type AssetIntelligencePayload,
  type TokensDossierQuery,
} from "@/lib/tokensDossierApi";

export const ASSET_INTELLIGENCE_QUERY_KEY = ["asset-intelligence"] as const;

/** Identity-only key so symbol/name hints never abort an in-flight request. */
export function assetIntelligenceIdentityKey(
  lookup: TokensDossierQuery | null | undefined,
): string | null {
  if (!lookup) return null;
  const assetId = lookup.assetId?.trim() ?? "";
  const mint = lookup.mint?.trim() ?? "";
  const ref = lookup.ref?.trim() ?? "";
  const q = lookup.q?.trim() ?? "";
  if (!assetId && !mint && !ref && !q) return null;
  return [assetId, mint, ref, q].join("|");
}

export function useAssetIntelligence(lookup: TokensDossierQuery | null) {
  const identityKey = useMemo(() => assetIntelligenceIdentityKey(lookup), [lookup]);

  return useQuery({
    queryKey: [...ASSET_INTELLIGENCE_QUERY_KEY, identityKey],
    queryFn: ({ signal }): Promise<AssetIntelligencePayload> =>
      fetchAssetIntelligence(lookup!, { signal }),
    enabled: identityKey != null,
    staleTime: 120_000,
    gcTime: 10 * 60_000,
    retry: 0,
  });
}
