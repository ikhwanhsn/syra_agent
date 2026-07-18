import { useQuery } from "@tanstack/react-query";
import {
  fetchPumpfunCallerLeaderboard,
  fetchPumpfunLiveCalls,
  fetchPumpfunScanCall,
  fetchPumpfunScanHistory,
} from "@/lib/pumpfunScanHistoryApi";

export const PUMPFUN_SCAN_HISTORY_KEY = ["pumpfun-scan-history"] as const;
export const PUMPFUN_CALLERS_KEY = ["pumpfun-callers"] as const;
export const PUMPFUN_LIVE_CALLS_KEY = ["pumpfun-live-calls"] as const;

/** Latest items shown on Live / My calls / Best callers tabs. */
export const PUMPFUN_LIST_LIMIT = 10;

/** @deprecated Use PUMPFUN_LIST_LIMIT */
export const PUMPFUN_LIVE_CALLS_PAGE_SIZE = PUMPFUN_LIST_LIMIT;

export function usePumpfunScanHistory(enabled: boolean) {
  return useQuery({
    queryKey: [...PUMPFUN_SCAN_HISTORY_KEY, PUMPFUN_LIST_LIMIT],
    queryFn: ({ signal }) => fetchPumpfunScanHistory({ limit: PUMPFUN_LIST_LIMIT, signal }),
    enabled,
    staleTime: 60_000,
  });
}

export function usePumpfunCallerLeaderboard() {
  return useQuery({
    queryKey: [...PUMPFUN_CALLERS_KEY, PUMPFUN_LIST_LIMIT],
    queryFn: ({ signal }) =>
      fetchPumpfunCallerLeaderboard({ limit: PUMPFUN_LIST_LIMIT, signal }),
    staleTime: 120_000,
  });
}

export function usePumpfunLiveCalls(enabled: boolean) {
  return useQuery({
    queryKey: [...PUMPFUN_LIVE_CALLS_KEY, PUMPFUN_LIST_LIMIT],
    queryFn: ({ signal }) =>
      fetchPumpfunLiveCalls({
        limit: PUMPFUN_LIST_LIMIT,
        offset: 0,
        signal,
      }),
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
