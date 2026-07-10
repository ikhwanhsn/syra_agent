import { useQuery } from "@tanstack/react-query";
import {
  fetchMmEquityHistory,
  fetchMmLearning,
  fetchMmOverview,
  fetchMmRuns,
  fetchMmVolumeHistory,
} from "@/lib/mmApi";

const OVERVIEW_REFETCH_MS = 15_000;
const RUNS_REFETCH_MS = 30_000;

export function useMmOverview() {
  return useQuery({
    queryKey: ["mm", "overview"],
    queryFn: ({ signal }) => fetchMmOverview(signal),
    refetchInterval: OVERVIEW_REFETCH_MS,
    staleTime: 10_000,
  });
}

export function useMmRuns(params?: { limit?: number; status?: string }) {
  return useQuery({
    queryKey: ["mm", "runs", params?.limit ?? 50, params?.status ?? "all"],
    queryFn: () => fetchMmRuns({ limit: params?.limit ?? 50, status: params?.status }),
    refetchInterval: RUNS_REFETCH_MS,
    staleTime: 15_000,
  });
}

export function useMmEquityHistory() {
  return useQuery({
    queryKey: ["mm", "equity-history"],
    queryFn: ({ signal }) => fetchMmEquityHistory(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMmVolumeHistory() {
  return useQuery({
    queryKey: ["mm", "volume-history"],
    queryFn: ({ signal }) => fetchMmVolumeHistory(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMmLearning() {
  return useQuery({
    queryKey: ["mm", "learning"],
    queryFn: ({ signal }) => fetchMmLearning(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
