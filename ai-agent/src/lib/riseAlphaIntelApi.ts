import { getApiBaseUrl } from "@/lib/chatApi";
import type { PumpfunAlphaTrendToken } from "@/lib/pumpfunAlphaTrendApi";
import { RISE_ALPHA_TOKEN, RISE_ALPHA_TOKEN_MINT } from "@/lib/riseToken";

/** Rise vault / fund lens layered on live $UPONLY market data (paper borrow metrics — not on-chain). */
export interface RiseAlphaFundLens {
  borrowPoolUsd: number;
  utilizationPct: number;
  borrowAprPct: number;
  lendAprPct: number;
  alphaNlvUsd: number;
  flow24hUsd: number;
}

export interface RiseAlphaTokenSnapshot {
  mint: string;
  symbol: string;
  name: string;
  imageUrl: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  floorPriceUsd: number | null;
  volume24hUsd: number | null;
  holders: number | null;
  priceChange24hPct: number | null;
  level: number | null;
  isVerified: boolean;
}

export interface RiseAlphaIntelResponse {
  nowMs: number;
  token: RiseAlphaTokenSnapshot;
  rise: RiseAlphaFundLens;
  /** Always the canonical RISE $UPONLY mint — Rise Alpha desk target only. */
  riseAlphaMintTargets: readonly [typeof RISE_ALPHA_TOKEN_MINT];
}

type RiseMarketRowPayload = {
  mint?: string;
  symbol?: string;
  name?: string;
  imageUrl?: string | null;
  priceUsd?: number | null;
  marketCapUsd?: number | null;
  floorPriceUsd?: number | null;
  volume24hUsd?: number | null;
  holders?: number | null;
  priceChange24hPct?: number | null;
  level?: number | null;
  isVerified?: boolean;
};

type RiseMarketApiResponse = {
  success?: boolean;
  row?: RiseMarketRowPayload | null;
  normalized?: {
    priceUsd?: number | null;
    marketCapUsd?: number | null;
    floorPriceUsd?: number | null;
    volume24hUsd?: number | null;
    holders?: number | null;
    imageUrl?: string | null;
  } | null;
  error?: string;
  message?: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function deriveFundLens(nowMs: number, marketCapUsd: number | null): RiseAlphaFundLens {
  const mc = marketCapUsd != null && Number.isFinite(marketCapUsd) ? marketCapUsd : 420_000;
  const seed = Number(nowMs) % 100_000;
  const utilizationPct = clamp(38 + (seed % 35), 24, 88);
  const borrowAprPct = clamp(9 + utilizationPct * 0.11 + (seed % 7) * 0.05, 7.5, 26);
  const lendAprPct = clamp(borrowAprPct * 0.62 + (seed % 5) * 0.04, 4, 16);
  const borrowPoolUsd = mc * (2.4 + (seed % 120) / 100);
  const alphaNlvUsd = borrowPoolUsd * (0.55 + (seed % 40) / 200);
  const flow24hUsd = alphaNlvUsd * ((seed % 17) - 8) / 400;
  return {
    borrowPoolUsd,
    utilizationPct,
    borrowAprPct,
    lendAprPct,
    alphaNlvUsd,
    flow24hUsd,
  };
}

function mergeTokenSnapshot(row: RiseMarketRowPayload | null | undefined, normalized: RiseMarketApiResponse["normalized"]): RiseAlphaTokenSnapshot {
  const priceUsd = row?.priceUsd ?? normalized?.priceUsd ?? null;
  const marketCapUsd = row?.marketCapUsd ?? normalized?.marketCapUsd ?? null;
  return {
    mint: row?.mint ?? RISE_ALPHA_TOKEN_MINT,
    symbol: row?.symbol?.trim() || RISE_ALPHA_TOKEN.symbol,
    name: row?.name?.trim() || RISE_ALPHA_TOKEN.name,
    imageUrl: row?.imageUrl ?? normalized?.imageUrl ?? null,
    priceUsd,
    marketCapUsd,
    floorPriceUsd: row?.floorPriceUsd ?? normalized?.floorPriceUsd ?? null,
    volume24hUsd: row?.volume24hUsd ?? normalized?.volume24hUsd ?? null,
    holders: row?.holders ?? normalized?.holders ?? null,
    priceChange24hPct: row?.priceChange24hPct ?? null,
    level: row?.level ?? null,
    isVerified: row?.isVerified === true,
  };
}

export function riseTokenToExperimentTape(token: RiseAlphaTokenSnapshot, nowMs: number): PumpfunAlphaTrendToken {
  return {
    mint: token.mint,
    symbol: token.symbol,
    name: token.name,
    complete: true,
    marketCapUsd: token.marketCapUsd,
    athMarketCapUsd: token.marketCapUsd,
    athMarketCapTimestampMs: nowMs,
    updatedAtMs: nowMs,
    lastTradeTimestampMs: nowMs,
    anchorTsMs: nowMs,
  };
}

export async function fetchRiseAlphaIntel(): Promise<RiseAlphaIntelResponse> {
  const nowMs = Date.now();
  const base = getApiBaseUrl().replace(/\/$/, "");
  const url = `${base}/uponly-rise-market/${encodeURIComponent(RISE_ALPHA_TOKEN_MINT)}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const body = (await res.json().catch(() => ({}))) as RiseMarketApiResponse;

  if (!res.ok || body.success !== true) {
    throw new Error(body.error || body.message || "Failed to load RISE token market");
  }

  const token = mergeTokenSnapshot(body.row ?? null, body.normalized ?? null);
  const rise = deriveFundLens(nowMs, token.marketCapUsd);

  return {
    nowMs,
    token,
    rise,
    riseAlphaMintTargets: [RISE_ALPHA_TOKEN_MINT],
  };
}
