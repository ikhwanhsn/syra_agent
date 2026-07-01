import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMemecoinAnalysis,
  fetchMemecoinAnalysisQuota,
  isValidSolanaMint,
  MemecoinAnalysisQuotaError,
  type MemecoinAnalysisPayload,
  type PumpfunScanRecordSummary,
} from "@/lib/pumpfunAnalysisApi";
import {
  clearAllPumpfunScanSessionCaches,
  readPumpfunScanSessionCache,
  readPumpfunScanSessionEntry,
  removePumpfunScanSessionCache,
  writePumpfunScanSessionCache,
} from "@/lib/pumpfunScanSessionCache";
import { markGuestScanUsedToday } from "@/lib/pumpfunGuestScan";
import { PUMPFUN_LIVE_CALLS_KEY, PUMPFUN_SCAN_HISTORY_KEY } from "@/hooks/usePumpfunScanHistory";

export const MEMECOIN_ANALYSIS_QUOTA_KEY = ["memecoin-analysis-quota"] as const;
export const MEMECOIN_ANALYSIS_QUERY_ROOT = "memecoin-analysis" as const;

export type MemecoinAnalysisQueryData = {
  data: MemecoinAnalysisPayload;
  scanRecord: PumpfunScanRecordSummary | null;
};

export function memecoinAnalysisQueryKey(mint: string, bust = 0) {
  return bust > 0
    ? ([MEMECOIN_ANALYSIS_QUERY_ROOT, mint.trim(), bust] as const)
    : ([MEMECOIN_ANALYSIS_QUERY_ROOT, mint.trim()] as const);
}

export function clearPumpfunScanSessionCache(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.removeQueries({ queryKey: [MEMECOIN_ANALYSIS_QUERY_ROOT] });
  clearAllPumpfunScanSessionCaches();
}

export function getPumpfunScanSessionCache(
  queryClient: ReturnType<typeof useQueryClient>,
  mint: string,
): MemecoinAnalysisQueryData | undefined {
  return (
    queryClient.getQueryData(memecoinAnalysisQueryKey(mint)) ??
    readPumpfunScanSessionCache(mint) ??
    undefined
  );
}

export function useMemecoinAnalysisQuota(enabled = true) {
  return useQuery({
    queryKey: MEMECOIN_ANALYSIS_QUOTA_KEY,
    queryFn: ({ signal }) => fetchMemecoinAnalysisQuota({ signal }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled,
  });
}

type UseMemecoinAnalysisOptions = {
  /** Keep results cached — no refetch on remount, tab switch, or window focus. */
  sessionCache?: boolean;
  /** Increment to bypass caches and force a fresh scan. */
  bust?: number;
  /** Wallet + Syra session ready — required before hitting the API when wallet connected. */
  scanReady?: boolean;
  /** Allow one wallet-free scan per day (device id quota). */
  guestScanReady?: boolean;
};

export function useMemecoinAnalysis(
  mint: string | null | undefined,
  options?: UseMemecoinAnalysisOptions,
) {
  const queryClient = useQueryClient();
  const trimmed = mint?.trim() ?? "";
  const bust = options?.bust ?? 0;
  const hasMint = trimmed.length > 0 && isValidSolanaMint(trimmed);
  const scanReady = options?.scanReady ?? true;
  const guestScanReady = options?.guestScanReady ?? false;
  const sessionCache = options?.sessionCache ?? false;
  const sessionEntry = hasMint && bust === 0 ? readPumpfunScanSessionEntry(trimmed) : null;

  return useQuery({
    queryKey: memecoinAnalysisQueryKey(trimmed, bust),
    queryFn: async ({ signal }) => {
      if (bust === 0) {
        const sessionHit = readPumpfunScanSessionCache(trimmed);
        if (sessionHit) return sessionHit;

        const memoryHit = queryClient.getQueryData<MemecoinAnalysisQueryData>(
          memecoinAnalysisQueryKey(trimmed),
        );
        if (memoryHit?.data?.mint) return memoryHit;
      } else {
        removePumpfunScanSessionCache(trimmed);
      }

      try {
        const result = await fetchMemecoinAnalysis(trimmed, {
          signal,
          force: bust > 0,
        });
        queryClient.setQueryData(MEMECOIN_ANALYSIS_QUOTA_KEY, result.quota);
        void queryClient.invalidateQueries({ queryKey: PUMPFUN_SCAN_HISTORY_KEY });
        void queryClient.invalidateQueries({ queryKey: PUMPFUN_LIVE_CALLS_KEY });
        const payload = { data: result.data, scanRecord: result.scanRecord };
        writePumpfunScanSessionCache(trimmed, payload);
        if (!result.scanRecord) {
          markGuestScanUsedToday();
        }
        return payload;
      } catch (error) {
        if (error instanceof MemecoinAnalysisQuotaError) {
          queryClient.setQueryData(MEMECOIN_ANALYSIS_QUOTA_KEY, error.quota);
        }
        throw error;
      }
    },
    enabled: hasMint && (scanReady || guestScanReady || bust > 0),
    initialData: () => sessionEntry?.payload,
    initialDataUpdatedAt: () => sessionEntry?.savedAt,
    staleTime: sessionCache ? Number.POSITIVE_INFINITY : 60_000,
    gcTime: sessionCache ? Number.POSITIVE_INFINITY : 30 * 60_000,
    refetchOnMount: false,
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
