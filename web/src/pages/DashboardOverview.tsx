import { cn } from "@/lib/utils";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { useWalletContext } from "@/contexts/WalletContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useUserDashboardOverview } from "@/hooks/useUserDashboardOverview";
import { useTreasuryBalanceChange } from "@/hooks/useTreasuryBalanceChange";
import { DashboardPillarsHub } from "@/components/dashboard/DashboardPillarsHub";

export interface DashboardOverviewProps {
  embedded?: boolean;
}

export default function DashboardOverview({ embedded = false }: DashboardOverviewProps) {
  const { connected } = useWalletContext();
  const { openConnectModal } = useConnectModal();
  const overview = useUserDashboardOverview();

  const balanceChanges = useTreasuryBalanceChange(
    overview.address,
    {
      userUsdc: overview.treasury.userUsdc,
      userSol: overview.treasury.userSol,
      chatUsdc: overview.treasury.spendUsdc,
      chatSol: overview.treasury.spendSol,
      lpUsdc: overview.treasury.lpUsdc,
      lpSol: overview.treasury.lpSol,
      totalUsd: overview.treasury.totalUsd,
      totalUsdc: overview.treasury.totalUsdc,
      agentUsdc: overview.treasury.agentUsdc,
      solPriceUsd: overview.treasury.solPriceUsd,
    },
    overview.balancesLoading,
  );

  return (
    <div className={cn("relative flex flex-col min-h-0", embedded ? "flex-1 min-h-0" : "min-h-screen")}>
      <OverviewPageBackdrop />
      <div
        className={cn(DASHBOARD_CONTENT_SHELL, "relative flex-1 space-y-8", PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM)}
      >
        <DashboardPillarsHub
          connected={connected}
          walletLabel={overview.shortAddress ?? undefined}
          onConnect={() => openConnectModal()}
          treasury={
            connected
              ? {
                  totalUsd: overview.treasury.totalUsd,
                  totalUsdc: overview.treasury.totalUsdc,
                  isLoading: overview.balancesLoading,
                  refreshing: overview.refreshing,
                  onRefresh: () => void overview.refreshAll(),
                }
              : undefined
          }
          pillarBalances={connected ? overview.treasury.pillarBalances : undefined}
          balancesLoading={overview.balancesLoading}
          balanceChart={
            connected
              ? {
                  totalUsd: overview.treasury.totalUsd,
                  totalUsdc: overview.treasury.totalUsdc,
                  totalSol: overview.treasury.totalSol,
                  solPriceUsd: overview.treasury.solPriceUsd,
                  pillarBalances: overview.treasury.pillarBalances,
                  historyPoints: balanceChanges.chartPoints,
                  totalChange: balanceChanges.total,
                  loading: overview.balancesLoading,
                  walletLabel: overview.shortAddress ?? undefined,
                  refreshing: overview.refreshing,
                  onRefresh: () => void overview.refreshAll(),
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
