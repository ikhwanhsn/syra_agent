/**
 * Featured spotlight card for the UPONLY market — visually loud,
 * pinned just below the hero. Uses the live aggregate row + a 4h OHLC
 * sparkline. CTA deep-links to rise.rich/trade/{mint}.
 */
import { useId, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, Flame, ShoppingCart, Sparkles, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiseDashboard, useRiseOhlc } from "@/lib/RiseDashboardContext";
import { TARGET_MARKET_CAP_USD } from "@/data/riseUpOnly";
import { formatInt, formatPct, formatUsd } from "@/lib/marketDisplayFormat";
import { buildRiseTradeUrl } from "@/lib/riseDashboardApi";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  GlassCard,
  RISE_UPONLY_MINT,
  StatTile,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  shortenMint,
} from "./RiseShared";

function MiniSparkline({ values, tone }: { values: number[]; tone: "up" | "down" | "neutral" }) {
  const gradientId = useId();
  if (values.length < 2) {
    return <div className="h-16 w-full rounded-md bg-muted/20" aria-hidden />;
  }
  const data = values.map((v, i) => ({ i, v }));
  const stroke =
    tone === "up" ? "hsl(var(--success))" : tone === "down" ? "hsl(var(--destructive))" : "hsl(var(--ring))";
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.6} fill={`url(#${gradientId})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UponlySpotlight() {
  const { uponly, aggregate } = useRiseDashboard();
  const spotlightAddress = uponly?.marketAddress ?? uponly?.mint ?? RISE_UPONLY_MINT;
  const ohlc = useRiseOhlc(spotlightAddress, "1h", 96);

  const tradeUrl = useMemo(() => buildRiseTradeUrl(uponly?.mint || RISE_UPONLY_MINT), [uponly?.mint]);

  const sparkline = useMemo(() => {
    const candles = ohlc.data?.candles ?? [];
    const normalized = candles
      .map((c, idx) => {
        const rawTime = typeof c.time === "number" && Number.isFinite(c.time) ? c.time : null;
        const closeCandidate =
          typeof c.close === "number" && Number.isFinite(c.close)
            ? c.close
            : typeof c.open === "number" && Number.isFinite(c.open)
              ? c.open
              : typeof c.high === "number" && Number.isFinite(c.high)
                ? c.high
                : typeof c.low === "number" && Number.isFinite(c.low)
                  ? c.low
                  : null;
        const close = closeCandidate;
        if (close === null) return null;
        // Some upstream OHLC rows omit time; fall back to stable index spacing.
        const tsMs =
          rawTime === null
            ? idx * 3_600_000
            : rawTime > 1_000_000_000_000
              ? rawTime
              : rawTime * 1000;
        return { tsMs, close };
      })
      .filter((v): v is { tsMs: number; close: number } => v !== null)
      .sort((a, b) => a.tsMs - b.tsMs);
    return normalized.map((p) => p.close);
  }, [ohlc.data]);

  const sparkTone = useMemo(() => {
    if (sparkline.length < 2) return "neutral" as const;
    const first = sparkline[0];
    const last = sparkline[sparkline.length - 1];
    if (last > first * 1.001) return "up" as const;
    if (last < first * 0.999) return "down" as const;
    return "neutral" as const;
  }, [sparkline]);

  const progressPct = useMemo(() => {
    const mc = uponly?.marketCapUsd ?? null;
    if (mc === null || !Number.isFinite(mc) || mc <= 0) return 0;
    return Math.min(100, (mc / TARGET_MARKET_CAP_USD) * 100);
  }, [uponly?.marketCapUsd]);

  const isLoading = aggregate.isPending && !uponly;

  return (
    <section aria-labelledby="rise-uponly-spotlight">
      <GlassCard
        padded={false}
        className="border-success/25 bg-gradient-to-b from-success/[0.07] via-card/60 to-card/30"
      >
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-success/15 bg-success/[0.08] blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full border border-foreground/5 bg-foreground/[0.04] blur-3xl" aria-hidden />

        <div className="relative flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-success/35 bg-success/[0.1] px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-foreground sm:text-xs">
              <Flame className="h-3 w-3" aria-hidden />
              Spotlight · Syra × RISE
            </span>
            <Link
              to="/uponly/overview"
              className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-foreground/80 underline-offset-2 hover:underline sm:text-xs"
            >
              <BookOpen className="h-3 w-3" aria-hidden />
              Read the $UPONLY thesis
              <ArrowUpRight className="h-3 w-3 opacity-70" aria-hidden />
            </Link>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-12 lg:gap-6">
            <div className="min-w-0 lg:col-span-7">
              <div className="flex min-w-0 items-center gap-4">
                <TokenAvatar imageUrl={uponly?.imageUrl ?? null} symbol={uponly?.symbol ?? "UPONLY"} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2
                    id="rise-uponly-spotlight"
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-balance text-xl font-bold leading-tight tracking-[-0.01em] text-foreground sm:text-2xl"
                  >
                    <span>{uponly?.name || "Up Only"}</span>
                    <span className="font-mono text-base font-medium text-muted-foreground sm:text-lg">
                      ${uponly?.symbol || "UPONLY"}
                    </span>
                    <VerifiedBadge verified={Boolean(uponly?.isVerified)} />
                  </h2>
                  <p className="mt-1 break-all font-mono text-[0.65rem] text-muted-foreground sm:text-xs">
                    {shortenMint(uponly?.mint || RISE_UPONLY_MINT, 6, 6)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {isLoading ? (
                      <Skeleton className="h-6 w-24" />
                    ) : (
                      <>
                        <span className="text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                          {formatPriceSmart(uponly?.priceUsd ?? null)}
                        </span>
                        <ChangePill pct={uponly?.priceChange24hPct ?? null} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                {ohlc.isPending && sparkline.length === 0 ? (
                  <Skeleton className="h-16 w-full rounded-md" />
                ) : (
                  <MiniSparkline values={sparkline} tone={sparkTone} />
                )}
                <div className="mt-1 flex items-center justify-between text-[0.65rem] text-muted-foreground sm:text-xs">
                  <span>1h candles · last {sparkline.length || 0}</span>
                  <span>Source: public.rise.rich</span>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between text-[0.65rem] text-muted-foreground sm:text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <TrendingUp className="h-3 w-3 opacity-80" aria-hidden /> Progress to $100M target
                  </span>
                  <span className="font-medium text-foreground/85 tabular-nums">
                    {`${progressPct.toFixed(progressPct < 1 ? 2 : 1).replace(/\.0$/, "")}%`}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full bg-gradient-to-r from-success/70 via-foreground/40 to-foreground/20 transition-[width] duration-700"
                    style={{ width: `${progressPct}%` }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progressPct)}
                    aria-label="Progress toward 100M USD market cap target"
                  />
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-5">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
                <StatTile label="Market cap" value={formatUsd(uponly?.marketCapUsd ?? null, { compact: false })} />
                <StatTile label="Floor mcap" value={formatUsd(uponly?.floorMarketCapUsd ?? null, { compact: false })} />
                <StatTile label="Floor price" value={formatPriceSmart(uponly?.floorPriceUsd ?? null)} sub={uponly?.floorDeltaPct != null ? `Δ floor ${formatPct(uponly.floorDeltaPct)}` : undefined} />
                <StatTile label="24h volume" value={formatUsd(uponly?.volume24hUsd ?? null, { compact: false })} />
                <StatTile label="Holders" value={formatInt(uponly?.holders ?? null)} />
                <StatTile label="Creator fee" value={formatPct(uponly?.creatorFeePct ?? null)} />
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
                <Button
                  asChild
                  size="default"
                  className={cn("min-h-11 flex-1 gap-2", !tradeUrl && "pointer-events-none opacity-60")}
                  disabled={!tradeUrl}
                >
                  <a
                    href={tradeUrl ?? "#"}
                    target={tradeUrl ? "_blank" : undefined}
                    rel={tradeUrl ? "noopener noreferrer" : undefined}
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
                    Buy on RISE
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  </a>
                </Button>
                <Button asChild variant="ghost" className="min-h-11 flex-1 gap-2 border border-border/55 bg-background/30">
                  <Link to="/uponly/overview">
                    <Sparkles className="h-3.5 w-3.5 opacity-80" aria-hidden />
                    Full thesis
                  </Link>
                </Button>
              </div>

              <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground/85 sm:text-xs">
                Live data via <strong className="font-medium text-foreground/85">public.rise.rich</strong>. The
                spotlight is for context — position sizing is your call. Not financial advice; you can lose your
                entire position.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
