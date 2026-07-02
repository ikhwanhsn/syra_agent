"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/env";
import type { SyraDuneAnalyticsPayload, SyraDuneAnalyticsResponse } from "@/lib/syraDuneAnalyticsApi";

export interface UseSyraDuneAnalyticsResult {
  data: SyraDuneAnalyticsPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSyraDuneAnalytics(): UseSyraDuneAnalyticsResult {
  const [data, setData] = useState<SyraDuneAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (refresh = false) => {
    const base = getApiBaseUrl();
    if (!base) {
      setError("API URL not configured");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const qs = refresh ? "?refresh=1" : "";
      const res = await fetch(`${base.replace(/\/$/, "")}/syra-analytics${qs}`, {
        method: "GET",
        cache: "no-store",
      });
      const body = (await res.json().catch(() => ({}))) as SyraDuneAnalyticsResponse;
      if (!res.ok || !body.success || !body.data) {
        throw new Error(body.error || `Failed to load analytics (${res.status})`);
      }
      setData(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics(false);
  }, [fetchAnalytics]);

  const refresh = useCallback(async () => {
    await fetchAnalytics(true);
  }, [fetchAnalytics]);

  return { data, loading, error, refresh };
}
