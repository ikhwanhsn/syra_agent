import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { computeProgressToHundredM, TARGET_MARKET_CAP_USD } from "@/data/riseUpOnly";
import { useRiseUpOnlyMarket } from "@/lib/RiseUpOnlyMarketContext";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import { useAnimatedNumber } from "@/lib/useAnimatedNumber";
import { cn } from "@/lib/utils";

function StripItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "min-w-0 px-2.5 py-2.5 sm:px-4 sm:py-3",
        accent && "bg-success/[0.06] min-[400px]:bg-success/[0.04]",
      )}
    >
      <p className="text-[0.6rem] font-medium uppercase leading-tight tracking-wider text-muted-foreground [overflow-wrap:anywhere] min-[400px]:text-[0.65rem] sm:tracking-wider">
        {label}
      </p>
      <p
        className="mt-1 min-w-0 break-words text-xs font-semibold leading-snug tabular-nums text-foreground [overflow-wrap:anywhere] min-[400px]:text-sm"
      >
        {value}
      </p>
    </div>
  );
}

export function LiveMarketStrip({ className }: { className?: string }) {
  const { data: v } = useRiseUpOnlyMarket();
  const progress = useMemo(() => computeProgressToHundredM(v), [v]);
  const reduce = useReducedMotion() ?? false;
  const animPct = useAnimatedNumber(
    v.marketCapUsd === null ? null : progress.pctToward100M,
    { duration: 1000, disabled: reduce || v.marketCapUsd === null },
  );

  const pctDisplay =
    v.marketCapUsd === null ? "—" : `${animPct.toFixed(1).replace(/\.0$/, "")}%`;

  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-sm backdrop-blur-md",
        className,
      )}
    >
      <div className="grid min-w-0 max-w-full auto-rows-fr grid-cols-1 divide-y divide-border/25 min-[400px]:grid-cols-2 min-[400px]:divide-y-0 min-[400px]:divide-x min-[400px]:divide-border/20 sm:grid-cols-3 lg:grid-cols-6">
        <StripItem label="Price" value={formatUsd(v.priceUsd)} />
        <StripItem label="Market cap" value={formatUsd(v.marketCapUsd, { compact: false })} />
        <StripItem label="24h volume" value={formatUsd(v.volume24hUsd, { compact: false })} />
        <StripItem label="Holders" value={formatInt(v.holders)} />
        <StripItem label="Floor (ref.)" value={formatUsd(v.floorPriceUsd)} />
        <StripItem
          label="Progress to $100M"
          value={pctDisplay}
          accent
        />
      </div>
      <div className="h-1.5 w-full bg-muted/30">
        <div
          className="h-full origin-left bg-gradient-to-r from-success/50 to-foreground/40 transition-[width] duration-1000"
          style={{
            width: v.marketCapUsd === null ? "0%" : `${Math.min(100, progress.pctToward100M)}%`,
          }}
          role="progressbar"
          aria-valuenow={v.marketCapUsd === null ? 0 : Math.round(progress.pctToward100M)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progress toward 100M USD market cap target"
        />
      </div>
      <p className="break-words border-t border-border/30 px-2.5 py-2.5 text-balance text-[0.6rem] leading-relaxed text-muted-foreground [overflow-wrap:anywhere] min-[400px]:px-3 sm:px-4 sm:text-left sm:text-xs">
        Target market cap: {formatUsd(TARGET_MARKET_CAP_USD, { compact: false })} — stage:{" "}
        <span className="font-medium text-foreground">{progress.currentStageLabel}</span>
        {progress.nextMilestoneLabel ? (
          <>
            {" "}
            · next: {progress.nextMilestoneLabel}
          </>
        ) : null}
        .
      </p>
    </div>
  );
}
