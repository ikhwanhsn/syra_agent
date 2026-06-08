import { getApiBaseUrl } from "@/lib/chatApi";

export type PumpfunAlphaPeriod = "today" | "week" | "month";

export interface PumpfunAlphaTrendToken {
  mint: string;
  symbol: string;
  name: string;
  complete: boolean;
  marketCapUsd: number | null;
  athMarketCapUsd: number | null;
  athMarketCapTimestampMs: number | null;
  updatedAtMs: number | null;
  lastTradeTimestampMs: number | null;
  createdTimestampMs: number | null;
  anchorTsMs: number | null;
}

export type PumpfunAlphaFeedMode = "trend" | "experiment";

export interface PumpfunAlphaTrendAnalysis {
  trendTitle: string;
  metaSummary: string;
  signals: string[];
  watchlist: Array<{ mint: string; symbol: string; reason: string }>;
  riskCaveats: string[];
}

export interface PumpfunAlphaTrendResponse {
  period: PumpfunAlphaPeriod;
  startMs: number;
  nowMs: number;
  candidatePool: number;
  matchedCount: number;
  tokens: PumpfunAlphaTrendToken[];
  analysis: PumpfunAlphaTrendAnalysis;
}

function assertResponseShape(v: unknown): v is PumpfunAlphaTrendResponse {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.period !== "string") return false;
  if (typeof o.startMs !== "number" || typeof o.nowMs !== "number") return false;
  if (!Array.isArray(o.tokens)) return false;
  if (!o.analysis || typeof o.analysis !== "object") return false;
  return true;
}

export async function fetchPumpfunAlphaTrend(
  period: PumpfunAlphaPeriod,
  options?: { mode?: PumpfunAlphaFeedMode },
): Promise<PumpfunAlphaTrendResponse> {
  const base = `${getApiBaseUrl().replace(/\/$/, "")}/agent/pumpfun-alpha`;
  const mode = options?.mode ?? "trend";
  const url = `${base}/trend?period=${encodeURIComponent(period)}&mode=${encodeURIComponent(mode)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  const body = (await res.json().catch(() => ({}))) as { success?: boolean; data?: unknown; error?: string; message?: string };
  if (!res.ok || body.success !== true || !body.data || !assertResponseShape(body.data)) {
    throw new Error(body.error || body.message || "Failed to load pump.fun alpha trend");
  }
  return body.data;
}

