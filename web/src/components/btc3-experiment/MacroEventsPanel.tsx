import { Badge } from "@/components/ui/badge";
import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { Btc3MacroEvent } from "@/lib/btc3/types";
import { formatRelativeTime } from "@/lib/btc3/format";

export function MacroEventsPanel({ events }: { events: Btc3MacroEvent[] }) {
  return (
    <PanelShell
      kicker="Macro Events"
      title="Clustered Events"
      description="Deduplicated macro event clusters from ingested news."
    >
      {events.length === 0 ? (
        <EmptyState message="No macro events clustered yet." />
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-border/40 bg-background/20 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-medium">{event.headline}</h3>
                <Badge variant="outline">{event.status}</Badge>
              </div>
              {event.summary ? (
                <p className="mt-2 text-sm text-muted-foreground">{event.summary}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {event.categories.map((c) => (
                  <Badge key={c} variant="secondary" className="text-[10px]">
                    {c}
                  </Badge>
                ))}
                <span className="text-[10px] text-muted-foreground">
                  {event.articleCount} articles · {formatRelativeTime(event.publishedAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
