import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/navigation";
import { Activity, Loader2, RefreshCw, Sparkles, Wallet } from "lucide-react";
import { PillarCard } from "@/components/pillars/PillarCard";
import { MachineMoneyPreviewToggle } from "@/components/dashboard/MachineMoneyPreviewToggle";
import { MachineMoneyFlowDiagram } from "@/components/dashboard/overview/MachineMoneyFlowDiagram";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { fetchPillarsDiscovery, PILLAR_COPY, type PillarId } from "@/lib/pillarsApi";
import { useMachineMoneyPreview } from "@/contexts/MachineMoneyPreviewContext";
import { isAdminWallet } from "@/constants/adminWallet";
import { useWalletContext } from "@/contexts/WalletContext";
import { DASHBOARD_PILLAR_NAV } from "@/lib/dashboardPillarNav";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import { MACHINE_MONEY_FLOW_COPY, PILLAR_OVERVIEW_META } from "@/lib/machineMoneyOverview";
import { cn } from "@/lib/utils";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";

const PILLAR_ORDER: PillarId[] = ["earn", "treasury", "invest", "spend", "grow"];

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

export interface DashboardPillarsHubProps {
  connected?: boolean;
  walletLabel?: string;
  onConnect?: () => void;
  treasury?: DashboardPillarsHubTreasurySummary;
}

export function DashboardPillarsHub({
  connected = false,
  walletLabel,
  onConnect,
  treasury,
}: DashboardPillarsHubProps) {
  const { address, connected: walletConnected } = useWalletContext();
  const { machineMoneyUnlocked, previewComingSoon } = useMachineMoneyPreview();
  const isAdmin = isAdminWallet(walletConnected, address);

  const discoveryQ = useQuery({
    queryKey: ["pillars", "discovery"],
    queryFn: fetchPillarsDiscovery,
    staleTime: 300_000,
  });

  const pillarsById = new Map(
    (discoveryQ.data?.pillars ?? []).map((p) => [p.id as PillarId, p]),
  );

  const primaryValue =
    treasury?.totalUsd != null && treasury.totalUsd > 0
      ? treasury.totalUsd
      : treasury?.totalUsdc != null
        ? treasury.totalUsdc
        : null;

  return (
    <section className="space-y-8">
      <header
        className={cn(
          overviewCardShell,
          "overflow-hidden rounded-3xl p-6 sm:p-8 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8 lg:items-center",
        )}
      >
        <div
          className={overviewCardGlow}
          style={{ background: overviewAccentBackground("marketplace") }}
          aria-hidden
        />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
              Machine Money
            </div>
            {isAdmin ? <MachineMoneyPreviewToggle compact /> : null}
          </div>

          <div className="space-y-2">
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]">
              Earn · Treasury · Invest · Spend · Grow
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {previewComingSoon
                ? "Previewing the public coming-soon experience — toggle the eye to return to full pages."
                : discoveryQ.data?.narrative ?? MACHINE_MONEY_FLOW_COPY}
            </p>
          </div>

          {!connected ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {onConnect ? (
                <Button type="button" className="rounded-xl px-6" onClick={onConnect}>
                  <Wallet className="mr-2 h-4 w-4" aria-hidden />
                  Connect wallet
                </Button>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Unlock treasury balances and fuel your agent wallets.
              </p>
            </div>
          ) : treasury ? (
            <div className="rounded-2xl border border-border/50 bg-background/30 px-4 py-4 backdrop-blur-md sm:max-w-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={overviewKickerClass}>Total treasury</p>
                  {treasury.isLoading ? (
                    <div className="mt-2 h-9 w-36 animate-pulse rounded-lg bg-muted/50" />
                  ) : (
                    <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]">
                      <AnimatedMetric
                        value={primaryValue}
                        format={(n) => formatCompactUsd(n)}
                        deltaMode
                      />
                    </p>
                  )}
                  {walletLabel ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Connected{" "}
                      <span className="font-mono text-foreground/80">{walletLabel}</span>
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-1 font-medium backdrop-blur-md"
                  >
                    <Activity className="mr-1.5 h-3 w-3 opacity-80" aria-hidden />
                    Live
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <Link to="/overview/treasury">Open Treasury</Link>
                </Button>
                {treasury.onRefresh ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl gap-2"
                    disabled={treasury.refreshing || treasury.isLoading}
                    onClick={() => void treasury.onRefresh?.()}
                  >
                    {treasury.refreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="h-4 w-4" aria-hidden />
                    )}
                    Refresh
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <MachineMoneyFlowDiagram className="relative mt-6 lg:mt-0" />
      </header>

      <div>
        <p className={cn(overviewKickerClass, "mb-4")}>Five pillars</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PILLAR_ORDER.map((id) => {
            const copy = PILLAR_COPY[id];
            const meta = pillarsById.get(id);
            const pillarMeta = PILLAR_OVERVIEW_META[id];
            return (
              <PillarCard
                key={id}
                id={id}
                label={copy.headline}
                tagline={meta?.tagline ?? DASHBOARD_PILLAR_NAV.find((p) => p.id === id)?.description ?? copy.headline}
                description={copy.description}
                href={copy.href}
                icon={PILLAR_ICONS[id]}
                step={pillarMeta.step}
                accent={pillarMeta}
                features={pillarMeta.features}
                comingSoon={!machineMoneyUnlocked}
                stats={
                  meta
                    ? { routeCount: meta.routeCount, toolCount: meta.toolCount }
                    : undefined
                }
                className={cn(id === "treasury" && "sm:col-span-2 xl:col-span-1")}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
