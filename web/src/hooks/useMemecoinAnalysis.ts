import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMemecoinAnalysis,
  fetchMemecoinAnalysisQuota,
  isValidSolanaMint,
  MemecoinAnalysisQuotaError,
  type MemecoinAnalysisPayload,
  type PumpfunScanRecordSummary,
} from "@/lib/pumpfunAnalysisApi";
import { PUMPFUN_LIVE_CALLS_KEY, PUMPFUN_SCAN_HISTORY_KEY } from "@/hooks/usePumpfunScanHistory";

export const MEMECOIN_ANALYSIS_QUOTA_KEY = ["memecoin-analysis-quota"] as const;
export const MEMECOIN_ANALYSIS_QUERY_ROOT = "memecoin-analysis" as const;

export type MemecoinAnalysisQueryData = {
  data: MemecoinAnalysisPayload;
  scanRecord: PumpfunScanRecordSummary | null;
};

export function memecoinAnalysisQueryKey(mint: string) {
  return [MEMECOIN_ANALYSIS_QUERY_ROOT, mint.trim()] as const;
}

export function clearPumpfunScanSessionCache(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.removeQueries({ queryKey: [MEMECOIN_ANALYSIS_QUERY_ROOT] });
}

export function getPumpfunScanSessionCache(
  queryClient: ReturnType<typeof useQueryClient>,
  mint: string,
): MemecoinAnalysisQueryData | undefined {
  return queryClient.getQueryData(memecoinAnalysisQueryKey(mint));
}

export function useMemecoinAnalysisQuota(enabled = true) {
  return useQuery({
    queryKey: MEMECOIN_ANALYSIS_QUOTA_KEY,
    queryFn: ({ signal }) => fetchMemecoinAnalysisQuota({ signal }),
    staleTime: 30_000,
    enabled,
  });
}

type UseMemecoinAnalysisOptions = {
  /** Keep results for this page visit — no refetch when switching tabs. */
  sessionCache?: boolean;
};

export function useMemecoinAnalysis(
  mint: string | null | undefined,
  options?: UseMemecoinAnalysisOptions,
) {
  const queryClient = useQueryClient();
  const trimmed = mint?.trim() ?? "";
  const enabled = trimmed.length > 0 && isValidSolanaMint(trimmed);
  const sessionCache = options?.sessionCache ?? false;

  return useQuery({
    queryKey: memecoinAnalysisQueryKey(trimmed),
    queryFn: async ({ signal }) => {
      try {
        const result = await fetchMemecoinAnalysis(trimmed, { signal });
        queryClient.setQueryData(MEMECOIN_ANALYSIS_QUOTA_KEY, result.quota);
        void queryClient.invalidateQueries({ queryKey: PUMPFUN_SCAN_HISTORY_KEY });
        void queryClient.invalidateQueries({ queryKey: PUMPFUN_LIVE_CALLS_KEY });
        return { data: result.data, scanRecord: result.scanRecord };
      } catch (error) {
        if (error instanceof MemecoinAnalysisQuotaError) {
          queryClient.setQueryData(MEMECOIN_ANALYSIS_QUOTA_KEY, error.quota);
        }
        throw error;
      }
    },
    enabled,
    staleTime: sessionCache ? Number.POSITIVE_INFINITY : 60_000,
    gcTime: sessionCache ? Number.POSITIVE_INFINITY : 5 * 60_000,
    refetchOnMount: sessionCache ? false : true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.name === "MemecoinAnalysisQuotaError") {
        return false;
      }
      return failureCount < 1;
    },
  });
}
