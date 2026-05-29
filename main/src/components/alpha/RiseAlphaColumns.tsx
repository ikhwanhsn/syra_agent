import { cn } from "@/lib/utils";
import type { AgentTradeTier, AlphaScore, NarrativeTag, RiskFlag } from "@/lib/riseIntelligence";

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

export function AlphaScoreCell({ alpha, compact = false }: { alpha: AlphaScore; compact?: boolean }) {
  const tone = alpha.score >= 75 ? "up" : alpha.score >= 50 ? "neutral" : "down";
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-mono text-xs tabular-nums font-semibold",
            tone === "up" && "text-emerald-400",
            tone === "neutral" && "text-foreground",
            tone === "down" && "text-red-400",
          )}
        >
          {alpha.score.toFixed(1)}
        </span>
        {!compact ? (
          <span className="text-[0.65rem] text-muted-foreground">
            M {alpha.momentum.toFixed(0)} · F {alpha.flow.toFixed(0)} · D {alpha.depth.toFixed(0)}
          </span>
        ) : null}
      </div>
      <div className="mt-1 h-1.5 w-full max-w-[7rem] rounded-full bg-muted/45">
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

export function AgentTierBadge({ tier }: { tier: AgentTradeTier }) {
  const styles: Record<AgentTradeTier, string> = {
    ready: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
    watch: "border-amber-500/35 bg-amber-500/10 text-amber-100",
    avoid: "border-rose-500/35 bg-rose-500/10 text-rose-200",
  };
  const labels: Record<AgentTradeTier, string> = {
    ready: "Agent ready",
    watch: "Watch",
    avoid: "Avoid",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em]",
        styles[tier],
      )}
    >
      {labels[tier]}
    </span>
  );
}

export function RiskFlagsCell({ flags }: { flags: RiskFlag[] }) {
  if (flags.length === 0) {
    return <span className="text-[0.65rem] font-medium text-emerald-400">Clean</span>;
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
          title={flags.slice(3).map((f) => RISK_LABEL[f]).join(", ")}
          className="inline-flex items-center rounded-md border border-border/50 bg-muted/25 px-1.5 py-0.5 text-[0.6rem] text-muted-foreground"
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

export function NarrativeTagsCell({ tags }: { tags: NarrativeTag[] }) {
  if (tags.length === 0) {
    return <span className="text-[0.65rem] text-muted-foreground">—</span>;
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

export function ChangePill({ pct }: { pct: number | null }) {
  if (pct === null || !Number.isFinite(pct)) {
    return <span className="font-mono text-xs text-muted-foreground">—</span>;
  }
  const tone = pct > 0.01 ? "text-emerald-400" : pct < -0.01 ? "text-red-400" : "text-muted-foreground";
  const sign = pct > 0 ? "+" : "";
  return (
    <span className={cn("font-mono text-xs font-semibold tabular-nums", tone)}>
      {sign}
      {pct.toFixed(2)}%
    </span>
  );
}
