import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchPumpfunCallerLeaderboard,
  fetchPumpfunLiveCalls,
  fetchPumpfunScanCall,
  fetchPumpfunScanHistory,
} from "@/lib/pumpfunScanHistoryApi";

export const PUMPFUN_SCAN_HISTORY_KEY = ["pumpfun-scan-history"] as const;
export const PUMPFUN_CALLERS_KEY = ["pumpfun-callers"] as const;
export const PUMPFUN_LIVE_CALLS_KEY = ["pumpfun-live-calls"] as const;

export const PUMPFUN_LIVE_CALLS_PAGE_SIZE = 20;

export function usePumpfunScanHistory(enabled: boolean) {
  return useQuery({
    queryKey: PUMPFUN_SCAN_HISTORY_KEY,
    queryFn: ({ signal }) => fetchPumpfunScanHistory({ signal }),
    enabled,
    staleTime: 60_000,
  });
}

export function usePumpfunCallerLeaderboard() {
  return useQuery({
    queryKey: PUMPFUN_CALLERS_KEY,
    queryFn: ({ signal }) => fetchPumpfunCallerLeaderboard({ signal }),
    staleTime: 120_000,
  });
}

export function usePumpfunLiveCalls(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: PUMPFUN_LIVE_CALLS_KEY,
    queryFn: ({ pageParam, signal }) =>
      fetchPumpfunLiveCalls({
        limit: PUMPFUN_LIVE_CALLS_PAGE_SIZE,
        offset: pageParam,
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PUMPFUN_LIVE_CALLS_PAGE_SIZE;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function usePumpfunScanCall(callId: string | null) {
  return useQuery({
    queryKey: ["pumpfun-scan-call", callId],
    queryFn: ({ signal }) => fetchPumpfunScanCall(callId!, { signal }),
    enabled: Boolean(callId?.trim()),
    staleTime: 60_000,
  });
}
