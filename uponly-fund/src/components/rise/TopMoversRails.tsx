/**
 * Three horizontal-scroll rails powered by the /aggregate digest:
 *  • Top volume 24h
 *  • Top gainers 24h
 *  • Newest markets
 *
 * Cards are click-targets that open the MarketDetailDrawer (passed in via prop
 * to avoid a hard prop-drill — siblings raise the click event, the page owns
 * the drawer state).
 */
import { Activity, Clock4, Flame, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiseDashboard } from "@/lib/RiseDashboardContext";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  RiseTradeButton,
  SectionHeader,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  formatRelativeAge,
} from "./RiseShared";

type Tone = "success" | "ring" | "neutral";

function MoverCard({
  market,
  onSelect,
  metricLabel,
  metricValue,
  tone = "neutral",
}: {
  market: RiseMarketRow;
  onSelect: (m: RiseMarketRow) => void;
  metricLabel: string;
  metricValue: string;
  tone?: Tone;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(market)}
      className={cn(
        "group relative flex w-[clamp(14rem,72vw,17rem)] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-border/45 bg-card/40 p-3.5 text-left shadow-sm transition-all backdrop-blur-sm",
        "hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-card/70 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <TokenAvatar imageUrl={market.imageUrl} symbol={market.symbol} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-foreground">${market.symbol || "—"}</p>
            <VerifiedBadge verified={market.isVerified} />
          </div>
          <p className="truncate text-[0.7rem] text-muted-foreground sm:text-xs">{market.name || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-foreground">{formatPriceSmart(market.priceUsd)}</p>
          <ChangePill pct={market.priceChange24hPct} className="mt-0.5" />
        </div>
      </div>
      <div
        className={cn(
          "rounded-lg border border-border/35 px-2.5 py-2 text-[0.7rem] sm:text-xs",
          tone === "success" && "bg-success/[0.05]",
          tone === "ring" && "bg-ring/[0.06]",
          tone === "neutral" && "bg-background/30",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">{metricLabel}</span>
          <span className="font-semibold tabular-nums text-foreground">{metricValue}</span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-muted-foreground">
          <span className="truncate">MC {formatUsd(market.marketCapUsd, { compact: true })}</span>
          <span>·</span>
          <span className="truncate">Holders {formatInt(market.holders)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-[0.65rem] text-muted-foreground sm:text-xs">
        <span className="truncate">Age {formatRelativeAge(market.ageHours)}</span>
        <RiseTradeButton mint={market.mint} />
      </div>
    </button>
  );
}

function Rail({
  title,
  description,
  icon: Icon,
  items,
  onSelect,
  metric,
  tone = "neutral",
  isLoading,
}: {
  title: string;
  description: string;
  icon: typeof Flame;
  items: RiseMarketRow[];
  onSelect: (m: RiseMarketRow) => void;
  metric: (m: RiseMarketRow) => { label: string; value: string };
  tone?: Tone;
  isLoading: boolean;
}) {
  return (
    <GlassCard padded={false}>
      <div className="flex items-start gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/40 text-foreground/85 shadow-inner">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">{title}</h3>
          <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground sm:text-xs">{description}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[8.5rem] w-[16rem] shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <EmptyState title="No data yet" icon={Activity} description="Refreshing — check back in a minute." />
        </div>
      ) : (
        <div
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 pt-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [scroll-padding-inline:1rem] sm:px-5 sm:pb-5 sm:pt-3 sm:[scroll-padding-inline:1.25rem]"
        >
          {items.map((m) => {
            const { label, value } = metric(m);
            return <MoverCard key={m.mint} market={m} onSelect={onSelect} metricLabel={label} metricValue={value} tone={tone} />;
          })}
          <div className="w-1 shrink-0 sm:w-2" aria-hidden />
        </div>
      )}
    </GlassCard>
  );
}

export function TopMoversRails({ onSelect }: { onSelect: (m: RiseMarketRow) => void }) {
  const { aggregate } = useRiseDashboard();
  const data = aggregate.data;
  const isLoading = aggregate.isPending && !data;

  return (
    <section aria-labelledby="rise-movers-heading" className="flex flex-col gap-5">
      <SectionHeader
        eyebrow="Movers"
        title="Top movers across RISE"
        description="Server-aggregated digest of the busiest, fastest-rising, and freshest markets right now."
      />
      <div id="rise-movers-heading" className="sr-only">
        Top movers
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Rail
          title="Top volume · 24h"
          description="Highest USD turnover in the last 24h"
          icon={Flame}
          items={data?.topVolume24h ?? []}
          onSelect={onSelect}
          isLoading={isLoading}
          tone="ring"
          metric={(m) => ({ label: "Vol 24h", value: formatUsd(m.volume24hUsd, { compact: true }) })}
        />
        <Rail
          title="Top gainers · 24h"
          description="Largest positive 24h price moves"
          icon={TrendingUp}
          items={data?.topGainers24h ?? []}
          onSelect={onSelect}
          isLoading={isLoading}
          tone="success"
          metric={(m) => ({ label: "24h Δ", value: m.priceChange24hPct != null ? `${m.priceChange24hPct.toFixed(1)}%` : "—" })}
        />
        <Rail
          title="Newest markets"
          description="Most recently launched on RISE"
          icon={Clock4}
          items={data?.newest ?? []}
          onSelect={onSelect}
          isLoading={isLoading}
          metric={(m) => ({ label: "Age", value: formatRelativeAge(m.ageHours) })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Rail
          title="Most holders"
          description="Distribution leaders by holder count"
          icon={Users}
          items={data?.mostHolders ?? []}
          onSelect={onSelect}
          isLoading={isLoading}
          metric={(m) => ({ label: "Holders", value: formatInt(m.holders) })}
        />
        <Rail
          title="Largest by mcap"
          description="Top market caps in the sampled set"
          icon={Activity}
          items={data?.largestByMcap ?? []}
          onSelect={onSelect}
          isLoading={isLoading}
          metric={(m) => ({ label: "MC", value: formatUsd(m.marketCapUsd, { compact: true }) })}
        />
      </div>
    </section>
  );
}
