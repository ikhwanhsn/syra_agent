import { Link } from "react-router-dom";
import { Award, Clock, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface KolPointsInfoProps {
  /** Compact single-line style for forms and inline contexts. */
  compact?: boolean;
  className?: string;
}

function formatPointsExample(): string {
  return "2.5 / 2.0 / 1.5";
}

export function KolPointsInfo({ compact = false, className }: KolPointsInfoProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-3.5 py-3 text-sm",
          className,
        )}
      >
        <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">S3Labs Points:</span> +1 per campaign at
          end, plus up to +3 early-bird points split by submit order —{" "}
          <span className="text-foreground/90">earlier = more</span>.{" "}
          <Link to="/profile" className="text-primary hover:underline">
            View your profile
          </Link>
        </p>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "panel-glass rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] to-transparent p-5 sm:p-6",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 border border-primary/25">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="eyebrow">S3Labs Points</p>
          </div>
          <h3 className="font-semibold text-lg tracking-tight">
            Earn points on every campaign
          </h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-xl">
            SOL rewards pay by engagement at snapshot. Points are a separate wallet score that
            rewards participation and early submissions across all campaigns.
          </p>
        </div>
        <Link
          to="/profile"
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/15 transition-colors"
        >
          View profile
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Participation</p>
          <p className="text-2xl font-semibold tabular-nums text-primary mt-1">+1</p>
          <p className="text-xs text-muted-foreground mt-1">Every participant when campaign ends</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Early bird</p>
          <p className="text-2xl font-semibold tabular-nums text-primary mt-1">+3</p>
          <p className="text-xs text-muted-foreground mt-1">Pool split by submission order</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Example (3 KOLs)</p>
          <p className="text-lg font-semibold tabular-nums mt-1">{formatPointsExample()}</p>
          <p className="text-xs text-muted-foreground mt-1">Total pts per person (participation + early)</p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
        <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          Submit sooner to rank higher and capture more of the early-bird pool. Points credit
          automatically when the campaign finalizes — no extra steps.
        </span>
      </div>
    </section>
  );
}
