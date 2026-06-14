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

export async function fetchRecentNarrativePosts(limit = 15): Promise<RecentNarrativesResponse> {
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

export async function fetchRecentQuoteResponses(limit = 15): Promise<RecentQuoteResponsesResponse> {
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

export async function fetchRecentThreadExpands(limit = 15): Promise<RecentThreadsResponse> {
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

export async function fetchRecentProofDrops(limit = 15): Promise<RecentProofDropsResponse> {
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

export type CopyPolishToneId = "polish" | "hype" | "narrative" | "punchy" | "syra-brand" | "cta";

export interface CopyPolishItem {
  id: string;
  originalText: string;
  polishedText: string;
  tone: string;
  direction: string;
  createdAt?: string;
  createdByWallet?: string | null;
}

export interface GenerateCopyPolishResponse {
  success: boolean;
  data: CopyPolishItem;
}

export interface RecentCopyPolishesResponse {
  success: boolean;
  data: CopyPolishItem[];
  total: number;
}

export async function generateCopyPolish(
  originalText: string,
  wallet?: string | null,
  tone?: CopyPolishToneId | null,
  direction?: string,
): Promise<GenerateCopyPolishResponse> {
  return fetchInternalJson<GenerateCopyPolishResponse>("/internal/tools/copy-polisher/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originalText,
      ...(tone ? { tone } : {}),
      ...(direction?.trim() ? { direction: direction.trim() } : {}),
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchRecentCopyPolishes(limit = 15): Promise<RecentCopyPolishesResponse> {
  return fetchInternalJson<RecentCopyPolishesResponse>(
    `/internal/tools/copy-polisher/recent?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function deleteCopyPolish(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson<DeleteNarrativeResponse>(
    `/internal/tools/copy-polisher/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export type ImagePromptStyleId =
  | "data-chart"
  | "ai-agent"
  | "bull-bear-split"
  | "transformation"
  | "ecosystem-hub"
  | "minimal-poster";

export interface ImagePromptItem {
  id: string;
  sourcePrompt: string;
  imagePrompt: string;
  caption: string;
  style: string;
  direction: string;
  createdAt?: string;
  createdByWallet?: string | null;
}

export interface GenerateImagePromptResponse {
  success: boolean;
  data: ImagePromptItem;
}

export interface RecentImagePromptsResponse {
  success: boolean;
  data: ImagePromptItem[];
  total: number;
}

export async function generateImagePrompt(
  sourcePrompt: string,
  wallet?: string | null,
  style?: ImagePromptStyleId | null,
  direction?: string,
): Promise<GenerateImagePromptResponse> {
  return fetchInternalJson<GenerateImagePromptResponse>("/internal/tools/image-prompt/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourcePrompt,
      ...(style ? { style } : {}),
      ...(direction?.trim() ? { direction: direction.trim() } : {}),
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchRecentImagePrompts(limit = 15): Promise<RecentImagePromptsResponse> {
  return fetchInternalJson<RecentImagePromptsResponse>(
    `/internal/tools/image-prompt/recent?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function deleteImagePrompt(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson<DeleteNarrativeResponse>(
    `/internal/tools/image-prompt/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export type EngagementTopicId =
  | "solana"
  | "ai-agents"
  | "x402"
  | "agent-economy"
  | "defi-agents"
  | "autonomous";

export type EngagementWindowId = "6h" | "12h" | "24h" | "48h";

export type EngagementQueryType = "Latest" | "Top";

export type EngagementReplyToneId =
  | "insight"
  | "builder"
  | "amplify"
  | "question"
  | "contrast"
  | "hype";

export interface EngagementAuthor {
  userName: string;
  name: string;
  followers: number;
  verified: boolean;
}

export interface EngagementMetrics {
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  quoteCount: number;
  viewCount: number;
}

export interface EngagementOpportunity {
  id: string;
  text: string;
  url: string;
  createdAt: string | null;
  author: EngagementAuthor;
  metrics: EngagementMetrics;
  score: number;
}

export interface EngagementSearchMeta {
  query: string;
  topicIds: string[];
  window: string;
  minFaves: number;
  queryType: EngagementQueryType;
  rawCount: number;
  validatedCount: number;
  returnedCount: number;
}

export interface EngagementSearchResponse {
  success: boolean;
  data: {
    opportunities: EngagementOpportunity[];
    meta: EngagementSearchMeta;
  };
}

export interface EngagementReplyItem {
  id: string;
  text: string;
  sourceTweetId: string;
  sourceTweetText: string;
  authorHandle: string;
  tone: string;
  createdAt?: string;
  createdByWallet?: string | null;
}

export interface DraftEngagementReplyResponse {
  success: boolean;
  data: EngagementReplyItem;
}

export interface RecentEngagementRepliesResponse {
  success: boolean;
  data: EngagementReplyItem[];
  total: number;
}

export async function searchEngagementOpportunities(opts?: {
  topics?: EngagementTopicId[];
  keyword?: string;
  minFaves?: number;
  window?: EngagementWindowId;
  queryType?: EngagementQueryType;
}): Promise<EngagementSearchResponse> {
  return fetchInternalJson<EngagementSearchResponse>("/internal/tools/engagement-radar/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(opts?.topics?.length ? { topics: opts.topics } : {}),
      ...(opts?.keyword?.trim() ? { keyword: opts.keyword.trim() } : {}),
      ...(opts?.minFaves != null ? { minFaves: opts.minFaves } : {}),
      ...(opts?.window ? { window: opts.window } : {}),
      ...(opts?.queryType ? { queryType: opts.queryType } : {}),
    }),
  });
}

export async function draftEngagementReply(
  tweetId: string,
  tweetText: string,
  authorHandle: string,
  wallet?: string | null,
  tone?: EngagementReplyToneId | null,
): Promise<DraftEngagementReplyResponse> {
  return fetchInternalJson<DraftEngagementReplyResponse>("/internal/tools/engagement-radar/draft-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tweetId,
      tweetText,
      authorHandle,
      ...(tone ? { tone } : {}),
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchRecentEngagementReplies(
  limit = 15,
): Promise<RecentEngagementRepliesResponse> {
  return fetchInternalJson<RecentEngagementRepliesResponse>(
    `/internal/tools/engagement-radar/recent?limit=${encodeURIComponent(String(limit))}`,
  );
}

export async function deleteEngagementReply(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson<DeleteNarrativeResponse>(
    `/internal/tools/engagement-radar/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function buildReplyOnXUrl(tweetId: string, text: string): string {
  const params = new URLSearchParams({
    in_reply_to: tweetId,
    text,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildTweetOnXUrl(text: string): string {
  const params = new URLSearchParams({ text });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

// --- Holder Pulse ---

export type HolderPulseAngleId =
  | "holder-growth"
  | "staking"
  | "concentration"
  | "price-momentum"
  | "liquidity";

export interface HolderPulseSnapshot {
  mint: string;
  updatedAt: string;
  holders: {
    mint: string;
    decimals?: number;
    supplyHuman: number;
    holders: Array<{ rank: number; wallet: string; balanceHuman: number; sharePct: number }>;
    top10ConcentrationPct: number | null;
  };
  price: {
    priceUsd: number | null;
    liquidityUsd?: number;
    volume24h?: number;
    priceChange24h?: number;
    source: string;
  } | null;
  marketCapUsd: number | null;
  staking: {
    uniqueWallets: number;
    openLockCount: number;
    totalStakedFormatted: string;
    closedLockCount: number;
  } | null;
}

export interface HolderPulsePost {
  id: string;
  text: string;
  angle: string;
  snapshot: HolderPulseSnapshot;
  createdAt?: string;
  createdByWallet?: string | null;
}

export async function fetchHolderPulseSnapshot(): Promise<{ success: boolean; data: HolderPulseSnapshot }> {
  return fetchInternalJson("/internal/tools/holder-pulse/snapshot");
}

export async function generateHolderPulsePost(
  wallet?: string | null,
  angle?: HolderPulseAngleId | null,
): Promise<{ success: boolean; data: HolderPulsePost }> {
  return fetchInternalJson("/internal/tools/holder-pulse/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...(angle ? { angle } : {}), ...(wallet ? { wallet } : {}) }),
  });
}

export async function fetchRecentHolderPulsePosts(
  limit = 15,
): Promise<{ success: boolean; data: HolderPulsePost[]; total: number }> {
  return fetchInternalJson(`/internal/tools/holder-pulse/recent?limit=${encodeURIComponent(String(limit))}`);
}

export async function deleteHolderPulsePost(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson(`/internal/tools/holder-pulse/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Trend Scanner ---

export type TrendScannerWoeidId = "worldwide" | "usa" | "uk";

export interface TrendScanItem {
  name: string;
  rank: number | null;
  relevanceScore: number;
  angle: string;
  syraFit: "high" | "medium" | "low";
  sampleTweet: { id: string; text: string; url: string; author: string } | null;
}

export interface TrendScanPost {
  id: string;
  text: string;
  trendText: string;
  angle: string;
  relevanceScore: number;
  createdAt?: string;
  createdByWallet?: string | null;
}

export async function scanNarrativeTrends(
  woeid?: TrendScannerWoeidId | number,
): Promise<{ success: boolean; data: { trends: TrendScanItem[]; meta: Record<string, unknown> } }> {
  return fetchInternalJson("/internal/tools/trend-scanner/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...(woeid != null ? { woeid } : {}) }),
  });
}

export async function generateTrendPost(
  trendText: string,
  angle: string,
  relevanceScore: number,
  wallet?: string | null,
): Promise<{ success: boolean; data: TrendScanPost }> {
  return fetchInternalJson("/internal/tools/trend-scanner/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trendText, angle, relevanceScore, ...(wallet ? { wallet } : {}) }),
  });
}

export async function fetchRecentTrendScanPosts(
  limit = 15,
): Promise<{ success: boolean; data: TrendScanPost[]; total: number }> {
  return fetchInternalJson(`/internal/tools/trend-scanner/recent?limit=${encodeURIComponent(String(limit))}`);
}

export async function deleteTrendScanPost(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson(`/internal/tools/trend-scanner/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- Founder Pulse ---

export interface FounderPulseAnalytics {
  avgEngagement: number;
  totalEngagement: number;
  tweetsAnalyzed: number;
  tweetsPerDay: number | null;
  topTweets: Array<{
    id: string;
    text: string;
    url: string;
    createdAt: string | null;
    engagement: number;
    metrics: EngagementMetrics;
  }>;
  bestHours: Array<{ hour: number; avgEngagement: number; count: number }>;
  bestDays: Array<{ day: number; avgEngagement: number; count: number }>;
  profile: {
    userName: string;
    name: string;
    followers: number;
    following: number;
    tweetCount: number;
    verified: boolean;
  };
  insight?: string | null;
  followerDelta?: number | null;
}

export interface FounderPulseSnapshot {
  id: string;
  handle: string;
  followers: number;
  following: number;
  tweetCount: number;
  analytics: FounderPulseAnalytics;
  capturedAt?: string;
  createdByWallet?: string | null;
  followerDelta?: number | null;
  insight?: string | null;
}

export async function analyzeFounderPulse(
  handle?: string,
  wallet?: string | null,
): Promise<{ success: boolean; data: FounderPulseSnapshot }> {
  return fetchInternalJson("/internal/tools/founder-pulse/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...(handle?.trim() ? { handle: handle.trim() } : {}),
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchRecentFounderPulseSnapshots(
  limit = 15,
  handle?: string,
): Promise<{ success: boolean; data: FounderPulseSnapshot[]; total: number }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (handle?.trim()) params.set("handle", handle.trim());
  return fetchInternalJson(`/internal/tools/founder-pulse/recent?${params.toString()}`);
}

// --- Mention Triage ---

export type MentionCategory = "question" | "opportunity" | "fud" | "praise" | "spam";
export type MentionPriority = "high" | "medium" | "low";
export type MentionReplyToneId = "helpful" | "hype" | "builder" | "clarify";

export interface MentionTriageItem {
  id: string;
  text: string;
  url: string;
  createdAt: string | null;
  author: EngagementAuthor;
  metrics: EngagementMetrics;
  category: MentionCategory;
  priority: MentionPriority;
  summary: string;
  engagement: number;
}

export interface MentionReplyItem {
  id: string;
  text: string;
  sourceTweetId: string;
  sourceTweetText: string;
  authorHandle: string;
  category: string;
  tone: string;
  createdAt?: string;
  createdByWallet?: string | null;
}

export async function scanMentionTriage(
  handle?: string,
): Promise<{ success: boolean; data: { mentions: MentionTriageItem[]; meta: Record<string, unknown> } }> {
  return fetchInternalJson("/internal/tools/mention-triage/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...(handle?.trim() ? { handle: handle.trim() } : {}) }),
  });
}

export async function draftMentionReply(
  tweetId: string,
  tweetText: string,
  authorHandle: string,
  category: MentionCategory,
  wallet?: string | null,
  tone?: MentionReplyToneId | null,
): Promise<{ success: boolean; data: MentionReplyItem }> {
  return fetchInternalJson("/internal/tools/mention-triage/draft-reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tweetId,
      tweetText,
      authorHandle,
      category,
      ...(tone ? { tone } : {}),
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchRecentMentionReplies(
  limit = 15,
): Promise<{ success: boolean; data: MentionReplyItem[]; total: number }> {
  return fetchInternalJson(`/internal/tools/mention-triage/recent?limit=${encodeURIComponent(String(limit))}`);
}

export async function deleteMentionReply(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson(`/internal/tools/mention-triage/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// --- KOL Tracker ---

export type KolEngagementModeId = "reply" | "quote" | "amplify";

export interface KolOpportunity {
  id: string;
  text: string;
  url: string;
  createdAt: string | null;
  author: EngagementAuthor;
  metrics: EngagementMetrics;
  kolHandle: string;
  score: number;
}

export interface KolEngagementItem {
  id: string;
  text: string;
  sourceTweetId: string;
  sourceTweetText: string;
  authorHandle: string;
  mode: string;
  createdAt?: string;
  createdByWallet?: string | null;
}

export async function trackKolOpportunities(
  handles?: string[],
): Promise<{ success: boolean; data: { opportunities: KolOpportunity[]; meta: Record<string, unknown> } }> {
  return fetchInternalJson("/internal/tools/kol-tracker/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...(handles?.length ? { handles } : {}) }),
  });
}

export async function draftKolEngagement(
  tweetId: string,
  tweetText: string,
  authorHandle: string,
  wallet?: string | null,
  mode?: KolEngagementModeId | null,
): Promise<{ success: boolean; data: KolEngagementItem }> {
  return fetchInternalJson("/internal/tools/kol-tracker/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tweetId,
      tweetText,
      authorHandle,
      ...(mode ? { mode } : {}),
      ...(wallet ? { wallet } : {}),
    }),
  });
}

export async function fetchRecentKolEngagements(
  limit = 15,
): Promise<{ success: boolean; data: KolEngagementItem[]; total: number }> {
  return fetchInternalJson(`/internal/tools/kol-tracker/recent?limit=${encodeURIComponent(String(limit))}`);
}

export async function deleteKolEngagement(id: string): Promise<DeleteNarrativeResponse> {
  return fetchInternalJson(`/internal/tools/kol-tracker/${encodeURIComponent(id)}`, { method: "DELETE" });
}
