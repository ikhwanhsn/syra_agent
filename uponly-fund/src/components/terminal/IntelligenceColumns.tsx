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

export function RiskCell({ flags }: { flags: RiskFlag[] }) {
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
          {RISK_LABEL[flag]}
        </span>
      ))}
      {overflow > 0 ? (
        <span
          title={flags.slice(3).map((flag) => RISK_LABEL[flag]).join(", ")}
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
