/**
 * Top-of-page hero for /rise.
 *
 * Renders the ecosystem KPIs (sampled from /aggregate) plus a thin animated
 * ticker tape of top movers. The visual language matches /uponly's
 * `LiveMarketStrip` — same monochrome glass-card density.
 */
import { useMemo } from "react";
import { useReducedMotion, motion } from "framer-motion";
import { Activity, BadgeCheck, BarChart3, Coins, Layers3, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeUp } from "@/components/uponly/primitives";
import { useRiseDashboard } from "@/lib/RiseDashboardContext";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  StatTile,
  TokenAvatar,
  formatPriceSmart,
} from "./RiseShared";

function HeroBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-success/[0.05] via-background to-background" />
      <div
        className="absolute -top-40 left-1/2 h-[34rem] w-[min(96vw,46rem)] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, hsl(var(--ring) / 0.18), transparent 70%)" }}
      />
      <div className="absolute inset-0 grid-pattern opacity-[0.18]" />
    </div>
  );
}

function TickerTape({
  rows,
  reduceMotion,
}: {
  rows: { symbol: string; imageUrl: string | null; pct: number | null; price: number | null }[];
  reduceMotion: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border/40 bg-card/30 px-4 py-2.5 text-[0.7rem] text-muted-foreground sm:text-xs">
        Loading market ticker…
      </div>
    );
  }
  const items = [...rows, ...rows];
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm"
      aria-label="RISE ecosystem ticker tape"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-12 bg-gradient-to-r from-card/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-12 bg-gradient-to-l from-card/80 to-transparent" />
      <motion.div
        className="flex min-w-max items-center gap-5 px-4 py-2.5 will-change-transform"
        animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
        transition={
          reduceMotion
            ? undefined
            : { duration: Math.max(20, items.length * 1.4), ease: "linear", repeat: Infinity }
        }
      >
        {items.map((r, i) => (
          <span
            key={`${r.symbol}-${i}`}
            className="inline-flex shrink-0 items-center gap-2 text-[0.7rem] sm:text-xs"
          >
            <TokenAvatar imageUrl={r.imageUrl} symbol={r.symbol} size="xs" />
            <span className="font-semibold tracking-tight text-foreground">${r.symbol || "—"}</span>
            <span className="text-muted-foreground tabular-nums">{formatPriceSmart(r.price)}</span>
            <ChangePill pct={r.pct} />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function AnimatedUsd({ end, compact = true }: { end: number | null; compact?: boolean }) {
  const reduce = useReducedMotion() ?? false;
  const v = useAnimatedNumber(end, { duration: 900, disabled: reduce });
  if (end === null || !Number.isFinite(end)) return <span>—</span>;
  return <span>{formatUsd(v, { compact })}</span>;
}

function AnimatedInt({ end }: { end: number | null }) {
  const reduce = useReducedMotion() ?? false;
  const v = useAnimatedNumber(end, { duration: 900, disabled: reduce });
  if (end === null || !Number.isFinite(end)) return <span>—</span>;
  return <span>{formatInt(v)}</span>;
}

export function RiseHero() {
  const reduceMotion = useReducedMotion() ?? false;
  const { aggregate } = useRiseDashboard();
  const data = aggregate.data;

  const tickerRows = useMemo(() => {
    if (!data) return [];
    const merged = [...data.topGainers24h.slice(0, 6), ...data.topVolume24h.slice(0, 6), ...data.topLosers24h.slice(0, 4)];
    const seen = new Set<string>();
    const dedup: { symbol: string; imageUrl: string | null; pct: number | null; price: number | null }[] = [];
    for (const r of merged) {
      if (!r.mint || seen.has(r.mint)) continue;
      seen.add(r.mint);
      dedup.push({
        symbol: r.symbol || "—",
        imageUrl: r.imageUrl,
        pct: r.priceChange24hPct,
        price: r.priceUsd,
      });
      if (dedup.length >= 14) break;
    }
    return dedup;
  }, [data]);

  return (
    <section className="relative isolate w-full" aria-labelledby="rise-hero-heading">
      <HeroBackdrop />
      <motion.div {...fadeUp(reduceMotion)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border/45 bg-background/50 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-foreground/85 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
            Live · RISE ecosystem
          </p>
          <h1
            id="rise-hero-heading"
            className="text-balance text-[1.65rem] font-bold leading-[1.08] tracking-[-0.02em] sm:text-4xl md:text-[2.5rem]"
          >
            <span className="neon-text">RISE</span>
            <span className="text-foreground/85"> dashboard &amp; screener</span>
          </h1>
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            The full <strong className="font-medium text-foreground/90">rise.rich</strong> universe in one workstation —
            ecosystem totals, top movers, every market with floor metrics, plus quote and borrow simulators powered by
            the same RISE APIs that drive Syra agents. Featuring <strong className="font-medium text-foreground/90">$UPONLY</strong>
            — the Syra × RISE flagship tranche on the road to $100M.
          </p>
        </div>

        <div
          className={cn(
            "grid gap-2.5 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3",
            aggregate.isPending && "animate-pulse",
          )}
        >
          {aggregate.isPending && !data ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[5.25rem] rounded-xl" />
            ))
          ) : (
            <>
              <StatTile
                label="Markets"
                value={<AnimatedInt end={data?.ecosystem.marketCount ?? null} />}
                sub={
                  data
                    ? `Sampled ${formatInt(data.ecosystem.sampledCount)} for stats`
                    : undefined
                }
              />
              <StatTile
                label="Total market cap"
                value={<AnimatedUsd end={data?.ecosystem.totalMarketCapUsd ?? null} />}
                sub="Sampled, USD"
              />
              <StatTile
                label="24h volume"
                value={<AnimatedUsd end={data?.ecosystem.totalVolume24hUsd ?? null} />}
                sub="Sampled, USD"
              />
              <StatTile
                label="Floor-backed mcap"
                value={<AnimatedUsd end={data?.ecosystem.totalFloorMarketCapUsd ?? null} />}
                sub={data ? `${formatInt(data.ecosystem.withFloorCount)} markets with floor` : undefined}
              />
              <StatTile
                label="Holders (sampled)"
                value={<AnimatedInt end={data?.ecosystem.totalHolders ?? null} />}
                sub={data ? `Median fee ${formatPct(data.ecosystem.medianCreatorFeePct)}` : undefined}
              />
              <StatTile
                label="Verified markets"
                value={<AnimatedInt end={data?.ecosystem.verifiedCount ?? null} />}
                sub="In sampled set"
                accent
              />
            </>
          )}
        </div>

        <TickerTape rows={tickerRows} reduceMotion={reduceMotion} />

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.7rem] text-muted-foreground/85 sm:text-xs">
          <li className="inline-flex items-center gap-1.5">
            <Coins className="h-3 w-3 opacity-70" aria-hidden /> Read-only — no wallet required
          </li>
          <li className="inline-flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3 opacity-70" aria-hidden /> Refresh every 60s via TanStack Query
          </li>
          <li className="inline-flex items-center gap-1.5">
            <BadgeCheck className="h-3 w-3 opacity-70" aria-hidden /> Powered by public.rise.rich
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Layers3 className="h-3 w-3 opacity-70" aria-hidden /> Aggregated server-side
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Users className="h-3 w-3 opacity-70" aria-hidden /> DYOR — not financial advice
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Activity className="h-3 w-3 opacity-70" aria-hidden />
            {aggregate.data?.degraded
              ? "Showing partial data (some pages timed out)"
              : "All systems nominal"}
          </li>
        </ul>
      </motion.div>
    </section>
  );
}
