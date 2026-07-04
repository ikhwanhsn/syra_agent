import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/env";

const base = () => getApiBaseUrl().replace(/\/$/, "");

export type PillarId = "earn" | "treasury" | "invest" | "spend" | "grow";

export type PillarMeta = {
  id: PillarId;
  label: string;
  tagline: string;
  order: number;
  routePrefixes: string[];
  routeCount: number;
  toolCount: number;
};

export type PillarsDiscovery = {
  narrative: string;
  notice: string[];
  pillars: PillarMeta[];
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/** Public Invest adapters only. Internal adapters (giza, lp_real, rise) are not listed. */
export type InvestAdapterId = "jupiter";

export type InvestOpportunity = {
  adapter: InvestAdapterId | string;
  label: string;
  chain?: string;
  description: string;
  status: string;
  actions?: string[];
  toolId?: string;
  summary?: {
    enabled?: boolean;
    openPositions?: number;
    deployedSol?: number | null;
  };
};

export type InvestOpportunitiesData = {
  opportunities: InvestOpportunity[];
  disclaimer?: string;
  fetchedAt?: string;
};

export type InvestPosition = {
  id: string;
  adapter: string;
  pool?: string;
  status?: string;
  strategyId?: string;
  deployedSol?: number | null;
  netPnlPct?: number | null;
};

export type InvestPositionsData = {
  positions: InvestPosition[];
  count: number;
  fetchedAt?: string;
};

/** Illustrative notes for read-only simulator (probabilistic, not live quotes). */
export type InvestAprRange = {
  lowPct: number;
  highPct: number;
  label: string;
};

export const INVEST_ILLUSTRATIVE_APR: Record<string, InvestAprRange> = {
  jupiter: { lowPct: 0, highPct: 0, label: "Swap only — no yield estimate" },
};

export type RiseMarketRow = {
  address?: string;
  symbol?: string;
  name?: string;
  volume24hUsd?: number | null;
  marketCapUsd?: number | null;
  priceChange24hPct?: number | null;
  holders?: number | null;
};

export type RiseMarketsAggregate = {
  success: boolean;
  updatedAt?: string;
  degraded?: boolean;
  ecosystem?: {
    marketCount?: number;
    totalVolume24hUsd?: number;
    totalMarketCapUsd?: number;
  };
  topVolume24h?: RiseMarketRow[];
  topGainers24h?: RiseMarketRow[];
};

export type SpendTool = {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  path: string;
  method: string;
  pactEligible?: boolean;
  pactPremiumUsd?: number;
};

export type SpendToolsResponse = {
  success: boolean;
  tools: SpendTool[];
  pact?: { enabled: boolean; premiumUsdDefault?: number };
  error?: string;
};

export type SpendToolCategory =
  | "Intelligence"
  | "Nansen"
  | "Signals"
  | "Assets"
  | "DeFi"
  | "Social"
  | "Other";

export function categorizeSpendTool(tool: SpendTool): SpendToolCategory {
  const id = tool.id.toLowerCase();
  const path = tool.path.toLowerCase();
  if (id.startsWith("nansen") || path.includes("nansen")) return "Nansen";
  if (
    id.includes("signal") ||
    id.includes("indicator") ||
    id.includes("arbitrage") ||
    path.includes("signal") ||
    path.includes("indicator")
  ) {
    return "Signals";
  }
  if (
    id.includes("news") ||
    id.includes("sentiment") ||
    id.includes("event") ||
    id.includes("brain") ||
    id.includes("spcx") ||
    id.includes("equity") ||
    path.includes("news") ||
    path.includes("sentiment")
  ) {
    return "Intelligence";
  }
  if (
    id.startsWith("tokens") ||
    id.includes("asset") ||
    id.includes("coingecko") ||
    id.includes("birdeye") ||
    id.includes("gmgn") ||
    path.includes("assets")
  ) {
    return "Assets";
  }
  if (
    id.includes("giza") ||
    id.includes("jupiter") ||
    id.includes("rise") ||
    id.includes("topledger") ||
    id.includes("zerion") ||
    id.includes("pumpfun") ||
    id.includes("meteora")
  ) {
    return "DeFi";
  }
  if (id.includes("neynar") || id.startsWith("x-") || id.includes("twitter") || id.includes("social")) {
    return "Social";
  }
  return "Other";
}

export type AnalyticsKpi = {
  totalPaidApiCalls: number;
  paidApiCallsLast7Days: number;
  paidApiCallsLast30Days: number;
  completedPaidToolCalls?: number;
  chatsWithPaidToolUse?: number;
  updatedAt?: string;
};

export type PreviewNewsItem = {
  title?: string;
  news_url?: string;
  source_name?: string;
  date?: string;
  text?: string;
  tickers?: string[];
};

export type PreviewNewsResponse = {
  news?: PreviewNewsItem[];
  source?: string;
  error?: string;
};

export type PreviewSentimentResponse = {
  sentiment?: {
    total?: {
      "Total Positive"?: number;
      "Total Negative"?: number;
      "Total Neutral"?: number;
      "Sentiment Score"?: number;
    };
  };
  source?: string;
  error?: string;
};

export type PreviewSignalResponse = {
  signal?: {
    recommendation?: string;
    confidence?: number;
    summary?: string;
    trend?: string;
    [key: string]: unknown;
  };
  token?: string;
  source?: string;
  error?: string;
};

export type GrowAllocationItem = {
  symbol: string;
  mint?: string;
  amount?: number;
  valueUsd?: number | null;
  pct?: number | null;
};

export type GrowPortfolioSummary = {
  totalValueUsd?: number | null;
  tokenValueUsd?: number | null;
  defiNetWorthUsd?: number | null;
  tokenCount?: number;
  solBalance?: number;
  activeProtocols?: number;
  lendingNetUsd?: number | null;
  perpsCollateralUsd?: number | null;
  lpValueUsd?: number | null;
  stakingValueUsd?: number | null;
  yieldValueUsd?: number | null;
  pendingRewardsUsd?: number | null;
};

export type GrowDefiSlice = {
  netWorthUsd?: number | null;
  activeProtocols?: string[];
  lending?: { netUsd?: number | null; borrowUsd?: number | null; depositUsd?: number | null };
  perps?: { collateralUsd?: number | null };
  lp?: { valueUsd?: number | null };
  staking?: { valueUsd?: number | null };
  yield?: { valueUsd?: number | null };
  rewards?: { pendingUsd?: number | null };
};

export type GrowPortfolioData = {
  address?: string;
  totalValueUsd?: number | null;
  solBalance?: number;
  tokens?: GrowAllocationItem[];
  allocation?: GrowAllocationItem[];
  defi?: GrowDefiSlice;
  summary?: GrowPortfolioSummary;
};

export type GrowRecommendation = {
  id: string;
  type: string;
  priority: "low" | "medium" | "high" | string;
  title: string;
  rationale: string;
  suggestedAdapter?: string;
  probabilistic?: boolean;
};

export type GrowRecommendationsData = {
  recommendations: GrowRecommendation[];
  portfolioSummary?: GrowPortfolioSummary;
  defiSummary?: {
    netWorthUsd?: number | null;
    activeProtocols?: string[];
    lendingNetUsd?: number | null;
    pendingRewardsUsd?: number | null;
  };
  disclaimer?: string;
  fetchedAt?: string;
};

export async function fetchPillarsDiscovery(): Promise<PillarsDiscovery> {
  const res = await fetch(`${base()}/pillars`, { headers: { Accept: "application/json" } });
  const json = (await res.json()) as { success: boolean; data?: PillarsDiscovery; error?: string };
  if (!json.success || !json.data) throw new Error(json.error ?? "Failed to load pillars");
  return json.data;
}

export async function fetchInvestOpportunities(
  anonymousId?: string,
): Promise<ApiEnvelope<InvestOpportunitiesData>> {
  const q = anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : "";
  const res = await syraFetch(`${base()}/invest/opportunities${q}`);
  return res.json() as Promise<ApiEnvelope<InvestOpportunitiesData>>;
}

export async function fetchInvestPositions(
  anonymousId?: string,
): Promise<ApiEnvelope<InvestPositionsData>> {
  const q = anonymousId ? `?anonymousId=${encodeURIComponent(anonymousId)}` : "";
  const res = await syraFetch(`${base()}/invest/positions${q}`);
  return res.json() as Promise<ApiEnvelope<InvestPositionsData>>;
}

/** Free public RISE markets digest — no x402. */
export async function fetchRiseMarketsAggregate(): Promise<RiseMarketsAggregate> {
  const res = await fetch(`${base()}/uponly-rise-markets/aggregate`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`RISE markets failed (${res.status})`);
  return res.json() as Promise<RiseMarketsAggregate>;
}

export async function fetchGrowRecommendations(
  address?: string,
  anonymousId?: string,
): Promise<ApiEnvelope<GrowRecommendationsData>> {
  const params = new URLSearchParams();
  if (address) params.set("address", address);
  if (anonymousId) params.set("anonymousId", anonymousId);
  const q = params.toString() ? `?${params}` : "";
  const res = await syraFetch(`${base()}/grow/recommendations${q}`);
  return res.json() as Promise<ApiEnvelope<GrowRecommendationsData>>;
}

/** Public when `address` is provided (on-chain portfolio health check). */
export async function fetchGrowPortfolio(
  address: string,
): Promise<ApiEnvelope<GrowPortfolioData>> {
  const res = await fetch(
    `${base()}/grow/portfolio?address=${encodeURIComponent(address)}`,
    { headers: { Accept: "application/json" } },
  );
  return res.json() as Promise<ApiEnvelope<GrowPortfolioData>>;
}

export async function fetchEarnSummary(walletOrAnonymousId: string) {
  const res = await fetch(
    `${base()}/earn/summary?wallet=${encodeURIComponent(walletOrAnonymousId)}`,
    { headers: { Accept: "application/json" } },
  );
  return res.json();
}

/** Free x402 tool catalog — browsing does not require payment. */
export async function fetchSpendTools(): Promise<SpendToolsResponse> {
  const res = await fetch(`${base()}/agent/tools`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Tools catalog failed (${res.status})`);
  return res.json() as Promise<SpendToolsResponse>;
}

/** Free KPI endpoint — used for spend social proof. */
export async function fetchAnalyticsKpi(): Promise<AnalyticsKpi> {
  const res = await fetch(`${base()}/analytics/kpi`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Analytics KPI failed (${res.status})`);
  return res.json() as Promise<AnalyticsKpi>;
}

/** Free preview tier — no x402 payment. */
export async function fetchPreviewNews(ticker = "BTC"): Promise<PreviewNewsResponse> {
  const res = await fetch(
    `${base()}/preview/news?ticker=${encodeURIComponent(ticker)}`,
    { headers: { Accept: "application/json" } },
  );
  return res.json() as Promise<PreviewNewsResponse>;
}

export async function fetchPreviewSentiment(
  ticker = "general",
): Promise<PreviewSentimentResponse> {
  const res = await fetch(
    `${base()}/preview/sentiment?ticker=${encodeURIComponent(ticker)}`,
    { headers: { Accept: "application/json" } },
  );
  return res.json() as Promise<PreviewSentimentResponse>;
}

export async function fetchPreviewSignal(token = "solana"): Promise<PreviewSignalResponse> {
  const res = await fetch(
    `${base()}/preview/signal?token=${encodeURIComponent(token)}`,
    { headers: { Accept: "application/json" } },
  );
  return res.json() as Promise<PreviewSignalResponse>;
}

/** Probabilistic annual return range for a notional amount (read-only simulator). */
export function estimateReturnRange(
  amountUsd: number,
  range: InvestAprRange,
): { lowUsd: number; highUsd: number } {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { lowUsd: 0, highUsd: 0 };
  }
  return {
    lowUsd: (amountUsd * range.lowPct) / 100,
    highUsd: (amountUsd * range.highPct) / 100,
  };
}

export const PILLAR_COPY: Record<
  PillarId,
  { headline: string; description: string; href: string }
> = {
  earn: {
    headline: "Earn",
    description: "Monetize agent skills — prompts, campaigns, and API work.",
    href: "/earn",
  },
  treasury: {
    headline: "Treasury",
    description: "Allocate capital across agent wallets with policy controls.",
    href: "/treasury",
  },
  invest: {
    headline: "Invest",
    description: "Deploy capital into yield, LP, and trading strategies.",
    href: "/invest",
  },
  spend: {
    headline: "Spend",
    description: "Pay per API call with x402 micropayments.",
    href: "/spend",
  },
  grow: {
    headline: "Grow",
    description: "Optimize your portfolio and compound returns.",
    href: "/grow",
  },
};
