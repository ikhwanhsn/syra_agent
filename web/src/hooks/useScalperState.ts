import { useQuery } from "@tanstack/react-query";
import {
  fetchScalperEquityHistory,
  fetchScalperOverview,
  fetchScalperRuns,
} from "@/lib/scalperApi";

const OVERVIEW_REFETCH_MS = 15_000;
const RUNS_REFETCH_MS = 30_000;

export function useScalperOverview() {
  return useQuery({
    queryKey: ["scalper", "overview"],
    queryFn: ({ signal }) => fetchScalperOverview(signal),
    refetchInterval: OVERVIEW_REFETCH_MS,
    staleTime: 10_000,
  });
}

export function useScalperRuns(params?: { limit?: number; status?: string }) {
  return useQuery({
    queryKey: ["scalper", "runs", params?.limit ?? 50, params?.status ?? "all"],
    queryFn: () => fetchScalperRuns({ limit: params?.limit ?? 50, status: params?.status }),
    refetchInterval: RUNS_REFETCH_MS,
    staleTime: 15_000,
  });
}

export function useScalperEquityHistory() {
  return useQuery({
    queryKey: ["scalper", "equity-history"],
    queryFn: ({ signal }) => fetchScalperEquityHistory(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
