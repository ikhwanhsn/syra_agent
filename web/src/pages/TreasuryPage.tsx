import { Link } from "@/lib/navigation";
import { Landmark, Wallet } from "lucide-react";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { OverviewGroupLabel } from "@/components/dashboard/overview/OverviewGroupLabel";
import { OverviewTreasuryAllocationChart } from "@/components/dashboard/overview/OverviewTreasuryAllocationChart";
import { TreasurySplitCardGrid } from "@/components/dashboard/overview/TreasurySplitCard";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { AgentBillingDashboard } from "@/components/wallet/AgentBillingDashboard";
import { Button } from "@/components/ui/button";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useUserDashboardOverview } from "@/hooks/useUserDashboardOverview";
import { useTreasuryBalanceChange } from "@/hooks/useTreasuryBalanceChange";
import { cn } from "@/lib/utils";

/** Treasury pillar — allocation, billing, and wallet management. */
export default function TreasuryPage() {
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
    <PillarLayout
      embedded
      title="Treasury"
      tagline="Allocate and manage capital"
      description="Five pillar agent wallets — earn, treasury, invest, spend, and grow — plus billing caps and allocation."
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/wallet">
            <Wallet className="mr-1.5 h-4 w-4" aria-hidden />
            Agent wallets
          </Link>
        </Button>
      }
    >
      {!overview.connected ? (
        <div className={cn(overviewCardShell, "p-8 text-center")}>
          <p className="mb-4 text-sm text-muted-foreground">Connect wallet to view treasury allocation.</p>
          <Button onClick={() => openConnectModal()}>Connect wallet</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <AgentBillingDashboard />
          <OverviewTreasuryAllocationChart
            loading={overview.balancesLoading}
            totalChange={balanceChanges.total}
            historyPoints={balanceChanges.chartPoints}
            treasury={{
              userUsdc: overview.treasury.userUsdc,
              userSol: overview.treasury.userSol,
              chatUsdc: overview.treasury.spendUsdc,
              chatSol: overview.treasury.spendSol,
              lpUsdc: overview.treasury.lpUsdc,
              lpSol: overview.treasury.lpSol,
              totalUsd: overview.treasury.totalUsd,
              totalUsdc: overview.treasury.totalUsdc,
              totalSol: overview.treasury.totalSol,
              solPriceUsd: overview.treasury.solPriceUsd,
            }}
          />
          <OverviewGroupLabel icon={Landmark}>Pillar wallet split</OverviewGroupLabel>
          <TreasurySplitCardGrid
            loading={overview.balancesLoading}
            connectedWallet={{
              usdc: overview.treasury.userUsdc,
              sol: overview.treasury.userSol,
            }}
            pillars={overview.treasury.pillarBalances}
          />
        </div>
      )}
    </PillarLayout>
  );
}
