import { useQuery } from "@tanstack/react-query";
import {
  fetchBtcBubblemap,
  fetchBtcDashboard,
  type BtcExchange,
  type BtcInterval,
} from "@/lib/btcApi";

/** Poll DB snapshots — server refreshes on tiered rate-limit-aware schedule. */
const SNAPSHOT_STALE_MS = 120_000;
const SNAPSHOT_REFETCH_MS = 120_000;

export function useBtcDashboard() {
  return useQuery({
    queryKey: ["btc", "dashboard"],
    queryFn: ({ signal }) => fetchBtcDashboard(signal),
    staleTime: SNAPSHOT_STALE_MS,
    refetchInterval: SNAPSHOT_REFETCH_MS,
    retry: (failureCount, error) => {
      if (error instanceof Error && /503|not ready/i.test(error.message)) {
        return failureCount < 8;
      }
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(15_000, 2_000 * (attempt + 1)),
  });
}

export interface UseBtcBubblemapOptions {
  exchange: BtcExchange;
  interval: BtcInterval;
  limit?: number;
}

export function useBtcBubblemap({ exchange, interval, limit = 200 }: UseBtcBubblemapOptions) {
  return useQuery({
    queryKey: ["btc", "bubblemap", exchange, interval, limit],
    queryFn: ({ signal }) => fetchBtcBubblemap({ exchange, interval, limit, signal }),
    staleTime: SNAPSHOT_STALE_MS,
    refetchInterval: SNAPSHOT_REFETCH_MS,
    retry: (failureCount, error) => {
      if (error instanceof Error && /503|not ready/i.test(error.message)) {
        return failureCount < 8;
      }
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(15_000, 2_000 * (attempt + 1)),
  });
}
