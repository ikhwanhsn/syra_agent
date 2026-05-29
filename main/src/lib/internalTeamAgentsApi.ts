import { getApiBaseUrl } from "@/lib/chatApi";
import type { InternalAgentSlug } from "@/lib/internalAgentsCatalog";

async function fetchInternalJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, { ...init, credentials: "include" });
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

export interface TrendScoutContentSuggestion {
  title: string;
  angle: string;
  platforms: string[];
  hook: string;
  priority: "high" | "medium" | "low";
}

export interface TrendScoutFeatureSuggestion {
  title: string;
  why: string;
  surface: string;
  priority: "high" | "medium" | "low";
}

export interface TrendScoutPayload {
  marketSummary?: string;
  trendingTopics?: string[];
  contentSuggestions?: TrendScoutContentSuggestion[];
  featureSuggestions?: TrendScoutFeatureSuggestion[];
  risksOrCaveats?: string[];
  generatedAt?: string;
  sourceStats?: {
    headlineCount?: number;
    articleCount?: number;
    eventDayCount?: number;
  };
}

export interface TrendScoutLatestResponse {
  success: boolean;
  data: TrendScoutPayload | null;
  savedAt?: string;
}

export async function fetchTrendScoutLatest(): Promise<TrendScoutLatestResponse> {
  return fetchInternalJson<TrendScoutLatestResponse>("/internal/trend-scout/latest");
}

export interface PartnershipTarget {
  name: string;
  projectType: string;
  utility: string;
  whyFitForSyra: string;
  collaborationIdea: string;
  onchainSignals: string[];
  priority: "high" | "medium" | "low";
  link?: string | null;
}

export interface PartnershipScoutPayload {
  ranAt?: string;
  ecosystemSummary?: string;
  onchainThemes?: string[];
  partnershipTargets?: PartnershipTarget[];
  quickIntegrations?: string[];
  risksOrCaveats?: string[];
  generatedAt?: string;
  sourceStats?: Record<string, number>;
  candidatesScanned?: number;
  candidatesFresh?: number;
  extractedTargets?: number;
  extractedIntegrations?: number;
  newSaved?: number;
  skippedExisting?: number;
}

export interface PartnershipScoutLatestResponse {
  success: boolean;
  data: PartnershipScoutPayload | null;
  savedAt?: string;
}

export async function fetchPartnershipScoutLatest(): Promise<PartnershipScoutLatestResponse> {
  return fetchInternalJson<PartnershipScoutLatestResponse>("/internal/partnership-scout/latest-run");
}


export type InternalAgentLatestResponse = TrendScoutLatestResponse | PartnershipScoutLatestResponse;

export async function fetchInternalAgentLatest(
  slug: InternalAgentSlug,
): Promise<InternalAgentLatestResponse> {
  switch (slug) {
    case "trend-scout":
      return fetchTrendScoutLatest();
    case "partnership-scout":
      return fetchPartnershipScoutLatest();
    default: {
      const _exhaustive: never = slug;
      return _exhaustive;
    }
  }
}
