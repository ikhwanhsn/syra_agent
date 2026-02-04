import { Bot, Wrench, Puzzle } from "lucide-react";

type IconType = typeof Bot;

/** Compact placeholder for marketplace sections that are not yet available */
export function MarketplaceSectionSoon({
  description,
  icon: Icon,
}: {
  description: string;
  icon: IconType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground flex-1 min-w-0">{description}</p>
      <span className="text-xs font-medium text-muted-foreground/90 uppercase tracking-wider shrink-0">Coming soon</span>
    </div>
  );
}
