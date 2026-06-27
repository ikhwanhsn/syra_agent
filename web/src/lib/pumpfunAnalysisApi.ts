import { getApiBaseUrl } from "@/lib/chatApi";
import { syraFetch } from "@/lib/agentAuthApi";
import type {
  TokensDossierCandle,
  TokensDossierPayload,
  TokensMarketScore,
} from "@/lib/tokensDossierApi";
import { parseAssetLookupInput } from "@/lib/tokensDossierApi";

export type MemecoinAnalysisSection<T> = {
  ok: boolean;
  source: string;
  data?: T;
  error?: string;
  status?: number;
};

export interface PumpfunDexPairSnapshot {
  dexId?: string | null;
  pairAddress?: string | null;
  url?: string | null;
  priceUsd?: number | null;
  marketCapUsd?: number | null;
  liquidityUsd?: number | null;
  volume24hUsd?: number | null;
  priceChange1hPercent?: number | null;
  priceChange24hPercent?: number | null;
}

export interface PumpfunCoinMetadata {
  mint: string;
  symbol: string;
  name: string;
  imageUri?: string;
  complete?: boolean;
  program?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  website?: string | null;
  description?: string | null;
  createdTimestampMs?: number | null;
  lastTradeTimestampMs?: number | null;
  marketCapUsd?: number | null;
  athMarketCapUsd?: number | null;
  priceUsd?: number | null;
  bondingLiquidityUsd?: number | null;
  holderCount?: number | null;
  replyCount?: number | null;
  totalSupply?: number | null;
  source?: string;
  dexPair?: PumpfunDexPairSnapshot | null;
}

export interface MemecoinMarketStats {
  priceUsd: number | null;
  marketCapUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  priceChange24hPercent: number | null;
  priceChange1hPercent: number | null;
  athMarketCapUsd: number | null;
  primarySource: string;
  sources: string[];
  dexPair: {
    dexId: string | null;
    pairAddress: string | null;
    url: string | null;
  } | null;
}

export interface OnChainHolderRow {
  rank: number;
  wallet: string | null;
  tokenAccount: string;
  balanceHuman: number | null;
  sharePct: number | null;
}

export interface OnChainHoldersPayload {
  mint: string;
  decimals: number;
  supplyHuman: number;
  holders: OnChainHolderRow[];
  top10ConcentrationPct: number | null;
  holderCountEstimate?: number;
  estimateSource?: string;
}

export interface HolderDistributionFlag {
  id: string;
  severity: "high" | "medium" | "low";
  message: string;
}

export interface HolderDistributionPayload {
  mint: string;
  decimals: number;
  supplyHuman: number;
  decentralizationScore: number;
  concentration: {
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top20: number;
  };
  tiers: {
    whale: number;
    dolphin: number;
    shrimp: number;
  };
  flags: HolderDistributionFlag[];
  holderSampleSize: number;
  topHolders: Array<{
    rank: number;
    wallet: string | null;
    sharePct: number | null;
    balanceHuman: number | null;
  }>;
}

export interface OnChainMintSecurityPayload {
  mint: string;
  decimals: number;
  supplyRaw: string;
  mintAuthorityRenounced: boolean;
  freezeAuthorityRenounced: boolean;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isInitialized: boolean;
}

export interface MemecoinAnalysisQuota {
  limit: number;
  used: number;
  remaining: number;
  tier: "free" | "staker" | "unlimited" | "bypass" | "holder" | string;
  resetAt: string;
  verifiedWallet?: boolean;
}

export class MemecoinAnalysisQuotaError extends Error {
  quota: MemecoinAnalysisQuota;

  constructor(message: string, quota: MemecoinAnalysisQuota) {
    super(message);
    this.name = "MemecoinAnalysisQuotaError";
    this.quota = quota;
  }
}

export interface SyraAlphaScore {
  score: number;
  verdict: string;
  tone: "safe" | "warning" | "danger" | string;
  factors: Array<{ id: string; delta: number; label: string }>;
  disclaimer: string;
}

export interface TokenKolSampleTweet {
  id: string;
  text: string;
  url: string;
  createdAt: string;
  engagement: number;
}

export interface TokenKolRow {
  rank: number;
  username: string;
  displayName: string;
  followers: number;
  verified: boolean;
  profileImageUrl: string | null;
  tweetsAboutToken: number;
  firstMention: string | null;
  lastMention: string | null;
  avgEngagement: number;
  promotionType: "direct" | "neutral" | "warning" | string;
  sampleTweet: TokenKolSampleTweet | null;
}

export interface TokenKolShillsPayload {
  mint: string;
  query: string;
  queries?: string[];
  searchTerms?: {
    symbol: string | null;
    name: string | null;
    twitter: string | null;
  };
  source?: string;
  summary: {
    totalAccountsFound: number;
    topKolsCount: number;
    combinedReach: number;
    directShills: number;
    warnings: number;
    overallSentiment: string;
    searchWindowDays: number | null;
  };
  topKols: TokenKolRow[];
}

export interface MemecoinAnalysisPayload {
  mint: string;
  syraAlpha: SyraAlphaScore;
  market: MemecoinMarketStats;
  dossier: MemecoinAnalysisSection<TokensDossierPayload>;
  kolShills: MemecoinAnalysisSection<TokenKolShillsPayload>;
  holders: MemecoinAnalysisSection<OnChainHoldersPayload>;
  distribution: MemecoinAnalysisSection<HolderDistributionPayload>;
  onChainSecurity: MemecoinAnalysisSection<OnChainMintSecurityPayload>;
  pumpfun: MemecoinAnalysisSection<PumpfunCoinMetadata>;
  fetchedAt: string;
}

export function isValidSolanaMint(raw: string): boolean {
  const parsed = parseAssetLookupInput(raw);
  return parsed?.mint != null;
}

export function normalizeMintInput(raw: string): string | null {
  const parsed = parseAssetLookupInput(raw.trim());
  return parsed?.mint ?? null;
}

export function pickMarketScoreFromDossier(
  dossier: TokensDossierPayload | null | undefined,
): TokensMarketScore | null {
  if (!dossier) return null;
  const fromInclude = dossier.includes?.risk?.ok ? dossier.includes.risk.data?.marketScore : null;
  if (fromInclude) return fromInclude;
  return dossier.mintRisk?.risk?.marketScore ?? null;
}

export async function fetchMemecoinAnalysisQuota(
  opts?: { signal?: AbortSignal },
): Promise<MemecoinAnalysisQuota> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}/agent/tokens/memecoin-analysis/quota`;
  const res = await syraFetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: MemecoinAnalysisQuota;
    error?: string;
  };

  if (res.status === 401) {
    return {
      limit: 0,
      used: 0,
      remaining: 0,
      tier: "locked",
      resetAt: new Date().toISOString(),
      verifiedWallet: false,
    };
  }

  if (!res.ok || body.success !== true || !body.data) {
    throw new Error(body.error || "Failed to load scan quota");
  }

  return body.data;
}

export interface PumpfunScanRecordSummary {
  callId: string;
  callerWallet: string;
  mint: string;
  symbol: string;
  name: string;
  imageUri: string | null;
  scanMarketCapUsd: number | null;
  peakGainMultiplier: number | null;
  scannedAt: string;
}

export async function fetchMemecoinAnalysis(
  mint: string,
  opts?: { signal?: AbortSignal },
): Promise<{
  data: MemecoinAnalysisPayload;
  quota: MemecoinAnalysisQuota;
  scanRecord: PumpfunScanRecordSummary | null;
}> {
  const trimmed = mint.trim();
  if (!isValidSolanaMint(trimmed)) {
    throw new Error("Enter a valid Solana mint address");
  }

  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}/agent/tokens/memecoin-analysis?mint=${encodeURIComponent(trimmed)}`;
  const res = await syraFetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: MemecoinAnalysisPayload;
    error?: string;
    message?: string;
    quota?: MemecoinAnalysisQuota;
    scanRecord?: PumpfunScanRecordSummary | null;
  };

  if (res.status === 429 && body.quota) {
    throw new MemecoinAnalysisQuotaError(
      body.error || body.message || "Daily scan limit reached",
      body.quota,
    );
  }

  if (!res.ok || body.success !== true || !body.data?.mint) {
    const fallback =
      res.status === 500
        ? "Scan failed — the API may be starting up or the database is reconnecting. Try again in a few seconds."
        : "Failed to load memecoin analysis";
    throw new Error(body.error || body.message || fallback);
  }

  return {
    data: body.data,
    quota: body.quota ?? {
      limit: 3,
      used: 0,
      remaining: 0,
      tier: "free",
      resetAt: new Date().toISOString(),
    },
    scanRecord: body.scanRecord ?? null,
  };
}

export type { TokensDossierCandle };

export type HolderOverlapTier = "whale" | "dolphin" | "shrimp";

export type HolderOverlapTone = "warning" | "caution" | "neutral";

export interface HolderOverlapTokenMeta {
  mint: string;
  symbol: string;
  name: string;
  image: string | null;
  priceUsd: number | null;
  supplyHuman: number | null;
  holdersCompared: number;
  holdersFetchError?: string | null;
}

export interface HolderOverlapRow {
  wallet: string;
  rankA: number;
  rankB: number;
  balanceHumanA: number | null;
  balanceHumanB: number | null;
  sharePctA: number | null;
  sharePctB: number | null;
  usdValueA: number | null;
  usdValueB: number | null;
  combinedUsdValue: number | null;
  tier: HolderOverlapTier;
  flags: string[];
}

export interface HolderOverlapSummary {
  overlapCount: number;
  comparedA: number;
  comparedB: number;
  overlapRatioA: number;
  overlapRatioB: number;
  sharedSupplyPctA: number;
  sharedSupplyPctB: number;
  sharedUsdValueTotal: number | null;
  topTenBothCount: number;
  whaleCount: number;
  verdict: string;
  tone: HolderOverlapTone;
  interpretation: string;
  holderSampleLimit: number;
}

export interface HolderOverlapPayload {
  mintA: string;
  mintB: string;
  tokenA: HolderOverlapTokenMeta;
  tokenB: HolderOverlapTokenMeta;
  sharedHolders: HolderOverlapRow[];
  summary: HolderOverlapSummary;
  fetchedAt?: string;
}

export interface HolderOverlapMultiTokenHolder {
  wallet: string;
  tokensMatched: number;
  tokenSymbols: string[];
  mints: string[];
  rankA: number;
  sharePctA: number | null;
  balanceHumanA: number | null;
}

export interface HolderOverlapAggregateSummary {
  compareTokenCount: number;
  unionOverlapCount: number;
  fullOverlapCount: number;
  unionOverlapRatioA: number;
  fullOverlapRatioA: number;
  multiTokenHolders: HolderOverlapMultiTokenHolder[];
}

export interface HolderOverlapBatchPayload {
  mintA: string;
  tokenA: HolderOverlapTokenMeta;
  comparisons: HolderOverlapPayload[];
  aggregate: HolderOverlapAggregateSummary | null;
  fetchedAt: string;
}

export const MAX_HOLDER_OVERLAP_COMPARE_MINTS = 8;

export type HolderLastTradeSide = "buy" | "sell";

export interface HolderLastTrade {
  side: HolderLastTradeSide | null;
  at: string | null;
  amountToken: number | null;
  amountUsd: number | null;
}

export interface HolderNetWorth {
  netWorthUsd: number | null;
  nativeBalanceSol: number | null;
  nativeBalanceUsd: number | null;
  tokenPositionUsd: number | null;
}

export interface HolderInsightsRow {
  rank: number;
  wallet: string;
  inProfit: boolean | null;
  profitUsd: number | null;
  profitPct: number | null;
  costUsd: number | null;
  lastTrade: HolderLastTrade;
  netWorth: HolderNetWorth;
}

export interface HolderInsightsPayload {
  mint: string;
  source: string;
  holders: HolderInsightsRow[];
  summary: {
    total: number;
    inProfit: number;
    atLoss: number;
    unknown: number;
    lastBuy: number;
    lastSell: number;
    lastTradeUnknown: number;
    withNetWorth: number;
    totalNetWorthUsd: number | null;
  };
  fetchedAt: string;
}

/** @deprecated Use HolderInsightsRow */
export type HolderProfitRow = HolderInsightsRow;

/** @deprecated Use HolderInsightsPayload */
export type HolderProfitPayload = HolderInsightsPayload;

export async function fetchHolderInsights(
  mint: string,
  opts?: { wallets?: string[]; signal?: AbortSignal },
): Promise<HolderInsightsPayload> {
  const trimmed = mint.trim();
  if (!isValidSolanaMint(trimmed)) {
    throw new Error("Enter a valid mint address");
  }

  const base = getApiBaseUrl().replace(/\/$/, "");
  const params = new URLSearchParams({ mint: trimmed });
  const wallets = opts?.wallets?.map((w) => w.trim()).filter(Boolean) ?? [];
  if (wallets.length > 0) {
    params.set("wallets", wallets.join(","));
  }
  const url = `${base}/agent/tokens/holder-profit?${params.toString()}`;
  const res = await syraFetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: HolderProfitPayload;
    error?: string;
    message?: string;
  };

  if (!res.ok || body.success !== true || !body.data?.mint) {
    throw new Error(body.error || body.message || "Failed to load holder insights");
  }

  return body.data;
}

/** @deprecated Use fetchHolderInsights */
export async function fetchHolderProfitStatus(
  mint: string,
  opts?: { wallets?: string[]; signal?: AbortSignal },
): Promise<HolderInsightsPayload> {
  return fetchHolderInsights(mint, opts);
}

export function parseMintAddressList(raw: string): string[] {
  const parts = raw.split(/[\s,\n\r;]+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const normalized = normalizeMintInput(part);
    if (!normalized || !isValidSolanaMint(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export async function fetchHolderOverlapBatch(
  mintA: string,
  mintBs: string[],
  opts?: { signal?: AbortSignal },
): Promise<HolderOverlapBatchPayload> {
  const a = mintA.trim();
  const uniqueBs = [...new Set(mintBs.map((m) => m.trim()).filter(Boolean))].filter(
    (m) => m !== a && isValidSolanaMint(m),
  );

  if (!isValidSolanaMint(a)) {
    throw new Error("Enter a valid base mint address");
  }
  if (uniqueBs.length === 0) {
    throw new Error("Add at least one valid compare mint address");
  }
  if (uniqueBs.length > MAX_HOLDER_OVERLAP_COMPARE_MINTS) {
    throw new Error(`Compare at most ${MAX_HOLDER_OVERLAP_COMPARE_MINTS} tokens at once`);
  }

  const base = getApiBaseUrl().replace(/\/$/, "");
  const mintBParam = uniqueBs.map((m) => encodeURIComponent(m)).join(",");
  const url = `${base}/agent/tokens/holder-overlap?mintA=${encodeURIComponent(a)}&mintB=${mintBParam}`;
  const res = await syraFetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: HolderOverlapBatchPayload;
    error?: string;
    message?: string;
  };

  if (!res.ok || body.success !== true || !body.data?.mintA || !body.data.comparisons?.length) {
    throw new Error(body.error || body.message || "Failed to compare holder overlap");
  }

  return body.data;
}

/** @deprecated Use fetchHolderOverlapBatch for multi-mint support */
export async function fetchHolderOverlap(
  mintA: string,
  mintB: string,
  opts?: { signal?: AbortSignal },
): Promise<HolderOverlapPayload> {
  const batch = await fetchHolderOverlapBatch(mintA, [mintB], opts);
  const comparison = batch.comparisons[0];
  if (!comparison) {
    throw new Error("Failed to compare holder overlap");
  }
  return comparison;
}

