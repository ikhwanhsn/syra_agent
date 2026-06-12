import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  agentBiasLabel,
  formatFeedTimestamp,
  type SpcxIntelligenceReport,
} from "@/lib/spcxApi";
import { cn } from "@/lib/utils";

function FeedRow({ entry, compact }: { entry: SpcxIntelligenceReport; compact?: boolean }) {
  const ts = entry.tickAt || entry.computedAt;
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-muted/[0.04] px-3.5 py-3",
        compact && "py-2.5",
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{formatFeedTimestamp(ts)}</span>
        <Badge variant="outline" className="rounded-lg capitalize text-[10px]">
          {agentBiasLabel(entry.agentBias)}
        </Badge>
      </div>
      <p
        className={cn(
          "mt-1.5 text-sm leading-relaxed text-foreground/90",
          compact && "line-clamp-2 text-[13px]",
        )}
      >
        {entry.agentTake || "No update for this tick."}
      </p>
    </div>
  );
}

const MAX_VISIBLE_ENTRIES = 4;

export function SpcxDecisionFeed({
  entries,
  loading,
  error,
  onRetry,
  retrying,
  embedded = false,
}: {
  entries: SpcxIntelligenceReport[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
  embedded?: boolean;
}) {
  const olderEntries = entries.slice(embedded ? 1 : 0, embedded ? MAX_VISIBLE_ENTRIES : MAX_VISIBLE_ENTRIES);

  if (embedded && !error && !loading && olderEntries.length === 0 && entries.length <= 1) {
    return null;
  }

  const content = (
    <>
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-5 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-foreground">Updates unavailable</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
          {onRetry ? (
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={onRetry} disabled={retrying}>
              <RefreshCw className={cn("h-3.5 w-3.5", retrying && "animate-spin")} />
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {loading && !entries.length && !error ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {embedded && olderEntries.length > 0 ? (
        <div className="space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Earlier updates
          </p>
          {olderEntries.map((entry, i) => (
            <FeedRow key={entry.id ?? `${entry.computedAt ?? "tick"}-${i}`} entry={entry} compact />
          ))}
        </div>
      ) : null}

      {!embedded && !error
        ? olderEntries.map((entry, i) => (
            <FeedRow key={entry.id ?? `${entry.computedAt ?? "tick"}-${i}`} entry={entry} />
          ))
        : null}

      {!embedded && !olderEntries.length && !loading && !error ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No updates yet — tap Refresh prices to start.
        </p>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-3">{content}</div>;
  }

  return <div className="space-y-3">{content}</div>;
}
