import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PumpfunAlphaPeriod } from "@/lib/pumpfunAlphaTrendApi";
import { fetchRiseAlphaIntel } from "@/lib/riseAlphaIntelApi";
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

  const intelQ = useQuery({
    queryKey: ["alpha", "rise-intel", period, "experiment"],
    queryFn: () => fetchRiseAlphaIntel(period),
    staleTime: STALE_MS,
  });

  const lastSigRef = useRef<string>("");

  useEffect(() => {
    const d = intelQ.data;
    if (!d) return;
    const sig = `${d.nowMs}|${d.tokens.map((t) => `${t.mint}:${t.marketCapUsd ?? ""}`).join(";")}|${d.riseAlphaMintTargets.join(",")}`;
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;

    const targets = new Set(d.riseAlphaMintTargets);
    setPersisted((prev) => {
      const next = processRiseExperimentTick({
        persisted: prev,
        tokens: d.tokens,
        nowMs: d.nowMs,
        riseAlphaMintTargets: targets,
      });
      saveRiseExperiment(next);
      return next;
    });
  }, [intelQ.data]);

  const resetAll = useCallback(() => {
    const fresh = createInitialRiseExperiment();
    const d = intelQ.data;
    let next = fresh;
    if (d) {
      const targets = new Set(d.riseAlphaMintTargets);
      const sig = `${d.nowMs}|${d.tokens.map((t) => `${t.mint}:${t.marketCapUsd ?? ""}`).join(";")}|${d.riseAlphaMintTargets.join(",")}`;
      lastSigRef.current = sig;
      next = processRiseExperimentTick({
        persisted: fresh,
        tokens: d.tokens,
        nowMs: d.nowMs,
        riseAlphaMintTargets: targets,
      });
    } else {
      lastSigRef.current = "";
    }
    saveRiseExperiment(next);
    setPersisted(next);
  }, [intelQ.data]);

  return { persisted, intelQ, resetAll };
}
