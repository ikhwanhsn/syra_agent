import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { Btc3SimilarityItem } from "@/lib/btc3/types";
import { formatReturn } from "@/lib/btc3/format";

export function HistoricalSimilarityPanel({
  items,
  currentEventTitle,
}: {
  items: Btc3SimilarityItem[];
  currentEventTitle: string | null;
}) {
  return (
    <PanelShell
      kicker="Historical Similarity"
      title="Similar Historical Events"
      description="Vector similarity search against historical macro events and BTC performance."
    >
      {currentEventTitle ? (
        <p className="mb-4 text-sm">
          <span className="text-muted-foreground">Current event: </span>
          <span className="font-medium">{currentEventTitle}</span>
        </p>
      ) : null}
      {items.length === 0 ? (
        <EmptyState message="No similarity matches yet. Configure embedding provider (OPENAI_API_KEY) and run pipeline." />
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={`${item.similarEventTitle}-${i}`}
              className="flex items-center gap-4 rounded-xl border border-border/40 bg-background/20 p-4"
            >
              <div className="flex-1">
                <p className="font-medium">{item.similarEventTitle}</p>
                {item.similarityScore != null ? (
                  <p className="text-xs text-muted-foreground">
                    Similarity: {(item.similarityScore * 100).toFixed(0)}%
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold">
                  {formatReturn(item.btcReturn)}
                </p>
                {item.durationDays != null ? (
                  <p className="text-[10px] text-muted-foreground">{item.durationDays}d duration</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
