import { useQuery } from "@tanstack/react-query";
import { ALPHA_TECH_TEAMS } from "@/constants/alphaTechTeams";
import { fetchAlphaTechScreener, type AlphaTechScreeningRow } from "@/lib/alphaTechScreenerApi";

export const ALPHA_TECH_SCREENER_QUERY_KEY = ["alphatech-screener", "v1"] as const;

const STALE_MS = 5 * 60_000;

export function useAlphaTechScreener(enabled = true) {
  return useQuery({
    queryKey: ALPHA_TECH_SCREENER_QUERY_KEY,
    queryFn: ({ signal }) => fetchAlphaTechScreener(ALPHA_TECH_TEAMS, { signal, concurrency: 5 }),
    enabled,
    staleTime: STALE_MS,
    gcTime: STALE_MS * 2,
  });
}

export function alphaTechScreenerSummary(rows: AlphaTechScreeningRow[] | undefined) {
  const data = rows ?? [];
  const matched = data.filter((r) => r.matched);
  const totalLiquidity = matched.reduce((sum, r) => sum + (r.liquidityUsd ?? 0), 0);
  const totalVolume = matched.reduce((sum, r) => sum + (r.volume24h ?? 0), 0);

  return {
    total: data.length,
    matchedCount: matched.length,
    unmatchedCount: data.length - matched.length,
    totalLiquidity,
    totalVolume,
  };
}
