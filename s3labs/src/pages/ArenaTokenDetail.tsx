import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Globe,
  LayoutGrid,
  MessageCircle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { ThemeProvider } from "@/contexts/ThemeContext";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplicationModal from "@/components/ApplicationModal";
import TelegramCommunityModal from "@/components/TelegramCommunityModal";
import { useTelegramPopup } from "@/hooks/useTelegramPopup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { findArenaProjectByMint, isArenaListedMint } from "@/lib/s3labs-arena-projects";
import { bestPairByMint, fetchSolanaTokenPairs } from "@/lib/dexscreener";
import { cn } from "@/lib/utils";
import MeteorEffect from "@/components/MeteorEffect";
import MouseEffects from "@/components/MouseEffects";
import { useTheme } from "@/contexts/ThemeContext";

function formatUsd(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: n < 1 ? 8 : 2,
  }).format(n);
}

function formatCompactUsd(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPct(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function formatPairAge(createdAtMs: number | undefined, t: (id: string, en: string) => string): string {
  if (createdAtMs === undefined || Number.isNaN(createdAtMs)) return "—";
  const diffMs = Date.now() - createdAtMs;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(diffMs / 3600000);
  if (Math.abs(hours) < 48) return rtf.format(-hours, "hour");
  const days = Math.round(diffMs / 86400000);
  if (Math.abs(days) < 60) return rtf.format(-days, "day");
  const months = Math.round(days / 30);
  return rtf.format(-months, "month");
}

function socialIcon(type: string | undefined) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("twitter") || t === "x") return MessageCircle;
  if (t.includes("telegram")) return MessageCircle;
  if (t.includes("discord")) return MessageCircle;
  return Globe;
}

function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-card/50 p-4", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

const ArenaTokenDetailContent = () => {
  const { mint: mintParam } = useParams<{ mint: string }>();
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { open: telegramOpen, dismiss: dismissTelegram, setOpen: setTelegramOpen } = useTelegramPopup();

  const mint = useMemo(() => {
    if (!mintParam) return null;
    try {
      return decodeURIComponent(mintParam);
    } catch {
      return mintParam;
    }
  }, [mintParam]);

  const listed = Boolean(mint && isArenaListedMint(mint));
  const project = mint ? findArenaProjectByMint(mint) : undefined;

  const {
    data: pairs = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["dexscreener", "arena-token", mint],
    queryFn: () => fetchSolanaTokenPairs([mint!]),
    enabled: listed && Boolean(mint),
    staleTime: 60_000,
  });

  const pair = useMemo(() => {
    if (!mint || pairs.length === 0) return null;
    return bestPairByMint(pairs).get(mint) ?? null;
  }, [pairs, mint]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mint]);

  if (!mint || !mintParam) {
    return <Navigate to="/arenass" replace />;
  }

  if (!listed || !project) {
    return <Navigate to="/arenass" replace />;
  }

  const priceUsd = pair ? Number.parseFloat(pair.priceUsd) : Number.NaN;
  const change24 = pair?.priceChange?.h24;
  const up = change24 !== undefined && change24 > 0;
  const down = change24 !== undefined && change24 < 0;

  const copyMint = async () => {
    try {
      await navigator.clipboard.writeText(mint);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div
      className={cn(
        "relative min-h-screen",
        theme === "light" ? "landing-light-bg" : "bg-background",
      )}
    >
      <MeteorEffect />
      <MouseEffects />
      <div className="relative z-10">
        <Header onApplyClick={() => setIsModalOpen(true)} />
        <main className="pt-20 lg:pt-24">
          <div className="border-b border-border bg-muted/20">
            <div className="container py-8 lg:py-12">
              <Link
                to="/arenass"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {"Back to Arena"}
              </Link>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-64 max-w-full" />
                  <Skeleton className="h-5 w-96 max-w-full" />
                </div>
              ) : (
                <div className="flex flex-wrap items-start gap-4">
                  {pair?.info?.imageUrl ? (
                    <img
                      src={pair.info.imageUrl}
                      alt=""
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-border bg-muted shrink-0"
                    />
                  ) : (
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground ring-2 ring-border shrink-0">
                      {project.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        <LayoutGrid className="w-3 h-3 text-primary" />
                        S3Labs
                      </span>
                      {pair?.dexId ? (
                        <Badge variant="secondary" className="capitalize font-normal">
                          {pair.dexId}
                        </Badge>
                      ) : null}
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground break-words">
                      {pair?.baseToken.name ?? project.name}
                    </h1>
                    <p className="text-muted-foreground mt-1 font-mono text-sm">
                      {pair?.baseToken.symbol ?? "—"} · {project.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => void copyMint()}>
                      <Copy className="w-4 h-4" />
                      {"Copy mint"}
                    </Button>
                    {pair?.url ? (
                      <Button size="sm" className="gap-2" asChild>
                        <a href={pair.url} target="_blank" rel="noopener noreferrer">
                          DexScreener
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => void refetch()}
                      disabled={isFetching}
                    >
                      <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                      {"Refresh"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {pair?.info?.header ? (
            <div className="container -mt-4 pb-2">
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted aspect-[21/9] max-h-56 sm:max-h-64">
                <img
                  src={pair.info.header}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          ) : null}

          <div className="container py-10 lg:py-14 space-y-10">
            {isError && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    {"Could not load data"}
                  </CardTitle>
                  <CardDescription>
                    {error instanceof Error ? error.message : "Please try again."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => void refetch()}>
                    {"Retry"}
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-card overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{"Contract address"}</CardTitle>
                <CardDescription>
                  {"Solana token mint (base58)."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <code className="block break-all rounded-lg bg-muted/80 px-4 py-3 text-sm font-mono text-foreground border border-border/60">
                  {mint}
                </code>
              </CardContent>
            </Card>

            {!isLoading && !pair && !isError && (
              <Card className="border-border/60 bg-muted/20">
                <CardHeader>
                  <CardTitle>{"Market data not available"}</CardTitle>
                  <CardDescription>
                    {"DexScreener has no listed pair for this mint yet. Check back later or use an explorer."}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {pair ? (
              <>
                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    {"Market overview"}
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Stat
                      label={"Price (USD)"}
                      value={Number.isFinite(priceUsd) ? formatUsd(priceUsd) : "—"}
                    />
                    <Stat
                      label={"Price (native)"}
                      value={
                        pair.quoteToken.symbol
                          ? `${pair.priceNative} ${pair.quoteToken.symbol}`
                          : pair.priceNative
                      }
                    />
                    <Stat
                      label="24h"
                      value={change24 === undefined ? "—" : formatPct(change24)}
                      sub={
                        change24 === undefined
                          ? undefined
                          : up
                            ? "Up"
                            : down
                              ? "Down"
                              : undefined
                      }
                      className={cn(
                        change24 !== undefined &&
                          up &&
                          "border-emerald-500/20 bg-emerald-500/5",
                        change24 !== undefined &&
                          down &&
                          "border-red-500/20 bg-red-500/5",
                      )}
                    />
                    <Stat
                      label={"Market cap"}
                      value={formatCompactUsd(pair.marketCap)}
                    />
                    <Stat label="FDV" value={formatCompactUsd(pair.fdv)} />
                    <Stat
                      label={"Liquidity"}
                      value={formatCompactUsd(pair.liquidity?.usd)}
                    />
                    <Stat
                      label={"Volume 24h"}
                      value={formatCompactUsd(pair.volume?.h24)}
                    />
                    <Stat
                      label={"Pair created"}
                      value={formatPairAge(pair.pairCreatedAt, t)}
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    {"Volume & transactions"}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Card className="border-border/60 bg-card/60">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{"Volume"}</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">5m</p>
                          <p className="font-mono font-medium">{formatCompactUsd(pair.volume?.m5)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">1h</p>
                          <p className="font-mono font-medium">{formatCompactUsd(pair.volume?.h1)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">6h</p>
                          <p className="font-mono font-medium">{formatCompactUsd(pair.volume?.h6)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">24h</p>
                          <p className="font-mono font-medium">{formatCompactUsd(pair.volume?.h24)}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-border/60 bg-card/60">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{"Buys / sells"}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {(
                          [
                            ["5m", pair.txns.m5],
                            ["1h", pair.txns.h1],
                            ["6h", pair.txns.h6],
                            ["24h", pair.txns.h24],
                          ] as const
                        ).map(([label, tx]) => (
                          <div key={label} className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground font-medium">{label}</span>
                            <span className="font-mono tabular-nums">
                              <span className="text-emerald-600 dark:text-emerald-400">{tx.buys}</span>
                              <span className="text-muted-foreground mx-1">/</span>
                              <span className="text-red-600 dark:text-red-400">{tx.sells}</span>
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    {"Price change"}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {(
                      [
                        ["5m", pair.priceChange.m5],
                        ["1h", pair.priceChange.h1],
                        ["6h", pair.priceChange.h6],
                        ["24h", pair.priceChange.h24],
                      ] as const
                    ).map(([label, pct]) => {
                      const positive = pct > 0;
                      const negative = pct < 0;
                      return (
                        <div
                          key={label}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-4 py-3 min-w-[100px]",
                            positive && "border-emerald-500/25 bg-emerald-500/5",
                            negative && "border-red-500/25 bg-red-500/5",
                            !positive && !negative && "border-border/60 bg-muted/30",
                          )}
                        >
                          <span className="text-xs text-muted-foreground font-medium">{label}</span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums",
                              positive && "text-emerald-600 dark:text-emerald-400",
                              negative && "text-red-600 dark:text-red-400",
                            )}
                          >
                            {positive ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                            {negative ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                            {formatPct(pct)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Card className="border-border/60 bg-card/60">
                  <CardHeader>
                    <CardTitle className="text-base">{"Pair"}</CardTitle>
                    <CardDescription>
                      {"Quote token and pair address."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {pair.labels?.map((label) => (
                        <Badge key={label} variant="outline">
                          {label}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{"Quote token"}</p>
                        <p className="font-medium">{pair.quoteToken.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{pair.quoteToken.symbol}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{"Pair address"}</p>
                        <code className="text-xs break-all font-mono">{pair.pairAddress}</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {(pair.info?.websites?.length || pair.info?.socials?.length) ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {pair.info?.websites && pair.info.websites.length > 0 ? (
                      <Card className="border-border/60 bg-card/60">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            {"Websites & docs"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {pair.info.websites.map((w, i) => (
                            <a
                              key={`${w.url}-${i}`}
                              href={w.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors group"
                            >
                              <span className="font-medium truncate">{w.label ?? w.url}</span>
                              <ExternalLink className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100" />
                            </a>
                          ))}
                        </CardContent>
                      </Card>
                    ) : null}
                    {pair.info?.socials && pair.info.socials.length > 0 ? (
                      <Card className="border-border/60 bg-card/60">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-primary" />
                            {"Social"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {pair.info.socials.map((s, i) => {
                            const Icon = socialIcon(s.type);
                            return (
                              <a
                                key={`${s.url}-${i}`}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors group"
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                                  <span className="truncate capitalize">{s.type ?? "Link"}</span>
                                </span>
                                <ExternalLink className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100" />
                              </a>
                            );
                          })}
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                ) : null}

                {pair.info?.openGraph ? (
                  <Card className="border-border/60 bg-card/60 overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-base">Open Graph</CardTitle>
                      <CardDescription>{"Preview image from DexScreener."}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <a
                        href={pair.info.openGraph}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-border/60 overflow-hidden max-w-md hover:opacity-95 transition-opacity"
                      >
                        <img src={pair.info.openGraph} alt="" className="w-full h-auto object-cover" loading="lazy" />
                      </a>
                    </CardContent>
                  </Card>
                ) : null}
              </>
            ) : null}

            <Separator className="opacity-50" />
            <p className="text-center text-xs text-muted-foreground max-w-2xl mx-auto">
              {"Data from DexScreener. Not financial advice; verify before acting."}
            </p>
          </div>
        </main>
        <Footer />
        <ApplicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <TelegramCommunityModal
          open={telegramOpen}
          onOpenChange={setTelegramOpen}
          onDismiss={dismissTelegram}
        />
      </div>
    </div>
  );
};

const ArenaTokenDetail = () => (
  <ThemeProvider>
    <ArenaTokenDetailContent />
    </ThemeProvider>
);

export default ArenaTokenDetail;
