import { Link } from "@/lib/navigation";
import { ArrowRight, Wallet } from "lucide-react";
import { PillarCard } from "@/components/pillars/PillarCard";
import { OverviewBalanceChart } from "@/components/dashboard/overview/OverviewBalanceChart";
import { Button } from "@/components/ui/button";
import { PILLAR_COPY, type PillarId } from "@/lib/pillarsApi";
import { DASHBOARD_PILLAR_NAV } from "@/lib/dashboardPillarNav";
import {
  MACHINE_MONEY_STEPS,
  OVERVIEW_HERO_COPY,
  PILLAR_OVERVIEW_META,
} from "@/lib/machineMoneyOverview";
import { cn } from "@/lib/utils";
import type { PillarWalletPurpose } from "@/lib/agentWalletCatalog";
import type { BalanceChangeResult } from "@/lib/treasuryBalanceHistory";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";

const PILLAR_ORDER: PillarId[] = [
  "earn",
  "treasury",
  "invest",
  "spend",
  "grow",
];

const PILLAR_ICONS = Object.fromEntries(
  DASHBOARD_PILLAR_NAV.map((item) => [item.id, item.icon]),
) as Record<PillarId, (typeof DASHBOARD_PILLAR_NAV)[number]["icon"]>;

export interface DashboardPillarsHubTreasurySummary {
  totalUsd: number | null;
  totalUsdc: number | null;
  isLoading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export interface DashboardPillarsHubBalanceChart {
  totalUsd: number | null;
  totalUsdc: number | null;
  totalSol: number | null;
  solPriceUsd?: number | null;
  pillarBalances: Partial<
    Record<PillarWalletPurpose, { usdc: number | null; sol: number | null }>
  >;
  historyPoints?: Array<{ label: string; value: number; at: number }>;
  totalChange?: BalanceChangeResult | null;
  loading?: boolean;
  walletLabel?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export interface DashboardPillarsHubProps {
  connected?: boolean;
  walletLabel?: string;
  onConnect?: () => void;
  treasury?: DashboardPillarsHubTreasurySummary;
  pillarBalances?: Partial<
    Record<PillarWalletPurpose, { usdc: number | null; sol: number | null }>
  >;
  balancesLoading?: boolean;
  balanceChart?: DashboardPillarsHubBalanceChart;
}

export function DashboardPillarsHub({
  connected = false,
  onConnect,
  pillarBalances,
  balancesLoading = false,
  balanceChart,
}: DashboardPillarsHubProps) {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <header
        className={cn(
          overviewCardShell,
          "overflow-hidden rounded-3xl p-6 sm:p-8",
        )}
      >
        <div
          className={overviewCardGlow}
          style={{ background: overviewAccentBackground("marketplace") }}
          aria-hidden
        />

        <div
          className={cn(
            "relative grid gap-8",
            balanceChart &&
              "lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:gap-10",
          )}
        >
          <div className="flex min-h-0 flex-col justify-between gap-8 lg:min-h-[340px] lg:py-1">
            <div className="space-y-6">
              <p className={overviewKickerClass}>Machine Money</p>

              <div className="space-y-4">
                <h1 className="text-balance font-semibold tracking-tight">
                  <span className="block text-3xl text-foreground sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]">
                    {OVERVIEW_HERO_COPY.titleLine1}
                  </span>
                  <span className="mt-0.5 block bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-3xl text-transparent sm:text-4xl lg:text-[2.65rem] lg:leading-[1.05]">
                    {OVERVIEW_HERO_COPY.titleLine2}
                  </span>
                </h1>
                <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-[17px] sm:leading-relaxed">
                  {connected
                    ? OVERVIEW_HERO_COPY.connectedSubtitle
                    : OVERVIEW_HERO_COPY.subtitle}
                </p>
              </div>

              {!connected && onConnect ? (
                <div className="space-y-3">
                  <Button
                    type="button"
                    className="rounded-xl px-6"
                    onClick={onConnect}
                  >
                    <Wallet className="mr-2 h-4 w-4" aria-hidden />
                    Connect wallet
                  </Button>
                  <p className="text-sm text-muted-foreground/80">
                    {OVERVIEW_HERO_COPY.ctaHint}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className={overviewKickerClass}>
                {connected ? "Jump to a pillar" : "Five pillars"}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {PILLAR_ORDER.map((id) => {
                  const copy = PILLAR_COPY[id];
                  const meta = PILLAR_OVERVIEW_META[id];
                  const Icon = PILLAR_ICONS[id];
                  return (
                    <Link
                      key={id}
                      to={copy.href}
                      className={cn(
                        "group flex flex-col items-center gap-2 rounded-xl border border-border/45 bg-background/25 px-1.5 py-3 text-center transition-all",
                        "hover:border-border/70 hover:bg-background/45",
                        meta.borderHover,
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                          meta.iconRing,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", meta.accent)} aria-hidden />
                      </span>
                      <span className="text-[10px] font-medium leading-tight text-foreground sm:text-[11px]">
                        {copy.headline}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {balanceChart ? (
            <OverviewBalanceChart
              variant="compact"
              totalUsd={balanceChart.totalUsd}
              totalUsdc={balanceChart.totalUsdc}
              totalSol={balanceChart.totalSol}
              solPriceUsd={balanceChart.solPriceUsd}
              pillarBalances={balanceChart.pillarBalances}
              historyPoints={balanceChart.historyPoints}
              totalChange={balanceChart.totalChange}
              loading={balanceChart.loading}
              walletLabel={balanceChart.walletLabel}
              refreshing={balanceChart.refreshing}
              onRefresh={balanceChart.onRefresh}
            />
          ) : null}
        </div>
      </header>

      {/* Pillars */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Explore pillars
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each pillar is a dedicated wallet and workspace for your agent.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {PILLAR_ORDER.map((id) => {
            const copy = PILLAR_COPY[id];
            const pillarMeta = PILLAR_OVERVIEW_META[id];
            const navItem = DASHBOARD_PILLAR_NAV.find((p) => p.id === id);
            return (
              <PillarCard
                key={id}
                id={id}
                label={copy.headline}
                description={navItem?.description ?? copy.description}
                href={copy.href}
                icon={PILLAR_ICONS[id]}
                step={pillarMeta.step}
                accent={pillarMeta}
                balance={pillarBalances?.[id]}
                balanceLoading={balancesLoading && connected}
              />
            );
          })}
        </div>
      </section>

      {/* How it works — single lightweight strip */}
      <section
        className={cn(
          overviewCardShell,
          "overflow-hidden rounded-2xl p-5 sm:p-6",
        )}
      >
        <div
          className={overviewCardGlow}
          style={{ background: overviewAccentBackground("neutral") }}
          aria-hidden
        />
        <div className="relative space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              How it flows
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Revenue moves through five steps — from earning to compounding.
            </p>
          </div>

          <ol className="grid gap-2 sm:grid-cols-5">
            {MACHINE_MONEY_STEPS.map((step) => {
              const meta = PILLAR_OVERVIEW_META[step.pillar];
              const copy = PILLAR_COPY[step.pillar];
              const Icon = PILLAR_ICONS[step.pillar];
              return (
                <li key={step.pillar}>
                  <Link
                    to={copy.href}
                    className={cn(
                      "group flex h-full flex-col rounded-xl border border-border/40 bg-background/30 p-3 transition-colors",
                      "hover:border-border/70 hover:bg-background/50",
                      meta.borderHover,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                          meta.iconRing,
                        )}
                      >
                        <Icon
                          className={cn("h-3.5 w-3.5", meta.accent)}
                          aria-hidden
                        />
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold tabular-nums",
                          meta.accent,
                        )}
                      >
                        {meta.step}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-foreground">
                      {copy.headline}
                    </p>
                    <p className="mt-0.5 flex-1 text-[11px] leading-relaxed text-muted-foreground">
                      {step.action}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-flex items-center gap-0.5 text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100",
                        meta.accent,
                      )}
                    >
                      Open
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}
