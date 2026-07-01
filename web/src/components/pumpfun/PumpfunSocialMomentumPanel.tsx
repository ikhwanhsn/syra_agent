import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { MemecoinAnalysisPayload } from "@/lib/pumpfunAnalysisApi";
import { cn } from "@/lib/utils";

function formatReach(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export interface PumpfunSocialMomentumPanelProps {
  data: MemecoinAnalysisPayload;
  className?: string;
}

export function PumpfunSocialMomentumPanel({ data, className }: PumpfunSocialMomentumPanelProps) {
  const kol = data.kolShills.ok ? data.kolShills.data : null;

  if (!kol) {
    return (
      <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
        <div className="mb-4 flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className={overviewKickerClass}>Social momentum</p>
            <h3 className="text-sm font-medium text-muted-foreground">
              Mention velocity and KOL reach from X search
            </h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Social data unavailable
          {data.kolShills.error ? `: ${data.kolShills.error}` : ""}
        </p>
      </section>
    );
  }

  const { summary } = kol;
  const mentionVelocity =
    summary.searchWindowDays != null && summary.searchWindowDays > 0
      ? summary.topKolsCount / summary.searchWindowDays
      : null;
  const sentimentTone =
    summary.overallSentiment === "positive" || summary.directShills > summary.warnings
      ? "safe"
      : summary.warnings > summary.directShills
        ? "danger"
        : "warning";

  return (
    <section className={cn(overviewCardShell, "p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start gap-3">
        <TrendingUp className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className={overviewKickerClass}>Social momentum</p>
          <h3 className="text-sm font-medium text-muted-foreground">
            KOL mention velocity and combined reach
          </h3>
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              sentimentTone === "safe"
                ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : sentimentTone === "danger"
                  ? "border-red-500/30 text-red-600 dark:text-red-400"
                  : "border-amber-500/30 text-amber-700 dark:text-amber-400",
            )}
          >
            {summary.overallSentiment || "Neutral sentiment"}
          </Badge>
          {summary.searchWindowDays != null ? (
            <Badge variant="secondary">{summary.searchWindowDays}d window</Badge>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "KOL mentions", value: String(summary.topKolsCount) },
            { label: "Combined reach", value: formatReach(summary.combinedReach) },
            { label: "Direct shills", value: String(summary.directShills) },
            { label: "Warnings", value: String(summary.warnings) },
            ...(mentionVelocity != null
              ? [{ label: "Mentions / day", value: mentionVelocity.toFixed(1) }]
              : []),
          ].map((row) => (
            <div
              key={row.label}
              className="rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-center"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</p>
              <p className="font-mono text-sm font-semibold tabular-nums">{row.value}</p>
            </div>
          ))}
        </div>

        {kol.topKols.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent activity
            </p>
            <div className="space-y-2">
              {kol.topKols.slice(0, 3).map((row) => (
                <div
                  key={row.username}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">@{row.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.tweetsAboutToken} tweet{row.tweetsAboutToken !== 1 ? "s" : ""} ·{" "}
                      {formatReach(row.followers)} followers
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {row.promotionType}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent KOL mentions detected in search window.</p>
        )}
      </div>
    </section>
  );
}
