import { fetchPumpfunAlphaTrend, type PumpfunAlphaPeriod, type PumpfunAlphaTrendResponse } from "@/lib/pumpfunAlphaTrendApi";

/** Rise vault / fund lens layered on the same graduate feed as Pumpfun Alpha (paper metrics — not on-chain). */
export interface RiseAlphaFundLens {
  /** Modeled Rise borrow pool size (USD). */
  borrowPoolUsd: number;
  /** Pool utilization 0–100. */
  utilizationPct: number;
  /** Variable borrow APR for the Rise-style vault (percent points). */
  borrowAprPct: number;
  /** Supply-side lend APR (percent points). */
  lendAprPct: number;
  /** Modeled net liquid value for the Alpha sleeve (USD). */
  alphaNlvUsd: number;
  /** Modeled 24h net flow into the sleeve (USD). */
  flow24hUsd: number;
}

export interface RiseAlphaIntelResponse extends PumpfunAlphaTrendResponse {
  rise: RiseAlphaFundLens;
  /** Mints tracked as “Rise Alpha” — watchlist plus the tape leader for the window. */
  riseAlphaMintTargets: string[];
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function deriveFundLens(nowMs: number, matchedCount: number, topMc: number | null): RiseAlphaFundLens {
  const seed = (Number(nowMs) ^ (matchedCount * 9973)) % 100000;
  const mc = topMc != null && Number.isFinite(topMc) ? topMc : 420_000;
  const utilizationPct = clamp(38 + (seed % 35) + matchedCount * 0.15, 24, 88);
  const borrowAprPct = clamp(9 + utilizationPct * 0.11 + (seed % 7) * 0.05, 7.5, 26);
  const lendAprPct = clamp(borrowAprPct * 0.62 + (seed % 5) * 0.04, 4, 16);
  const borrowPoolUsd = mc * (2.4 + (seed % 120) / 100);
  const alphaNlvUsd = borrowPoolUsd * (0.55 + (seed % 40) / 200);
  const flow24hUsd = alphaNlvUsd * ((seed % 17) - 8) / 400;
  return {
    borrowPoolUsd,
    utilizationPct,
    borrowAprPct,
    lendAprPct,
    alphaNlvUsd,
    flow24hUsd,
  };
}

export async function fetchRiseAlphaIntel(period: PumpfunAlphaPeriod): Promise<RiseAlphaIntelResponse> {
  const base = await fetchPumpfunAlphaTrend(period);
  const topMc = base.tokens[0]?.marketCapUsd ?? null;
  const rise = deriveFundLens(base.nowMs, base.matchedCount, topMc);
  const watch = base.analysis.watchlist.map((w) => w.mint);
  const leader = base.tokens[0]?.mint;
  const riseAlphaMintTargets = [...new Set([...watch, ...(leader ? [leader] : [])])];
  return { ...base, rise, riseAlphaMintTargets };
}
