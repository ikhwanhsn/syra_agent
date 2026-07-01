import { UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

export interface PumpfunFreshWalletPanelProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunFreshWalletPanel({ data, className }: PumpfunFreshWalletPanelProps) {
  const distribution = data.distribution.ok ? data.distribution.data : null;

  if (!distribution) {
    return (
      <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
        <div className="mb-4 flex items-start gap-3">
          <UserX className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className={overviewKickerClass}>Insider signals</p>
            <h3 className="text-sm font-medium text-muted-foreground">
              Bundled distribution and concentration heuristics
            </h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Distribution analysis unavailable
          {data.distribution.error ? `: ${data.distribution.error}` : ""}
        </p>
      </section>
    );
  }

  const bundledFlag = distribution.flags.find((f) => f.id === "bundled_distribution");
  const whalePct = distribution.tiers.whale;
  const dolphinPct = distribution.tiers.dolphin;
  const shrimpPct = distribution.tiers.shrimp;
  const bundledScore = bundledFlag ? (bundledFlag.severity === "high" ? 75 : bundledFlag.severity === "medium" ? 45 : 20) : 10;
  const tone =
    bundledFlag?.severity === "high" ? "danger" : bundledFlag?.severity === "medium" ? "warning" : "neutral";

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <UserX className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Insider signals</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            Holder tier breakdown and bundled wallet heuristics
          </h3>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              tone === "danger"
                ? "border-red-500/30 text-red-600 dark:text-red-400"
                : tone === "warning"
                  ? "border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
            )}
          >
            {bundledFlag ? bundledFlag.message : "No bundled distribution flag"}
          </Badge>
          <Badge variant="secondary" className="font-mono tabular-nums">
            Sample: {distribution.holderSampleSize} holders
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Whales (>5%)", value: whalePct, color: "bg-red-500/70" },
            { label: "Dolphins (1–5%)", value: dolphinPct, color: "bg-amber-500/70" },
            { label: "Shrimp (<1%)", value: shrimpPct, color: "bg-emerald-500/70" },
          ].map((tier) => (
            <div
              key={tier.label}
              className="rounded-lg border border-border/40 bg-background/30 px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{tier.label}</p>
              <p className="font-mono text-sm font-semibold tabular-nums">{tier.value} wallets</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Bundled distribution risk</span>
            <span className="font-mono tabular-nums">{bundledScore}%</span>
          </div>
          <Progress value={bundledScore} className="h-2" />
        </div>

        {distribution.flags.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flags</p>
            {distribution.flags.map((flag) => (
              <div
                key={flag.id}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  flag.severity === "high"
                    ? "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
                    : flag.severity === "medium"
                      ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
                      : "border-border/40 text-muted-foreground",
                )}
              >
                {flag.message}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
