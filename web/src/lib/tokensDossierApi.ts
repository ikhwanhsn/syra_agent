import { getApiBaseUrl } from "@/lib/chatApi";

export interface TokensDossierCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TokensMarketScore {
  score?: number;
  grade?: string;
  label?: string;
  tone?: "safe" | "warning" | "danger" | string;
  isTrustedLaunch?: boolean;
  hasInsufficientData?: boolean;
  insufficientDataReason?: string | null;
  components?: Record<string, { score?: number; status?: string; hasData?: boolean }>;
}

export interface TokensDossierAssetStats {
  price?: number;
  liquidity?: number;
  volume24hUSD?: number;
  marketCap?: number;
  priceChange24hPercent?: number;
  priceChange1hPercent?: number;
}

export interface TokensDossierAsset {
  assetId?: string;
  name?: string;
  symbol?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  stats?: TokensDossierAssetStats;
  canonicalMarket?: {
    source?: string;
    coinId?: string;
    price?: number;
    marketCap?: number;
    volume24hUSD?: number;
  };
  primaryVariant?: {
    mint?: string;
    chain?: string;
    kind?: string;
    liquidityTier?: string;
  };
}

export interface TokensDossierMarketRow {
  address?: string;
  name?: string;
  source?: string;
  liquidity?: number;
  volume24h?: number;
  price?: number;
}

export interface TokensDossierPayload {
  query: { ref?: string; mint?: string; assetId?: string };
  assetId: string;
  chartMint: string | null;
  asset: TokensDossierAsset | null;
  includes: {
    profile?: { ok: boolean; data?: unknown };
    risk?: { ok: boolean; data?: { marketScore?: TokensMarketScore } };
    markets?: {
      ok: boolean;
      data?: { markets?: TokensDossierMarketRow[] };
    };
  } | null;
  ohlcv: {
    interval: string;
    mint: string | null;
    candles: TokensDossierCandle[];
    error?: string;
  };
  mintRisk?: { risk?: { marketScore?: TokensMarketScore } } | null;
  fetchedAt: string;
}

export interface TokensDossierQuery {
  ref?: string;
  mint?: string;
  assetId?: string;
  q?: string;
}

export function parseAssetLookupInput(raw: string): TokensDossierQuery | null {
  const q = raw.trim();
  if (!q) return null;
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(q)) return { mint: q };
  if (q.startsWith("solana-") && q.includes("-")) return { assetId: q };
  if (q.includes("/") || q.includes(".")) return { q };
  return { ref: q };
}

export function dossierQueryToSearchParams(params: TokensDossierQuery): URLSearchParams {
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.ref?.trim()) sp.set("ref", params.ref.trim());
  if (params.mint?.trim()) sp.set("mint", params.mint.trim());
  if (params.assetId?.trim()) sp.set("assetId", params.assetId.trim());
  return sp;
}

export function parseDossierQueryParams(searchParams: URLSearchParams): TokensDossierQuery | null {
  const ref = searchParams.get("ref")?.trim();
  const mint = searchParams.get("mint")?.trim();
  const assetId = searchParams.get("assetId")?.trim();
  const q = searchParams.get("q")?.trim();
  if (ref || mint || assetId || q) {
    return {
      ...(ref && { ref }),
      ...(mint && { mint }),
      ...(assetId && { assetId }),
      ...(q && { q }),
    };
  }
  return null;
}

function buildDossierUrl(params: TokensDossierQuery): string {
  const base = `${getApiBaseUrl().replace(/\/$/, "")}/agent/tokens/dossier`;
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.ref?.trim()) sp.set("ref", params.ref.trim());
  if (params.mint?.trim()) sp.set("mint", params.mint.trim());
  if (params.assetId?.trim()) sp.set("assetId", params.assetId.trim());
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export async function fetchMintDossier(params: TokensDossierQuery): Promise<TokensDossierPayload> {
  const url = buildDossierUrl(params);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: TokensDossierPayload;
    error?: string;
    message?: string;
  };
  if (!res.ok || body.success !== true || !body.data?.assetId) {
    throw new Error(body.error || body.message || "Failed to load mint dossier");
  }
  return body.data;
}

/** Shareable dashboard URL for an asset dossier result. */
export const ASSETS_PATH = "/assets";

export function dossierSharePath(data: TokensDossierPayload): string {
  const q = data.query;
  if (q.mint) return `${ASSETS_PATH}?mint=${encodeURIComponent(q.mint)}`;
  if (q.assetId) return `${ASSETS_PATH}?assetId=${encodeURIComponent(q.assetId)}`;
  if (q.ref) return `${ASSETS_PATH}?ref=${encodeURIComponent(q.ref)}`;
  return `${ASSETS_PATH}?assetId=${encodeURIComponent(data.assetId)}`;
}

export function askSyraPrompt(data: TokensDossierPayload): string {
  const name = data.asset?.name || data.asset?.symbol || data.assetId;
  const mint = data.chartMint;
  if (mint) {
    return `Analyze ${name} (${data.assetId}) on Solana mint ${mint}: summarize Tokens.xyz risk, liquidity, and whether it's reasonable to trade. Use tokens tools if needed.`;
  }
  return `Analyze ${name} (${data.assetId}): summarize canonical price, risk grade, and key markets from Tokens.xyz data.`;
}
