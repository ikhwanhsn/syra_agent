import { Link } from "@/lib/navigation";
import { Wallet } from "lucide-react";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { TreasuryPanel } from "@/components/treasury/TreasuryPanel";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useUserDashboardOverview } from "@/hooks/useUserDashboardOverview";
import { useTreasuryBalanceChange } from "@/hooks/useTreasuryBalanceChange";
import { cn } from "@/lib/utils";

/** Treasury pillar — balance, allocation, and wallets. */
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
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/wallet">
            <Wallet className="mr-1.5 h-4 w-4" aria-hidden />
            Manage
          </Link>
        </Button>
      }
    >
      {!overview.connected ? (
        <div
          className={cn(
            overviewCardShell,
            "relative overflow-hidden rounded-2xl px-5 py-12 text-center sm:rounded-3xl sm:px-8 sm:py-16",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(420px 180px at 50% 0%, hsl(var(--primary) / 0.1), transparent 60%)",
            }}
            aria-hidden
          />
          <div className="relative">
            <p className="mb-5 text-sm text-muted-foreground">Connect your wallet to view balances.</p>
            <Button onClick={() => openConnectModal()}>Connect wallet</Button>
          </div>
        </div>
      ) : (
        <TreasuryPanel
          loading={overview.balancesLoading}
          totalUsd={overview.treasury.totalUsd}
          totalChange={balanceChanges.total}
          connectedWallet={{
            usdc: overview.treasury.userUsdc,
            sol: overview.treasury.userSol,
          }}
          pillars={overview.treasury.pillarBalances}
          solPriceUsd={overview.treasury.solPriceUsd}
        />
      )}
    </PillarLayout>
  );
}
