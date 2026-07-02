export interface SyraAnalyticsOverview {
  priceUsd: number;
  fdvUsd: number;
  volume24hUsd: number;
  volume7dUsd: number;
  volumeAllTimeUsd: number;
  totalHolders: number;
  top10ConcentrationPct: number;
}

export interface SyraAnalyticsDayPoint {
  day: string;
  label: string;
}

export interface SyraAnalyticsTradingVolumePoint extends SyraAnalyticsDayPoint {
  buyVolumeUsd: number;
  sellVolumeUsd: number;
  totalVolumeUsd: number;
  tradeCount: number;
}

export interface SyraAnalyticsUniqueTradersPoint extends SyraAnalyticsDayPoint {
  uniqueTraders: number;
}

export interface SyraAnalyticsVwapPoint extends SyraAnalyticsDayPoint {
  vwapPriceUsd: number;
  volumeUsd: number;
}

export interface SyraAnalyticsVenuePoint extends SyraAnalyticsDayPoint {
  project: string;
  volumeUsd: number;
  tradeCount: number;
}

export interface SyraAnalyticsHolderPoint extends SyraAnalyticsDayPoint {
  holderCount: number;
}

export interface SyraAnalyticsTopHolder {
  wallet: string;
  syraBalance: number;
  pctOfSupply: number;
  updatedAt: string | null;
}

export interface SyraAnalyticsStakingPoint extends SyraAnalyticsDayPoint {
  grossInflow: number;
  grossOutflow: number;
  netFlow: number;
  cumulativeNetLocked: number;
  pctSupplyLocked: number;
  uniqueLockers: number;
}

export interface SyraAnalyticsBuybackEvent {
  blockTime: string;
  syraBought: number;
  usdSpent: number;
  paidWith: string | null;
  project: string | null;
  txId: string | null;
  cumulativeSyraBought: number;
  cumulativeUsdSpent: number;
}

export interface SyraDuneAnalyticsPayload {
  updatedAt: string;
  source: string;
  overview: SyraAnalyticsOverview;
  trading: {
    dailyVolume: SyraAnalyticsTradingVolumePoint[];
    uniqueTraders: SyraAnalyticsUniqueTradersPoint[];
    vwap: SyraAnalyticsVwapPoint[];
    venues: SyraAnalyticsVenuePoint[];
  };
  holders: {
    overTime: SyraAnalyticsHolderPoint[];
    topHolders: SyraAnalyticsTopHolder[];
  };
  staking: {
    daily: SyraAnalyticsStakingPoint[];
    approximate: boolean;
  };
  buybacks: {
    events: SyraAnalyticsBuybackEvent[];
    cumulativeSyraBought: number;
    cumulativeUsdSpent: number;
    totalEvents: number;
  };
  links?: {
    duneOverview: string;
    duneQueries: Record<string, string>;
  };
}

export interface SyraDuneAnalyticsResponse {
  success: boolean;
  data?: SyraDuneAnalyticsPayload;
  error?: string;
}

export const SYRA_DUNE_OVERVIEW_URL = "https://dune.com/queries/7862075";
