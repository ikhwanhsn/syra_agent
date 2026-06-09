import { getApiBaseUrl } from "@/lib/chatApi";

export type PumpfunScoutConfidence = "low" | "medium" | "high";

export interface PumpfunScoutLearnedProfile {
  sampleSize: number;
  topKeywords: Array<{ keyword: string; count: number }>;
  mcBandUsd: { min: number | null; max: number | null; median: number | null };
  completeRate: number | null;
  avgPumpScoreAtFlag: number | null;
  prefersComplete: boolean | null;
  patternsLearned?: string[];
}

export interface PumpfunScoutPastAlpha {
  mint: string;
  symbol: string;
  name?: string;
  complete?: boolean;
  marketCapUsd: number | null;
  pumpScore: number;
  keywords?: string[];
  flaggedAtMs: number;
}

export interface PumpfunScoutRunner {
  mint: string;
  symbol: string;
  name: string;
  complete: boolean;
  marketCapUsd: number | null;
  pumpScore: number | null;
  reason: string;
}

export interface PumpfunScoutPrediction {
  mint: string;
  symbol: string;
  name?: string;
  complete?: boolean;
  marketCapUsd: number | null;
  pumpScore: number;
  learnedFitScore: number;
  thesis: string;
  confidence: PumpfunScoutConfidence;
  matchedPatterns: string[];
}

export interface PumpfunAlphaScoutBrief {
  nowMs: number;
  candidatePool: number;
  learnedProfile: PumpfunScoutLearnedProfile;
  pastAlphaHistory: PumpfunScoutPastAlpha[];
  currentAlphaRunners: PumpfunScoutRunner[];
  predictedAlphas: PumpfunScoutPrediction[];
  meta: {
    scoutTitle: string;
    scoutSummary: string;
    patternsLearned?: string[];
    riskCaveats: string[];
  };
}

export interface PumpfunAlphaScoutBriefResponse {
  data: PumpfunAlphaScoutBrief;
  savedAt: string;
  source: "database";
  nextRefreshAt: string | null;
}

function assertBriefShape(v: unknown): v is PumpfunAlphaScoutBrief {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.nowMs !== "number") return false;
  if (!o.learnedProfile || typeof o.learnedProfile !== "object") return false;
  if (!Array.isArray(o.predictedAlphas)) return false;
  if (!o.meta || typeof o.meta !== "object") return false;
  return true;
}

/** Matches server agent refresh cadence (1h default). */
export const PUMPFUN_ALPHA_SCOUT_CLIENT_STALE_MS = 60 * 60 * 1000;

export async function fetchPumpfunAlphaScoutBrief(): Promise<PumpfunAlphaScoutBriefResponse> {
  const base = `${getApiBaseUrl().replace(/\/$/, "")}/agent/pumpfun-alpha-scout`;
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
    throw new Error(body.error || body.message || "Failed to load Pump.fun Alpha Scout brief");
  }

  return {
    data: body.data,
    savedAt: body.savedAt ?? new Date(0).toISOString(),
    source: "database",
    nextRefreshAt: body.nextRefreshAt ?? null,
  };
}
