import { useEffect, useState } from "react";
import { ArrowRightLeft, Loader2, RefreshCw, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  agentBiasLabel,
  agentBiasTone,
  isNasdaqReferenceFallback,
  type AgentBias,
  type SpcxConfig,
  type SpcxIntelligenceReport,
} from "@/lib/spcxApi";
import { spcxKickerClass } from "@/components/spcx/spcxStyles";

function formatUpdatedAgo(computedAt: string | undefined): string | null {
  if (!computedAt) return null;
  const ts = new Date(computedAt).getTime();
  if (!Number.isFinite(ts)) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  return `Updated ${new Date(ts).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`;
}

export function SpcxHero({
  config,
  report,
  refreshing,
  onRefresh,
  onBuyClick,
}: {
  config?: SpcxConfig;
  report?: SpcxIntelligenceReport;
  refreshing: boolean;
  onRefresh: () => void;
  onBuyClick?: () => void;
}) {
  const bias = report?.agentBias;
  const nasdaqFallback = report ? isNasdaqReferenceFallback(report) : false;
  const [updatedAgo, setUpdatedAgo] = useState<string | null>(() =>
    formatUpdatedAgo(report?.computedAt),
  );

  useEffect(() => {
    setUpdatedAgo(formatUpdatedAgo(report?.computedAt));
    const id = setInterval(() => {
      setUpdatedAgo(formatUpdatedAgo(report?.computedAt));
    }, 1000);
    return () => clearInterval(id);
  }, [report?.computedAt]);

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card/95 to-muted/[0.06] shadow-[0_24px_80px_-48px_rgba(0,0,0,0.85)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.18) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-[280px] w-[280px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.1), transparent 65%)" }}
      />

      <div className="relative px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1 backdrop-blur-md">
                <Rocket className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className={spcxKickerClass}>SpaceX IPO hub</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  Live tracking
                </span>
              </div>
              {bias ? (
                <Badge className={cn("rounded-lg border capitalize", agentBiasTone(bias as AgentBias))}>
                  {agentBiasLabel(bias as AgentBias)}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-[2.5rem]">
                {config?.title ?? "SpaceX IPO — your complete guide"}
              </h1>
              <p className="max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Track the SpaceX stock price, compare safe ways to buy, and avoid scam tokens — all
                explained in plain English.
              </p>
            </div>

            {config ? (
              <p className="text-xs text-muted-foreground/90">
                Ticker {config.nasdaqTicker ?? "SPCX"}
                {updatedAgo ? ` · ${updatedAgo}` : ""}
                {nasdaqFallback && config.ipoReferencePriceUsd != null
                  ? ` · IPO reference $${config.ipoReferencePriceUsd} (Nasdaq feed offline)`
                  : ""}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              size="default"
              className="gap-2 rounded-xl px-5 font-semibold shadow-sm"
              onClick={onBuyClick}
            >
              <ArrowRightLeft className="h-4 w-4" />
              How to buy
            </Button>
            <Button
              variant="outline"
              size="default"
              className="gap-2 rounded-xl border-border/60 bg-background/60"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 opacity-80" />
              )}
              Refresh prices
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
