/**
 * Typed client for public RISE HTTP proxies. All endpoints live under
 * `${API_BASE}/uponly-rise-market(s)/...` and require no client-side secrets —
 * the API auto-injects auth for trusted origins (see api/utils/trustedOriginAuth.js).
 *
 * Errors are surfaced as thrown `RiseDashboardApiError`. Use TanStack Query
 * to retry / cache. Each function is single-responsibility and pure.
 */
import { API_BASE, getApiHeaders } from "../../config/global";
import type {
  RiseAggregateResponse,
  RiseBorrowQuoteResponse,
  RiseMarketRow,
  RiseMarketsListResponse,
  RiseOhlcResponse,
  RisePortfolioPositionsResponse,
  RisePortfolioSummaryResponse,
  RiseQuoteResponse,
  RiseTimeframe,
  RiseTransactionsResponse,
} from "./riseDashboardTypes";

/** Same canonical mint as `@/components/rise/RiseShared` (avoid importing React entry from this module). */
const RISE_UPONLY_MINT = "DzpB6nC3qnL7WUewVumi5dqWWtM1Le76E3v2HLCXrise" as const;

function dedupeMarketsByMint(rows: RiseMarketRow[]): Map<string, RiseMarketRow> {
  const dedup = new Map<string, RiseMarketRow>();
  for (const row of rows) {
    if (!row.mint) continue;
    if (!dedup.has(row.mint)) dedup.set(row.mint, row);
  }
  return dedup;
}

/** Adds UPONLY row from aggregate when missing; skips GET /aggregate if already listed or prefetch provided. */
async function mergeUponlySpotlightIntoDedup(
  dedup: Map<string, RiseMarketRow>,
  signal: AbortSignal | undefined,
  prefetchedAggregate: RiseAggregateResponse | undefined,
): Promise<RiseMarketRow[]> {
  const mergeFromAgg = (agg: RiseAggregateResponse) => {
    const uponly = agg.uponly;
    if (uponly?.mint && !dedup.has(uponly.mint)) dedup.set(uponly.mint, uponly);
  };

  if (prefetchedAggregate !== undefined) {
    mergeFromAgg(prefetchedAggregate);
    return Array.from(dedup.values());
  }

  if (dedup.has(RISE_UPONLY_MINT)) {
    return Array.from(dedup.values());
  }

  try {
    mergeFromAgg(await getRiseAggregate(signal));
  } catch {
    // list still valid without spotlight merge
  }
  return Array.from(dedup.values());
}

export class RiseDashboardApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RiseDashboardApiError";
    this.status = status;
  }
}

function getApiBase(): string {
  const fromEnv =
    typeof import.meta.env.VITE_SYRA_API_URL === "string" && import.meta.env.VITE_SYRA_API_URL.trim();
  return (fromEnv || `${API_BASE}/`).replace(/\/$/, "");
}

type FetchOptions = {
  signal?: AbortSignal;
  method?: "GET" | "POST";
  body?: unknown;
};

async function riseFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const base = getApiBase();
  const url = `${base}${path}`;
  const init: RequestInit = {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...getApiHeaders(),
    },
    signal: options.signal,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };
  const res = await fetch(url, init);
  const json = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
  if (!res.ok || !json || json.success === false) {
    const msg =
      (json && typeof json.error === "string" && json.error) ||
      `Request failed (${res.status} ${res.statusText})`;
    throw new RiseDashboardApiError(msg, res.status);
  }
  return json as T;
}

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (entries.length === 0) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.set(k, String(v));
  return `?${sp.toString()}`;
}

/* --- Markets / Aggregate --- */

export function getRiseAggregate(signal?: AbortSignal): Promise<RiseAggregateResponse> {
  return riseFetch<RiseAggregateResponse>("/uponly-rise-markets/aggregate", { signal });
}

export type RiseMarketsListParams = {
  page?: number;
  limit?: number;
  verified?: boolean;
  hasFloor?: boolean;
  minMarketCap?: number;
};

export function getRiseMarkets(
  params: RiseMarketsListParams = {},
  signal?: AbortSignal,
): Promise<RiseMarketsListResponse> {
  const q = buildQuery({
    page: params.page,
    limit: params.limit,
    verified: params.verified ? "true" : undefined,
    hasFloor: params.hasFloor ? "true" : undefined,
    minMarketCap: params.minMarketCap,
  });
  return riseFetch<RiseMarketsListResponse>(`/uponly-rise-markets${q}`, { signal });
}

/** Low concurrency + small gaps between batches avoids RISE/upstream 403s when the full-universe walk races other dashboard calls. */
const MARKETS_ALL_PAGE_CONCURRENCY = 2;
const MARKETS_ALL_BATCH_GAP_MS = 80;

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * First list page merged with UPONLY spotlight from aggregate (bubble map / fast surfaces).
 * Pass `prefetchedAggregate` from TanStack [`rise-aggregate`] to avoid a duplicate GET /aggregate.
 */
export async function getRiseMarketsTop(
  limit: number,
  signal?: AbortSignal,
  prefetchedAggregate?: RiseAggregateResponse,
): Promise<RiseMarketRow[]> {
  const first = await getRiseMarkets({ page: 1, limit }, signal);
  const dedup = dedupeMarketsByMint(first.markets);
  return mergeUponlySpotlightIntoDedup(dedup, signal, prefetchedAggregate);
}

/**
 * Full universe (paginated walk). Optional `prefetchedAggregate` avoids a trailing GET /aggregate when
 * already supplied from TanStack [`rise-aggregate`].
 */
export async function getRiseMarketsAll(
  limit: number,
  signal?: AbortSignal,
  prefetchedAggregate?: RiseAggregateResponse,
): Promise<RiseMarketRow[]> {
  const first = await getRiseMarkets({ page: 1, limit }, signal);
  const totalPages = Math.max(1, first.totalPages ?? 1);
  const merged: RiseMarketRow[] = [...first.markets];
  if (totalPages > 1) {
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, idx) => idx + 2);
    for (let i = 0; i < remainingPages.length; i += MARKETS_ALL_PAGE_CONCURRENCY) {
      if (i > 0) await delay(MARKETS_ALL_BATCH_GAP_MS, signal);
      const chunk = remainingPages.slice(i, i + MARKETS_ALL_PAGE_CONCURRENCY);
      const chunkResponses = await Promise.all(chunk.map((page) => getRiseMarkets({ page, limit }, signal)));
      for (const next of chunkResponses) {
        merged.push(...next.markets);
      }
    }
  }
  const dedup = dedupeMarketsByMint(merged);
  return mergeUponlySpotlightIntoDedup(dedup, signal, prefetchedAggregate);
}

/* --- Per-market --- */

export function getRiseMarketOhlc(
  address: string,
  timeframe: RiseTimeframe,
  limit = 168,
  signal?: AbortSignal,
): Promise<RiseOhlcResponse> {
  const q = buildQuery({ limit });
  return riseFetch<RiseOhlcResponse>(
    `/uponly-rise-market/${encodeURIComponent(address)}/ohlc/${encodeURIComponent(timeframe)}${q}`,
    { signal },
  );
}

export function getRiseMarketTransactions(
  address: string,
  page = 1,
  limit = 10,
  signal?: AbortSignal,
): Promise<RiseTransactionsResponse> {
  const q = buildQuery({ page, limit });
  return riseFetch<RiseTransactionsResponse>(
    `/uponly-rise-market/${encodeURIComponent(address)}/transactions${q}`,
    { signal },
  );
}

export function postRiseMarketQuote(
  address: string,
  body: { amount: number; direction: "buy" | "sell" },
  signal?: AbortSignal,
): Promise<RiseQuoteResponse> {
  return riseFetch<RiseQuoteResponse>(
    `/uponly-rise-market/${encodeURIComponent(address)}/quote`,
    { method: "POST", body, signal },
  );
}

export function postRiseBorrowQuote(
  address: string,
  body: { wallet: string; amountToBorrow: number },
  signal?: AbortSignal,
): Promise<RiseBorrowQuoteResponse> {
  return riseFetch<RiseBorrowQuoteResponse>(
    `/uponly-rise-market/${encodeURIComponent(address)}/borrow-quote`,
    { method: "POST", body, signal },
  );
}

/* --- Portfolio --- */

export function getRisePortfolioSummary(
  wallet: string,
  signal?: AbortSignal,
): Promise<RisePortfolioSummaryResponse> {
  return riseFetch<RisePortfolioSummaryResponse>(
    `/uponly-rise-portfolio/${encodeURIComponent(wallet)}/summary`,
    { signal },
  );
}

export function getRisePortfolioPositions(
  wallet: string,
  page = 1,
  limit = 10,
  signal?: AbortSignal,
): Promise<RisePortfolioPositionsResponse> {
  const q = buildQuery({ page, limit });
  return riseFetch<RisePortfolioPositionsResponse>(
    `/uponly-rise-portfolio/${encodeURIComponent(wallet)}/positions${q}`,
    { signal },
  );
}

/* --- Helpers --- */

export const RISE_RICH_TRADE_BASE = "https://rise.rich/trade" as const;

export function buildRiseTradeUrl(mint: string | null | undefined): string | null {
  if (!mint || typeof mint !== "string") return null;
  const trimmed = mint.trim();
  if (!trimmed) return null;
  return `${RISE_RICH_TRADE_BASE}/${trimmed}`;
}

export function buildSolscanTokenUrl(mint: string | null | undefined): string | null {
  if (!mint) return null;
  return `https://solscan.io/token/${mint}`;
}

export function buildSolscanAccountUrl(address: string | null | undefined): string | null {
  if (!address) return null;
  return `https://solscan.io/account/${address}`;
}

export function buildSolscanTxUrl(sig: string | null | undefined): string | null {
  if (!sig) return null;
  return `https://solscan.io/tx/${sig}`;
}
