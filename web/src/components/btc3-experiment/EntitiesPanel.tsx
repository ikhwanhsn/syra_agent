import { Badge } from "@/components/ui/badge";
import { EmptyState, PanelShell } from "./shared/PanelShell";
import type { Btc3Entity } from "@/lib/btc3/types";

export function EntitiesPanel({ entities }: { entities: Btc3Entity[] }) {
  return (
    <PanelShell
      kicker="Entities"
      title="Extracted Entities"
      description="People, organizations, countries, assets, and macro concepts."
    >
      {entities.length === 0 ? (
        <EmptyState message="No entities extracted yet. Requires OPENROUTER_API_KEY for LLM extraction." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/30 px-3 py-1.5"
            >
              <span className="text-sm font-medium">{entity.name}</span>
              <Badge variant="outline" className="text-[10px] capitalize">
                {entity.type.replace(/_/g, " ")}
              </Badge>
              <span className="text-[10px] text-muted-foreground">×{entity.mentionCount}</span>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
