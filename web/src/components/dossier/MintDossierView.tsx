import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import {
  ArrowUpRight,
  Bot,
  Copy,
  ExternalLink,
  Share2,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCompactUsd, formatPct } from "@/lib/dashboardOverviewAggregates";
import {
  askSyraPrompt,
  dossierSharePath,
  type TokensDossierPayload,
  type TokensMarketScore,
} from "@/lib/tokensDossierApi";
import { TokensOhlcvChart } from "@/components/dossier/TokensOhlcvChart";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { notify } from "@/lib/notify";

function pickMarketScore(data: TokensDossierPayload): TokensMarketScore | null {
  const fromInclude = data.includes?.risk?.ok ? data.includes.risk.data?.marketScore : null;
  if (fromInclude) return fromInclude;
  const fromMint = data.mintRisk?.risk?.marketScore;
  return fromMint ?? null;
}

function riskToneClass(tone?: string): string {
  if (tone === "safe") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (tone === "danger") return "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400";
  return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";
}

function truncateMint(mint: string, head = 6, tail = 4): string {
  if (mint.length <= head + tail + 3) return mint;
  return `${mint.slice(0, head)}…${mint.slice(-tail)}`;
}

export interface MintDossierViewProps {
  data: TokensDossierPayload;
  className?: string;
  /** Hides redundant kicker when parent page already shows breadcrumb nav. */
  embeddedInDetail?: boolean;
}

export function MintDossierView({ data, className, embeddedInDetail = false }: MintDossierViewProps) {
  const asset = data.asset;
  const stats = asset?.stats;
  const canonical = asset?.canonicalMarket;
  const price = stats?.price ?? canonical?.price;
  const change24 = stats?.priceChange24hPercent;
  const change1h = stats?.priceChange1hPercent;
  const risk = pickMarketScore(data);
  const markets =
    data.includes?.markets?.ok && Array.isArray(data.includes.markets.data?.markets)
      ? data.includes.markets.data!.markets!.slice(0, 8)
      : [];
  const mint = data.chartMint;
  const syraPrompt = encodeURIComponent(askSyraPrompt(data));
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${dossierSharePath(data)}`
      : dossierSharePath(data);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      notify.success("Link copied");
    } catch {
      notify.error("Could not copy link");
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card className={overviewCardShell}>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              {asset?.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt=""
                  className="h-14 w-14 rounded-2xl border border-border/60 bg-muted/30 object-cover shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-2xl border border-border/60 bg-muted/40 shrink-0" />
              )}
              <div className="min-w-0">
                {!embeddedInDetail ? (
                  <p className={overviewKickerClass}>Asset dossier</p>
                ) : null}
                <CardTitle
                  className={cn(
                    "font-semibold tracking-tight truncate",
                    embeddedInDetail ? "text-2xl sm:text-[1.75rem]" : "text-2xl sm:text-3xl",
                  )}
                >
                  {asset?.name ?? data.assetId}
                </CardTitle>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-foreground/85">{asset?.symbol ?? "—"}</span>
                  {asset?.category ? (
                    <Badge variant="secondary" className="font-normal capitalize">
                      {asset.category}
                    </Badge>
                  ) : null}
                  {!embeddedInDetail ? (
                    <span className="font-mono text-xs text-muted-foreground">{data.assetId}</span>
                  ) : null}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={copyShare}>
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                <Link to={`/?prompt=${syraPrompt}`}>
                  <Bot className="h-3.5 w-3.5" />
                  Ask Syra
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Price" value={price != null ? formatPriceUsd(price) : "—"} />
            <MetricTile
              label="24h"
              value={change24 != null ? formatPct(change24) : "—"}
              valueClassName={
                change24 != null
                  ? change24 >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                  : undefined
              }
              icon={
                change24 != null ? (
                  change24 >= 0 ? (
                    <TrendingUp className="h-4 w-4 opacity-70" />
                  ) : (
                    <TrendingDown className="h-4 w-4 opacity-70" />
                  )
                ) : null
              }
            />
            <MetricTile label="Market cap" value={formatCompactUsd(stats?.marketCap ?? canonical?.marketCap)} />
            <MetricTile label="24h volume" value={formatCompactUsd(stats?.volume24hUSD ?? canonical?.volume24hUSD)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-2 min-w-0">
              <p className={overviewKickerClass}>Price · 1H (7d)</p>
              <TokensOhlcvChart candles={data.ohlcv.candles} />
            </div>
            <div className="space-y-4">
              {risk ? (
                <div className={cn("rounded-2xl border p-4", riskToneClass(risk.tone))}>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Risk</span>
                  </div>
                  <p className="text-3xl font-semibold font-mono tabular-nums">
                    {risk.grade ?? "—"}
                    {risk.score != null ? (
                      <span className="text-lg text-muted-foreground ml-2">({Math.round(risk.score)})</span>
                    ) : null}
                  </p>
                  <p className="text-sm mt-1 font-medium">{risk.label ?? "Risk summary"}</p>
                  {risk.hasInsufficientData ? (
                    <p className="text-xs mt-2 opacity-80">Insufficient on-chain data for full scoring</p>
                  ) : null}
                </div>
              ) : null}
              {mint ? (
                <div className="rounded-2xl border border-border/55 bg-muted/20 p-4 space-y-2">
                  <p className={overviewKickerClass}>Primary mint</p>
                  <p className="font-mono text-xs break-all text-foreground/90">{mint}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 px-2"
                      onClick={() => {
                        void navigator.clipboard.writeText(mint).then(
                          () => notify.success("Mint copied"),
                          () => notify.error("Copy failed"),
                        );
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2" asChild>
                      <a
                        href={`https://solscan.io/token/${mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Solscan
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                  {asset?.primaryVariant?.liquidityTier ? (
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {asset.primaryVariant.liquidityTier}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
              <p className="text-[11px] text-muted-foreground">
                Data via{" "}
                <a
                  href="https://docs.tokens.xyz/v1/quickstart"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Tokens.xyz
                </a>
                {" · "}
                {new Date(data.fetchedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {markets.length > 0 ? (
        <Card className={overviewCardShell}>
          <CardHeader>
            <CardTitle className="text-lg">Top markets</CardTitle>
            <CardDescription>Liquidity venues for this asset on Solana</CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 pb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Liquidity</TableHead>
                  <TableHead className="text-right">24h vol</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {markets.map((m, i) => {
                  const addr = m.address;
                  const liq = m.liquidity;
                  const vol = m.volume24h;
                  return (
                    <TableRow key={addr ?? i}>
                      <TableCell className="font-mono text-xs">
                        {m.name ?? m.source ?? "Market"}
                        {addr ? (
                          <span className="block text-muted-foreground">{truncateMint(addr)}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-sm">
                        {formatCompactUsd(liq)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-sm">
                        {formatCompactUsd(vol)}
                      </TableCell>
                      <TableCell>
                        {addr ? (
                          <a
                            href={`https://solscan.io/account/${addr}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-muted-foreground hover:text-foreground"
                            aria-label="Open on Solscan"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </a>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {asset?.description ? (
        <Card className={overviewCardShell}>
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="w-full text-sm leading-relaxed text-muted-foreground">{asset.description}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function formatPriceUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) return formatCompactUsd(n);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 6 }).format(n);
}

function MetricTile({
  label,
  value,
  valueClassName,
  icon,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">{label}</p>
      <p className={cn("mt-1 font-mono text-xl font-semibold tabular-nums flex items-center gap-1.5", valueClassName)}>
        {value}
        {icon}
      </p>
    </div>
  );
}
