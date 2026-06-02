import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useManagedAgentWallets } from "@/hooks/useManagedAgentWallets";
import { useUserWalletBalance } from "@/hooks/useUserWalletBalance";
import { fetchUserCustomStats } from "@/lib/tradingExperimentApi";
import { fetchLpRealState, fetchLpRealSummary } from "@/lib/lpAgentRealApi";
import { aggregateUserCustomTrading } from "@/lib/dashboardOverviewAggregates";

const STALE_MS = 60_000;

export function useUserDashboardOverview() {
  const { address, connected, shortAddress } = useWalletContext();
  const { syraAuthReady, syraAuthenticated } = useSyraAuth();
  const { lpAnonymousId } = useAgentWallet();
  const wallets = useManagedAgentWallets();
  const userWallet = useUserWalletBalance();

  const tradingStatsQ = useQuery({
    queryKey: ["dashboard-user", "trading-stats", address],
    queryFn: () => fetchUserCustomStats(address!),
    enabled: Boolean(address) && syraAuthReady && syraAuthenticated,
    staleTime: STALE_MS,
    retry: 1,
  });

  const lpSummaryQ = useQuery({
    queryKey: ["dashboard-user", "lp-summary", lpAnonymousId],
    queryFn: () => fetchLpRealSummary(lpAnonymousId),
    enabled: Boolean(lpAnonymousId),
    staleTime: STALE_MS,
    retry: 1,
  });

  const lpStateQ = useQuery({
    queryKey: ["dashboard-user", "lp-state", lpAnonymousId],
    queryFn: () => fetchLpRealState(lpAnonymousId),
    enabled: Boolean(lpAnonymousId),
    staleTime: STALE_MS,
    retry: 1,
  });

  const tradingTotals = useMemo(
    () => aggregateUserCustomTrading(tradingStatsQ.data?.agents ?? []),
    [tradingStatsQ.data?.agents],
  );

  const treasury = useMemo(() => {
    const userUsdc = userWallet.userUsdcBalance ?? 0;
    const userSol = userWallet.userSolBalance ?? 0;
    const chatUsdc = wallets.chatUsdcBalance ?? 0;
    const chatSol = wallets.chatSolBalance ?? 0;
    const lpUsdc = wallets.lpAgentUsdcBalance ?? 0;
    const lpSol = wallets.lpAgentSolBalance ?? 0;

    const hasUserUsdc = userWallet.userUsdcBalance != null;
    const hasUserSol = userWallet.userSolBalance != null;
    const hasChatUsdc = wallets.chatUsdcBalance != null;
    const hasChatSol = wallets.chatSolBalance != null;
    const hasLpUsdc = wallets.lpAgentUsdcBalance != null;
    const hasLpSol = wallets.lpAgentSolBalance != null;

    const totalUsdc =
      hasUserUsdc || hasChatUsdc || hasLpUsdc
        ? userUsdc + chatUsdc + lpUsdc
        : null;
    const totalSol =
      hasUserSol || hasChatSol || hasLpSol ? userSol + chatSol + lpSol : null;

    const solPriceUsd = lpSummaryQ.data?.solPriceUsd;
    const totalUsd =
      totalUsdc != null && totalSol != null && solPriceUsd != null && solPriceUsd > 0
        ? totalUsdc + totalSol * solPriceUsd
        : totalUsdc;

    const agentUsdc =
      hasChatUsdc || hasLpUsdc ? chatUsdc + lpUsdc : wallets.totalUsdc;
    const agentSol = hasChatSol || hasLpSol ? chatSol + lpSol : wallets.totalSol;

    return {
      userUsdc: userWallet.userUsdcBalance,
      userSol: userWallet.userSolBalance,
      chatUsdc: wallets.chatUsdcBalance,
      chatSol: wallets.chatSolBalance,
      lpUsdc: wallets.lpAgentUsdcBalance,
      lpSol: wallets.lpAgentSolBalance,
      totalUsdc,
      totalSol,
      totalUsd,
      agentUsdc,
      agentSol,
      solPriceUsd,
    };
  }, [
    userWallet.userUsdcBalance,
    userWallet.userSolBalance,
    wallets.chatUsdcBalance,
    wallets.chatSolBalance,
    wallets.lpAgentUsdcBalance,
    wallets.lpAgentSolBalance,
    wallets.totalUsdc,
    wallets.totalSol,
    lpSummaryQ.data?.solPriceUsd,
  ]);

  const balancesLoading =
    userWallet.isLoading ||
    wallets.setupLoading ||
    (connected && wallets.syraAuthReady && wallets.syraAuthenticated && !wallets.activeAgent);

  const refreshAll = async () => {
    await Promise.all([
      userWallet.refetch(),
      wallets.handleRefreshAll(),
      tradingStatsQ.refetch(),
      lpSummaryQ.refetch(),
      lpStateQ.refetch(),
    ]);
  };

  const refreshing =
    userWallet.isFetching ||
    wallets.refreshingBalances ||
    wallets.refreshingLpBalances ||
    tradingStatsQ.isFetching ||
    lpSummaryQ.isFetching;

  return {
    connected,
    address,
    shortAddress,
    wallets,
    userWallet,
    treasury,
    tradingStatsQ,
    tradingTotals,
    maxTradingAgents: tradingStatsQ.data?.maxAgents ?? 0,
    lpSummaryQ,
    lpStateQ,
    balancesLoading,
    refreshing,
    refreshAll,
  };
}
