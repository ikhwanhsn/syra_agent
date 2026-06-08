import { Link } from "@/lib/navigation";
import { ArrowUpRight, Bot, Droplets, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { cn } from "@/lib/utils";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { BalanceChangeIndicator } from "@/components/dashboard/overview/BalanceChangeIndicator";
import type { BalanceChangeResult } from "@/lib/treasuryBalanceHistory";

export interface TreasurySplitCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  usdc: number | null;
  sol: number | null;
  href: string;
  isLoading?: boolean;
  accentClass?: string;
  change?: BalanceChangeResult | null;
}

function formatUsdc(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TreasurySplitCard({
  title,
  subtitle,
  icon: Icon,
  usdc,
  sol,
  href,
  isLoading,
  accentClass,
  change,
}: TreasurySplitCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        overviewCardShell,
        "group block p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-border/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl opacity-40 transition-opacity group-hover:opacity-55",
          accentClass,
        )}
        aria-hidden
      />
      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className={overviewKickerClass}>{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/40 text-muted-foreground transition-colors group-hover:text-foreground">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-28 animate-pulse rounded-md bg-muted/50" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted/30" />
          </div>
        ) : (
          <>
            <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {usdc != null ? (
                <AnimatedMetric value={usdc} format={(n) => `$${formatUsdc(n)}`} />
              ) : (
                "—"
              )}
            </p>
            <p className="mt-1 text-sm tabular-nums text-muted-foreground">
              {sol != null ? <AnimatedMetric value={sol} format={formatSol} /> : "—"} SOL
            </p>
            <BalanceChangeIndicator change={change} className="mt-2" />
          </>
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          Manage
          <ArrowUpRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function TreasurySplitCardGrid({
  connectedWallet,
  trading,
  lp,
  loading,
  changes,
}: {
  connectedWallet: { usdc: number | null; sol: number | null };
  trading: { usdc: number | null; sol: number | null };
  lp: { usdc: number | null; sol: number | null };
  loading?: boolean;
  changes?: {
    user?: BalanceChangeResult | null;
    trading?: BalanceChangeResult | null;
    lp?: BalanceChangeResult | null;
  };
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <TreasurySplitCard
        title="Connected wallet"
        subtitle="Your signer wallet on Solana"
        icon={Wallet}
        usdc={connectedWallet.usdc}
        sol={connectedWallet.sol}
        href="/wallet"
        isLoading={loading}
        accentClass="bg-gradient-to-br from-[#9945FF]/10 to-transparent"
        change={changes?.user}
      />
      <TreasurySplitCard
        title="Trading agent"
        subtitle="Chat treasury · spot strategies"
        icon={Bot}
        usdc={trading.usdc}
        sol={trading.sol}
        href="/wallet?wallet=chat"
        isLoading={loading}
        accentClass="bg-gradient-to-br from-primary/10 to-transparent"
        change={changes?.trading}
      />
      <TreasurySplitCard
        title="LP agent"
        subtitle="Meteora DLMM treasury"
        icon={Droplets}
        usdc={lp.usdc}
        sol={lp.sol}
        href="/wallet?wallet=lp"
        isLoading={loading}
        accentClass="bg-gradient-to-br from-cyan-500/8 to-transparent"
        change={changes?.lp}
      />
    </div>
  );
}
