import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPumpfunAlphaTrend, type PumpfunAlphaPeriod } from "@/lib/pumpfunAlphaTrendApi";
import {
  createInitialPersisted,
  loadPumpfunExperiment,
  processPumpfunExperimentTick,
  savePumpfunExperiment,
  type PumpfunExperimentPersisted,
} from "@/lib/pumpfunExperimentModel";

const STALE_MS = 120_000;

export function usePumpfunExperimentRunner(period: PumpfunAlphaPeriod) {
  const [persisted, setPersisted] = useState<PumpfunExperimentPersisted>(() => createInitialPersisted());
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    setPersisted(loadPumpfunExperiment());
  }, []);

  const trendQ = useQuery({
    queryKey: ["alpha", "pumpfun-trend", period, "experiment"],
    queryFn: () => fetchPumpfunAlphaTrend(period),
    staleTime: STALE_MS,
  });

  const lastSigRef = useRef<string>("");

  useEffect(() => {
    const d = trendQ.data;
    if (!d) return;
    const sig = `${d.nowMs}|${d.tokens.map((t) => `${t.mint}:${t.marketCapUsd ?? ""}`).join(";")}`;
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;

    const watch = new Set(d.analysis.watchlist.map((w) => w.mint));
    setPersisted((prev) => {
      const next = processPumpfunExperimentTick({
        persisted: prev,
        tokens: d.tokens,
        nowMs: d.nowMs,
        watchlistMints: watch,
      });
      savePumpfunExperiment(next);
      return next;
    });
  }, [trendQ.data]);

  const resetAll = useCallback(() => {
    const fresh = createInitialPersisted();
    const d = trendQ.data;
    let next = fresh;
    if (d) {
      const watch = new Set(d.analysis.watchlist.map((w) => w.mint));
      const sig = `${d.nowMs}|${d.tokens.map((t) => `${t.mint}:${t.marketCapUsd ?? ""}`).join(";")}`;
      lastSigRef.current = sig;
      next = processPumpfunExperimentTick({
        persisted: fresh,
        tokens: d.tokens,
        nowMs: d.nowMs,
        watchlistMints: watch,
      });
    } else {
      lastSigRef.current = "";
    }
    savePumpfunExperiment(next);
    setPersisted(next);
  }, [trendQ.data]);

  return { persisted, trendQ, resetAll };
}
