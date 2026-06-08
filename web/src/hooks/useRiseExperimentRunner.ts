import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRiseAlphaMarketsBundle } from "@/lib/riseMarketsApi";
import type { RiseMarketRow } from "@/lib/riseMarketsTypes";
import {
  buildRiseExperimentIntel,
  riseMarketsToExperimentTape,
  type RiseAlphaIntelResponse,
} from "@/lib/riseAlphaIntelApi";
import { fetchRiseExperimentLedger, saveRiseExperimentLedger } from "@/lib/riseExperimentApi";
import {
  clearLegacyRiseExperimentLocalStorage,
  createInitialRiseExperiment,
  processRiseExperimentTick,
  readLegacyRiseExperimentFromLocalStorage,
  type RiseEntryContext,
  type RiseExperimentPersisted,
} from "@/lib/riseExperimentModel";
import { enrichRiseMarket } from "@/lib/riseIntelligence";

const STALE_MS = 120_000;
const SAVE_DEBOUNCE_MS = 450;

function buildEntryContext(
  intel: RiseAlphaIntelResponse,
  markets: RiseMarketRow[],
  newDiscoveryMints: Set<string>,
): RiseEntryContext {
  const marketByMint = new Map<string, RiseMarketRow>();
  const riseReadyMints = new Set<string>();
  const riseWatchMints = new Set<string>();

  for (const row of markets) {
    marketByMint.set(row.mint, row);
    const enriched = enrichRiseMarket(row);
    if (enriched.agentTier === "ready") riseReadyMints.add(row.mint);
    else if (enriched.agentTier === "watch") riseWatchMints.add(row.mint);
  }

  return {
    nowMs: intel.nowMs,
    newDiscoveryMints,
    riseReadyMints,
    riseWatchMints,
    marketByMint,
  };
}

export function useRiseExperimentRunner() {
  const [persisted, setPersisted] = useState<RiseExperimentPersisted>(() => createInitialRiseExperiment());
  const [ledgerReady, setLedgerReady] = useState(false);
  const hydrated = useRef(false);
  const skipNextSave = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<RiseExperimentPersisted | null>(null);
  const lastSigRef = useRef<string>("");

  const scheduleSave = useCallback((state: RiseExperimentPersisted) => {
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
        void saveRiseExperimentLedger(payload).catch(() => {
          /* best-effort; next tick retries */
        });
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let ledger = await fetchRiseExperimentLedger();
        const legacy = readLegacyRiseExperimentFromLocalStorage();
        if (legacy) {
          const hasActivity =
            legacy.feedBootstrapped ||
            legacy.seenMints.length > 0 ||
            Object.values(legacy.cells).some(
              (c) => c.open.length > 0 || c.closed.length > 0,
            );
          if (hasActivity) {
            ledger = await saveRiseExperimentLedger(legacy);
          }
          clearLegacyRiseExperimentLocalStorage();
        }
        if (!cancelled) {
          skipNextSave.current = true;
          lastSigRef.current = "";
          setPersisted(ledger);
        }
      } catch {
        const legacy = readLegacyRiseExperimentFromLocalStorage();
        if (!cancelled && legacy) {
          skipNextSave.current = true;
          lastSigRef.current = "";
          setPersisted(legacy);
          void saveRiseExperimentLedger(legacy)
            .then(() => clearLegacyRiseExperimentLocalStorage())
            .catch(() => {});
        }
      } finally {
        if (!cancelled) {
          hydrated.current = true;
          setLedgerReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const marketsQ = useQuery({
    queryKey: ["alpha", "rise-markets", "experiment"],
    queryFn: () => fetchRiseAlphaMarketsBundle(),
    staleTime: STALE_MS,
  });

  const applyTick = useCallback(
    (intel: RiseAlphaIntelResponse, markets: RiseMarketRow[]) => {
      const tokens = riseMarketsToExperimentTape(markets, intel.nowMs);
      const sig = `${intel.nowMs}|${tokens.map((t) => `${t.mint}:${t.marketCapUsd ?? ""}`).join(";")}`;
      if (sig === lastSigRef.current) return;
      lastSigRef.current = sig;

      setPersisted((prev) => {
        const seen = new Set(prev.seenMints);
        const newDiscoveryMints = new Set<string>();
        for (const t of tokens) {
          if (!seen.has(t.mint)) newDiscoveryMints.add(t.mint);
        }
        const entryCtx = buildEntryContext(intel, markets, newDiscoveryMints);

        const next = processRiseExperimentTick({
          persisted: prev,
          tokens,
          nowMs: intel.nowMs,
          entryCtx,
        });
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  useEffect(() => {
    if (!ledgerReady || !marketsQ.data) return;
    const intel = buildRiseExperimentIntel(marketsQ.data);
    applyTick(intel, marketsQ.data.markets);
  }, [ledgerReady, marketsQ.data, applyTick]);

  const intelQ = {
    isLoading: marketsQ.isLoading,
    isFetching: marketsQ.isFetching,
    isError: marketsQ.isError,
    error: marketsQ.error,
    data: marketsQ.data ? buildRiseExperimentIntel(marketsQ.data) : undefined,
    refetch: async () => {
      lastSigRef.current = "";
      await marketsQ.refetch();
    },
  };

  const markets: RiseMarketRow[] = marketsQ.data?.markets ?? [];

  return { persisted, intelQ, markets, ledgerReady };
}
