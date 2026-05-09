import { useQuery } from "@tanstack/react-query";
import { getRisePortfolioPositions } from "@/lib/riseDashboardApi";
import type { RisePortfolioPosition } from "@/lib/riseDashboardTypes";

const PAGE_LIMIT = 100;
const STALE_MS = 30_000;

/**
 * Walks paginated RISE portfolio positions until `mint` matches or pages exhaust.
 * Returns `null` when the wallet has no row for that mint (balance treated as zero).
 */
export function useRisePortfolioPositionForMint(wallet: string | null | undefined, mint: string | null | undefined) {
  const w = wallet?.trim() ?? "";
  const m = mint?.trim() ?? "";
  const enabled = w.length >= 32 && m.length >= 32;

  return useQuery<RisePortfolioPosition | null, Error>({
    queryKey: ["rise-portfolio-position-by-mint", w, m],
    enabled,
    staleTime: STALE_MS,
    retry: 1,
    queryFn: async ({ signal }) => {
      const first = await getRisePortfolioPositions(w, 1, PAGE_LIMIT, signal);
      const hit = first.positions.find((p) => p.mint === m) ?? null;
      if (hit) return hit;

      const totalPages = Math.max(1, first.totalPages ?? 1);
      for (let page = 2; page <= totalPages; page += 1) {
        const next = await getRisePortfolioPositions(w, page, PAGE_LIMIT, signal);
        const found = next.positions.find((p) => p.mint === m) ?? null;
        if (found) return found;
      }
      return null;
    },
  });
}
