/** Types and fetch helpers for Syra internal news agent preview endpoints. */

export type SyraNewsArticle = {
  title?: string;
  news_url?: string;
  url?: string;
  link?: string;
  source_name?: string;
  date?: string;
  published_at?: string;
  text?: string;
  tickers?: string[];
  sentiment?: string;
};

export type SyraSentimentDay = {
  Positive: number;
  Negative: number;
  Neutral: number;
  Total?: number;
  sentiment_score?: number;
  Sentiment_Score?: number;
};

export type SyraSentimentTotals = {
  "Total Positive": number;
  "Total Negative": number;
  "Total Neutral": number;
  "Sentiment Score": number;
};

export type SyraPreviewNewsResponse = {
  news?: SyraNewsArticle[];
  error?: string;
};

export type SyraPreviewSentimentResponse = {
  sentiment?: {
    data?: Record<string, SyraSentimentDay>;
    total?: Partial<SyraSentimentTotals>;
  };
  sentimentAnalysis?: unknown[];
  error?: string;
};

export function resolveNewsArticleUrl(entry: SyraNewsArticle | undefined): string {
  if (!entry) return "";
  for (const key of ["news_url", "url", "link"] as const) {
    const v = entry[key];
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (t.startsWith("http://") || t.startsWith("https://")) return t;
  }
  return "";
}

export function normalizeNewsArticles(
  payload: SyraPreviewNewsResponse | undefined,
): SyraNewsArticle[] {
  if (!payload || payload.error) return [];
  return Array.isArray(payload.news) ? payload.news : [];
}

export function normalizeSentimentPayload(
  payload: SyraPreviewSentimentResponse | undefined,
): {
  data: Record<string, SyraSentimentDay>;
  total: SyraSentimentTotals;
} {
  const emptyTotal: SyraSentimentTotals = {
    "Total Positive": 0,
    "Total Negative": 0,
    "Total Neutral": 0,
    "Sentiment Score": 0,
  };

  if (!payload?.sentiment) {
    return { data: {}, total: emptyTotal };
  }

  const data = payload.sentiment.data ?? {};
  const rawTotal = payload.sentiment.total ?? {};

  return {
    data,
    total: {
      "Total Positive": Number(rawTotal["Total Positive"]) || 0,
      "Total Negative": Number(rawTotal["Total Negative"]) || 0,
      "Total Neutral": Number(rawTotal["Total Neutral"]) || 0,
      "Sentiment Score": Number(rawTotal["Sentiment Score"]) || 0,
    },
  };
}

export function daySentimentScore(day: SyraSentimentDay | undefined): number {
  if (!day) return 0;
  const raw = day.sentiment_score ?? day.Sentiment_Score;
  return typeof raw === "number" && !Number.isNaN(raw) ? raw : 0;
}

/** Map API score (-1..1 or 0..100) to chart range -100..100. */
export function toChartScore(raw: number | undefined): number {
  if (raw == null || Number.isNaN(Number(raw))) return 0;
  const v = Number(raw);
  if (v <= 1 && v >= -1) return v * 100;
  if (v <= 100 && v >= 0) return v;
  return Math.max(-100, Math.min(100, v));
}

export async function fetchPreviewNews(
  apiBase: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
): Promise<SyraNewsArticle[]> {
  const res = await fetch(`${apiBase}preview/news?ticker=general`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...headers },
    signal,
  });
  const json = (await res.json().catch(() => null)) as SyraPreviewNewsResponse | null;
  if (!res.ok || !json) {
    throw new Error(json?.error ?? `News request failed (${res.status})`);
  }
  if (json.error) throw new Error(json.error);
  const rows = normalizeNewsArticles(json);
  if (rows.length === 0) {
    throw new Error("No headlines from Syra news agent yet");
  }
  return rows;
}

export async function fetchPreviewSentiment(
  apiBase: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
): Promise<ReturnType<typeof normalizeSentimentPayload>> {
  const res = await fetch(`${apiBase}preview/sentiment?ticker=general`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...headers },
    signal,
  });
  const json = (await res.json().catch(() => null)) as SyraPreviewSentimentResponse | null;
  if (!res.ok || !json) {
    throw new Error(json?.error ?? `Sentiment request failed (${res.status})`);
  }
  if (json.error) throw new Error(json.error);
  return normalizeSentimentPayload(json);
}
