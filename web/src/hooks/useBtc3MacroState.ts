import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Btc3AgentState } from "@/lib/btc3/types";
import { fetchBtc3StateBundle, fetchBtc3Learning, mapApiToBtc3State } from "@/lib/btc3/mapApiToBtc3State";

const REFETCH_MS = 30_000;

async function fetchBtc3AgentBundle(): Promise<Btc3AgentState> {
  const [bundle, learning] = await Promise.all([
    fetchBtc3StateBundle(),
    fetchBtc3Learning().catch(() => null),
  ]);
  const state = mapApiToBtc3State(bundle);
  return { ...state, learning };
}

export function useBtc3MacroState() {
  const queryClient = useQueryClient();
  const [paused, setPaused] = useState(false);

  const query = useQuery({
    queryKey: ["btc3-macro", "agent-state"],
    queryFn: fetchBtc3AgentBundle,
    refetchInterval: paused ? false : REFETCH_MS,
    staleTime: 15_000,
  });

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["btc3-macro", "agent-state"] });
  }, [queryClient]);

  const state: Btc3AgentState | null = query.data ?? null;

  return useMemo(
    () => ({
      state,
      paused,
      togglePause,
      refresh,
      loading: query.isLoading,
      error: query.error instanceof Error ? query.error.message : null,
      isFetching: query.isFetching,
    }),
    [state, paused, togglePause, refresh, query.isLoading, query.error, query.isFetching],
  );
}
