import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, Gauge, Percent, TrendingDown, TrendingUp, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatBtcCompactUsd,
  formatBtcPct,
  formatBtcUsd,
  formatBtcVolume,
  formatFundingRate,
  type BtcOverview,
} from "@/lib/btcApi";
import {
  btcCardClass,
  btcCardInset,
  btcIconShell,
  btcKickerClass,
} from "@/components/btc/btcStyles";
import { BtcShareableSection } from "@/components/btc/share/BtcShareableSection";

interface StatItem {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "up" | "down" | "neutral" | "btc";
  featured?: boolean;
}

function fearGreedAccent(value: number | null): "up" | "down" | "neutral" {
  if (value == null) return "neutral";
  if (value >= 55) return "up";
  if (value <= 45) return "down";
  return "neutral";
}

function changeAccent(value: number | null): "up" | "down" | "neutral" {
  if (value == null || value === 0) return "neutral";
  return value > 0 ? "up" : "down";
}

function accentValueClass(accent?: StatItem["accent"]) {
  return cn(
    accent === "up" && "text-emerald-600 dark:text-emerald-400",
    accent === "down" && "text-red-600 dark:text-red-400",
    accent === "btc" && "text-[#F7931A]",
  );
}

function accentGlowClass(accent?: StatItem["accent"]) {
  return cn(
    accent === "up" && "from-emerald-500/10 to-transparent",
    accent === "down" && "from-red-500/10 to-transparent",
    accent === "btc" && "from-[#F7931A]/12 to-transparent",
    (!accent || accent === "neutral") && "from-primary/8 to-transparent",
  );
}

function StatCard({ item, loading }: { item: StatItem; loading?: boolean }) {
  const Icon = item.icon;
  return (
    <article className={cn(btcCardClass, item.featured && "sm:col-span-2 lg:col-span-2")}>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
          accentGlowClass(item.accent),
        )}
        aria-hidden
      />
      <div className="relative flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={btcKickerClass}>{item.label}</p>
            {loading ? (
              <div className="mt-3 h-9 w-32 animate-pulse rounded-lg bg-muted/35" />
            ) : (
              <p
                className={cn(
                  "mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground",
                  item.featured && "text-3xl sm:text-4xl",
                  accentValueClass(item.accent),
                )}
              >
                {item.value}
              </p>
            )}
          </div>
          <span className={cn(btcIconShell(item.accent === "btc" ? "btc" : "neutral"), "h-10 w-10")}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        {item.hint ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{item.hint}</p>
        ) : (
          <span className="h-4" />
        )}
      </div>
    </article>
  );
}

export function BtcStatCards({
  overview,
  loading,
}: {
  overview: BtcOverview | undefined;
  loading?: boolean;
}) {
  const change = overview?.price.change24hPct ?? null;
  const fear = overview?.sentiment.fearGreedIndex ?? null;
  const premium = overview?.exchanges.coinbasePremiumPct ?? null;

  const items: StatItem[] = [
    {
      label: "BTC spot",
      value: formatBtcUsd(overview?.price.usd ?? null, 0),
      hint:
        change != null
          ? `${formatBtcPct(change)} over 24h`
          : "Aggregated from Binance · CoinGecko fallback",
      icon: changeAccent(change) === "down" ? TrendingDown : TrendingUp,
      accent: changeAccent(change),
      featured: true,
    },
    {
      label: "Market cap",
      value: formatBtcCompactUsd(overview?.market.marketCapUsd ?? null),
      hint:
        overview?.market.dominancePct != null
          ? `${overview.market.dominancePct.toFixed(2)}% BTC dominance`
          : "CoinGecko global",
      icon: Percent,
      accent: "btc",
    },
    {
      label: "24h volume",
      value: formatBtcCompactUsd(overview?.price.volumeUsd24h ?? null),
      hint:
        overview?.price.volumeBtc24h != null
          ? `${formatBtcVolume(overview.price.volumeBtc24h)} BTC traded`
          : "Spot volume proxy",
      icon: BarChart3,
    },
    {
      label: "Funding rate",
      value: formatFundingRate(overview?.derivatives.fundingRate ?? null),
      hint: "Binance BTCUSDT perpetual",
      icon: Waves,
      accent:
        overview?.derivatives.fundingRate != null && overview.derivatives.fundingRate > 0
          ? "up"
          : overview?.derivatives.fundingRate != null && overview.derivatives.fundingRate < 0
            ? "down"
            : "neutral",
    },
    {
      label: "Open interest",
      value:
        overview?.derivatives.openInterestBtc != null
          ? `${formatBtcVolume(overview.derivatives.openInterestBtc)} BTC`
          : "—",
      hint:
        overview?.derivatives.markPrice != null
          ? `Mark ${formatBtcUsd(overview.derivatives.markPrice, 0)}`
          : "Futures positioning",
      icon: Activity,
    },
    {
      label: "Fear & Greed",
      value: fear != null ? String(Math.round(fear)) : "—",
      hint: overview?.sentiment.fearGreedLabel ?? "Alternative.me index",
      icon: Gauge,
      accent: fearGreedAccent(fear),
    },
    {
      label: "Coinbase premium",
      value: formatBtcPct(premium),
      hint: "Coinbase vs Binance spot spread",
      icon: TrendingUp,
      accent: premium != null && premium > 0 ? "up" : premium != null && premium < 0 ? "down" : "neutral",
    },
  ];

  return (
    <BtcShareableSection
      id="section-metrics"
      kicker="Market pulse"
      title="Key metrics"
      description="Cross-venue spot, derivatives, and sentiment at a glance."
      shareSlug="key-metrics"
      loading={loading}
      empty={!overview}
      capturedAt={overview?.computedAt}
      shareLines={items.map((item) => `${item.label}: ${item.value}`)}
      bodyClassName="!p-4 sm:!p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <StatCard key={item.label} item={item} loading={loading} />
        ))}
      </div>
    </BtcShareableSection>
  );
}

export function BtcDataSourcesStrip() {
  const sources = [
    "Binance",
    "Binance Futures",
    "Coinbase",
    "CoinGecko",
    "Alternative.me",
    "Syra News",
    "Syra Signal",
  ];
  return (
    <div className={cn(btcCardInset, "flex flex-wrap items-center gap-2 px-4 py-3")}>
      <span className={btcKickerClass}>Sources</span>
      {sources.map((s) => (
        <span
          key={s}
          className="rounded-full border border-border/45 bg-background/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          {s}
        </span>
      ))}
    </div>
  );
}
