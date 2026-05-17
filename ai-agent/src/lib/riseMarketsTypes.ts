/**
 * RISE market rows from Syra API proxies (`/uponly-rise-markets/*`).
 * Mirrors uponly-fund riseDashboardTypes — null means unknown upstream.
 */

export type RiseMarketRow = {
  mint: string;
  marketAddress: string | null;
  name: string;
  symbol: string;
  imageUrl: string | null;
  tokenUri: string | null;
  twitterUrl: string | null;
  telegramUrl: string | null;
  discordUrl: string | null;
  priceUsd: number | null;
  floorPriceUsd: number | null;
  marketCapUsd: number | null;
  floorMarketCapUsd: number | null;
  volume24hUsd: number | null;
  volumeAllTimeUsd: number | null;
  holders: number | null;
  creatorFeePct: number | null;
  startingPriceUsd: number | null;
  priceChange24hPct: number | null;
  floorDeltaPct: number | null;
  lockedSupplyPct: number | null;
  level: number | null;
  isVerified: boolean;
  disableSell: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  ageHours: number | null;
  creator: string | null;
  tokenDecimals: number | null;
  mintMain: string | null;
};

export type RiseEcosystemTotals = {
  marketCount: number;
  sampledCount: number;
  totalMarketCapUsd: number;
  totalVolume24hUsd: number;
  totalFloorMarketCapUsd: number;
  totalHolders: number;
  verifiedCount: number;
  withFloorCount: number;
  medianCreatorFeePct: number | null;
};

export type RiseTerminalKpiSnapshot = {
  marketCount: number;
  volume24hUsd: number;
  marketCapUsd: number;
  alphaPicks: number;
};

export type RiseTerminalKpiTrend = {
  dayUtc: string;
  baselineDayUtc: string | null;
  today: RiseTerminalKpiSnapshot;
  yesterday: RiseTerminalKpiSnapshot | null;
  growthPctVsYesterday: {
    marketCount: number | null;
    volume24hUsd: number | null;
    marketCapUsd: number | null;
    alphaPicks: number | null;
  };
};

export type RiseAggregateResponse = {
  success: true;
  updatedAt: string;
  degraded: boolean;
  uponly: RiseMarketRow | null;
  ecosystem: RiseEcosystemTotals;
  terminalKpiTrend?: RiseTerminalKpiTrend | null;
  topVolume24h: RiseMarketRow[];
  topGainers24h: RiseMarketRow[];
  topLosers24h: RiseMarketRow[];
  mostHolders: RiseMarketRow[];
  largestByMcap: RiseMarketRow[];
  newest: RiseMarketRow[];
};

export type RiseMarketsListResponse = {
  success: true;
  page: number;
  limit: number;
  total: number | null;
  totalPages: number | null;
  count: number;
  markets: RiseMarketRow[];
  updatedAt: string;
};
