import { getApiBaseUrl } from "@/lib/chatApi";

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

export type NarrativeSourceMode = "syra" | "trending";

export interface NarrativePost {
  id: string;
  text: string;
  theme: string;
  angle: string;
  sourceMode?: NarrativeSourceMode;
  newsHook?: string | null;
  createdAt?: string;
  createdByWallet?: string | null;
}

export interface TrendingNarrativePreview {
  headlines: Array<{
    headline: string;
    source: string | null;
    importance: number | null;
  }>;
  trendTopics: string[];
  marketSummary: string | null;
  suggestedHook: string | null;
}

export interface TrendingPreviewResponse {
  success: boolean;
  data: TrendingNarrativePreview;
}

export interface GenerateNarrativeResponse {
  success: boolean;
  data: NarrativePost;
}

export interface RecentNarrativesResponse {
  success: boolean;
  data: NarrativePost[];
  total: number;
}

export async function generateNarrativePost(
  wallet?: string | null,
  mode: NarrativeSourceMode = "syra",
): Promise<GenerateNarrativeResponse> {
  return fetchInternalJson<GenerateNarrativeResponse>("/internal/tools/narrative/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode,
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchTrendingNarrativePreview(): Promise<TrendingPreviewResponse> {
  return fetchInternalJson<TrendingPreviewResponse>("/internal/tools/narrative/trending-preview");
}

export async function fetchRecentNarrativePosts(limit = 20): Promise<RecentNarrativesResponse> {
  return fetchInternalJson<RecentNarrativesResponse>(
    `/internal/tools/narrative/recent?limit=${encodeURIComponent(String(limit))}`,
  );
}

export interface UpdateNarrativeResponse {
  success: boolean;
  data: NarrativePost;
}

export interface DeleteNarrativeResponse {
  success: boolean;
  deletedId: string;
}

export async function rewriteNarrativePost(
  id: string,
  instruction: string,
): Promise<UpdateNarrativeResponse> {
  return fetchInternalJson<UpdateNarrativeResponse>(`/internal/tools/narrative/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruction }),
  });
}

export async function deleteNarrativePost(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson<DeleteNarrativeResponse>(
    `/internal/tools/narrative/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export type QuoteToneId = "amplify" | "bullish" | "contrast" | "builder" | "token" | "question";

export interface QuoteResponseItem {
  id: string;
  text: string;
  sourcePost: string;
  tone: string;
  createdAt?: string;
  createdByWallet?: string | null;
}

export interface GenerateQuoteResponse {
  success: boolean;
  data: QuoteResponseItem;
}

export interface RecentQuoteResponsesResponse {
  success: boolean;
  data: QuoteResponseItem[];
  total: number;
}

export async function generateQuoteResponse(
  sourcePost: string,
  wallet?: string | null,
  tone?: QuoteToneId | null,
): Promise<GenerateQuoteResponse> {
  return fetchInternalJson<GenerateQuoteResponse>("/internal/tools/quote-response/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourcePost,
      ...(tone ? { tone } : {}),
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchRecentQuoteResponses(limit = 20): Promise<RecentQuoteResponsesResponse> {
  return fetchInternalJson<RecentQuoteResponsesResponse>(
    `/internal/tools/quote-response/recent?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function deleteQuoteResponse(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson<DeleteNarrativeResponse>(
    `/internal/tools/quote-response/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export interface ThreadExpandItem {
  id: string;
  sourceText: string;
  tweets: string[];
  fullText: string;
  tweetCount: number;
  createdAt?: string;
  createdByWallet?: string | null;
}

export interface GenerateThreadResponse {
  success: boolean;
  data: ThreadExpandItem;
}

export interface RecentThreadsResponse {
  success: boolean;
  data: ThreadExpandItem[];
  total: number;
}

export async function generateThreadExpand(
  sourceText: string,
  wallet?: string | null,
  tweetCount?: number | null,
): Promise<GenerateThreadResponse> {
  return fetchInternalJson<GenerateThreadResponse>("/internal/tools/thread-expander/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceText,
      ...(tweetCount ? { tweetCount } : {}),
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchRecentThreadExpands(limit = 20): Promise<RecentThreadsResponse> {
  return fetchInternalJson<RecentThreadsResponse>(
    `/internal/tools/thread-expander/recent?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function deleteThreadExpand(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson<DeleteNarrativeResponse>(
    `/internal/tools/thread-expander/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export type ProofDropAngleId = "headline" | "growth" | "monetization" | "engagement" | "playground";

export interface ProofDropMetricsSnapshot {
  totalPaidApiCalls: number;
  paidApiCallsLast7Days: number;
  paidApiCallsLast30Days: number;
  paidGrowth30dPct: number;
  paidGrowth30dLabel: string;
  uniqueUsersTotal: number;
  uniqueUsersLast7d: number;
  totalChats: number;
  paidConversionLabel: string;
  playgroundTotalShares: number;
  updatedAt: string;
}

export interface ProofDropItem {
  id: string;
  text: string;
  angle: string;
  shareSectionId: string;
  metricsSnapshot: ProofDropMetricsSnapshot;
  createdAt?: string;
  createdByWallet?: string | null;
}

export interface GenerateProofDropResponse {
  success: boolean;
  data: ProofDropItem;
}

export interface RecentProofDropsResponse {
  success: boolean;
  data: ProofDropItem[];
  total: number;
}

export interface ProofMetricsPreviewResponse {
  success: boolean;
  data: ProofDropMetricsSnapshot;
}

export async function fetchProofDropMetricsPreview(): Promise<ProofMetricsPreviewResponse> {
  return fetchInternalJson<ProofMetricsPreviewResponse>("/internal/tools/proof-drop/metrics-preview");
}

export async function generateProofDrop(
  wallet?: string | null,
  angle?: ProofDropAngleId | null,
): Promise<GenerateProofDropResponse> {
  return fetchInternalJson<GenerateProofDropResponse>("/internal/tools/proof-drop/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(angle ? { angle } : {}),
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchRecentProofDrops(limit = 20): Promise<RecentProofDropsResponse> {
  return fetchInternalJson<RecentProofDropsResponse>(
    `/internal/tools/proof-drop/recent?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function deleteProofDrop(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson<DeleteNarrativeResponse>(
    `/internal/tools/proof-drop/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
