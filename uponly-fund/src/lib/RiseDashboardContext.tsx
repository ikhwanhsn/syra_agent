/**
 * Provider + hooks for the /rise dashboard. Powered by TanStack Query so
 * components share the same cache (60s refetch for the aggregate digest,
 * shorter for trades, no cache for quotes).
 *
 * The provider is intentionally thin — only the aggregate query runs at the
 * top level. Per-market hooks (`useRiseOhlc`, `useRiseTransactions`,
 * `useRiseQuote`, etc.) live next to it so callers can opt into them per row
 * (e.g. inside a drawer) without inflating the global cache.
 */
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getRiseAggregate,
  getRiseMarketOhlc,
  getRiseMarketTransactions,
  getRiseMarkets,
  getRisePortfolioPositions,
  getRisePortfolioSummary,
  postRiseBorrowQuote,
  postRiseMarketQuote,
  type RiseMarketsListParams,
} from "./riseDashboardApi";
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

const AGGREGATE_REFETCH_MS = 60_000;
const LIST_REFETCH_MS = 60_000;
const OHLC_REFETCH_MS = 60_000;
const TX_REFETCH_MS = 30_000;
const PORTFOLIO_STALE_MS = 30_000;

type RiseDashboardContextValue = {
  aggregate: UseQueryResult<RiseAggregateResponse, Error>;
  uponly: RiseMarketRow | null;
};

const RiseDashboardContext = createContext<RiseDashboardContextValue | null>(null);

export function RiseDashboardProvider({ children }: { children: ReactNode }) {
  const aggregate = useQuery<RiseAggregateResponse, Error>({
    queryKey: ["rise-aggregate"],
    queryFn: ({ signal }) => getRiseAggregate(signal),
    staleTime: AGGREGATE_REFETCH_MS,
    refetchInterval: AGGREGATE_REFETCH_MS,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const value = useMemo<RiseDashboardContextValue>(
    () => ({ aggregate, uponly: aggregate.data?.uponly ?? null }),
    [aggregate],
  );

  return <RiseDashboardContext.Provider value={value}>{children}</RiseDashboardContext.Provider>;
}

export function useRiseDashboard(): RiseDashboardContextValue {
  const ctx = useContext(RiseDashboardContext);
  if (!ctx) throw new Error("useRiseDashboard must be used inside RiseDashboardProvider");
  return ctx;
}

export function useRiseMarkets(params: RiseMarketsListParams = {}) {
  const queryKey = [
    "rise-markets",
    params.page ?? 1,
    params.limit ?? 50,
    params.verified ?? false,
    params.hasFloor ?? false,
    params.minMarketCap ?? 0,
  ];
  return useQuery<RiseMarketsListResponse, Error>({
    queryKey,
    queryFn: ({ signal }) => getRiseMarkets(params, signal),
    staleTime: LIST_REFETCH_MS,
    refetchInterval: LIST_REFETCH_MS,
    placeholderData: (prev) => prev,
    retry: 1,
  });
}

export function useRiseOhlc(address: string | null | undefined, timeframe: RiseTimeframe, limit = 168) {
  const enabled = Boolean(address);
  return useQuery<RiseOhlcResponse, Error>({
    queryKey: ["rise-ohlc", address ?? "", timeframe, limit],
    queryFn: ({ signal }) => getRiseMarketOhlc(address as string, timeframe, limit, signal),
    enabled,
    staleTime: OHLC_REFETCH_MS,
    refetchInterval: OHLC_REFETCH_MS,
    retry: 1,
  });
}

export function useRiseTransactions(address: string | null | undefined, page = 1, limit = 25) {
  const enabled = Boolean(address);
  return useQuery<RiseTransactionsResponse, Error>({
    queryKey: ["rise-transactions", address ?? "", page, limit],
    queryFn: ({ signal }) => getRiseMarketTransactions(address as string, page, limit, signal),
    enabled,
    staleTime: TX_REFETCH_MS,
    refetchInterval: TX_REFETCH_MS,
    retry: 1,
  });
}

type QuoteParams = { address: string | null; amount: number | null; direction: "buy" | "sell" };

export function useRiseQuote({ address, amount, direction }: QuoteParams) {
  const enabled = Boolean(address) && typeof amount === "number" && Number.isFinite(amount) && amount > 0;
  return useQuery<RiseQuoteResponse, Error>({
    queryKey: ["rise-quote", address ?? "", amount ?? 0, direction],
    queryFn: ({ signal }) =>
      postRiseMarketQuote(address as string, { amount: amount as number, direction }, signal),
    enabled,
    staleTime: 0,
    gcTime: 30_000,
    retry: 0,
  });
}

type BorrowQuoteParams = { address: string | null; wallet: string | null; amountToBorrow: number | null };

export function useRiseBorrowQuote({ address, wallet, amountToBorrow }: BorrowQuoteParams) {
  const enabled =
    Boolean(address) &&
    typeof wallet === "string" &&
    wallet.length >= 32 &&
    typeof amountToBorrow === "number" &&
    Number.isFinite(amountToBorrow) &&
    amountToBorrow >= 0;
  return useQuery<RiseBorrowQuoteResponse, Error>({
    queryKey: ["rise-borrow-quote", address ?? "", wallet ?? "", amountToBorrow ?? 0],
    queryFn: ({ signal }) =>
      postRiseBorrowQuote(
        address as string,
        { wallet: wallet as string, amountToBorrow: (amountToBorrow as number) || 0 },
        signal,
      ),
    enabled,
    staleTime: 0,
    gcTime: 30_000,
    retry: 0,
  });
}

export function useRisePortfolioSummary(wallet: string | null | undefined) {
  const enabled = typeof wallet === "string" && wallet.length >= 32;
  return useQuery<RisePortfolioSummaryResponse, Error>({
    queryKey: ["rise-portfolio-summary", wallet ?? ""],
    queryFn: ({ signal }) => getRisePortfolioSummary(wallet as string, signal),
    enabled,
    staleTime: PORTFOLIO_STALE_MS,
    retry: 1,
  });
}

export function useRisePortfolioPositions(wallet: string | null | undefined, page = 1, limit = 25) {
  const enabled = typeof wallet === "string" && wallet.length >= 32;
  return useQuery<RisePortfolioPositionsResponse, Error>({
    queryKey: ["rise-portfolio-positions", wallet ?? "", page, limit],
    queryFn: ({ signal }) => getRisePortfolioPositions(wallet as string, page, limit, signal),
    enabled,
    staleTime: PORTFOLIO_STALE_MS,
    retry: 1,
  });
}
