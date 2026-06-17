import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMemecoinAnalysis,
  fetchMemecoinAnalysisQuota,
  isValidSolanaMint,
  MemecoinAnalysisQuotaError,
} from "@/lib/pumpfunAnalysisApi";

export const MEMECOIN_ANALYSIS_QUOTA_KEY = ["memecoin-analysis-quota"] as const;

export function useMemecoinAnalysisQuota() {
  return useQuery({
    queryKey: MEMECOIN_ANALYSIS_QUOTA_KEY,
    queryFn: ({ signal }) => fetchMemecoinAnalysisQuota({ signal }),
    staleTime: 30_000,
  });
}

export function useMemecoinAnalysis(mint: string | null | undefined) {
  const queryClient = useQueryClient();
  const trimmed = mint?.trim() ?? "";
  const enabled = trimmed.length > 0 && isValidSolanaMint(trimmed);

  return useQuery({
    queryKey: ["memecoin-analysis", trimmed],
    queryFn: async ({ signal }) => {
      try {
        const result = await fetchMemecoinAnalysis(trimmed, { signal });
        queryClient.setQueryData(MEMECOIN_ANALYSIS_QUOTA_KEY, result.quota);
        return result.data;
      } catch (error) {
        if (error instanceof MemecoinAnalysisQuotaError) {
          queryClient.setQueryData(MEMECOIN_ANALYSIS_QUOTA_KEY, error.quota);
        }
        throw error;
      }
    },
    enabled,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.name === "MemecoinAnalysisQuotaError") {
        return false;
      }
      return failureCount < 1;
    },
  });
}
