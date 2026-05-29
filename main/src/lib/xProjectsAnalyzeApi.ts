import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/x-projects-analyze`;

export interface XProjectsAnalyzeTypeMeta {
  type: string;
  label: string;
  provider: string;
  accountCount: number;
}

export interface XBreakdownSlice {
  score: number;
  max: number;
  details: Record<string, unknown>;
}

export interface XRecentTweet {
  id?: string;
  created_at?: string;
  text: string;
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
    quote_count?: number;
    impression_count?: number;
  };
}

export interface XSingleAnalysisPayload {
  username: string;
  user: {
    id?: string;
    username?: string;
    name?: string;
    description?: string;
    url?: string;
    created_at?: string;
    verified?: boolean;
    verified_type?: string;
    public_metrics?: {
      followers_count?: number;
      following_count?: number;
      tweet_count?: number;
    };
  };
  score: number;
  grade: string;
  breakdown: Record<string, XBreakdownSlice>;
  signals: Record<string, unknown>;
  redFlags: string[];
  aiSummary: string | null;
  updatedAt: string;
  recentTweets?: XRecentTweet[];
}

/** Single-account response from GET /x-projects-analyze/account (includes feed context). */
export interface XProjectAccountDetail extends XSingleAnalysisPayload {
  feedType: string;
  feedLabel: string;
}

export type XProjectsBatchItem =
  | {
      username: string;
      ok: true;
      analysis: XSingleAnalysisPayload;
    }
  | {
      username: string;
      ok: false;
      error: string;
      code?: string;
    };

export interface XProjectsAnalyzeData {
  type: string;
  label: string;
  provider: string;
  updatedAt: string;
  items: XProjectsBatchItem[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    averageScore: number | null;
  };
}

export async function fetchXProjectsAnalyzeTypes(): Promise<XProjectsAnalyzeTypeMeta[]> {
  const res = await fetch(`${base()}/types`, { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { types?: XProjectsAnalyzeTypeMeta[] };
    error?: string;
  };
  if (!res.ok || !body.success || !body.data?.types) {
    throw new Error(body.error || "Failed to load analyzer types");
  }
  return body.data.types;
}

export async function fetchXProjectsAnalyze(options: {
  type?: string;
  max_results?: number;
  includeAiSummary?: boolean;
}): Promise<XProjectsAnalyzeData> {
  const q = new URLSearchParams();
  const type = options.type?.trim();
  if (type) q.set("type", type);
  if (options.max_results != null && Number.isFinite(options.max_results)) {
    q.set("max_results", String(Math.min(50, Math.max(5, Math.floor(options.max_results)))));
  }
  if (options.includeAiSummary === true) q.set("includeAiSummary", "true");
  const qs = q.toString();
  const url = `${base()}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: XProjectsAnalyzeData;
    error?: string;
    code?: string;
  };
  if (!res.ok || !body.success || !body.data) {
    const msg =
      body.code === "ALPHA_X_BATCH_NOT_READY"
        ? body.error ||
          "Watchlist is warming up — scores refresh about once every 24 hours."
        : body.error || "Failed to load batch analysis";
    throw new Error(msg);
  }
  return body.data;
}

export async function fetchXProjectAnalyzeAccount(options: {
  username: string;
  type?: string;
  max_results?: number;
  includeAiSummary?: boolean;
}): Promise<XProjectAccountDetail> {
  const handle = options.username.trim().replace(/^@/, "");
  if (!handle) {
    throw new Error("Username required");
  }
  const q = new URLSearchParams();
  q.set("username", handle);
  const type = options.type?.trim();
  if (type) q.set("type", type);
  if (options.max_results != null && Number.isFinite(options.max_results)) {
    q.set(
      "max_results",
      String(Math.min(50, Math.max(10, Math.floor(options.max_results)))),
    );
  }
  if (options.includeAiSummary === false) q.set("includeAiSummary", "false");
  const url = `${base()}/account?${q.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: XProjectAccountDetail;
    error?: string;
  };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load account analysis");
  }
  return body.data;
}
