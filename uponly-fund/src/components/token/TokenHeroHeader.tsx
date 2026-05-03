import { useMemo } from "react";
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  MessageCircle,
  Share2,
  Star,
  Twitter,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChangePill,
  GlassCard,
  LevelChip,
  RiseTradeButton,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  shortenMint,
} from "@/components/rise/RiseShared";
import { toast } from "@/components/ui/sonner";
import { buildRiseTradeUrl, buildSolscanTokenUrl } from "@/lib/riseDashboardApi";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { useRiseOhlc } from "@/lib/RiseDashboardContext";
import { useWatchlist } from "@/lib/useWatchlist";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

function normalizeSparkline(
  candles: { time: number | null; close: number | null; open: number | null }[],
) {
  return candles
    .map((row, idx) => {
      const closeCandidate =
        typeof row.close === "number" && Number.isFinite(row.close)
          ? row.close
          : typeof row.open === "number" && Number.isFinite(row.open)
            ? row.open
            : null;
      if (closeCandidate === null) return null;
      const rawTime = typeof row.time === "number" && Number.isFinite(row.time) ? row.time : null;
      const tsMs =
        rawTime === null ? idx * 3_600_000 : rawTime > 1_000_000_000_000 ? rawTime : rawTime * 1000;
      return { time: tsMs, value: closeCandidate };
    })
    .filter((r): r is { time: number; value: number } => r !== null)
    .sort((a, b) => a.time - b.time);
}

function SparkTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value?: number }[];
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="rounded border border-border/60 bg-card/95 px-2 py-1 text-[0.65rem] shadow-sm backdrop-blur-sm">
      {formatPriceSmart(typeof v === "number" ? v : null)}
    </div>
  );
}

export function TokenHeroHeader({
  market,
  className,
}: {
  market: RiseMarketRow | null;
  className?: string;
}) {
  const { language } = useLanguage();
  const t = DASHBOARD_COPY[language].tokenDetail;
  const tradeUrl = market ? buildRiseTradeUrl(market.mint) : null;
  const tokenUrl = market ? buildSolscanTokenUrl(market.mint) : null;
  const addr = market?.marketAddress || market?.mint || null;
  const spark = useRiseOhlc(addr, "1h", 96);
  const sparkData = useMemo(() => normalizeSparkline(spark.data?.candles ?? []), [spark.data]);
  const { has, toggle } = useWatchlist();

  const copyMint = async () => {
    if (!market?.mint) return;
    try {
      await navigator.clipboard.writeText(market.mint);
      toast.success(t.mintCopied);
    } catch {
      toast.error(t.copyMint);
    }
  };

  const shareLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.linkCopied);
    } catch {
      toast.error(t.share);
    }
  };

  if (!market) {
    return (
      <GlassCard className={cn(className)}>
        <Skeleton className="h-28 w-full rounded-xl" />
      </GlassCard>
    );
  }

  const inWatch = has(market.mint);

  return (
    <GlassCard
      padded={false}
      className={cn(
        "sticky top-0 z-20 border-border/50 shadow-[0_8px_40px_-20px_hsl(0_0%_0%/0.45)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex flex-col gap-4 border-b border-border/40 bg-background/25 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <TokenAvatar imageUrl={market.imageUrl} symbol={market.symbol} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-balance font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {market.name || shortenMint(market.mint)}
                </h1>
                <span className="font-mono text-sm text-muted-foreground">${market.symbol || "—"}</span>
                <VerifiedBadge verified={market.isVerified} />
                <LevelChip level={market.level} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="rounded-md border border-border/45 bg-muted/20 px-2 py-1 font-mono text-[0.65rem] text-muted-foreground">
                  {shortenMint(market.mint, 6, 6)}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 px-2 text-xs"
                  onClick={() => void copyMint()}
                  aria-label={t.copyMint}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t.copyMint}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-foreground sm:text-4xl">
                  {formatPriceSmart(market.priceUsd)}
                </span>
                <ChangePill pct={market.priceChange24hPct} />
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 lg:w-[min(100%,20rem)]">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              1h · 96
            </p>
            <div className="h-24 w-full rounded-xl border border-border/35 bg-background/30">
              {spark.isPending ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : sparkData.length < 2 ? (
                <div className="flex h-full items-center justify-center text-[0.65rem] text-muted-foreground">
                  {t.chartNoData}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparkData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <XAxis dataKey="time" hide />
                    <YAxis dataKey="value" hide domain={["auto", "auto"]} />
                    <Tooltip content={<SparkTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--uof))"
                      strokeWidth={1.5}
                      fill="hsl(var(--uof) / 0.12)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tradeUrl ? (
            <Button asChild size="sm" className="h-9 gap-1.5">
              <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                {t.tradeOnRise}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
              </a>
            </Button>
          ) : (
            <RiseTradeButton mint={market.mint} size="md" />
          )}
          {tokenUrl ? (
            <Button asChild size="sm" variant="outline" className="h-9 gap-1.5 border-border/55 bg-background/40">
              <a href={tokenUrl} target="_blank" rel="noopener noreferrer">
                {t.solscan}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant={inWatch ? "default" : "outline"}
            className="h-9 gap-1.5 border-border/55"
            onClick={() => toggle(market.mint)}
            aria-pressed={inWatch}
          >
            <Star className={cn("h-3.5 w-3.5", inWatch && "fill-current")} />
            {inWatch ? t.watchlistRemove : t.watchlistAdd}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 border-border/55"
            onClick={() => void shareLink()}
          >
            <Share2 className="h-3.5 w-3.5" />
            {t.share}
          </Button>
          {market.twitterUrl ? (
            <Button asChild size="sm" variant="ghost" className="h-9 border border-border/40">
              <a href={market.twitterUrl} target="_blank" rel="noopener noreferrer">
                <Twitter className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null}
          {market.telegramUrl ? (
            <Button asChild size="sm" variant="ghost" className="h-9 border border-border/40">
              <a href={market.telegramUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null}
          {market.discordUrl ? (
            <Button asChild size="sm" variant="ghost" className="h-9 border border-border/40">
              <a href={market.discordUrl} target="_blank" rel="noopener noreferrer">
                {t.discord}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}
