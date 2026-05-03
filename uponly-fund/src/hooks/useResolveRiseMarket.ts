import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { useRiseDashboard, useRiseMarketsAll } from "@/lib/RiseDashboardContext";

const DETAIL_MARKETS_LIMIT = 250;

/**
 * Resolves a token row from the paginated universe + aggregate UPONLY fallback.
 */
export function useResolveRiseMarket(address: string | null | undefined): {
  market: RiseMarketRow | null;
  isPending: boolean;
  marketsQuery: UseQueryResult<RiseMarketRow[], Error>;
} {
  const normalized = (address ?? "").trim();
  const marketsQuery = useRiseMarketsAll(DETAIL_MARKETS_LIMIT);
  const { aggregate } = useRiseDashboard();

  const market = useMemo(() => {
    if (!normalized) return null;
    const rows = marketsQuery.data ?? [];
    const byMint = rows.find((r) => r.mint === normalized);
    if (byMint) return byMint;
    const byMarket = rows.find((r) => r.marketAddress === normalized);
    if (byMarket) return byMarket;

    const aggRows: RiseMarketRow[] = [];
    const d = aggregate.data;
    if (d?.uponly) aggRows.push(d.uponly);
    if (d) {
      aggRows.push(
        ...d.topVolume24h,
        ...d.topGainers24h,
        ...d.topLosers24h,
        ...d.mostHolders,
        ...d.largestByMcap,
        ...d.newest,
      );
    }
    const dedup = new Map<string, RiseMarketRow>();
    for (const r of aggRows) {
      if (r.mint && !dedup.has(r.mint)) dedup.set(r.mint, r);
    }
    const fromAgg = [...dedup.values()].find(
      (r) => r.mint === normalized || r.marketAddress === normalized,
    );
    return fromAgg ?? null;
  }, [normalized, marketsQuery.data, aggregate.data]);

  const isPending = marketsQuery.isPending && !marketsQuery.data;

  return { market, isPending, marketsQuery };
}
