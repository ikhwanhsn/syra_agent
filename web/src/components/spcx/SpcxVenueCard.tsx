import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  dexScreenerTokenUrl,
  formatPctChange,
  formatSpread,
  formatUsd,
  formatUsdCompact,
  solscanAccountUrl,
  spreadBadgeVariant,
  venueStatusLabel,
  xstocksAssetUrl,
  type SpcxVenueQuote,
  type VenueStatus,
} from "@/lib/spcxApi";
import { spcxCardQuietClass } from "@/components/spcx/spcxStyles";

function venueStatusTone(status: VenueStatus): string {
  switch (status) {
    case "live":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "halted":
      return "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200";
    case "impersonator_warning":
      return "border-destructive/35 bg-destructive/10 text-destructive";
    default:
      return "border-border/50 bg-muted/30 text-muted-foreground";
  }
}

function pctTone(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "text-muted-foreground";
  if (n > 0) return "text-emerald-600 dark:text-emerald-400";
  if (n < 0) return "text-destructive";
  return "text-muted-foreground";
}

export function SpcxVenueCard({ venue }: { venue: SpcxVenueQuote }) {
  const [copied, setCopied] = useState(false);
  const linksDisabled = venue.status === "impersonator_warning" || !venue.mint;

  const copyMint = async () => {
    if (!venue.mint) return;
    await navigator.clipboard.writeText(venue.mint);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(spcxCardQuietClass, "flex h-full flex-col p-4 transition-colors hover:border-border/60 sm:p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold capitalize text-foreground">{venue.venue}</p>
            <Badge variant="outline" className="rounded-lg font-mono text-[11px]">
              {venue.symbol}
            </Badge>
          </div>
          {venue.isin ? (
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">ISIN {venue.isin}</p>
          ) : null}
        </div>
        <Badge className={cn("shrink-0 rounded-lg border", venueStatusTone(venue.status))}>
          {venueStatusLabel(venue.status)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/40 bg-background/30 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Token price
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {venue.priceUsd != null ? formatUsd(venue.priceUsd) : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border/40 bg-background/30 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            vs stock
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
            {venue.spreadPct != null ? (
              <Badge variant={spreadBadgeVariant(venue.spreadLabel)} className="tabular-nums">
                {formatSpread(venue.spreadPct)}
              </Badge>
            ) : (
              "—"
            )}
          </p>
          {venue.spreadUsd != null ? (
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {formatUsd(venue.spreadUsd)} vs Nasdaq
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border/35 bg-muted/[0.04] px-2 py-1.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Available</p>
          <p className="mt-0.5 font-mono text-xs font-medium tabular-nums">
            {formatUsdCompact(venue.liquidityUsd)}
          </p>
        </div>
        <div className="rounded-lg border border-border/35 bg-muted/[0.04] px-2 py-1.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Traded 24h</p>
          <p className="mt-0.5 font-mono text-xs font-medium tabular-nums">
            {formatUsdCompact(venue.volume24h)}
          </p>
        </div>
        <div className="rounded-lg border border-border/35 bg-muted/[0.04] px-2 py-1.5">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Change 24h</p>
          <p className={cn("mt-0.5 font-mono text-xs font-medium tabular-nums", pctTone(venue.priceChange24h))}>
            {formatPctChange(venue.priceChange24h)}
          </p>
        </div>
      </div>

      {venue.priceSource ? (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Source: {venue.priceSource.replace(/_/g, " ")}
        </p>
      ) : null}

      {venue.mint ? (
        <div className="mt-2 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground" title={venue.mint}>
            {venue.mint}
          </p>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyMint}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {venue.mint && !linksDisabled ? (
          <>
            <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg px-2 text-[11px]" asChild>
              <a href={solscanAccountUrl(venue.mint)} target="_blank" rel="noopener noreferrer">
                Solscan <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg px-2 text-[11px]" asChild>
              <a href={dexScreenerTokenUrl(venue.mint)} target="_blank" rel="noopener noreferrer">
                DexScreener <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
            </Button>
          </>
        ) : null}
        {venue.venue === "xstocks" && !linksDisabled ? (
          <Button variant="outline" size="sm" className="h-7 gap-1 rounded-lg px-2 text-[11px]" asChild>
            <a href={xstocksAssetUrl(venue.symbol)} target="_blank" rel="noopener noreferrer">
              xStocks <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </Button>
        ) : null}
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{venue.statusNote}</p>
      {venue.description ? (
        <p className="mt-2 text-xs leading-relaxed text-foreground/75">{venue.description}</p>
      ) : null}
      {venue.accessNote ? (
        <p className="mt-2 text-xs leading-relaxed text-foreground/75">{venue.accessNote}</p>
      ) : null}
    </div>
  );
}
