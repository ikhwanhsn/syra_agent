import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { API_BASE, getApiHeaders } from "../../config/global";
import { RISE_UP_ONLY, mergeRiseUpOnlyWithLive, type RiseUpOnlyLiveStats, type RiseUpOnlyManual } from "@/data/riseUpOnly";

type FetchStatus = "idle" | "loading" | "ok" | "error";

type RiseUpOnlyMarketContextValue = {
  data: RiseUpOnlyManual;
  status: FetchStatus;
  errorMessage: string | null;
  refetch: () => void;
};

const RiseUpOnlyMarketContext = createContext<RiseUpOnlyMarketContextValue | null>(null);

type ApiRiseUpOnlyResponse =
  | { success: true; normalized: RiseUpOnlyLiveStats }
  | { success: false; error?: string };

export function RiseUpOnlyMarketProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [patch, setPatch] = useState<Partial<RiseUpOnlyLiveStats> | null>(null);

  const refetch = () => setVersion((v) => v + 1);

  useEffect(() => {
    const mint = RISE_UP_ONLY.mint?.trim() ?? null;
    if (!mint) {
      setStatus("ok");
      setErrorMessage(null);
      setPatch(null);
      return;
    }

    const ac = new AbortController();
    setStatus("loading");
    setErrorMessage(null);

    const fromEnv = typeof import.meta.env.VITE_SYRA_API_URL === "string" && import.meta.env.VITE_SYRA_API_URL.trim();
    const baseNorm = (fromEnv || `${API_BASE}/`).replace(/\/$/, "");
    const url = `${baseNorm}/uponly-rise-market/${encodeURIComponent(mint)}`;

    (async () => {
      try {
        const res = await fetch(url, {
          signal: ac.signal,
          headers: { ...getApiHeaders() },
        });
        const j = (await res.json().catch(() => ({}))) as ApiRiseUpOnlyResponse;
        if (!res.ok) {
          const err = "error" in j && typeof j.error === "string" ? j.error : res.statusText;
          setErrorMessage(err || "Could not load market data");
          setStatus("error");
          setPatch(null);
          return;
        }
        if (j && "success" in j && j.success && j.normalized && typeof j.normalized === "object") {
          setPatch(j.normalized);
          setStatus("ok");
          return;
        }
        setErrorMessage("Unexpected response from market API");
        setStatus("error");
        setPatch(null);
      } catch (e) {
        if (ac.signal.aborted) return;
        setErrorMessage(e instanceof Error ? e.message : "Network error");
        setStatus("error");
        setPatch(null);
      }
    })();

    return () => ac.abort();
  }, [version]);

  const data = useMemo(
    () => mergeRiseUpOnlyWithLive(RISE_UP_ONLY, patch),
    [patch],
  );

  const value = useMemo<RiseUpOnlyMarketContextValue>(
    () => ({ data, status, errorMessage, refetch }),
    [data, status, errorMessage],
  );

  return <RiseUpOnlyMarketContext.Provider value={value}>{children}</RiseUpOnlyMarketContext.Provider>;
}

/**
 * Merged RISE $UPONLY row (static config + live RISE API when available).
 * Outside the provider, returns static RISE_UP_ONLY and idle status.
 */
export function useRiseUpOnlyMarket(): RiseUpOnlyMarketContextValue {
  const ctx = useContext(RiseUpOnlyMarketContext);
  if (!ctx) {
    return {
      data: RISE_UP_ONLY,
      status: "idle",
      errorMessage: null,
      refetch: () => {},
    };
  }
  return ctx;
}
