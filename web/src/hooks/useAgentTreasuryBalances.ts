import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { agentWalletApi } from "@/lib/chatApi";
import {
  estimateTreasuryUsd,
  fetchSolUsdSpot,
  resolveAgentTreasuryBalance,
  sumAgentTreasuryTotals,
} from "@/lib/agentWalletBalanceDisplay";

const STALE_MS = 45_000;

export interface UseAgentTreasuryBalancesOptions {
  /** When set, chat balance resolution only prefers context if this matches the context anonymous id. */
  chatAnonymousId?: string | null;
}

/**
 * Shared agent treasury balances for wallet nav, wallet page, and related UIs.
 * Merges on-chain AgentWalletContext values with API balances (same rules everywhere).
 */
export function useAgentTreasuryBalances(options: UseAgentTreasuryBalancesOptions = {}) {
  const { chatAnonymousId: chatAnonymousIdOverride } = options;
  const queryClient = useQueryClient();
  const { address: solanaAddress, connected } = useWalletContext();
  const { syraAuthReady, syraAuthenticated } = useSyraAuth();
  const {
    ready: contextReady,
    anonymousId: contextAnonymousId,
    agentAddress,
    connectedChain,
    agentSolBalance,
    agentUsdcBalance,
    lpAnonymousId,
    lpAgentAddress,
    lpAgentSolBalance,
    lpAgentUsdcBalance,
    refetchBalance,
    refetchLpBalance,
  } = useAgentWallet();

  const chatAnonymousId = chatAnonymousIdOverride ?? contextAnonymousId;
  const walletQueriesEnabled = syraAuthReady && syraAuthenticated;
  const hasAgentTreasury = Boolean(agentAddress || lpAgentAddress);

  const isContextAgent =
    contextReady &&
    Boolean(contextAnonymousId) &&
    Boolean(agentAddress) &&
    connectedChain === "solana" &&
    Boolean(solanaAddress) &&
    (!chatAnonymousIdOverride || chatAnonymousIdOverride === contextAnonymousId);

  const chatBalanceQ = useQuery({
    queryKey: ["agent-wallet-balance", chatAnonymousId],
    queryFn: () => agentWalletApi.getBalance(chatAnonymousId!),
    enabled: Boolean(chatAnonymousId) && walletQueriesEnabled,
    staleTime: STALE_MS,
    retry: 1,
  });

  const lpBalanceQ = useQuery({
    queryKey: ["agent-wallet-balance", lpAnonymousId],
    queryFn: () => agentWalletApi.getBalance(lpAnonymousId!),
    enabled: Boolean(lpAnonymousId) && walletQueriesEnabled,
    staleTime: STALE_MS,
    retry: 1,
  });

  const { refetch: refetchChatApiBalance } = chatBalanceQ;
  const { refetch: refetchLpApiBalance } = lpBalanceQ;

  const chatUsdcBalance = resolveAgentTreasuryBalance(
    isContextAgent,
    agentUsdcBalance,
    chatBalanceQ.data?.usdcBalance,
  );
  const chatSolBalance = resolveAgentTreasuryBalance(
    isContextAgent,
    agentSolBalance,
    chatBalanceQ.data?.solBalance,
  );
  const lpUsdcBalance = resolveAgentTreasuryBalance(
    true,
    lpAgentUsdcBalance,
    lpBalanceQ.data?.usdcBalance,
  );
  const lpSolBalance = resolveAgentTreasuryBalance(
    true,
    lpAgentSolBalance,
    lpBalanceQ.data?.solBalance,
  );

  const totalUsdc = useMemo(
    () => sumAgentTreasuryTotals(chatUsdcBalance, lpUsdcBalance),
    [chatUsdcBalance, lpUsdcBalance],
  );

  const totalSol = useMemo(
    () => sumAgentTreasuryTotals(chatSolBalance, lpSolBalance),
    [chatSolBalance, lpSolBalance],
  );

  const solPriceQ = useQuery({
    queryKey: ["sol-usd-spot"],
    queryFn: fetchSolUsdSpot,
    enabled: connected && hasAgentTreasury,
    staleTime: STALE_MS,
    retry: 1,
  });

  const estimatedTreasuryUsd = useMemo(
    () => estimateTreasuryUsd(totalUsdc, totalSol, solPriceQ.data),
    [totalUsdc, totalSol, solPriceQ.data],
  );

  const totalsUnresolved = totalUsdc == null && totalSol == null;

  const apiBalancesPending =
    walletQueriesEnabled &&
    totalsUnresolved &&
    ((Boolean(chatAnonymousId) && chatBalanceQ.isFetching) ||
      (Boolean(lpAnonymousId) && lpBalanceQ.isFetching));

  const onChainBalancesPending =
    !walletQueriesEnabled &&
    totalsUnresolved &&
    agentUsdcBalance == null &&
    agentSolBalance == null &&
    (lpAgentAddress == null || (lpAgentUsdcBalance == null && lpAgentSolBalance == null));

  const balancesLoading =
    connected &&
    hasAgentTreasury &&
    (!contextReady || apiBalancesPending || onChainBalancesPending);

  useEffect(() => {
    if (!connected || !contextReady || !agentAddress) return;
    void refetchBalance();
  }, [connected, contextReady, agentAddress, refetchBalance]);

  useEffect(() => {
    if (!connected || !contextReady || !lpAgentAddress) return;
    void refetchLpBalance();
  }, [connected, contextReady, lpAgentAddress, refetchLpBalance]);

  const refreshChatBalances = useCallback(async () => {
    const tasks: Promise<unknown>[] = [refetchBalance()];
    if (chatAnonymousId && walletQueriesEnabled) {
      tasks.push(refetchChatApiBalance());
      tasks.push(
        queryClient.invalidateQueries({ queryKey: ["agent-wallet-balance", chatAnonymousId] }),
      );
    }
    await Promise.all(tasks);
  }, [refetchBalance, chatAnonymousId, walletQueriesEnabled, refetchChatApiBalance, queryClient]);

  const refreshLpBalances = useCallback(async () => {
    const tasks: Promise<unknown>[] = [refetchLpBalance()];
    if (lpAnonymousId && walletQueriesEnabled) {
      tasks.push(refetchLpApiBalance());
      tasks.push(
        queryClient.invalidateQueries({ queryKey: ["agent-wallet-balance", lpAnonymousId] }),
      );
    }
    await Promise.all(tasks);
  }, [refetchLpBalance, lpAnonymousId, walletQueriesEnabled, refetchLpApiBalance, queryClient]);

  const refreshTreasuryBalances = useCallback(async () => {
    await Promise.all([refreshChatBalances(), refreshLpBalances()]);
  }, [refreshChatBalances, refreshLpBalances]);

  return {
    contextReady,
    syraAuthReady,
    syraAuthenticated,
    hasAgentTreasury,
    chatUsdcBalance,
    chatSolBalance,
    lpUsdcBalance,
    lpSolBalance,
    totalUsdc,
    totalSol,
    solPriceUsd: solPriceQ.data ?? null,
    estimatedTreasuryUsd,
    balancesLoading,
    refreshChatBalances,
    refreshLpBalances,
    refreshTreasuryBalances,
    isContextAgent,
  };
}
