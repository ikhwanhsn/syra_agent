import { cn } from "@/lib/utils";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { OverviewGroupLabel } from "@/components/dashboard/overview/OverviewGroupLabel";
import { OverviewMachineMoneySections } from "@/components/dashboard/overview/OverviewMachineMoneySections";
import { TreasurySplitCardGrid } from "@/components/dashboard/overview/TreasurySplitCard";
import { useWalletContext } from "@/contexts/WalletContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useUserDashboardOverview } from "@/hooks/useUserDashboardOverview";
import { DashboardPillarsHub } from "@/components/dashboard/DashboardPillarsHub";
import { fetchPillarsDiscovery } from "@/lib/pillarsApi";
import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";

export interface DashboardOverviewProps {
  embedded?: boolean;
}

export default function DashboardOverview({ embedded = false }: DashboardOverviewProps) {
  const { connected } = useWalletContext();
  const { openConnectModal } = useConnectModal();
  const overview = useUserDashboardOverview();

  const discoveryQ = useQuery({
    queryKey: ["pillars", "discovery"],
    queryFn: fetchPillarsDiscovery,
    staleTime: 300_000,
  });

  return (
    <div className={cn("relative flex flex-col min-h-0", embedded ? "flex-1 min-h-0" : "min-h-screen")}>
      <OverviewPageBackdrop />
      <div
        className={cn(DASHBOARD_CONTENT_SHELL, "relative flex-1 space-y-10", PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM)}
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
        />

        {connected ? (
          <>
            <OverviewGroupLabel icon={Coins}>Pillar wallets</OverviewGroupLabel>
            <TreasurySplitCardGrid
              loading={overview.balancesLoading}
              pillars={overview.treasury.pillarBalances}
              machineMoneyOnly
            />
          </>
        ) : null}

        <OverviewMachineMoneySections
          discovery={discoveryQ.data}
          discoveryLoading={discoveryQ.isLoading}
        />
      </div>
    </div>
  );
}
