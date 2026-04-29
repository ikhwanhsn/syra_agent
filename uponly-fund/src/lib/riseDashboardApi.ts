/**
 * Typed client for the Syra public RISE proxies. All endpoints live under
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
  RiseMarketsListResponse,
  RiseOhlcResponse,
  RisePortfolioPositionsResponse,
  RisePortfolioSummaryResponse,
  RiseQuoteResponse,
  RiseTimeframe,
  RiseTransactionsResponse,
} from "./riseDashboardTypes";

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
