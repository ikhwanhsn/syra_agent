import { getApiBaseUrl } from "@/lib/env";

export type BtcExchange = "binance" | "coinbase";
export type BtcInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
export type BtcRatioSource = "taker" | "proxy";

export interface BtcBubblePoint {
  time: number;
  price: number;
  ratio: number;
  takerBuyVolume: number;
  takerSellVolume: number;
  extremePercentile: number;
}

export interface BtcBubblemapData {
  exchange: BtcExchange;
  interval: BtcInterval;
  ratioSource: BtcRatioSource;
  symbol: string;
  points: BtcBubblePoint[];
  computedAt: string;
}

export interface BtcOverview {
  price: {
    usd: number | null;
    change24hPct: number | null;
    high24h: number | null;
    low24h: number | null;
    volumeBtc24h: number | null;
    volumeUsd24h: number | null;
  };
  exchanges: {
    binance: { priceUsd: number | null };
    coinbase: { priceUsd: number | null };
    coinbasePremiumPct: number | null;
  };
  market: {
    marketCapUsd: number | null;
    dominancePct: number | null;
  };
  derivatives: {
    fundingRate: number | null;
    markPrice: number | null;
    openInterestBtc: number | null;
  };
  sentiment: {
    fearGreedIndex: number | null;
    fearGreedLabel: string | null;
  };
  computedAt: string;
}

export interface BtcTechnicalsSection {
  asOf: string;
  lastClose: number | null;
  rsi: number | null;
  rsiSignal: string | null;
  macdHistogram: number | null;
  macdSignal: string | null;
  ema21: number | null;
  emaSignal: string | null;
  bollingerUpper: number | null;
  bollingerLower: number | null;
  bollingerSignal: string | null;
}

export interface BtcPerformanceSection {
  currentPrice: number;
  changes: {
    "24h"?: number | null;
    "7d"?: number | null;
    "30d"?: number | null;
    "90d"?: number | null;
    "1y"?: number | null;
  };
}

export interface BtcVolatilitySection {
  atr14: number | null;
  atrPct: number | null;
  rangePositionPct: number | null;
  high24h: number | null;
  low24h: number | null;
}

export interface BtcOrderBookSection {
  midPrice: number;
  bidNotional: number;
  askNotional: number;
  imbalancePct: number | null;
  spreadBps: number | null;
}

export interface BtcFundingSection {
  current: number | null;
  annualizedPct: number | null;
  series: { time: number; rate: number }[];
}

export interface BtcOpenInterestSection {
  latestBtc: number | null;
  change24hPct: number | null;
  series: { time: number; oiBtc: number; oiUsd: number | null }[];
}

export interface BtcLongShortSection {
  latest: number | null;
  series: { time: number; ratio: number; longPct: number | null; shortPct: number | null }[];
}

export interface BtcTakerFlowSection {
  buyPct24h: number | null;
  bars: { time: number; buyPct: number; volume: number }[];
}

export interface BtcCorrelationSection {
  pairs: { symbol: string; label: string; correlation: number }[];
  interval: string;
}

export interface BtcFearGreedHistorySection {
  series: { time: number; value: number; label: string | null }[];
}

export interface BtcMarketStructureSection {
  totalMarketCapUsd: number | null;
  totalVolumeUsd24h: number | null;
  btcDominancePct: number | null;
  ethBtcDominanceRatio: number | null;
  altSeasonProxy: number | null;
}

export interface BtcNewsItem {
  title: string;
  url: string | null;
  date: string | null;
  source: string | null;
}

export interface BtcNewsSection {
  items: BtcNewsItem[];
}

export interface BtcSentimentSection {
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  score: number | null;
}

export interface BtcSignalSection {
  bias: string | null;
  confidence: number | null;
  reasoning: string | null;
  source: string | null;
  asOf: string | null;
}

export interface BtcSupplySection {
  circulating: number | null;
  maxSupply: number | null;
  pctMined: number | null;
  nextHalvingAt: string;
  daysToHalving: number | null;
}

export interface BtcDashboardSections {
  technicals: BtcTechnicalsSection | null;
  performance: BtcPerformanceSection | null;
  volatility: BtcVolatilitySection | null;
  orderBook: BtcOrderBookSection | null;
  funding: BtcFundingSection | null;
  openInterest: BtcOpenInterestSection | null;
  longShort: BtcLongShortSection | null;
  takerFlow: BtcTakerFlowSection | null;
  correlations: BtcCorrelationSection | null;
  fearGreedHistory: BtcFearGreedHistorySection | null;
  marketStructure: BtcMarketStructureSection | null;
  news: BtcNewsSection | null;
  sentiment: BtcSentimentSection | null;
  signal: BtcSignalSection | null;
  supply: BtcSupplySection | null;
}

export interface BtcDashboard {
  overview: BtcOverview;
  sections: BtcDashboardSections;
  computedAt: string;
}

export class BtcApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "BtcApiError";
    this.status = status;
  }
}

function apiBase(): string {
  return getApiBaseUrl().replace(/\/$/, "");
}

async function btcFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const json = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
  if (!res.ok || !json || json.success === false) {
    const msg =
      (json && typeof json.error === "string" && json.error) ||
      `Request failed (${res.status} ${res.statusText})`;
    throw new BtcApiError(msg, res.status);
  }
  return json as T;
}

export async function fetchBtcOverview(signal?: AbortSignal): Promise<BtcOverview> {
  const json = await btcFetch<{ success: true; data: BtcOverview }>("/btc/overview", signal);
  return json.data;
}

export async function fetchBtcDashboard(signal?: AbortSignal): Promise<BtcDashboard> {
  const json = await btcFetch<{ success: true; data: BtcDashboard }>("/btc/dashboard", signal);
  return json.data;
}

export interface FetchBtcBubblemapParams {
  exchange?: BtcExchange;
  interval?: BtcInterval;
  limit?: number;
  signal?: AbortSignal;
}

export async function fetchBtcBubblemap(params: FetchBtcBubblemapParams = {}): Promise<BtcBubblemapData> {
  const sp = new URLSearchParams();
  if (params.exchange) sp.set("exchange", params.exchange);
  if (params.interval) sp.set("interval", params.interval);
  if (params.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  const json = await btcFetch<{ success: true; data: BtcBubblemapData }>(
    `/btc/bubblemap${qs ? `?${qs}` : ""}`,
    params.signal,
  );
  return json.data;
}

export function formatBtcUsd(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatBtcCompactUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBtcPct(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatBtcRatio(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(3);
}

export function formatFundingRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(4)}%`;
}

export function formatBtcVolume(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatBubbleTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
