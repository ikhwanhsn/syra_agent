import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import {
  fetchAgentWalletPortfolio,
  mergeAgentPortfolios,
  type AgentWalletPortfolio,
  type MergedAgentPortfolio,
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
  const results = await Promise.all(
    targets.map(async (target) => ({
      purpose: target.purpose,
      portfolio: await fetchAgentWalletPortfolio(target.address),
    })),
  );
  return results;
}

export function useAgentWalletPortfolio({
  chatAddress,
  lpAddress,
  enabled = true,
  walletFilter = "all",
}: UseAgentWalletPortfolioArgs) {
  const targets = useMemo((): WalletTarget[] => {
    const out: WalletTarget[] = [];
    if (chatAddress) out.push({ purpose: "chat", address: chatAddress });
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
    targets: filteredTargets,
    merged,
    perWallet,
    loading: query.isLoading || query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refresh,
    hasWallets: targets.length > 0,
  };
}
