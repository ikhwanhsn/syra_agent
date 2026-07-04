import { Link } from "@/lib/navigation";
import { ArrowUpRight, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { BalanceChangeIndicator } from "@/components/dashboard/overview/BalanceChangeIndicator";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { TreasuryPanelSkeleton } from "@/components/treasury/TreasurySkeleton";
import { AgentBillingDashboard } from "@/components/wallet/AgentBillingDashboard";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import type { BalanceChangeResult } from "@/lib/treasuryBalanceHistory";
import {
  AGENT_WALLET_ACCENT,
  PILLAR_WALLET_PURPOSES,
  type PillarWalletPurpose,
  getAgentWalletSlot,
} from "@/lib/agentWalletCatalog";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import { cn } from "@/lib/utils";

type WalletRow = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  usd: number;
  bar: string;
  iconClass: string;
  iconWrapClass: string;
};

const PILLAR_HREF: Record<PillarWalletPurpose, string> = {
  earn: "/earn",
  treasury: "/treasury",
  invest: "/invest",
  spend: "/spend",
  grow: "/grow",
};

/** Soft bar colors that read well in light and dark. */
const BAR_COLORS: Record<string, string> = {
  wallet: "hsl(220 10% 58%)",
  spend: "hsl(var(--primary))",
  earn: "hsl(160 55% 42%)",
  treasury: "hsl(38 80% 50%)",
  invest: "hsl(199 70% 48%)",
  grow: "hsl(270 50% 58%)",
};

function segmentUsd(
  usdc: number | null | undefined,
  sol: number | null | undefined,
  solPriceUsd: number | null | undefined,
): number {
  const u = usdc != null && Number.isFinite(usdc) ? usdc : 0;
  const s = sol != null && Number.isFinite(sol) ? sol : 0;
  const px = solPriceUsd != null && solPriceUsd > 0 ? solPriceUsd : 0;
  return u + s * px;
}

export type TreasuryPanelProps = {
  loading?: boolean;
  totalUsd: number | null;
  totalChange?: BalanceChangeResult | null;
  connectedWallet: { usdc: number | null; sol: number | null };
  pillars: Partial<Record<PillarWalletPurpose, { usdc: number | null; sol: number | null }>>;
  solPriceUsd?: number | null;
};

export function TreasuryPanel({
  loading,
  totalUsd,
  totalChange,
  connectedWallet,
  pillars,
  solPriceUsd,
}: TreasuryPanelProps) {
  const showSkeleton = useMinimumSkeleton(Boolean(loading));

  const rows: WalletRow[] = [
    {
      key: "wallet",
      label: "Connected",
      href: "/wallet",
      icon: Wallet,
      usd: segmentUsd(connectedWallet.usdc, connectedWallet.sol, solPriceUsd),
      bar: BAR_COLORS.wallet,
      iconClass: "text-muted-foreground",
      iconWrapClass: "border-border/50 bg-muted/30",
    },
    ...PILLAR_WALLET_PURPOSES.map((purpose) => {
      const slot = getAgentWalletSlot(purpose);
      const bal = pillars[purpose];
      const accent = AGENT_WALLET_ACCENT[purpose];
      return {
        key: purpose,
        label: slot.shortLabel,
        href: PILLAR_HREF[purpose],
        icon: slot.icon,
        usd: segmentUsd(bal?.usdc, bal?.sol, solPriceUsd),
        bar: BAR_COLORS[purpose] ?? BAR_COLORS.spend,
        iconClass: accent.icon,
        iconWrapClass: cn(accent.border, accent.bg),
      };
    }),
  ];

  if (showSkeleton) {
    return <TreasuryPanelSkeleton />;
  }

  const allocated = rows.reduce((sum, row) => sum + row.usd, 0);
  const displayTotal =
    totalUsd != null && Number.isFinite(totalUsd) && totalUsd > 0 ? totalUsd : allocated;
  const showAllocation = displayTotal > 0;
  const fundedRows = rows.filter((row) => row.usd > 0);

  return (
    <div className="w-full space-y-5 sm:space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-stretch">
        <section
          className={cn(
            overviewCardShell,
            "relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl sm:rounded-3xl",
          )}
          aria-label="Total balance"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(520px 220px at 8% -10%, hsl(var(--primary) / 0.1), transparent 55%), radial-gradient(420px 180px at 100% 110%, hsl(var(--muted-foreground) / 0.06), transparent 50%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-20 -top-16 h-56 w-56 rounded-full blur-3xl sm:h-72 sm:w-72"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.12), transparent 70%)" }}
            aria-hidden
          />

          <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-6 p-5 sm:gap-8 sm:p-7 lg:p-8">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/80 sm:text-[13px] sm:normal-case sm:tracking-normal">
                Total balance
              </p>
              <p className="mt-2 font-mono text-[2rem] font-semibold leading-none tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
                <AnimatedMetric
                  value={displayTotal > 0 ? displayTotal : null}
                  format={formatTreasuryUsd}
                  deltaMode
                />
              </p>
              <BalanceChangeIndicator
                change={totalChange}
                size="md"
                variant="pill"
                className="mt-3 sm:mt-4"
              />
            </div>

            {showAllocation ? (
              <div className="space-y-3 sm:space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground">Allocation</p>
                  <p className="hidden font-mono text-xs tabular-nums text-muted-foreground/80 sm:block">
                    {fundedRows.length} active
                  </p>
                </div>

                <div
                  className="flex h-2.5 overflow-hidden rounded-full bg-muted/35 ring-1 ring-border/30 sm:h-3"
                  role="img"
                  aria-label="Portfolio allocation"
                >
                  {rows.map((row, index) => {
                    const pct = allocated > 0 ? (row.usd / allocated) * 100 : 0;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={row.key}
                        className={cn(
                          "min-w-[3px] transition-all duration-500",
                          index > 0 && "border-l border-background/40",
                        )}
                        style={{ width: `${pct}%`, background: row.bar }}
                        title={`${row.label}: ${formatTreasuryUsd(row.usd)}`}
                      />
                    );
                  })}
                </div>

                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
                  {fundedRows.map((row) => {
                    const pct = allocated > 0 ? (row.usd / allocated) * 100 : 0;
                    return (
                      <span
                        key={row.key}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/40 bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur-sm"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: row.bar }}
                          aria-hidden
                        />
                        <span className="font-medium text-foreground/90">{row.label}</span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {pct.toFixed(0)}%
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Fund a wallet to start tracking allocation.</p>
            )}
          </div>
        </section>

        <AgentBillingDashboard compact className="h-full min-h-0 w-full" />
      </div>

      <section aria-label="Wallets" className="space-y-3 sm:space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/80 sm:text-sm sm:normal-case sm:tracking-normal sm:text-muted-foreground">
          Wallets
        </h2>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-6">
          {rows.map((row) => {
            const Icon = row.icon;
            const pct = allocated > 0 ? (row.usd / allocated) * 100 : 0;
            return (
              <Link
                key={row.key}
                to={row.href}
                className={cn(
                  overviewCardShell,
                  "group relative flex min-h-[3.25rem] flex-row items-center gap-3.5 rounded-2xl p-3.5 transition-all duration-300",
                  "sm:min-h-0 sm:flex-col sm:items-stretch sm:gap-0 sm:p-5",
                  "hover:border-border/70 hover:bg-card/90",
                  "sm:hover:-translate-y-0.5",
                  "active:scale-[0.99] sm:active:scale-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors sm:mb-5 sm:h-9 sm:w-9",
                    row.iconWrapClass,
                    row.iconClass,
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>

                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 sm:block sm:flex-none">
                  <div className="min-w-0 sm:mb-0">
                    <div className="flex items-center justify-between gap-2 sm:mb-0">
                      <p className="truncate text-sm font-medium text-muted-foreground">
                        {row.label}
                      </p>
                      <ArrowUpRight
                        className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/35 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-muted-foreground sm:absolute sm:right-4 sm:top-4 sm:block"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-0.5 font-mono text-base font-semibold tabular-nums tracking-tight text-foreground sm:mt-1.5 sm:text-xl">
                      {formatTreasuryUsd(row.usd)}
                    </p>
                  </div>

                  <div className="hidden w-full sm:mt-auto sm:block sm:pt-5">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {pct > 0 ? `${pct.toFixed(0)}% of total` : "No balance"}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted/35">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 0)}%`,
                          background: row.bar,
                          opacity: pct > 0 ? 0.9 : 0,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:hidden">
                    {pct > 0 ? (
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {pct.toFixed(0)}%
                      </span>
                    ) : null}
                    <ArrowUpRight
                      className="h-4 w-4 text-muted-foreground/40"
                      aria-hidden
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
