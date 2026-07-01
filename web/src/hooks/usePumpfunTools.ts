import { useQuery } from "@tanstack/react-query";
import {
  fetchTokenDevInfo,
  fetchTokenSnipers,
  fetchTokenTrades,
  type TokenDevInfoPayload,
  type TokenSnipersPayload,
  type TokenTradesPayload,
} from "@/lib/pumpfunToolsApi";
import { isValidSolanaMint } from "@/lib/pumpfunAnalysisApi";

export const TOKEN_DEV_INFO_KEY = "token-dev-info" as const;
export const TOKEN_SNIPERS_KEY = "token-snipers" as const;
export const TOKEN_TRADES_KEY = "token-trades" as const;

function devInfoQueryKey(mint: string) {
  return [TOKEN_DEV_INFO_KEY, mint.trim()] as const;
}

function snipersQueryKey(mint: string) {
  return [TOKEN_SNIPERS_KEY, mint.trim()] as const;
}

function tradesQueryKey(mint: string, limit?: number) {
  return [TOKEN_TRADES_KEY, mint.trim(), limit ?? 50] as const;
}

type ToolQueryOptions = {
  enabled?: boolean;
};

export function useTokenDevInfo(mint: string | null | undefined, options?: ToolQueryOptions) {
  const trimmed = mint?.trim() ?? "";
  const enabled = (options?.enabled ?? true) && trimmed.length > 0 && isValidSolanaMint(trimmed);

  return useQuery({
    queryKey: devInfoQueryKey(trimmed),
    queryFn: ({ signal }) => fetchTokenDevInfo(trimmed, { signal }),
    enabled,
    staleTime: 120_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useTokenSnipers(mint: string | null | undefined, options?: ToolQueryOptions) {
  const trimmed = mint?.trim() ?? "";
  const enabled = (options?.enabled ?? true) && trimmed.length > 0 && isValidSolanaMint(trimmed);

  return useQuery({
    queryKey: snipersQueryKey(trimmed),
    queryFn: ({ signal }) => fetchTokenSnipers(trimmed, { signal }),
    enabled,
    staleTime: 90_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useTokenTrades(
  mint: string | null | undefined,
  options?: ToolQueryOptions & { limit?: number },
) {
  const trimmed = mint?.trim() ?? "";
  const limit = options?.limit ?? 50;
  const enabled = (options?.enabled ?? true) && trimmed.length > 0 && isValidSolanaMint(trimmed);

  return useQuery({
    queryKey: tradesQueryKey(trimmed, limit),
    queryFn: ({ signal }) => fetchTokenTrades(trimmed, { signal, limit }),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export type { TokenDevInfoPayload, TokenSnipersPayload, TokenTradesPayload };
