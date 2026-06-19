import { getApiBaseUrl } from "@/lib/chatApi";
import { RISE_ALPHA_TOKEN_MINT } from "@/lib/riseToken";
import type { RiseAggregateResponse, RiseMarketRow, RiseMarketsListResponse } from "@/lib/riseMarketsTypes";

export class RiseMarketsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RiseMarketsApiError";
    this.status = status;
  }
}

function apiBase(): string {
  return getApiBaseUrl().replace(/\/$/, "");
}

async function riseFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const json = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
  if (!res.ok || !json || json.success === false) {
    const msg =
      (json && typeof json.error === "string" && json.error) ||
      `Request failed (${res.status} ${res.statusText})`;
    throw new RiseMarketsApiError(msg, res.status);
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

function dedupeMarketsByMint(rows: RiseMarketRow[]): Map<string, RiseMarketRow> {
  const dedup = new Map<string, RiseMarketRow>();
  for (const row of rows) {
    if (!row.mint) continue;
    if (!dedup.has(row.mint)) dedup.set(row.mint, row);
  }
  return dedup;
}

async function mergeUponlySpotlight(
  dedup: Map<string, RiseMarketRow>,
  signal: AbortSignal | undefined,
  prefetched?: RiseAggregateResponse,
): Promise<RiseMarketRow[]> {
  const merge = (agg: RiseAggregateResponse) => {
    const uponly = agg.uponly;
    if (uponly?.mint && !dedup.has(uponly.mint)) dedup.set(uponly.mint, uponly);
  };
  if (prefetched) {
    merge(prefetched);
    return Array.from(dedup.values());
  }
  if (dedup.has(RISE_ALPHA_TOKEN_MINT)) return Array.from(dedup.values());
  try {
    merge(await getRiseAggregate(signal));
  } catch {
    // list still valid without spotlight
  }
  return Array.from(dedup.values());
}

export function getRiseAggregate(signal?: AbortSignal): Promise<RiseAggregateResponse> {
  return riseFetch<RiseAggregateResponse>("/uponly-rise-markets/aggregate", signal);
}

export function getRiseMarkets(
  params: { page?: number; limit?: number; verified?: boolean; hasFloor?: boolean } = {},
  signal?: AbortSignal,
): Promise<RiseMarketsListResponse> {
  const q = buildQuery({
    page: params.page,
    limit: params.limit,
    verified: params.verified ? "true" : undefined,
    hasFloor: params.hasFloor ? "true" : undefined,
  });
  return riseFetch<RiseMarketsListResponse>(`/uponly-rise-markets${q}`, signal);
}

const PAGE_CONCURRENCY = 2;
const BATCH_GAP_MS = 80;

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

export async function getRiseMarketsTop(
  limit: number,
  signal?: AbortSignal,
  prefetchedAggregate?: RiseAggregateResponse,
): Promise<RiseMarketRow[]> {
  const first = await getRiseMarkets({ page: 1, limit }, signal);
  const dedup = dedupeMarketsByMint(first.markets);
  return mergeUponlySpotlight(dedup, signal, prefetchedAggregate);
}

/** Paginated walk of the RISE universe (same pattern as uponly-fund terminal). */
export async function getRiseMarketsAll(
  limit: number,
  signal?: AbortSignal,
  prefetchedAggregate?: RiseAggregateResponse,
): Promise<RiseMarketRow[]> {
  const first = await getRiseMarkets({ page: 1, limit }, signal);
  const totalPages = Math.max(1, first.totalPages ?? 1);
  const merged: RiseMarketRow[] = [...first.markets];
  if (totalPages > 1) {
    const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    for (let i = 0; i < remaining.length; i += PAGE_CONCURRENCY) {
      if (i > 0) await delay(BATCH_GAP_MS, signal);
      const chunk = remaining.slice(i, i + PAGE_CONCURRENCY);
      const responses = await Promise.all(chunk.map((page) => getRiseMarkets({ page, limit }, signal)));
      for (const next of responses) merged.push(...next.markets);
    }
  }
  const dedup = dedupeMarketsByMint(merged);
  return mergeUponlySpotlight(dedup, signal, prefetchedAggregate);
}
