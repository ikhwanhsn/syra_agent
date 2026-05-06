import { getApiBaseUrl } from "@/lib/chatApi";
import type { InternalAgentSlug } from "@/lib/internalAgentsCatalog";

async function fetchInternalJson<T>(path: string): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (typeof body.message === "string" && body.message) ||
      (typeof body.error === "string" && body.error) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export interface AgentTeamLatestPayload {
  internal?: {
    summary?: string;
    generatedAt?: string;
    recommendations?: Array<{
      title?: string;
      why?: string;
      surface?: string;
      category?: string;
    }>;
    risks?: string[];
  };
  business?: {
    marketPosition?: string;
    generatedAt?: string;
    gtmRecommendations?: Array<{ title?: string; horizon?: string; channel?: string }>;
    monetizationIdeas?: Array<{ title?: string }>;
    competitiveRisks?: string[];
  };
  /** Crawled page URLs from last run */
  surfaces?: string[];
  baseUrls?: string[];
  crawledAt?: string;
  savedAt?: string;
}

export interface AgentTeamLatestResponse {
  success: boolean;
  data: AgentTeamLatestPayload | null;
  savedAt?: string;
}

export async function fetchAgentTeamLatest(): Promise<AgentTeamLatestResponse> {
  return fetchInternalJson<AgentTeamLatestResponse>("/internal/agent-team/latest");
}

export interface X402TrendBullet {
  title: string;
  detail: string;
  evidenceTweetIds: string[];
}

export interface X402XTrendsLatestPayload {
  summary?: string;
  bullets?: X402TrendBullet[];
  watchlist?: string[];
  noiseOrCaveats?: string[];
  generatedAt?: string;
  tweetsSampled?: number;
}

export interface X402XTrendsLatestResponse {
  success: boolean;
  data: X402XTrendsLatestPayload | null;
  savedAt?: string;
}

export async function fetchX402XTrendsLatest(): Promise<X402XTrendsLatestResponse> {
  return fetchInternalJson<X402XTrendsLatestResponse>("/internal/x402-x-trends/latest");
}

/** DexScreener / Jupiter / LLM growth digest */
export interface GrowthSyraMarketPayload {
  summary?: string;
  liquidityAssessment?: string;
  volumeAssessment?: string;
  bullSignals?: string[];
  riskSignals?: string[];
  growthActions?: string[];
  oneLineNorthStar?: string;
  generatedAt?: string;
  sourceStats?: {
    dexPairCount?: number;
    bestLiquidityUsd?: number | null;
    bestVolumeH24?: number | null;
    bestFdv?: number | null;
  };
}

export interface GrowthSyraMarketLatestResponse {
  success: boolean;
  data: GrowthSyraMarketPayload | null;
  savedAt?: string;
}

export async function fetchGrowthSyraMarketLatest(): Promise<GrowthSyraMarketLatestResponse> {
  return fetchInternalJson<GrowthSyraMarketLatestResponse>("/internal/growth-syra-market/latest");
}

export interface GrowthSocialBullet {
  title: string;
  detail: string;
  evidenceTweetIds: string[];
}

export interface GrowthSyraSocialPayload {
  summary?: string;
  sentiment?: string;
  tweetsSampled?: number;
  topThemes?: string[];
  communitySignals?: string[];
  risks?: string[];
  recommendedActions?: string[];
  bullets?: GrowthSocialBullet[];
  generatedAt?: string;
}

export interface GrowthSyraSocialLatestResponse {
  success: boolean;
  data: GrowthSyraSocialPayload | null;
  savedAt?: string;
}

export async function fetchGrowthSyraSocialLatest(): Promise<GrowthSyraSocialLatestResponse> {
  return fetchInternalJson<GrowthSyraSocialLatestResponse>("/internal/growth-syra-social/latest");
}

export interface GrowthSectorNarrativePayload {
  summary?: string;
  tweetsSampled?: number;
  tailwindThemes?: string[];
  headwindThemes?: string[];
  positioningIdeasForSyra?: string[];
  macroHeadline?: string;
  bullets?: X402TrendBullet[];
  generatedAt?: string;
}

export interface GrowthSectorNarrativeLatestResponse {
  success: boolean;
  data: GrowthSectorNarrativePayload | null;
  savedAt?: string;
}

export async function fetchGrowthSectorNarrativeLatest(): Promise<GrowthSectorNarrativeLatestResponse> {
  return fetchInternalJson<GrowthSectorNarrativeLatestResponse>("/internal/growth-sector-narrative/latest");
}

export type InternalAgentLatestResponse =
  | AgentTeamLatestResponse
  | X402XTrendsLatestResponse
  | GrowthSyraMarketLatestResponse
  | GrowthSyraSocialLatestResponse
  | GrowthSectorNarrativeLatestResponse;

export async function fetchInternalAgentLatest(slug: InternalAgentSlug): Promise<InternalAgentLatestResponse> {
  switch (slug) {
    case "agent-team":
      return fetchAgentTeamLatest();
    case "x402-pulse":
      return fetchX402XTrendsLatest();
    case "growth-syra-market":
      return fetchGrowthSyraMarketLatest();
    case "growth-syra-social":
      return fetchGrowthSyraSocialLatest();
    case "growth-sector-narrative":
      return fetchGrowthSectorNarrativeLatest();
    default: {
      const _exhaustive: never = slug;
      return _exhaustive;
    }
  }
}
