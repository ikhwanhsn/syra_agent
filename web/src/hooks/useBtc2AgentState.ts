import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Btc2AgentState } from "@/lib/btc2/types";
import { mapRealToBtc2State } from "@/lib/btc2/mapRealToBtc2State";
import {
  fetchBtcLabState,
  fetchBtcOhlcv,
  fetchBtcOverview,
  fetchBtcRealPositions,
  fetchBtcRealState,
  fetchBtcRuns,
  fetchBtcSignalReport,
  fetchBtcStats,
  type BtcQuantLane,
} from "@/lib/btcQuantApi";

const REFETCH_MS = 30_000;
const BTC2_LANE: BtcQuantLane = "btc2";

async function fetchBtc2AgentBundle() {
  const [overview, labState, stats] = await Promise.all([
    fetchBtcOverview(BTC2_LANE),
    fetchBtcLabState(BTC2_LANE),
    fetchBtcStats(BTC2_LANE),
  ]);

  const activeExperimentId = labState.activeExperimentId ?? stats.experimentId ?? undefined;

  const [runsResult, realState] = await Promise.all([
    fetchBtcRuns({
      limit: 25,
      offset: 0,
      lane: BTC2_LANE,
      experimentId: activeExperimentId,
    }),
    fetchBtcRealState().catch(() => null),
  ]);

  const leaderId =
    realState?.leaderStrategyId ??
    overview.simulation.leaderStrategyId ??
    stats.agents[0]?.strategyId;
  const leader = stats.agents.find((a) => a.strategyId === leaderId) ?? stats.agents[0];
  const bar = leader?.bar ?? "1h";

  const [signalReport, ohlcvResult, realPositions] = await Promise.all([
    fetchBtcSignalReport(bar),
    fetchBtcOhlcv(bar, 80),
    realState?.experimentId
      ? fetchBtcRealPositions({ limit: 12, experimentId: realState.experimentId }).catch(() => ({
          positions: [],
          total: 0,
        }))
      : Promise.resolve({ positions: [], total: 0 }),
  ]);

  return mapRealToBtc2State({
    overview,
    labState,
    stats,
    runs: runsResult.runs,
    signalReport,
    ohlcv: ohlcvResult.points,
    realState,
    realPositions: realPositions.positions,
    leaderBar: bar,
    fetchedAt: Date.now(),
  });
}

export function useBtc2AgentState() {
  const queryClient = useQueryClient();
  const [paused, setPaused] = useState(false);

  const query = useQuery({
    queryKey: ["btc2-quant", "agent-state", BTC2_LANE],
    queryFn: fetchBtc2AgentBundle,
    refetchInterval: paused ? false : REFETCH_MS,
    staleTime: 15_000,
  });

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["btc2-quant", "agent-state", BTC2_LANE] });
  }, [queryClient]);

  const state: Btc2AgentState | null = query.data ?? null;

  return useMemo(
    () => ({
      state,
      paused,
      togglePause,
      refresh,
      loading: query.isLoading,
      error: query.error instanceof Error ? query.error.message : query.isError ? "Failed to load agent data" : null,
      isFetching: query.isFetching,
    }),
    [state, paused, togglePause, refresh, query.isLoading, query.error, query.isError, query.isFetching],
  );
}
