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
