import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Landmark, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fetchRiseAlphaIntel } from "@/lib/riseAlphaIntelApi";
import {
  buildRiseTradeUrl,
  buildSolscanTokenUrl,
  progressTowardTarget,
  RISE_ALPHA_TOKEN,
  shortenMint,
} from "@/lib/riseToken";

const STALE_MS = 180_000;

function formatCompactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `$${Math.round(n / 1000)}k`;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatSignedCompactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const v = Math.abs(n);
  let body: string;
  if (v >= 1_000_000) body = `$${(v / 1_000_000).toFixed(1)}M`;
  else if (v >= 10_000) body = `$${Math.round(v / 1000)}k`;
  else body = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  return `${sign}${body}`;
}

function formatPctSigned(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function formatTs(tsMs: number | null | undefined): string {
  if (tsMs == null || !Number.isFinite(tsMs)) return "—";
  try {
    return new Date(tsMs).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function KpiTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/55 bg-gradient-to-br from-card/95 via-card/85 to-muted/[0.06] shadow-[0_1px_0_0_hsl(var(--border)/0.45)] backdrop-blur-sm",
        className,
      )}
    >
      <CardContent className="relative p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">{label}</p>
        <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
        {hint ? <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/80">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function RiseAlphaTabPanel() {
  const batchQ = useQuery({
    queryKey: ["alpha", "rise-intel"],
    queryFn: () => fetchRiseAlphaIntel(),
    staleTime: STALE_MS,
  });

  const rise = batchQ.data?.rise;
  const token = batchQ.data?.token;
  const tradeUrl = token ? buildRiseTradeUrl(token.mint) : null;
  const progressPct = progressTowardTarget(token?.marketCapUsd ?? null, RISE_ALPHA_TOKEN.targetMarketCapUsd);

  return (
    <div className="space-y-8 pb-10 sm:pb-12 lg:pb-14">
      <Card className="relative overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-br from-sky-950/25 via-card/90 to-muted/[0.05] shadow-[0_24px_70px_-46px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <CardContent className="relative space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/55 bg-background/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Landmark className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                Rise Alpha desk
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                ${RISE_ALPHA_TOKEN.symbol} on RISE
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/90">
                Live market data for the RISE-listed Up Only tranche — same token as the Up Only fund desk. Borrow pool
                metrics are modeled paper lenses for the Rise experiment (not on-chain execution).
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <p className="text-xs text-muted-foreground/75">
                  Updated {batchQ.data?.nowMs ? formatTs(batchQ.data.nowMs) : "—"}
                </p>
                <Button variant="secondary" size="sm" className="h-8 rounded-lg px-3 text-xs font-semibold" asChild>
                  <Link to="/dashboard/rise-experiment">Open Rise experiment</Link>
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-2 rounded-xl border-border/70 px-3 font-semibold"
              onClick={() => void batchQ.refetch()}
              disabled={batchQ.isFetching}
            >
              {batchQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {batchQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[118px] rounded-2xl" />
          ))}
        </div>
      ) : rise && token ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiTile label="Market cap" value={formatCompactUsd(token.marketCapUsd)} hint="Live RISE market cap." className="ring-1 ring-sky-500/10" />
          <KpiTile label="Floor price" value={formatCompactUsd(token.floorPriceUsd)} hint="Protocol floor (USD) when published." />
          <KpiTile label="24h change" value={formatPctSigned(token.priceChange24hPct)} hint="Price variation over 24h." />
          <KpiTile label="Borrow pool (modeled)" value={formatCompactUsd(rise.borrowPoolUsd)} hint="Vault depth sized off live $UPONLY MC." />
          <KpiTile label="Borrow APR" value={`${rise.borrowAprPct.toFixed(2)}%`} hint="Variable borrow for levered clips." />
          <KpiTile label="24h sleeve flow" value={formatSignedCompactUsd(rise.flow24hUsd)} hint="Modeled net flow into the Alpha sleeve." />
        </div>
      ) : null}

      {batchQ.isError ? (
        <Card className="border-destructive/25 bg-destructive/[0.03]">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-foreground">Unable to load $UPONLY market</p>
            <p className="text-sm text-muted-foreground">{(batchQ.error as Error)?.message || "Request failed."}</p>
            <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={() => void batchQ.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!batchQ.isLoading && token ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="border-border/55 bg-card/60 backdrop-blur-md xl:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">On-chain token</CardTitle>
              <CardDescription>RISE-listed $UPONLY — the only mint tracked by Rise Alpha.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {token.imageUrl ? (
                  <img
                    src={token.imageUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl border border-border/50 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-muted/30 font-mono text-lg font-bold text-foreground">
                    {token.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-foreground">
                      {token.name}
                      <span className="ml-2 font-mono text-sm text-muted-foreground">${token.symbol}</span>
                    </p>
                    {token.isVerified ? (
                      <Badge variant="outline" className="border-emerald-500/35 bg-emerald-500/10 text-emerald-200">
                        Verified
                      </Badge>
                    ) : null}
                    {token.level != null ? (
                      <Badge variant="outline" className="font-mono text-[10px]">
                        L{Math.round(token.level)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{shortenMint(token.mint, 8, 8)}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/35 bg-background/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Spot</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{formatCompactUsd(token.priceUsd)}</p>
                </div>
                <div className="rounded-xl border border-border/35 bg-background/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Volume 24h</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{formatCompactUsd(token.volume24hUsd)}</p>
                </div>
                <div className="rounded-xl border border-border/35 bg-background/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Holders</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                    {token.holders != null ? token.holders.toLocaleString() : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/35 bg-background/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Road to $100M</p>
                  <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{progressPct.toFixed(1)}%</p>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500/80 to-primary/80 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {tradeUrl ? (
                  <Button asChild size="sm" className="rounded-xl">
                    <a href={tradeUrl} target="_blank" rel="noopener noreferrer">
                      Trade on RISE
                      <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>
                ) : null}
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <a href={buildSolscanTokenUrl(token.mint)} target="_blank" rel="noopener noreferrer">
                    Solscan
                    <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/55 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Rise Alpha target</CardTitle>
              <CardDescription>Single mint for the Rise-only sniper in the experiment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-4">
                <p className="font-mono text-sm font-semibold text-foreground">${token.symbol}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground break-all">{token.mint}</p>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Same SPL mint as Up Only fund on rise.rich. Universal desk still reads Pumpfun graduates; Rise Alpha only
                  this token.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
