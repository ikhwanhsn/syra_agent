import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "@/lib/navigation";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import type { InvestOpportunity } from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

const tvlFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const apyFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function kindLabel(kind?: string): string {
  if (kind === "liquid_staking") return "Liquid staking";
  if (kind === "lending") return "Lending";
  if (kind === "lp") return "Liquidity";
  return "Onchain";
}

type InvestOpportunityCardProps = {
  opportunity: InvestOpportunity;
  onDeposit: (o: InvestOpportunity) => void;
};

export function InvestOpportunityCard({
  opportunity,
  onDeposit,
}: InvestOpportunityCardProps) {
  const executable = Boolean(opportunity.executable);
  const deepLink = opportunity.deepLinkUrl?.trim() || null;
  const accent = executable ? "marketplace" : "neutral";

  return (
    <li
      className={cn(
        overviewCardShell,
        "group min-w-0 flex flex-col transition-all duration-200 hover:border-border/80",
      )}
    >
      <div
        className={overviewCardGlow}
        style={{ background: overviewAccentBackground(accent) }}
        aria-hidden
      />
      <div className="relative z-[1] flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium tracking-tight text-foreground">
                  {opportunity.label}
                </p>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    executable
                      ? "border-foreground/15 bg-foreground/5 text-foreground"
                      : "border-border/50 bg-muted/30 text-muted-foreground",
                  )}
                >
                  {executable ? "In-app" : "External"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {kindLabel(opportunity.kind)} · Solana
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={overviewKickerClass}>APY</p>
              {opportunity.apyPct != null ? (
                <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground sm:text-xl">
                  {apyFmt.format(opportunity.apyPct)}%
                </p>
              ) : (
                <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-muted-foreground sm:text-xl">
                  —
                </p>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {opportunity.description}
          </p>

          <p className="text-xs text-muted-foreground/90">
            TVL{" "}
            {opportunity.tvlUsd != null ? tvlFmt.format(opportunity.tvlUsd) : "—"}
            {opportunity.yieldSource ? (
              <span className="text-muted-foreground/70"> · {opportunity.yieldSource}</span>
            ) : null}
          </p>
        </div>

        {executable ? (
          <Button
            className="h-10 w-full rounded-full sm:h-9 sm:w-auto"
            onClick={() => onDeposit(opportunity)}
          >
            Deposit
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
          </Button>
        ) : deepLink ? (
          <Button
            variant="outline"
            className="h-10 w-full rounded-full sm:h-9 sm:w-auto"
            asChild
          >
            <a href={deepLink} target="_blank" rel="noopener noreferrer">
              Open {opportunity.label}
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-10 w-full rounded-full sm:h-9 sm:w-auto"
            asChild
          >
            <Link to="/wallet">Fund</Link>
          </Button>
        )}
      </div>
    </li>
  );
}
