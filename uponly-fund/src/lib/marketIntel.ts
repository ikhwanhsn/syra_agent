/**
 * Derived analytics combining multiple Rise payloads — pure helpers for token detail UI.
 */
import { momentum, rsi, volatility } from "@/lib/computeIndicators";
import { computeNarrativeTags } from "@/components/terminal/IntelligenceEngine";
import type { RiseMarketRow, RiseOhlcCandle, RiseTransactionRow } from "@/lib/riseDashboardTypes";

export type TopPercentile = {
  /** 1 = best in cohort */
  rank: number;
  total: number;
  /** 1–100, ceil — display as "Top X%" */
  topPct: number;
};

function finitePick(rows: RiseMarketRow[], pick: (r: RiseMarketRow) => number | null): number[] {
  return rows.map(pick).filter((v): v is number => v !== null && Number.isFinite(v));
}

/** Higher value = better rank (mcap, volume, holders, age hours). */
export function computeTopPercentileHigherIsBetter(
  value: number | null,
  peers: readonly number[],
): TopPercentile | null {
  const vals = peers.filter((x) => Number.isFinite(x));
  if (value === null || !Number.isFinite(value) || vals.length === 0) return null;
  const strictlyBetter = vals.filter((x) => x > value).length;
  const rank = strictlyBetter + 1;
  const topPct = Math.max(1, Math.ceil((rank / vals.length) * 100));
  return { rank, total: vals.length, topPct };
}

/** Percentile in [0,100]: fraction of peers strictly below `value` (for generic charts). */
export function computePercentileRank(value: number | null, peers: readonly number[]): number | null {
  const vals = peers.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (value === null || !Number.isFinite(value) || vals.length === 0) return null;
  const below = vals.filter((x) => x < value).length;
  return (below / vals.length) * 100;
}

export type MarketRankPack = {
  mcap: TopPercentile | null;
  volume24h: TopPercentile | null;
  holders: TopPercentile | null;
  ageHours: TopPercentile | null;
};

export function computeMarketRanks(market: RiseMarketRow, allMarkets: RiseMarketRow[]): MarketRankPack {
  const cohort = allMarkets.filter((m) => m.mint !== market.mint);
  return {
    mcap: computeTopPercentileHigherIsBetter(market.marketCapUsd, finitePick(cohort, (r) => r.marketCapUsd)),
    volume24h: computeTopPercentileHigherIsBetter(market.volume24hUsd, finitePick(cohort, (r) => r.volume24hUsd)),
    holders: computeTopPercentileHigherIsBetter(market.holders, finitePick(cohort, (r) => r.holders)),
    ageHours: computeTopPercentileHigherIsBetter(market.ageHours, finitePick(cohort, (r) => r.ageHours)),
  };
}

export type OhlcStats = {
  high: number | null;
  low: number | null;
  range: number | null;
  avgClose: number | null;
  totalVolume: number | null;
  lastVsFirstPct: number | null;
  rsi14: number | null;
  momentum14: number | null;
  /** Sample volatility index from closes (see computeIndicators.volatility). */
  annualisedVol: number | null;
  candleCount: number;
};

export function computeOhlcStats(candles: RiseOhlcCandle[]): OhlcStats {
  const closes: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];
  let volSum = 0;

  for (const c of candles) {
    const closeCandidate =
      typeof c.close === "number" && Number.isFinite(c.close)
        ? c.close
        : typeof c.open === "number" && Number.isFinite(c.open)
          ? c.open
          : null;
    if (closeCandidate !== null) closes.push(closeCandidate);

    const h =
      typeof c.high === "number" && Number.isFinite(c.high)
        ? c.high
        : closeCandidate;
    const l =
      typeof c.low === "number" && Number.isFinite(c.low)
        ? c.low
        : closeCandidate;
    if (typeof h === "number" && Number.isFinite(h)) highs.push(h);
    if (typeof l === "number" && Number.isFinite(l)) lows.push(l);

    if (typeof c.volume === "number" && Number.isFinite(c.volume)) volSum += c.volume;
  }

  const high = highs.length ? Math.max(...highs) : null;
  const low = lows.length ? Math.min(...lows) : null;
  const range =
    high !== null && low !== null && Number.isFinite(high) && Number.isFinite(low) ? high - low : null;

  const avgClose =
    closes.length > 0 ? closes.reduce((a, b) => a + b, 0) / closes.length : null;

  const first = closes.length > 0 ? closes[0] : null;
  const last = closes.length > 0 ? closes[closes.length - 1] : null;
  const lastVsFirstPct =
    first !== null && last !== null && Number.isFinite(first) && first !== 0
      ? ((last - first) / first) * 100
      : null;

  return {
    high,
    low,
    range,
    avgClose,
    totalVolume: volSum > 0 ? volSum : null,
    lastVsFirstPct,
    rsi14: rsi(closes, 14),
    momentum14: momentum(closes, 14),
    annualisedVol: volatility(closes),
    candleCount: candles.length,
  };
}

export type TradeAggregates = {
  buyCount: number;
  sellCount: number;
  unknownCount: number;
  buyVolUsd: number;
  sellVolUsd: number;
  /** buyVol / (buyVol+sellVol), null if none */
  buySellRatio: number | null;
  uniqueWallets: number;
  avgTradeUsd: number | null;
  largestTradeUsd: number | null;
};

export type NormalizedTradeSide = "buy" | "sell" | "borrow" | "repay" | "create" | "other";

export function classifyTradeSide(kind: string | null): NormalizedTradeSide {
  const v = (kind ?? "").trim().toLowerCase();
  if (!v) return "other";
  if (v === "buy" || v === "sell" || v === "borrow" || v === "repay" || v === "create") return v;
  if (/(buy|long|bid)/.test(v)) return "buy";
  if (/(sell|short|ask)/.test(v)) return "sell";
  if (/borrow|deposit/.test(v)) return "borrow";
  if (/repay|withdraw/.test(v)) return "repay";
  if (/create|mint/.test(v)) return "create";
  return "other";
}

export function computeTradeAggregates(transactions: RiseTransactionRow[]): TradeAggregates {
  let buyCount = 0;
  let sellCount = 0;
  let unknownCount = 0;
  let buyVolUsd = 0;
  let sellVolUsd = 0;
  const wallets = new Set<string>();
  const usdAmounts: number[] = [];

  for (const row of transactions) {
    const amountUsd =
      typeof row.amountUsd === "number" && Number.isFinite(row.amountUsd) && row.amountUsd > 0
        ? row.amountUsd
        : null;
    const side = classifyTradeSide(row.kind);

    if (side === "buy") buyCount += 1;
    else if (side === "sell") sellCount += 1;
    else unknownCount += 1;

    if (amountUsd !== null) {
      usdAmounts.push(amountUsd);
      if (side === "buy") buyVolUsd += amountUsd;
      else if (side === "sell") sellVolUsd += amountUsd;
    }

    const w = row.wallet;
    if (typeof w === "string" && w.trim()) wallets.add(w.trim());
  }

  const denom = buyVolUsd + sellVolUsd;
  const buySellRatio = denom > 0 ? buyVolUsd / denom : null;

  const largestTradeUsd = usdAmounts.length ? Math.max(...usdAmounts) : null;
  const avgTradeUsd = usdAmounts.length ? usdAmounts.reduce((a, b) => a + b, 0) / usdAmounts.length : null;

  return {
    buyCount,
    sellCount,
    unknownCount,
    buyVolUsd,
    sellVolUsd,
    buySellRatio,
    uniqueWallets: wallets.size,
    avgTradeUsd,
    largestTradeUsd,
  };
}

/**
 * Decode raw token base-units to a human amount using `tokenDecimals`.
 */
export function decodeTokenAmount(
  raw: number | null,
  decimals: number | null,
): number | null {
  if (raw === null || !Number.isFinite(raw)) return null;
  if (decimals === null || !Number.isFinite(decimals) || decimals < 0) return null;
  return raw / Math.pow(10, decimals);
}

/**
 * Per-token USD price from the trade itself: `amountUsd / amountTokens`.
 */
export function deriveTradePriceUsd(
  amountUsd: number | null,
  amountTokens: number | null,
): number | null {
  if (
    amountUsd === null ||
    amountTokens === null ||
    !Number.isFinite(amountUsd) ||
    !Number.isFinite(amountTokens) ||
    amountTokens <= 0
  ) {
    return null;
  }
  return amountUsd / amountTokens;
}

export function findSimilarMarkets(
  market: RiseMarketRow,
  all: RiseMarketRow[],
  opts?: { limit?: number },
): RiseMarketRow[] {
  const limit = opts?.limit ?? 6;
  const tags = new Set(computeNarrativeTags(market));
  const selfLogMcap =
    market.marketCapUsd !== null && market.marketCapUsd > 0 && Number.isFinite(market.marketCapUsd)
      ? Math.log10(market.marketCapUsd)
      : null;

  return all
    .filter((m) => m.mint !== market.mint)
    .map((m) => {
      let score = 0;
      const mLog =
        m.marketCapUsd !== null && m.marketCapUsd > 0 && Number.isFinite(m.marketCapUsd)
          ? Math.log10(m.marketCapUsd)
          : null;
      if (selfLogMcap !== null && mLog !== null) score -= Math.abs(selfLogMcap - mLog);
      const overlap = computeNarrativeTags(m).filter((t) => tags.has(t)).length;
      score += overlap * 3;
      return { m, score };
    })
    .sort((a, b) => b.score - a.score || (b.m.volume24hUsd ?? 0) - (a.m.volume24hUsd ?? 0))
    .slice(0, limit)
    .map(({ m }) => m);
}

export function computeRoiFromStart(priceUsd: number | null, startingPriceUsd: number | null): number | null {
  if (
    priceUsd === null ||
    startingPriceUsd === null ||
    !Number.isFinite(priceUsd) ||
    !Number.isFinite(startingPriceUsd) ||
    startingPriceUsd <= 0
  ) {
    return null;
  }
  return ((priceUsd - startingPriceUsd) / startingPriceUsd) * 100;
}

export function computeFloorCoverage(floorMcap: number | null, mcap: number | null): number | null {
  if (
    floorMcap === null ||
    mcap === null ||
    !Number.isFinite(floorMcap) ||
    !Number.isFinite(mcap) ||
    mcap <= 0
  ) {
    return null;
  }
  return Math.min(100, (floorMcap / mcap) * 100);
}

export function computeTurnoverRatio(volume24hUsd: number | null, marketCapUsd: number | null): number | null {
  if (
    volume24hUsd === null ||
    marketCapUsd === null ||
    !Number.isFinite(volume24hUsd) ||
    !Number.isFinite(marketCapUsd) ||
    marketCapUsd <= 0
  ) {
    return null;
  }
  return volume24hUsd / marketCapUsd;
}
