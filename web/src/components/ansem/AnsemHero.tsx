import { useState } from "react";
import { Copy, ExternalLink, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { ANSEM, ANSEM_LOGO_URL, ANSEM_VENUES } from "@/lib/ansem";
import type { AnsemMarketSnapshot } from "@/lib/ansemMarketApi";
import { formatPct } from "@/lib/dashboardOverviewAggregates";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { AnsemLiveIndicator } from "@/components/ansem/AnsemLiveIndicator";

function truncateMint(mint: string, head = 6, tail = 4): string {
  if (mint.length <= head + tail + 3) return mint;
  return `${mint.slice(0, head)}…${mint.slice(-tail)}`;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null || !Number.isFinite(price)) return "—";
  if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
  if (price >= 0.0001) return `$${price.toLocaleString(undefined, { maximumSignificantDigits: 6 })}`;
  return `$${price.toExponential(2)}`;
}

async function copyMint(mint: string) {
  try {
    await navigator.clipboard.writeText(mint);
    notify.success("Contract copied");
  } catch {
    notify.error("Could not copy contract");
  }
}

export function AnsemHero({
  market,
  isLoading,
  className,
}: {
  market?: AnsemMarketSnapshot;
  isLoading: boolean;
  className?: string;
}) {
  const name = market?.name ?? ANSEM.name;
  const symbol = market?.symbol ?? ANSEM.symbol;
  const price = market?.priceUsd ?? null;
  const change24 = market?.priceChange24hPercent ?? null;
  const change1h = market?.priceChange1hPercent ?? null;
  const imageUrl = market?.imageUrl ?? ANSEM_LOGO_URL;
  const [imgFailed, setImgFailed] = useState(false);
  const displayImage = imgFailed ? ANSEM_LOGO_URL : imageUrl;

  const buyVenues = ANSEM_VENUES.filter((v) => v.kind === "buy");
  const primaryVenue = buyVenues.find((v) => v.primary) ?? buyVenues[0];
  const secondaryVenues = buyVenues.filter((v) => v.id !== primaryVenue?.id);

  if (isLoading && !market) {
    return (
      <section className={cn(overviewCardShell, "min-w-0 overflow-hidden p-6 sm:p-8", className)}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        overviewCardShell,
        "relative min-w-0 overflow-hidden p-6 sm:p-8",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(38 92% 50% / 0.14), hsl(280 70% 55% / 0.08), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <img
              src={displayImage}
              alt=""
              className="h-20 w-20 shrink-0 rounded-2xl border border-border/60 object-cover shadow-lg sm:h-24 sm:w-24"
              onError={() => setImgFailed(true)}
              referrerPolicy="no-referrer"
            />

            <div className="min-w-0 space-y-2">
              <p className={overviewKickerClass}>Token hub · Solana</p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {name}
                </h1>
                <Badge className="border-amber-500/30 bg-amber-500/10 font-mono text-amber-700 dark:text-amber-300">
                  ${symbol}
                </Badge>
                {market?.graduated === true ? (
                  <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Graduated
                  </Badge>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => copyMint(ANSEM.mint)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/40 px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                {truncateMint(ANSEM.mint, 8, 6)}
                <Copy className="h-3 w-3" aria-hidden />
              </button>

              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {market?.description?.trim() ||
                  "The community token catching fire on Solana. Track live stats, sentiment, and on-chain signals — powered by Syra."}
              </p>
            </div>
          </div>

          <AnsemLiveIndicator fetchedAt={market?.fetchedAt} />
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              Live price
            </p>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-5xl">
                <AnimatedMetric value={price} format={formatPrice} deltaMode />
              </span>
              {change24 != null && Number.isFinite(change24) ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium",
                    change24 >= 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  {change24 >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {formatPct(change24)} 24h
                </span>
              ) : null}
              {change1h != null && Number.isFinite(change1h) ? (
                <span className="text-sm text-muted-foreground">{formatPct(change1h)} 1h</span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            {primaryVenue ? (
              <Button
                size="lg"
                variant="neon"
                className="h-12 rounded-xl px-6 text-base shadow-glow-sm"
                asChild
              >
                <a href={primaryVenue.href} target="_blank" rel="noopener noreferrer">
                  Buy ${symbol}
                  <ExternalLink className="ml-2 h-4 w-4" aria-hidden />
                </a>
              </Button>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {secondaryVenues.map((venue) => (
                <Button key={venue.id} variant="outline" size="sm" className="rounded-xl" asChild>
                  <a href={venue.href} target="_blank" rel="noopener noreferrer">
                    {venue.label}
                  </a>
                </Button>
              ))}
              {ANSEM_VENUES.filter((v) => v.kind !== "buy").map((venue) => (
                <Button key={venue.id} variant="ghost" size="sm" className="rounded-xl" asChild>
                  <a href={venue.href} target="_blank" rel="noopener noreferrer">
                    {venue.label}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
