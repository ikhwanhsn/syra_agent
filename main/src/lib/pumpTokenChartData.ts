/**
 * In-chat price charts: CoinGecko USD OHLC by default (via Syra API — no CORS / optional pro key).
 * Fallback: Binance SOL/USDT for wrapped SOL; then GeckoTerminal pool OHLC via DexScreener.
 */

import { getApiBaseUrl } from "@/lib/chatApi";

const DEXSCREENER_TOKENS = "https://api.dexscreener.com/tokens/v1/solana";
const GECKO_NETWORK = "https://api.geckoterminal.com/api/v2/networks/solana/pools";
const COINGECKO_SOL = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
const BINANCE_KLINES = "https://api.binance.com/api/v3/klines";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
/** Wrapped SOL mint — `pumpfun-sol-price` chart. */
export const WRAPPED_SOL_MINT = "So11111111111111111111111111111111111111112";

export type PumpChartRange = "1D" | "1W" | "1M" | "1Y";

type GeckoOhlcvMeta = {
  quote?: { address?: string; symbol?: string };
};

type GeckoOhlcvResponse = {
  data?: {
    attributes?: { ohlcv_list?: number[][] };
    meta?: GeckoOhlcvMeta;
  };
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for chart data`);
  }
  return res.json();
}

async function fetchSolUsd(signal?: AbortSignal): Promise<number> {
  try {
    const raw = await fetchJson(COINGECKO_SOL, signal);
    if (!isRecord(raw)) return 0;
    const sol = raw.solana;
    if (!isRecord(sol)) return 0;
    const usd = sol.usd;
    return typeof usd === "number" && Number.isFinite(usd) && usd > 0 ? usd : 0;
  } catch {
    return 0;
  }
}

export type AgentChartSeriesOpts = {
  /** Solana token mint (pump.fun, etc.) */
  mint?: string;
  /** CoinGecko coin id (e.g. bitcoin, solana) — trading signal tool */
  coinId?: string;
};

/**
 * Primary path: Syra API proxies CoinGecko `/coins/{id}/ohlc` (USD).
 */
async function fetchCoinGeckoUsdSeriesFromApi(
  opts: AgentChartSeriesOpts,
  range: PumpChartRange,
  signal?: AbortSignal
): Promise<{ time: number; value: number }[]> {
  const mint = opts.mint?.trim() ?? "";
  const coinId = opts.coinId?.trim() ?? "";
  if (!mint && !coinId) return [];

  const base = getApiBaseUrl().replace(/\/$/, "");
  const qs = new URLSearchParams({ range });
  if (coinId) qs.set("coinId", coinId);
  else qs.set("mint", mint);
  const url = `${base}/agent/chart/ohlc?${qs}`;
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const data: unknown = await res.json().catch(() => null);
  if (!isRecord(data) || data.success !== true || !Array.isArray(data.points)) return [];
  const out: { time: number; value: number }[] = [];
  for (const p of data.points) {
    if (!isRecord(p)) continue;
    const t = p.time;
    const v = p.value;
    if (typeof t !== "number" || typeof v !== "number" || !Number.isFinite(t) || !Number.isFinite(v) || v <= 0) {
      continue;
    }
    out.push({ time: t, value: v });
  }
  return out.sort((a, b) => a.time - b.time);
}

function quoteMintHint(row: Record<string, unknown>): "usd" | "sol" | "other" {
  const qt = isRecord(row.quoteToken) ? row.quoteToken : null;
  const addr = typeof qt?.address === "string" ? qt.address : "";
  const sym = typeof qt?.symbol === "string" ? qt.symbol.toUpperCase() : "";
  if (addr === USDC_MINT || addr === USDT_MINT || sym === "USDC" || sym === "USDT") return "usd";
  if (addr === WRAPPED_SOL_MINT || sym === "SOL" || sym === "WSOL") return "sol";
  return "other";
}

async function resolvePairCandidates(mint: string, signal?: AbortSignal): Promise<string[]> {
  const raw = await fetchJson(`${DEXSCREENER_TOKENS}/${encodeURIComponent(mint)}`, signal);
  if (!Array.isArray(raw) || raw.length === 0) return [];

  type Scored = { pairAddress: string; liq: number; hint: "usd" | "sol" | "other" };
  const scored: Scored[] = [];
  for (const row of raw) {
    if (!isRecord(row)) continue;
    const pairAddress = typeof row.pairAddress === "string" ? row.pairAddress : "";
    if (!pairAddress) continue;
    const liq = isRecord(row.liquidity) && typeof row.liquidity.usd === "number" ? row.liquidity.usd : 0;
    scored.push({ pairAddress, liq, hint: quoteMintHint(row) });
  }
  if (scored.length === 0) return [];

  const rank = (h: Scored["hint"]) => (h === "usd" ? 0 : h === "sol" ? 1 : 2);
  scored.sort((a, b) => {
    const dr = rank(a.hint) - rank(b.hint);
    if (dr !== 0) return dr;
    return b.liq - a.liq;
  });
  return scored.map((s) => s.pairAddress);
}

function binanceParamsForRange(range: PumpChartRange): { interval: string; limit: number } {
  switch (range) {
    case "1D":
      return { interval: "5m", limit: 288 };
    case "1W":
      return { interval: "1h", limit: 168 };
    case "1M":
      return { interval: "4h", limit: 180 };
    case "1Y":
      return { interval: "1d", limit: 365 };
    default:
      return { interval: "5m", limit: 288 };
  }
}

async function fetchWsolUsdSeriesFromBinance(
  range: PumpChartRange,
  signal?: AbortSignal
): Promise<{ time: number; value: number }[]> {
  const { interval, limit } = binanceParamsForRange(range);
  const url = `${BINANCE_KLINES}?symbol=SOLUSDT&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const raw: unknown = await res.json();
  if (!Array.isArray(raw)) return [];
  const points: { time: number; value: number }[] = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const openMs = row[0];
    const close = row[4];
    const tSec =
      typeof openMs === "number"
        ? Math.floor(openMs / 1000)
        : typeof openMs === "string"
          ? Math.floor(Number.parseInt(openMs, 10) / 1000)
          : 0;
    const v =
      typeof close === "string"
        ? Number.parseFloat(close)
        : typeof close === "number"
          ? close
          : Number.NaN;
    if (!Number.isFinite(v) || v <= 0 || tSec <= 0) continue;
    points.push({ time: tSec, value: v });
  }
  points.sort((a, b) => a.time - b.time);
  return points;
}

function geckoPathForRange(range: PumpChartRange): { path: string; query: string } {
  switch (range) {
    case "1D":
      return { path: "ohlcv/minute", query: "aggregate=5&limit=288" };
    case "1W":
      return { path: "ohlcv/minute", query: "aggregate=15&limit=672" };
    case "1M":
      return { path: "ohlcv/hour", query: "aggregate=1&limit=720" };
    case "1Y":
      return { path: "ohlcv/day", query: "aggregate=1&limit=400" };
    default:
      return { path: "ohlcv/minute", query: "aggregate=5&limit=288" };
  }
}

function quoteIsUsd(meta: GeckoOhlcvMeta | undefined): boolean {
  const addr = meta?.quote?.address;
  if (addr === USDC_MINT) return true;
  const sym = meta?.quote?.symbol?.toUpperCase();
  return sym === "USDC" || sym === "USDT";
}

function quoteIsSol(meta: GeckoOhlcvMeta | undefined): boolean {
  const addr = meta?.quote?.address;
  if (addr === WRAPPED_SOL_MINT) return true;
  return meta?.quote?.symbol?.toUpperCase() === "SOL";
}

async function fetchGeckoUsdSeriesForPool(
  pool: string,
  range: PumpChartRange,
  signal?: AbortSignal
): Promise<{ time: number; value: number }[]> {
  const { path, query } = geckoPathForRange(range);
  const url = `${GECKO_NETWORK}/${encodeURIComponent(pool)}/${path}?${query}`;
  let json: GeckoOhlcvResponse;
  try {
    json = (await fetchJson(url, signal)) as GeckoOhlcvResponse;
  } catch {
    return [];
  }
  const list = json.data?.attributes?.ohlcv_list;
  if (!Array.isArray(list) || list.length === 0) return [];

  const meta = json.data?.meta;
  const solUsd = quoteIsSol(meta) ? await fetchSolUsd(signal) : 0;
  const useSol = quoteIsSol(meta) && solUsd > 0;
  const useUsd = quoteIsUsd(meta);

  const points: { time: number; value: number }[] = [];
  for (const row of list) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const t = row[0];
    const close = row[4];
    if (typeof t !== "number" || typeof close !== "number" || !Number.isFinite(close)) continue;
    let usd = close;
    if (useUsd) {
      usd = close;
    } else if (useSol) {
      usd = close * solUsd;
    } else {
      continue;
    }
    if (!Number.isFinite(usd) || usd <= 0) continue;
    points.push({ time: t, value: usd });
  }

  points.sort((a, b) => a.time - b.time);
  const deduped: { time: number; value: number }[] = [];
  for (const p of points) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.time === p.time) {
      prev.value = p.value;
    } else {
      deduped.push({ ...p });
    }
  }
  return deduped;
}

/**
 * Returns ascending time series (unix seconds → USD price) for lightweight-charts.
 * Order: CoinGecko OHLC (Syra API) → Binance (WSOL mint only) → GeckoTerminal pools (mint only).
 */
export async function fetchAgentChartUsdSeries(
  opts: AgentChartSeriesOpts,
  range: PumpChartRange,
  signal?: AbortSignal
): Promise<{ time: number; value: number }[]> {
  const mint = opts.mint?.trim() ?? "";
  const coinId = opts.coinId?.trim() ?? "";
  if (!mint && !coinId) return [];

  const primary = await fetchCoinGeckoUsdSeriesFromApi({ mint: mint || undefined, coinId: coinId || undefined }, range, signal);
  if (primary.length > 0) return primary;

  if (!mint) return [];

  if (mint === WRAPPED_SOL_MINT) {
    const binance = await fetchWsolUsdSeriesFromBinance(range, signal);
    if (binance.length > 0) return binance;
  }

  const candidates = await resolvePairCandidates(mint, signal);
  for (const pool of candidates) {
    const series = await fetchGeckoUsdSeriesForPool(pool, range, signal);
    if (series.length > 0) return series;
  }

  return [];
}

/** @deprecated Prefer fetchAgentChartUsdSeries — kept for callers that only pass a mint */
export async function fetchPumpMintUsdSeries(
  mint: string,
  range: PumpChartRange,
  signal?: AbortSignal
): Promise<{ time: number; value: number }[]> {
  return fetchAgentChartUsdSeries({ mint }, range, signal);
}
