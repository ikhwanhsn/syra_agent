import { useEffect, useMemo, useState } from "react";

import { Bitcoin, Share2, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import {

  formatBtcCompactUsd,

  formatBtcPct,

  formatBtcUsd,

  type BtcOverview,

} from "@/lib/btcApi";

import { btcHeroShell, btcIconShell, btcKickerClass } from "@/components/btc/btcStyles";

import { BtcSectionShareModal } from "@/components/btc/share/BtcSectionShareModal";

import { BtcMetricTile } from "@/components/btc/sections/btcSectionShared";



function formatUpdatedAgo(iso: string | undefined): string | null {

  if (!iso) return null;

  const ts = new Date(iso).getTime();

  if (!Number.isFinite(ts)) return null;

  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));

  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

}



export function BtcPageHero({

  overview,

  loading,

}: {

  overview: BtcOverview | undefined;

  loading?: boolean;

}) {

  const [shareOpen, setShareOpen] = useState(false);

  const change = overview?.price.change24hPct ?? null;

  const price = overview?.price.usd ?? null;

  const high = overview?.price.high24h ?? null;

  const low = overview?.price.low24h ?? null;

  const isUp = change != null && change > 0;

  const isDown = change != null && change < 0;



  const rangePct = useMemo(() => {

    if (price == null || high == null || low == null || high <= low) return null;

    return ((price - low) / (high - low)) * 100;

  }, [price, high, low]);



  const [updatedAgo, setUpdatedAgo] = useState<string | null>(() =>

    formatUpdatedAgo(overview?.computedAt),

  );



  useEffect(() => {

    setUpdatedAgo(formatUpdatedAgo(overview?.computedAt));

    const id = setInterval(() => setUpdatedAgo(formatUpdatedAgo(overview?.computedAt)), 1000);

    return () => clearInterval(id);

  }, [overview?.computedAt]);



  const shareLines = [

    price != null ? `BTC ${formatBtcUsd(price, 0)}` : "",

    change != null ? `24h ${formatBtcPct(change)}` : "",

    overview?.price.volumeUsd24h != null ? `Volume ${formatBtcCompactUsd(overview.price.volumeUsd24h)}` : "",

    overview?.sentiment.fearGreedIndex != null

      ? `Fear & Greed ${overview.sentiment.fearGreedIndex}`

      : "",

  ].filter(Boolean);



  return (

    <>

      <section id="section-hero" className={cn(btcHeroShell, "scroll-mt-24")}>

        <div

          className="pointer-events-none absolute inset-0 opacity-40"

          style={{

            backgroundImage: `

            linear-gradient(to right, hsl(var(--border) / 0.14) 1px, transparent 1px),

            linear-gradient(to bottom, hsl(var(--border) / 0.14) 1px, transparent 1px)

          `,

            backgroundSize: "40px 40px",

          }}

        />

        <div

          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-3xl"

          style={{ background: "radial-gradient(circle, rgba(247,147,26,0.12), transparent 65%)" }}

        />



        <div className="relative px-5 py-7 sm:px-8 sm:py-9">

          <Button

            type="button"

            variant="ghost"

            size="icon"

            className="absolute right-4 top-4 z-10 h-9 w-9 rounded-xl border border-border/40 bg-background/40 text-muted-foreground backdrop-blur-sm hover:text-foreground"

            disabled={loading || price == null}

            onClick={() => setShareOpen(true)}

            aria-label="Share overview"

          >

            <Share2 className="h-4 w-4" aria-hidden />

          </Button>



          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div className="min-w-0 space-y-5 pr-10">

              <div className="flex flex-wrap items-center gap-2">

                <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/55 px-3 py-1 backdrop-blur-md">

                  <span className={cn(btcIconShell("btc"), "h-6 w-6 rounded-lg")}>

                    <Bitcoin className="h-3.5 w-3.5" aria-hidden />

                  </span>

                  <span className={btcKickerClass}>Bitcoin intelligence</span>

                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1">

                  <span className="relative flex h-2 w-2">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />

                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />

                  </span>

                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">

                    Live

                  </span>

                </div>

                {updatedAgo ? (

                  <Badge variant="outline" className="rounded-full border-border/50 bg-background/30 text-[10px] font-normal">

                    Updated {updatedAgo}

                  </Badge>

                ) : null}

              </div>



              <div>

                {loading ? (

                  <div className="h-14 w-56 animate-pulse rounded-2xl bg-muted/30" />

                ) : (

                  <div className="flex flex-wrap items-end gap-3">

                    <p className="font-display text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-5xl">

                      {formatBtcUsd(price, 0)}

                    </p>

                    {change != null ? (

                      <span

                        className={cn(

                          "mb-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-sm font-medium tabular-nums",

                          isUp && "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",

                          isDown && "bg-red-500/12 text-red-600 dark:text-red-400",

                          !isUp && !isDown && "bg-muted/40 text-muted-foreground",

                        )}

                      >

                        {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : isDown ? <TrendingDown className="h-3.5 w-3.5" /> : null}

                        {formatBtcPct(change)}

                      </span>

                    ) : null}

                  </div>

                )}

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">

                  Spot, derivatives, dominance, and sentiment — with taker buy/sell ratio bubblemaps across

                  major venues.

                </p>

              </div>



              {high != null && low != null && price != null && rangePct != null ? (

                <div className="max-w-md space-y-2">

                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">

                    <span>L {formatBtcUsd(low, 0)}</span>

                    <span>24h range</span>

                    <span>H {formatBtcUsd(high, 0)}</span>

                  </div>

                  <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/50">

                    <div

                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500/50 via-[#F7931A]/70 to-emerald-500/60"

                      style={{ width: "100%" }}

                    />

                    <div

                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow-md"

                      style={{ left: `calc(${Math.min(100, Math.max(0, rangePct))}% - 6px)` }}

                    />

                  </div>

                </div>

              ) : null}

            </div>



            {overview?.price.volumeUsd24h != null ? (

              <div className="rounded-2xl border border-border/50 bg-background/40 px-4 py-3 text-right backdrop-blur-md lg:mr-0">

                <p className={btcKickerClass}>24h volume</p>

                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">

                  {formatBtcCompactUsd(overview.price.volumeUsd24h)}

                </p>

              </div>

            ) : null}

          </div>

        </div>

      </section>



      {!loading && price != null ? (

        <BtcSectionShareModal

          open={shareOpen}

          onClose={() => setShareOpen(false)}

          shareSlug="overview-hero"

          kicker="Bitcoin intelligence"

          title="BTC market overview"

          description="Spot price, 24h change, and key context."

          capturedAt={overview?.computedAt}

          shareLines={shareLines}

        >

          <div className="grid gap-3 sm:grid-cols-2">

            <BtcMetricTile label="BTC spot" value={formatBtcUsd(price, 0)} hint={change != null ? formatBtcPct(change) : undefined} accent={isUp ? "up" : isDown ? "down" : "neutral"} />

            <BtcMetricTile

              label="24h volume"

              value={formatBtcCompactUsd(overview?.price.volumeUsd24h ?? null)}

            />

            <BtcMetricTile

              label="24h range"

              value={high != null && low != null ? `${formatBtcUsd(low, 0)} – ${formatBtcUsd(high, 0)}` : "—"}

            />

            <BtcMetricTile

              label="Fear & Greed"

              value={overview?.sentiment.fearGreedIndex != null ? String(overview.sentiment.fearGreedIndex) : "—"}

              hint={overview?.sentiment.fearGreedLabel ?? undefined}

            />

          </div>

        </BtcSectionShareModal>

      ) : null}

    </>

  );

}


