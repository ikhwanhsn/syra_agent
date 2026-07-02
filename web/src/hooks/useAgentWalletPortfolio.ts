import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import {
  fetchAgentWalletPortfolio,
  mergeAgentPortfolios,
  type AgentWalletPortfolio,
  type MergedAgentPortfolio,
  type WalletDefiPositions,
} from "@/lib/agentWalletPortfolioApi";

const STALE_MS = 30_000;

export type PortfolioWalletFilter = "all" | AgentWalletPurpose;

interface WalletTarget {
  purpose: AgentWalletPurpose;
  address: string;
}

interface UseAgentWalletPortfolioArgs {
  chatAddress?: string | null;
  lpAddress?: string | null;
  enabled?: boolean;
  walletFilter?: PortfolioWalletFilter;
}

async function fetchPortfoliosForTargets(
  targets: WalletTarget[],
): Promise<Array<{ purpose: AgentWalletPurpose; portfolio: AgentWalletPortfolio }>> {
  const results = await Promise.allSettled(
    targets.map(async (target) => ({
      purpose: target.purpose,
      portfolio: await fetchAgentWalletPortfolio(target.address),
    })),
  );

  const fulfilled: Array<{ purpose: AgentWalletPurpose; portfolio: AgentWalletPortfolio }> = [];
  const errors: string[] = [];

  for (let i = 0; i < results.length; i += 1) {
    const result = results[i];
    const label = targets[i]?.purpose ?? "wallet";
    if (result.status === "fulfilled") {
      fulfilled.push(result.value);
      continue;
    }
    const message =
      result.reason instanceof Error ? result.reason.message : `Failed to load ${label} portfolio`;
    errors.push(message);
  }

  if (fulfilled.length === 0 && errors.length > 0) {
    throw new Error(errors.join(" · "));
  }

  return fulfilled;
}

export function useAgentWalletPortfolio({
  chatAddress,
  lpAddress,
  enabled = true,
  walletFilter = "all",
}: UseAgentWalletPortfolioArgs) {
  const targets = useMemo((): WalletTarget[] => {
    const out: WalletTarget[] = [];
    if (chatAddress) out.push({ purpose: "spend", address: chatAddress });
    if (lpAddress) out.push({ purpose: "lp", address: lpAddress });
    return out;
  }, [chatAddress, lpAddress]);

  const filteredTargets = useMemo(() => {
    if (walletFilter === "all") return targets;
    return targets.filter((t) => t.purpose === walletFilter);
  }, [targets, walletFilter]);

  const queryKey = useMemo(
    () => [
      "agent-wallet-portfolio",
      filteredTargets.map((t) => `${t.purpose}:${t.address}`).join("|") || "none",
    ] as const,
    [filteredTargets],
  );

  const query = useQuery({
    queryKey,
    queryFn: () => fetchPortfoliosForTargets(filteredTargets),
    enabled: enabled && filteredTargets.length > 0,
    staleTime: STALE_MS,
    retry: 1,
  });

  const primaryDefi = useMemo((): WalletDefiPositions | undefined => {
    const entries = query.data ?? [];
    const spend = entries.find((e) => e.purpose === "spend")?.portfolio.defi;
    if (spend) return spend;
    return entries[0]?.portfolio.defi;
  }, [query.data]);

  const merged = useMemo((): MergedAgentPortfolio | null => {
    if (!query.data?.length) return null;
    return mergeAgentPortfolios(query.data);
  }, [query.data]);

  const perWallet = useMemo(() => {
    const map = new Map<AgentWalletPurpose, AgentWalletPortfolio>();
    for (const row of query.data ?? []) {
      map.set(row.purpose, row.portfolio);
    }
    return map;
  }, [query.data]);

  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["agent-wallet-portfolio"] });
    return query.refetch();
  }, [query, queryClient]);

  return {
    allTargets: targets,
    targets: filteredTargets,
    merged,
    perWallet,
    primaryDefi,
    loading: query.isLoading || query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refresh,
    hasWallets: targets.length > 0,
  };
}
