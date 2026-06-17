import { GitBranchPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

function severityClass(severity: string): string {
  if (severity === "high") return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400";
  if (severity === "medium") return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  return "border-border/50 text-muted-foreground";
}

export interface PumpfunClusterPanelProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunClusterPanel({ data, className }: PumpfunClusterPanelProps) {
  const distribution = data.distribution.ok ? data.distribution.data : null;

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <GitBranchPlus className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Holder distribution</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            Syra on-chain concentration analysis (free RPC)
          </h3>
        </div>
      </div>

      {!distribution ? (
        <p className="text-sm text-muted-foreground">
          Distribution analysis unavailable
          {data.distribution.error ? `: ${data.distribution.error}` : ""}
        </p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">Decentralization score</span>
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-base tabular-nums",
                distribution.decentralizationScore >= 70
                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : distribution.decentralizationScore >= 40
                    ? "border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "border-red-500/30 text-red-600 dark:text-red-400",
              )}
            >
              {distribution.decentralizationScore} / 100
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Top 1", value: distribution.concentration.top1 },
              { label: "Top 3", value: distribution.concentration.top3 },
              { label: "Top 5", value: distribution.concentration.top5 },
              { label: "Top 10", value: distribution.concentration.top10 },
              { label: "Top 20", value: distribution.concentration.top20 },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-center"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</p>
                <p className="font-mono text-sm font-semibold tabular-nums">{row.value.toFixed(1)}%</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Top 10 share of supply</span>
              <span className="font-mono tabular-nums">{distribution.concentration.top10.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(100, distribution.concentration.top10)} className="h-2" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Whales ≥5%: {distribution.tiers.whale}</Badge>
            <Badge variant="secondary">Dolphins 1–5%: {distribution.tiers.dolphin}</Badge>
            <Badge variant="secondary">Shrimp &lt;1%: {distribution.tiers.shrimp}</Badge>
            <Badge variant="outline" className="font-mono text-xs">
              Sample: top {distribution.holderSampleSize} accounts
            </Badge>
          </div>

          {distribution.flags.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flags</p>
              {distribution.flags.map((flag) => (
                <div
                  key={flag.id}
                  className={cn("rounded-lg border px-3 py-2 text-sm", severityClass(flag.severity))}
                >
                  {flag.message}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No high-severity concentration flags detected in the top holder sample.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
