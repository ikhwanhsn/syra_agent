"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchSyraWalletBalance,
  isSyraHolderEligible,
  SYRA_HOLDER_THRESHOLD,
  syraHolderProgressPct,
} from "@/lib/syraHolder";

export function useSyraHolderBalance(
  walletAddress: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const enabled = (options?.enabled ?? true) && !!walletAddress?.trim();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!walletAddress?.trim()) {
      setBalance(null);
      return null;
    }
    setLoading(true);
    try {
      const next = await fetchSyraWalletBalance(walletAddress);
      setBalance(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    void fetchSyraWalletBalance(walletAddress!.trim()).then((next) => {
      if (!cancelled) {
        setBalance(next);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, walletAddress]);

  return {
    balance,
    loading,
    refresh,
    threshold: SYRA_HOLDER_THRESHOLD,
    progressPct: syraHolderProgressPct(balance),
    isEligible: isSyraHolderEligible(balance),
  };
}
