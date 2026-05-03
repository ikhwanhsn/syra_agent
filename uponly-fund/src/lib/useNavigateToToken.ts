import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";

export function useNavigateToToken() {
  const navigate = useNavigate();
  return useCallback(
    (market: RiseMarketRow) => {
      const mint = market.mint?.trim();
      if (!mint) return;
      void navigate(`/token/${encodeURIComponent(mint)}`);
    },
    [navigate],
  );
}
