import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AssetIntelligenceEventItem } from "@/lib/tokensDossierApi";
import {
  intelligenceAccentGlow,
  intelligenceGlowClass,
  intelligencePanelShell,
} from "@/components/assets/intelligence/intelligenceStyles";
const COMPACT_LIMIT = 4;

export function AssetEventsCard({
  items,
  className,
}: {
  items: readonly AssetIntelligenceEventItem[];
  className?: string;
}) {
  const visible = items.slice(0, COMPACT_LIMIT);
  if (visible.length === 0) return null;

  return (
    <Card className={cn(intelligencePanelShell, className)}>
      <div
        className={intelligenceGlowClass}
        style={{ background: intelligenceAccentGlow("neutral") }}
        aria-hidden
      />
      <CardHeader className="relative pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">Events</CardTitle>
            <CardDescription className="text-xs">Upcoming and recent crypto events</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0 text-[11px] font-medium">
            {visible.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3 pt-0">        {visible.map((item, i) => {
          const title = item.event_name?.trim() || "Event";
          return (
            <div
              key={`${title}-${item.date ?? i}`}
              className="flex gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0"
            >
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug line-clamp-2">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[item.date, item.ticker].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
