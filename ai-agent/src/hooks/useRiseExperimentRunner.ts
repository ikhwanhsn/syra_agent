import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPumpfunAlphaTrend, type PumpfunAlphaPeriod } from "@/lib/pumpfunAlphaTrendApi";
import { fetchRiseAlphaIntel, riseTokenToExperimentTape } from "@/lib/riseAlphaIntelApi";
import { RISE_ALPHA_TOKEN_MINT } from "@/lib/riseToken";
import {
  createInitialRiseExperiment,
  loadRiseExperiment,
  processRiseExperimentTick,
  saveRiseExperiment,
  type RiseExperimentPersisted,
} from "@/lib/riseExperimentModel";

const STALE_MS = 120_000;

export function useRiseExperimentRunner(period: PumpfunAlphaPeriod) {
  const [persisted, setPersisted] = useState<RiseExperimentPersisted>(() => createInitialRiseExperiment());
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    setPersisted(loadRiseExperiment());
  }, []);

  const pumpfunQ = useQuery({
    queryKey: ["alpha", "pumpfun-trend", period, "rise-experiment"],
    queryFn: () => fetchPumpfunAlphaTrend(period),
    staleTime: STALE_MS,
  });

  const riseIntelQ = useQuery({
    queryKey: ["alpha", "rise-intel", "experiment"],
    queryFn: () => fetchRiseAlphaIntel(),
    staleTime: STALE_MS,
  });

  const lastSigRef = useRef<string>("");

  useEffect(() => {
    const pumpfun = pumpfunQ.data;
    const rise = riseIntelQ.data;
    if (!pumpfun || !rise) return;

    const riseTape = riseTokenToExperimentTape(rise.token, rise.nowMs);
    const tokens = pumpfun.tokens.some((t) => t.mint === RISE_ALPHA_TOKEN_MINT)
      ? pumpfun.tokens
      : [riseTape, ...pumpfun.tokens];

    const sig = `${rise.nowMs}|${pumpfun.nowMs}|${tokens.map((t) => `${t.mint}:${t.marketCapUsd ?? ""}`).join(";")}`;
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;

    const targets = new Set<string>(rise.riseAlphaMintTargets);
    setPersisted((prev) => {
      const next = processRiseExperimentTick({
        persisted: prev,
        tokens,
        nowMs: Math.max(rise.nowMs, pumpfun.nowMs),
        riseAlphaMintTargets: targets,
      });
      saveRiseExperiment(next);
      return next;
    });
  }, [pumpfunQ.data, riseIntelQ.data]);

  const resetAll = useCallback(() => {
    const fresh = createInitialRiseExperiment();
    const pumpfun = pumpfunQ.data;
    const rise = riseIntelQ.data;
    let next = fresh;

    if (pumpfun && rise) {
      const riseTape = riseTokenToExperimentTape(rise.token, rise.nowMs);
      const tokens = pumpfun.tokens.some((t) => t.mint === RISE_ALPHA_TOKEN_MINT)
        ? pumpfun.tokens
        : [riseTape, ...pumpfun.tokens];
      const sig = `${rise.nowMs}|${pumpfun.nowMs}|${tokens.map((t) => `${t.mint}:${t.marketCapUsd ?? ""}`).join(";")}`;
      lastSigRef.current = sig;
      next = processRiseExperimentTick({
        persisted: fresh,
        tokens,
        nowMs: Math.max(rise.nowMs, pumpfun.nowMs),
        riseAlphaMintTargets: new Set(rise.riseAlphaMintTargets),
      });
    } else {
      lastSigRef.current = "";
    }

    saveRiseExperiment(next);
    setPersisted(next);
  }, [pumpfunQ.data, riseIntelQ.data]);

  const intelQ = {
    isLoading: pumpfunQ.isLoading || riseIntelQ.isLoading,
    isFetching: pumpfunQ.isFetching || riseIntelQ.isFetching,
    isError: pumpfunQ.isError || riseIntelQ.isError,
    error: pumpfunQ.error ?? riseIntelQ.error,
    data:
      pumpfunQ.data && riseIntelQ.data
        ? {
            ...riseIntelQ.data,
            matchedCount: pumpfunQ.data.matchedCount,
            pumpfunMatchedCount: pumpfunQ.data.matchedCount,
          }
        : undefined,
    refetch: async () => {
      await Promise.all([pumpfunQ.refetch(), riseIntelQ.refetch()]);
    },
  };

  return { persisted, intelQ, resetAll };
}
