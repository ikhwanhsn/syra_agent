import { Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import type { AssetIntelligencePayload } from "@/lib/tokensDossierApi";
import { IntelligenceEmptyMessage } from "@/components/assets/intelligence/IntelligenceEmptyMessage";

export function AssetEventsList({
  events,
  className,
}: {
  events: AssetIntelligencePayload["events"];
  className?: string;
}) {
  const items = events.items;
  const hasData = items.length > 0;

  return (
    <Card className={cn(overviewCardShell, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight">Events</CardTitle>
        <CardDescription className="text-xs">
          Calendar and news-derived catalysts for this token
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-3">
            {items.map((item, i) => {
              const title = item.event_name?.trim() || "Event";
              const text = item.event_text?.trim();
              return (
                <div
                  key={`${title}-${item.date ?? i}`}
                  className="flex gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0"
                >
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{title}</p>
                    {text && text !== title ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {text}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[item.date, item.source, item.ticker].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <IntelligenceEmptyMessage>
            {events.error ?? "No upcoming or recent events for this asset yet."}
          </IntelligenceEmptyMessage>
        )}
      </CardContent>
    </Card>
  );
}
