import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlphaScore, NarrativeTag, RiskFlag } from "./types";

const RISK_LABEL: Record<RiskFlag, string> = {
  LowLiquidity: "Low liq",
  HighFee: "High fee",
  NewAge: "New",
  LowLocked: "Low locked",
  Unverified: "Unverified",
  DisableSell: "Sell off",
};

const NARRATIVE_LABEL: Record<NarrativeTag, string> = {
  Verified: "Verified",
  FloorBacked: "Floor",
  Momentum: "Momentum",
  Cooldown: "Cooldown",
  BlueChip: "Blue chip",
  Microcap: "Microcap",
  Fresh: "Fresh",
};

export function AlphaCell({ alpha, compact = false }: { alpha: AlphaScore; compact?: boolean }) {
  const tone = alpha.score >= 75 ? "up" : alpha.score >= 50 ? "neutral" : "down";
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-mono text-xs tabular-nums",
            tone === "up" && "text-emerald-400",
            tone === "neutral" && "text-foreground",
            tone === "down" && "text-red-400",
          )}
        >
          {alpha.score.toFixed(1)}
        </span>
        {!compact ? (
          <span className="text-[0.65rem] text-muted-foreground">
            M {alpha.momentum.toFixed(0)} · F {alpha.flow.toFixed(0)}
          </span>
        ) : null}
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-muted/45">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            tone === "up" && "bg-emerald-400/85",
            tone === "neutral" && "bg-foreground/70",
            tone === "down" && "bg-red-400/80",
          )}
          style={{ width: `${Math.max(2, Math.min(100, alpha.score))}%` }}
        />
      </div>
    </div>
  );
}

const RISK_TYPES_MAX = 6;

export function RiskCell({
  flags,
  presentation = "inline",
  flagLabels,
  watchlistCopy,
}: {
  flags: RiskFlag[];
  /** `watchlist` — rich meter + pills for terminal sidebar. */
  presentation?: "inline" | "watchlist";
  flagLabels?: Partial<Record<RiskFlag, string>>;
  watchlistCopy?: { riskHeading: string; clearState: string };
}) {
  const resolve = (flag: RiskFlag) => flagLabels?.[flag] ?? RISK_LABEL[flag];

  if (presentation === "watchlist") {
    const heading = watchlistCopy?.riskHeading ?? "Risk";
    const clearState = watchlistCopy?.clearState ?? "No active flags";

    if (flags.length === 0) {
      return (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/18 bg-emerald-500/[0.05] px-3 py-3 sm:px-3.5 sm:py-3.5 dark:border-emerald-500/14 dark:bg-emerald-500/[0.07]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/22 bg-emerald-500/[0.1] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08)]">
            <Check className="h-4 w-4 stroke-[2.25] text-emerald-600 dark:text-emerald-400" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-1 pt-0.5">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{heading}</p>
            <p className="text-[0.8125rem] font-medium leading-snug text-emerald-800 dark:text-emerald-300">{clearState}</p>
          </div>
        </div>
      );
    }

    const visible = flags.slice(0, 4);
    const overflow = flags.length - visible.length;
    const meterPct = Math.min(100, Math.max(8, (flags.length / RISK_TYPES_MAX) * 100));

    return (
      <div className="min-w-0 space-y-2.5 px-0.5 pt-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{heading}</span>
          <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums leading-none">
            <span className="font-semibold text-foreground">{flags.length}</span>
            <span className="text-muted-foreground">/{RISK_TYPES_MAX}</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/60 shadow-[inset_0_1px_3px_hsl(0_0%_0%/0.14)] dark:bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500/95 via-orange-500/90 to-rose-600/95 shadow-[0_0_14px_rgba(244,63,94,0.2)] transition-[width] duration-500 ease-out"
            style={{ width: `${meterPct}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {visible.map((flag) => (
            <span
              key={flag}
              className="inline-flex max-w-full items-center truncate rounded-full border border-rose-500/18 bg-rose-500/[0.07] px-2.5 py-1 text-[0.65rem] font-medium leading-none tracking-tight text-rose-900 shadow-sm dark:border-rose-400/22 dark:bg-rose-500/[0.11] dark:text-rose-50"
            >
              {resolve(flag)}
            </span>
          ))}
          {overflow > 0 ? (
            <span
              title={flags.slice(4).map((f) => resolve(f)).join(", ")}
              className="inline-flex items-center rounded-full border border-border/50 bg-muted/35 px-2.5 py-1 text-[0.65rem] font-medium tabular-nums leading-none text-muted-foreground"
            >
              +{overflow}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (flags.length === 0) {
    return <span className="text-[0.65rem] text-emerald-400">Clean</span>;
  }

  const visible = flags.slice(0, 3);
  const overflow = flags.length - visible.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((flag) => (
        <span
          key={flag}
          className="inline-flex items-center rounded-md border border-red-500/35 bg-red-500/10 px-1.5 py-0.5 text-[0.6rem] text-red-300"
        >
          {resolve(flag)}
        </span>
      ))}
      {overflow > 0 ? (
        <span
          title={flags.slice(3).map((f) => resolve(f)).join(", ")}
          className="inline-flex items-center rounded-md border border-border/50 bg-muted/25 px-1.5 py-0.5 text-[0.6rem] text-muted-foreground"
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

export function NarrativeCell({ tags }: { tags: NarrativeTag[] }) {
  if (tags.length === 0) {
    return <span className="text-[0.65rem] text-muted-foreground">None</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.slice(0, 2).map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-md border border-border/50 bg-background/40 px-1.5 py-0.5 text-[0.6rem] text-foreground/85"
        >
          {NARRATIVE_LABEL[tag]}
        </span>
      ))}
      {tags.length > 2 ? (
        <span className="inline-flex items-center rounded-md border border-border/50 bg-muted/20 px-1.5 py-0.5 text-[0.6rem] text-muted-foreground">
          +{tags.length - 2}
        </span>
      ) : null}
    </div>
  );
}
