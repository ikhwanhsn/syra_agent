import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  SCALPER_SOURCE_LABELS,
  type ScalperMarketRegime,
  type ScalperOpportunity,
  type ScalperScanDiagnostics,
} from "@/lib/scalperApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface ScalperOpportunityFeedProps {
  opportunities: ScalperOpportunity[];
  scannedAt: string | null;
  regime?: ScalperMarketRegime | null;
  diagnostics?: ScalperScanDiagnostics | null;
  loading?: boolean;
  className?: string;
}

function regimeBadgeClass(regime: ScalperMarketRegime["regime"] | undefined): string {
  if (regime === "trend_up") return "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15";
  if (regime === "trend_down") return "bg-rose-500/15 text-rose-400 hover:bg-rose-500/15";
  return "bg-amber-500/15 text-amber-400 hover:bg-amber-500/15";
}

function emptyStateMessage(
  regime: ScalperMarketRegime | null | undefined,
  diagnostics: ScalperScanDiagnostics | null | undefined,
): string {
  if (regime && !regime.allowLong) {
    const why = regime.reason || diagnostics?.regimeReason || "longs paused";
    return `Regime: ${regime.regime.replace("_", " ")} — ${why}. Waiting for a clearer long setup.`;
  }

  const raw = diagnostics?.rawCandidates ?? 0;
  const dropped = diagnostics?.droppedReasons?.length ?? 0;
  if (raw > 0) {
    const topReason = diagnostics?.droppedReasons?.[0]?.reason;
    return `${raw} candidate${raw === 1 ? "" : "s"} scanned, ${dropped} filtered${
      topReason ? ` (e.g. ${topReason})` : ""
    }. Waiting for scores above threshold.`;
  }

  if (diagnostics?.regimeReason) {
    return `No candidates this scan · ${diagnostics.regimeReason}`;
  }

  return "No opportunities above threshold right now.";
}

export function ScalperOpportunityFeed({
  opportunities,
  scannedAt,
  regime,
  diagnostics,
  loading,
  className,
}: ScalperOpportunityFeedProps) {
  return (
    <section className={cn(overviewCardShell, "rounded-2xl p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Opportunity feed</h2>
          <p className="text-xs text-muted-foreground">
            Confluence-ranked signals · trend/RSI filters · cost-aware entry gate
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {regime ? (
            <Badge className={cn("text-[10px]", regimeBadgeClass(regime.regime))}>
              {regime.regime.replace("_", " ")}
              {regime.allowLong ? " · longs on" : " · longs off"}
            </Badge>
          ) : null}
          {scannedAt ? (
            <span className="text-[10px] text-muted-foreground">
              Scanned {new Date(scannedAt).toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading opportunities…</p>
      ) : opportunities.length === 0 ? (
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{emptyStateMessage(regime, diagnostics)}</p>
          {diagnostics && (diagnostics.rawCandidates > 0 || Object.keys(diagnostics.perSource ?? {}).length > 0) ? (
            <p className="text-[10px] text-muted-foreground/80">
              Sources:{" "}
              {Object.entries(diagnostics.perSource)
                .filter(([, n]) => n > 0)
                .map(([src, n]) => `${src}=${n}`)
                .join(" · ") || "none"}
              {diagnostics.mergedCount != null ? ` · merged ${diagnostics.mergedCount}` : ""}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Rationale</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opp) => {
                const confluence = opp.meta?.confluenceCount ?? (opp.rationale.startsWith("Confluence") ? 2 : 1);
                return (
                <TableRow key={`${opp.source}-${opp.symbol}-${opp.score}`}>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {SCALPER_SOURCE_LABELS[opp.source]}
                      </Badge>
                      {confluence >= 2 ? (
                        <Badge className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/15 text-[10px]">
                          {confluence}× confluence
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{opp.symbol}</TableCell>
                  <TableCell className="capitalize">{opp.side}</TableCell>
                  <TableCell>{(opp.score * 100).toFixed(0)}</TableCell>
                  <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                    {opp.rationale}
                  </TableCell>
                  <TableCell>
                    {opp.taken ? (
                      <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">Taken</Badge>
                    ) : opp.skippedReason ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Skipped · {opp.skippedReason}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
