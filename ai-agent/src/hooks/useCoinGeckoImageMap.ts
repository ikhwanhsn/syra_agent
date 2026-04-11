import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { coinGeckoLookupKey, fetchCoinGeckoImagesBatch } from "@/lib/coingeckoCoinImages";

/**
 * Batched CoinGecko coin images for a list of tickers / pair strings (deduped).
 */
export function useCoinGeckoImageMap(symbols: readonly string[]) {
  const keys = useMemo(() => {
    const out = new Set<string>();
    for (const s of symbols) {
      const k = coinGeckoLookupKey(s);
      if (k) out.add(k);
    }
    return [...out].sort();
  }, [symbols]);

  return useQuery({
    queryKey: ["coingecko-coin-images", "v3", keys.join("|")] as const,
    queryFn: () => fetchCoinGeckoImagesBatch(keys),
    enabled: keys.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
