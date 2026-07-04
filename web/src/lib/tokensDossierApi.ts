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
  /** Optional dossier hints for intelligence keyword resolution */
  symbol?: string;
  name?: string;
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

export async function fetchMintDossier(
  params: TokensDossierQuery,
  opts?: { signal?: AbortSignal },
): Promise<TokensDossierPayload> {
  const url = buildDossierUrl(params);
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });
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

export interface AssetsBoardItem {
  key: string;
  ref: string;
  assetId: string;
  name: string;
  symbol: string;
  assetClass: "crypto" | "equity";
  category?: string;
  price?: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
  liquidity?: number;
  imageUrl?: string;
  mint?: string;
}

export interface AssetsBoardPayload {
  items: AssetsBoardItem[];
  total: number;
  list: string;
  groupBy: string;
  pagesFetched: number;
}

export async function fetchAssetsBoard(opts?: {
  list?: string;
  groupBy?: string;
  signal?: AbortSignal;
}): Promise<AssetsBoardPayload> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const sp = new URLSearchParams({
    list: opts?.list?.trim() || "all",
    groupBy: opts?.groupBy?.trim() || "asset",
  });
  const res = await fetch(`${base}/agent/tokens/board?${sp}`, {
    headers: { Accept: "application/json" },
    signal: opts?.signal,
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: AssetsBoardPayload;
    error?: string;
    message?: string;
  };
  if (!res.ok || body.success !== true || !body.data?.items) {
    throw new Error(body.error || body.message || "Failed to load assets board");
  }
  return body.data;
}

/** Shareable dashboard URL for an asset dossier result. */
export const ASSETS_PATH = "/assets";

/** Clean detail path, e.g. `/assets/solana` or `/assets/<mint>`. */
export function assetPathFromQuery(query: TokensDossierQuery): string {
  const assetId = query.assetId?.trim();
  const mint = query.mint?.trim();
  const ref = query.ref?.trim();
  const q = query.q?.trim();
  if (assetId) return `/assets/${encodeURIComponent(assetId)}`;
  if (mint) return `/assets/${encodeURIComponent(mint)}`;
  if (ref) return `/assets/${encodeURIComponent(ref.toLowerCase())}`;
  if (q) return `/assets/lookup?${dossierQueryToSearchParams({ q }).toString()}`;
  return ASSETS_PATH;
}

export function slugToDossierQuery(slug: string | undefined): TokensDossierQuery | null {
  if (!slug || slug === "lookup") return null;
  const decoded = decodeURIComponent(slug);
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(decoded)) return { mint: decoded };
  if (decoded.startsWith("solana-")) return { assetId: decoded };
  return { ref: decoded };
}

export function dossierSharePath(data: TokensDossierPayload): string {
  return assetPathFromQuery({
    assetId: data.assetId,
    mint: data.query.mint ?? data.chartMint ?? undefined,
    ref: data.query.ref,
  });
}

export function askSyraPrompt(
  data: TokensDossierPayload,
  intelligence?: AssetIntelligencePayload | null,
): string {
  const name = data.asset?.name || data.asset?.symbol || data.assetId;
  const mint = data.chartMint;
  const intelHint =
    intelligence?.signal?.ok && intelligence.signal.tradingSignal
      ? ` Recent Syra signal: ${intelligence.signal.tradingSignal} (${intelligence.signal.strength ?? "—"}).`
      : intelligence?.sentiment?.ok
        ? ` Recent news sentiment score: ${intelligence.sentiment.total["Sentiment Score"]?.toFixed(2) ?? "n/a"}.`
        : "";
  if (mint) {
    return `Analyze ${name} (${data.assetId}) on Solana mint ${mint}: summarize Tokens.xyz risk, liquidity, recent news, and whether it's reasonable to trade.${intelHint} Use tokens tools if needed.`;
  }
  return `Analyze ${name} (${data.assetId}): summarize canonical price, risk grade, key markets, and recent news/sentiment from Syra data.${intelHint}`;
}

export interface AssetIntelligenceNewsItem {
  title?: string;
  news_url?: string;
  url?: string;
  link?: string;
  source_name?: string;
  date?: string;
  published_at?: string;
  text?: string;
  tickers?: string[];
}

export interface AssetIntelligenceEventItem {
  event_name?: string;
  event_text?: string;
  ticker?: string;
  source?: string;
  date?: string;
}

export interface AssetIntelligencePayload {
  query: {
    assetId: string;
    ticker: string;
    signalToken: string | null;
    ref?: string;
    mint?: string;
  };
  news: {
    ok: boolean;
    items: AssetIntelligenceNewsItem[];
    error?: string;
  };
  sentiment: {
    ok: boolean;
    data: Record<string, { Positive?: number; Negative?: number; Neutral?: number; sentiment_score?: number }>;
    total: {
      "Total Positive": number;
      "Total Negative": number;
      "Total Neutral": number;
      "Sentiment Score": number;
    };
    error?: string;
  };
  events: {
    ok: boolean;
    items: AssetIntelligenceEventItem[];
    error?: string;
  };
  signal: {
    ok: boolean;
    tradingSignal: string | null;
    strength: string | null;
    source: string | null;
    error?: string;
  };
  fetchedAt: string;
}

function buildIntelligenceUrl(params: TokensDossierQuery): string {
  const base = `${getApiBaseUrl().replace(/\/$/, "")}/agent/tokens/intelligence`;
  const sp = new URLSearchParams();
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.ref?.trim()) sp.set("ref", params.ref.trim());
  if (params.mint?.trim()) sp.set("mint", params.mint.trim());
  if (params.assetId?.trim()) sp.set("assetId", params.assetId.trim());
  if (params.symbol?.trim()) sp.set("symbol", params.symbol.trim());
  if (params.name?.trim()) sp.set("name", params.name.trim());
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

const INTELLIGENCE_CLIENT_TIMEOUT_MS = 14_000;

export async function fetchAssetIntelligence(
  params: TokensDossierQuery,
  opts?: { signal?: AbortSignal },
): Promise<AssetIntelligencePayload> {
  const url = buildIntelligenceUrl(params);
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  opts?.signal?.addEventListener("abort", onAbort);
  const timer = setTimeout(() => controller.abort(), INTELLIGENCE_CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const body = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      data?: AssetIntelligencePayload;
      error?: string;
      message?: string;
    };
    if (!res.ok || body.success !== true || !body.data) {
      throw new Error(body.error || body.message || "Failed to load asset intelligence");
    }
    return body.data;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      if (opts?.signal?.aborted) throw err;
      throw new Error("Asset intelligence timed out");
    }
    throw err;
  } finally {
    clearTimeout(timer);
    opts?.signal?.removeEventListener("abort", onAbort);
  }
}
