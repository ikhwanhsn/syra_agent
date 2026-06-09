import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPumpfunAlphaTrend, PUMPFUN_ALPHA_TREND_CLIENT_STALE_MS, type PumpfunAlphaPeriod } from "@/lib/pumpfunAlphaTrendApi";
import { fetchPumpfunExperimentLedger, savePumpfunExperimentLedger } from "@/lib/pumpfunExperimentApi";
import {
  clearLegacyPumpfunExperimentLocalStorage,
  createInitialPersisted,
  processPumpfunExperimentTick,
  readLegacyPumpfunExperimentFromLocalStorage,
  type PumpfunExperimentPersisted,
} from "@/lib/pumpfunExperimentModel";

const STALE_MS = PUMPFUN_ALPHA_TREND_CLIENT_STALE_MS;
const SAVE_DEBOUNCE_MS = 450;

export function usePumpfunExperimentRunner(period: PumpfunAlphaPeriod) {
  const [persisted, setPersisted] = useState<PumpfunExperimentPersisted>(() => createInitialPersisted());
  const hydrated = useRef(false);
  const skipNextSave = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<PumpfunExperimentPersisted | null>(null);

  const scheduleSave = useCallback((state: PumpfunExperimentPersisted) => {
    if (!hydrated.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    pendingSave.current = state;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = pendingSave.current;
      pendingSave.current = null;
      if (payload) {
        void savePumpfunExperimentLedger(payload).catch(() => {
          /* best-effort; next tick retries */
        });
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let ledger = await fetchPumpfunExperimentLedger();
        const legacy = readLegacyPumpfunExperimentFromLocalStorage();
        if (legacy) {
          const hasActivity =
            legacy.feedBootstrapped ||
            legacy.seenMints.length > 0 ||
            Object.values(legacy.cells).some(
              (c) => c.open.length > 0 || c.closed.length > 0 || c.balanceSol !== 10,
            );
          if (hasActivity) {
            ledger = await savePumpfunExperimentLedger(legacy);
          }
          clearLegacyPumpfunExperimentLocalStorage();
        }
        if (!cancelled) {
          skipNextSave.current = true;
          setPersisted(ledger);
        }
      } catch {
        const legacy = readLegacyPumpfunExperimentFromLocalStorage();
        if (!cancelled && legacy) {
          skipNextSave.current = true;
          setPersisted(legacy);
          void savePumpfunExperimentLedger(legacy)
            .then(() => clearLegacyPumpfunExperimentLocalStorage())
            .catch(() => {});
        }
      } finally {
        if (!cancelled) hydrated.current = true;
      }
    })();

    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const trendQ = useQuery({
    queryKey: ["alpha", "pumpfun-trend", period, "experiment"],
    queryFn: () => fetchPumpfunAlphaTrend(period, { mode: "experiment" }),
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
  });

  const lastSigRef = useRef<string>("");

  useEffect(() => {
    const d = trendQ.data?.data;
    if (!d || !hydrated.current) return;
    const sig = `${d.nowMs}|${d.tokens.map((t) => `${t.mint}:${t.complete}:${t.marketCapUsd ?? ""}`).join(";")}`;
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;

    const watch = new Set([
      ...d.analysis.watchlist.map((w) => w.mint),
      ...(d.betaTokens ?? []).map((b) => b.mint),
    ]);
    setPersisted((prev) => {
      const next = processPumpfunExperimentTick({
        persisted: prev,
        tokens: d.tokens,
        nowMs: d.nowMs,
        watchlistMints: watch,
      });
      scheduleSave(next);
      return next;
    });
  }, [trendQ.data, scheduleSave]);

  return { persisted, trendQ };
}
