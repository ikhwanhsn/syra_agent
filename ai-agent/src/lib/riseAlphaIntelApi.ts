import { getApiBaseUrl } from "@/lib/chatApi";
import type { PumpfunAlphaTrendToken } from "@/lib/pumpfunAlphaTrendApi";
import type { RiseAlphaMarketsBundle } from "@/lib/riseMarketsApi";
import type { RiseMarketRow } from "@/lib/riseMarketsTypes";
import { enrichRiseMarket } from "@/lib/riseIntelligence";
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
  /** RISE mints the Rise Alpha desk may enter (agent-ready / watch tier). */
  riseAlphaMintTargets: readonly string[];
  /** Full RISE universe size on this refresh. */
  marketCount: number;
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

function parseIsoMs(iso: string | null | undefined, fallback: number): number {
  if (!iso) return fallback;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : fallback;
}

export function riseMarketRowToTokenSnapshot(row: RiseMarketRow): RiseAlphaTokenSnapshot {
  return {
    mint: row.mint,
    symbol: row.symbol?.trim() || "—",
    name: row.name?.trim() || row.symbol || "—",
    imageUrl: row.imageUrl,
    priceUsd: row.priceUsd,
    marketCapUsd: row.marketCapUsd,
    floorPriceUsd: row.floorPriceUsd,
    volume24hUsd: row.volume24hUsd,
    holders: row.holders,
    priceChange24hPct: row.priceChange24hPct,
    level: row.level,
    isVerified: row.isVerified,
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

export function riseMarketToExperimentTape(row: RiseMarketRow, nowMs: number): PumpfunAlphaTrendToken {
  const updatedMs = parseIsoMs(row.updatedAt, nowMs);
  const createdMs = parseIsoMs(row.createdAt, updatedMs);
  return {
    mint: row.mint,
    symbol: row.symbol?.trim() || "—",
    name: row.name?.trim() || row.symbol || "—",
    complete: true,
    marketCapUsd: row.marketCapUsd,
    athMarketCapUsd: row.marketCapUsd,
    athMarketCapTimestampMs: updatedMs,
    updatedAtMs: updatedMs,
    lastTradeTimestampMs: updatedMs,
    anchorTsMs: createdMs,
  };
}

export function riseTokenToExperimentTape(token: RiseAlphaTokenSnapshot, nowMs: number): PumpfunAlphaTrendToken {
  return riseMarketToExperimentTape(
    {
      mint: token.mint,
      marketAddress: null,
      name: token.name,
      symbol: token.symbol,
      imageUrl: token.imageUrl,
      tokenUri: null,
      twitterUrl: null,
      telegramUrl: null,
      discordUrl: null,
      priceUsd: token.priceUsd,
      floorPriceUsd: token.floorPriceUsd,
      marketCapUsd: token.marketCapUsd,
      floorMarketCapUsd: null,
      volume24hUsd: token.volume24hUsd,
      volumeAllTimeUsd: null,
      holders: token.holders,
      creatorFeePct: null,
      startingPriceUsd: null,
      priceChange24hPct: token.priceChange24hPct,
      floorDeltaPct: null,
      lockedSupplyPct: null,
      level: token.level,
      isVerified: token.isVerified,
      disableSell: false,
      createdAt: null,
      updatedAt: null,
      ageHours: null,
      creator: null,
      tokenDecimals: null,
      mintMain: null,
    },
    nowMs,
  );
}

export function riseMarketsToExperimentTape(markets: readonly RiseMarketRow[], nowMs: number): PumpfunAlphaTrendToken[] {
  const tokens = markets.map((row) => riseMarketToExperimentTape(row, nowMs));
  tokens.sort((a, b) => (b.anchorTsMs ?? 0) - (a.anchorTsMs ?? 0));
  return tokens;
}

export function buildRiseExperimentIntel(bundle: RiseAlphaMarketsBundle): RiseAlphaIntelResponse {
  const nowMs = bundle.fetchedAtMs;
  const uponlyRow =
    bundle.markets.find((m) => m.mint === RISE_ALPHA_TOKEN_MINT) ?? bundle.aggregate.uponly ?? null;
  const token = uponlyRow
    ? riseMarketRowToTokenSnapshot(uponlyRow)
    : mergeTokenSnapshot({ mint: RISE_ALPHA_TOKEN_MINT, symbol: RISE_ALPHA_TOKEN.symbol, name: RISE_ALPHA_TOKEN.name }, null);
  const rise = deriveFundLens(nowMs, token.marketCapUsd);
  const riseAlphaMintTargets = bundle.markets
    .map(enrichRiseMarket)
    .filter((r) => r.agentTier === "ready" || r.agentTier === "watch")
    .map((r) => r.market.mint);
  return {
    nowMs,
    token,
    rise,
    riseAlphaMintTargets,
    marketCount: bundle.markets.length,
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
    marketCount: 1,
  };
}
