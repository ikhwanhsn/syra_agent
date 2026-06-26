import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useManagedAgentWallets } from "@/hooks/useManagedAgentWallets";
import { useUserWalletBalance } from "@/hooks/useUserWalletBalance";
import { fetchLpRealState, fetchLpRealSummary } from "@/lib/lpAgentRealApi";
import { PILLAR_WALLET_PURPOSES, type PillarWalletPurpose } from "@/lib/agentWalletCatalog";

const STALE_MS = 60_000;

export function useUserDashboardOverview() {
  const { address, connected, shortAddress } = useWalletContext();
  const { syraAuthReady, syraAuthenticated } = useSyraAuth();
  const { lpAnonymousId } = useAgentWallet();
  const wallets = useManagedAgentWallets();
  const userWallet = useUserWalletBalance();

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

  const pillarBalances = useMemo(() => {
    const out: Partial<Record<PillarWalletPurpose, { usdc: number | null; sol: number | null }>> = {};
    for (const purpose of PILLAR_WALLET_PURPOSES) {
      const entry = wallets.pillarEntries.find((e) => e.purpose === purpose);
      out[purpose] = {
        usdc: entry?.balances.usdcBalance ?? null,
        sol: entry?.balances.solBalance ?? null,
      };
    }
    return out;
  }, [wallets.pillarEntries]);

  const treasury = useMemo(() => {
    const userUsdc = userWallet.userUsdcBalance ?? 0;
    const userSol = userWallet.userSolBalance ?? 0;

    let agentUsdc = 0;
    let agentSol = 0;
    let hasAgentUsdc = false;
    let hasAgentSol = false;

    for (const purpose of PILLAR_WALLET_PURPOSES) {
      const bal = pillarBalances[purpose];
      if (bal?.usdc != null) {
        agentUsdc += bal.usdc;
        hasAgentUsdc = true;
      }
      if (bal?.sol != null) {
        agentSol += bal.sol;
        hasAgentSol = true;
      }
    }

    const lpUsdc = wallets.lpAgentUsdcBalance;
    const lpSol = wallets.lpAgentSolBalance;
    if (lpUsdc != null) {
      agentUsdc += lpUsdc;
      hasAgentUsdc = true;
    }
    if (lpSol != null) {
      agentSol += lpSol;
      hasAgentSol = true;
    }

    const spendUsdc = pillarBalances.spend?.usdc ?? wallets.spendUsdcBalance;
    const spendSol = pillarBalances.spend?.sol ?? wallets.spendSolBalance;

    const totalUsdc =
      userWallet.userUsdcBalance != null || hasAgentUsdc
        ? userUsdc + agentUsdc
        : null;
    const totalSol =
      userWallet.userSolBalance != null || hasAgentSol ? userSol + agentSol : null;

    const solPriceUsd = lpSummaryQ.data?.solPriceUsd;
    const totalUsd =
      totalUsdc != null && totalSol != null && solPriceUsd != null && solPriceUsd > 0
        ? totalUsdc + totalSol * solPriceUsd
        : totalUsdc;

    return {
      userUsdc: userWallet.userUsdcBalance,
      userSol: userWallet.userSolBalance,
      pillarBalances,
      spendUsdc,
      spendSol,
      chatUsdc: spendUsdc,
      chatSol: spendSol,
      lpUsdc: wallets.lpAgentUsdcBalance,
      lpSol: wallets.lpAgentSolBalance,
      totalUsdc,
      totalSol,
      totalUsd,
      agentUsdc: hasAgentUsdc ? agentUsdc : wallets.totalUsdc,
      agentSol: hasAgentSol ? agentSol : wallets.totalSol,
      solPriceUsd,
    };
  }, [
    userWallet.userUsdcBalance,
    userWallet.userSolBalance,
    pillarBalances,
    wallets.lpAgentUsdcBalance,
    wallets.lpAgentSolBalance,
    wallets.spendUsdcBalance,
    wallets.spendSolBalance,
    wallets.totalUsdc,
    wallets.totalSol,
    lpSummaryQ.data?.solPriceUsd,
  ]);

  const balancesLoading =
    userWallet.isLoading ||
    wallets.setupLoading ||
    wallets.loading ||
    (connected && wallets.syraAuthReady && wallets.syraAuthenticated && !wallets.activeAgent);

  const refreshAll = async () => {
    await Promise.all([
      userWallet.refetch(),
      wallets.handleRefreshAll(),
      lpSummaryQ.refetch(),
      lpStateQ.refetch(),
    ]);
  };

  const refreshing =
    userWallet.isFetching ||
    wallets.refreshingBalances ||
    lpSummaryQ.isFetching ||
    lpStateQ.isFetching;

  return {
    connected,
    address,
    shortAddress,
    treasury,
    lpSummaryQ,
    lpStateQ,
    lpSummary: lpSummaryQ.data,
    lpState: lpStateQ.data,
    balancesLoading,
    refreshing,
    wallets,
    refreshAll,
  };
}
