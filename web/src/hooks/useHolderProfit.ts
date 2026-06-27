import { useQuery } from "@tanstack/react-query";
import { fetchHolderInsights, type HolderInsightsPayload } from "@/lib/pumpfunAnalysisApi";

export const HOLDER_INSIGHTS_QUERY_ROOT = "holder-insights" as const;

/** @deprecated Use HOLDER_INSIGHTS_QUERY_ROOT */
export const HOLDER_PROFIT_QUERY_ROOT = HOLDER_INSIGHTS_QUERY_ROOT;

export function holderInsightsQueryKey(mint: string, wallets: readonly string[]) {
  const sorted = [...new Set(wallets.map((w) => w.trim()).filter(Boolean))].sort();
  return [HOLDER_INSIGHTS_QUERY_ROOT, mint.trim(), sorted.join(",")] as const;
}

/** @deprecated Use holderInsightsQueryKey */
export function holderProfitQueryKey(mint: string, wallets: readonly string[]) {
  return holderInsightsQueryKey(mint, wallets);
}

export function useHolderInsights(
  mint: string | null,
  wallets: readonly string[],
  enabled = true,
) {
  const trimmed = mint?.trim() ?? "";
  const walletKey = wallets.map((w) => w.trim()).filter(Boolean);
  return useQuery({
    queryKey: holderInsightsQueryKey(trimmed, walletKey),
    queryFn: ({ signal }): Promise<HolderInsightsPayload> =>
      fetchHolderInsights(trimmed, { wallets: walletKey, signal }),
    enabled: enabled && trimmed.length > 0 && walletKey.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/** @deprecated Use useHolderInsights */
export function useHolderProfit(
  mint: string | null,
  wallets: readonly string[],
  enabled = true,
) {
  return useHolderInsights(mint, wallets, enabled);
}
