import { getApiBaseUrl } from "@/lib/chatApi";

export type UtilityScoutConfidence = "low" | "medium" | "high";

export interface UtilityScoutLearnedProfile {
  sampleSize: number;
  topProjectTypes: Array<{ type: string; count: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
  withWebsiteRate: number | null;
  avgUtilityScore: number | null;
  patternsLearned?: string[];
}

export interface UtilityScoutPastEntry {
  mint: string;
  symbol: string;
  name?: string;
  projectType: string;
  utilityScore: number;
  marketCapUsd: number | null;
  complete?: boolean;
  website?: string | null;
  flaggedAtMs: number;
}

export interface PumpfunUtilityPick {
  mint: string;
  symbol: string;
  name: string;
  complete: boolean;
  marketCapUsd: number | null;
  utilityScore: number;
  learnedFitScore: number;
  projectType: string;
  website: string | null;
  twitter: string | null;
  utilityThesis: string;
  confidence: UtilityScoutConfidence;
}

export interface EcosystemUtilityPick {
  id: string;
  name: string;
  source: string;
  category: string;
  projectType: string;
  utility: string;
  signals: string[];
  link: string | null;
  score: number | null;
}

export interface PumpfunUtilityScoutBrief {
  nowMs: number;
  candidatePool: number;
  learnedProfile: UtilityScoutLearnedProfile;
  pastUtilityHistory: UtilityScoutPastEntry[];
  pumpfunUtilityPicks: PumpfunUtilityPick[];
  ecosystemUtilityPicks: EcosystemUtilityPick[];
  ecosystemNotes: string[];
  meta: {
    scoutTitle: string;
    scoutSummary: string;
    patternsLearned?: string[];
    riskCaveats: string[];
  };
}

export interface PumpfunUtilityScoutBriefResponse {
  data: PumpfunUtilityScoutBrief;
  savedAt: string;
  source: "database";
  nextRefreshAt: string | null;
}

function assertBriefShape(v: unknown): v is PumpfunUtilityScoutBrief {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.nowMs !== "number") return false;
  if (!o.learnedProfile || typeof o.learnedProfile !== "object") return false;
  if (!Array.isArray(o.pumpfunUtilityPicks)) return false;
  if (!o.meta || typeof o.meta !== "object") return false;
  return true;
}

export const PUMPFUN_UTILITY_SCOUT_CLIENT_STALE_MS = 60 * 60 * 1000;

export async function fetchPumpfunUtilityScoutBrief(): Promise<PumpfunUtilityScoutBriefResponse> {
  const base = `${getApiBaseUrl().replace(/\/$/, "")}/agent/pumpfun-utility-scout`;
  const res = await fetch(`${base}/brief`, { headers: { Accept: "application/json" } });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: unknown;
    savedAt?: string;
    nextRefreshAt?: string | null;
    error?: string;
    message?: string;
  };

  if (!res.ok || body.success !== true || !body.data || !assertBriefShape(body.data)) {
    throw new Error(body.error || body.message || "Failed to load Utility Scout brief");
  }

  return {
    data: body.data,
    savedAt: body.savedAt ?? new Date(0).toISOString(),
    source: "database",
    nextRefreshAt: body.nextRefreshAt ?? null,
  };
}
