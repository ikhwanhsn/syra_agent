"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchStakingProtocolSummary,
  type StakingProtocolSummary,
} from "@/lib/stakingSummary";

export function useStakingProtocolSummary() {
  const [summary, setSummary] = useState<StakingProtocolSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStakingProtocolSummary();
      setSummary(data);
      if (!data) {
        setError("Protocol stats unavailable");
      }
    } catch {
      setSummary(null);
      setError("Protocol stats unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { summary, loading, error, refetch };
}
