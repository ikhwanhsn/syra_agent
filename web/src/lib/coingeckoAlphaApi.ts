import { getApiBaseUrl } from "@/lib/chatApi";

export type CoingeckoAlphaConfidence = "low" | "medium" | "high";

export interface CoingeckoAlphaTokenRow {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  priceUsd: number;
  marketCapUsd: number;
  volume24hUsd: number;
  priceChange24hPct: number;
}

export interface CoingeckoAlphaDigest extends CoingeckoAlphaTokenRow {
  pumpReason: string;
  catalysts: string[];
  confidence: CoingeckoAlphaConfidence;
  newsHeadlines: string[];
  xSnippets: string[];
}

export interface CoingeckoAlphaPrediction {
  coinId: string;
  symbol: string;
  name: string;
  thesis: string;
  catalystWatch: string[];
  timeframe: "24h" | "48h" | "72h";
  confidence: CoingeckoAlphaConfidence;
}

export interface CoingeckoAlphaHistoryEntry {
  date: string;
  topGainerSymbol: string;
  topGainerChangePct: number | null;
  pumpReasonSummary: string;
}

export interface CoingeckoAlphaBrief {
  date: string;
  updatedAt: string;
  topGainer: CoingeckoAlphaTokenRow;
  topGainers: CoingeckoAlphaTokenRow[];
  dailyDigests: CoingeckoAlphaDigest[];
  meta: {
    narrativeTitle: string;
    narrativeSummary: string;
    patternsLearned: string[];
    riskCaveats: string[];
  };
  predictions: CoingeckoAlphaPrediction[];
  history: CoingeckoAlphaHistoryEntry[];
  researchCount: number;
  xApiEnabled: boolean;
}

export interface CoingeckoAlphaBriefResponse {
  data: CoingeckoAlphaBrief;
  savedAt: string;
  source: "database";
  /** ISO — when the server scheduler is expected to run the next daily screen. */
  nextRefreshAt: string | null;
}

function assertBriefShape(v: unknown): v is CoingeckoAlphaBrief {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.date !== "string" || typeof o.updatedAt !== "string") return false;
  if (!o.topGainer || typeof o.topGainer !== "object") return false;
  if (!Array.isArray(o.topGainers) || !Array.isArray(o.dailyDigests)) return false;
  if (!o.meta || typeof o.meta !== "object") return false;
  if (!Array.isArray(o.predictions)) return false;
  return true;
}

/** Matches server daily refresh cadence — client does not re-fetch more often. */
export const COINGECKO_ALPHA_CLIENT_STALE_MS = 24 * 60 * 60 * 1000;

export async function fetchCoingeckoAlphaBrief(): Promise<CoingeckoAlphaBriefResponse> {
  const base = `${getApiBaseUrl().replace(/\/$/, "")}/agent/coingecko-alpha`;
  const res = await fetch(`${base}/brief`, { headers: { Accept: "application/json" } });

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: unknown;
    savedAt?: string;
    source?: "database";
    nextRefreshAt?: string | null;
    error?: string;
    code?: string;
    message?: string;
  };

  if (!res.ok || body.success !== true || !body.data || !assertBriefShape(body.data)) {
    const msg =
      body.code === "COINGECKO_ALPHA_NOT_READY"
        ? body.error ||
          "CoinGecko daily screen is warming up — refreshes about once every 24 hours."
        : body.error || body.message || "Failed to load CoinGecko alpha brief";
    throw new Error(msg);
  }

  return {
    data: body.data,
    savedAt: typeof body.savedAt === "string" ? body.savedAt : body.data.updatedAt,
    source: "database",
    nextRefreshAt: typeof body.nextRefreshAt === "string" ? body.nextRefreshAt : null,
  };
}
