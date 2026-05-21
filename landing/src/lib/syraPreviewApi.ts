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
  try {
    const res = await fetch(`${apiBase}preview/news?ticker=general`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...headers },
      signal,
    });
    const json = (await res.json().catch(() => null)) as SyraPreviewNewsResponse | null;
    if (!res.ok || !json || json.error) return [];
    return normalizeNewsArticles(json);
  } catch {
    return [];
  }
}

export type BinanceTickerRow = {
  symbol: string;
  price: string;
};

export type PreviewSignalPayload = {
  token?: string;
  signal?: {
    metadata?: {
      TRADING_SIGNAL?: string;
      SIGNAL_STRENGTH?: string;
    };
  };
};

/** Coin slugs for `/preview/signal` rotation on the landing dashboard preview. */
export const PREVIEW_SIGNAL_TOKENS = [
  "bitcoin",
  "ethereum",
  "solana",
  "xrp",
  "dogecoin",
  "chainlink",
  "avalanche",
] as const;

export type PreviewSignalToken = (typeof PREVIEW_SIGNAL_TOKENS)[number];

export function formatPreviewSignalTokenLabel(token: string): string {
  return token
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function fetchBinanceTicker(
  apiBase: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
): Promise<BinanceTickerRow[]> {
  try {
    const res = await fetch(`${apiBase}binance-ticker`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...headers },
      signal,
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as BinanceTickerRow[]) : [];
  } catch {
    return [];
  }
}

export async function fetchPreviewSignal(
  apiBase: string,
  headers: Record<string, string>,
  token = "bitcoin",
  signal?: AbortSignal,
): Promise<PreviewSignalPayload | null> {
  try {
    const res = await fetch(`${apiBase}preview/signal?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...headers },
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as PreviewSignalPayload;
  } catch {
    return null;
  }
}

const EMPTY_SENTIMENT = normalizeSentimentPayload(undefined);

/** Shown when API is empty or unavailable so the preview chart still renders. */
export function buildPlaceholderSentimentPayload(): ReturnType<
  typeof normalizeSentimentPayload
> {
  const data: Record<string, SyraSentimentDay> = {};
  const scores: number[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const score = 0.12 + (i % 4) * 0.04 - 0.08;
    scores.push(score);
    data[dateKey] = {
      Positive: 14 + i * 2,
      Negative: 9 + (6 - i),
      Neutral: 6,
      sentiment_score: score,
      Sentiment_Score: score,
    };
  }

  const avgScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  let totalPos = 0;
  let totalNeg = 0;
  let totalNeutral = 0;
  for (const day of Object.values(data)) {
    totalPos += day.Positive;
    totalNeg += day.Negative;
    totalNeutral += day.Neutral;
  }

  return normalizeSentimentPayload({
    sentiment: {
      data,
      total: {
        "Total Positive": totalPos,
        "Total Negative": totalNeg,
        "Total Neutral": totalNeutral,
        "Sentiment Score": avgScore,
      },
    },
  });
}

export async function fetchPreviewSentiment(
  apiBase: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
): Promise<ReturnType<typeof normalizeSentimentPayload>> {
  try {
    const res = await fetch(`${apiBase}preview/sentiment?ticker=general`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...headers },
      signal,
    });
    const json = (await res.json().catch(() => null)) as SyraPreviewSentimentResponse | null;
    if (!res.ok || !json) {
      return EMPTY_SENTIMENT;
    }
    if (json.error) return EMPTY_SENTIMENT;
    const normalized = normalizeSentimentPayload(json);
    if (Object.keys(normalized.data).length === 0) {
      return EMPTY_SENTIMENT;
    }
    return normalized;
  } catch {
    return EMPTY_SENTIMENT;
  }
}
