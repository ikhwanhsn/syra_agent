import { Crosshair, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RISE_PERSONALITIES,
  SNIPER_PERSONALITY_IDS,
  entrySolForPersonality,
} from "@/lib/riseExperimentModel";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

const SNIPER_META: ReadonlyArray<{
  id: number;
  icon: LucideIcon;
  stage: string;
  tagline: string;
}> = [
  {
    id: 0,
    icon: Sparkles,
    stage: "Fresh launch",
    tagline: "Catches brand-new RISE listings early",
  },
  {
    id: 1,
    icon: ShieldCheck,
    stage: "High quality",
    tagline: "Only enters verified, high-score tokens",
  },
  {
    id: 2,
    icon: Crosshair,
    stage: "On watchlist",
    tagline: "Tracks promising tokens before they run",
  },
];

export interface RiseSniperAgentsProps {
  selectedPersonalityId: number;
  onSelect: (personalityId: number) => void;
  className?: string;
}

export function RiseSniperAgents({
  selectedPersonalityId,
  onSelect,
  className,
}: RiseSniperAgentsProps) {
  const snipers = SNIPER_META.filter((s) => SNIPER_PERSONALITY_IDS.has(s.id));

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {snipers.map(({ id, icon: Icon, stage, tagline }) => {
        const meta = RISE_PERSONALITIES[id];
        const active = selectedPersonalityId === id;
        const entrySol = entrySolForPersonality(id);

        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              overviewCardShell,
              "flex flex-col gap-3 rounded-2xl p-4 text-left transition-all duration-200",
              "hover:-translate-y-px hover:border-sky-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active && "border-sky-500/40 ring-1 ring-sky-500/25",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-sky-600 dark:text-sky-400">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <Badge
                variant="outline"
                className="shrink-0 rounded-md border-sky-500/35 bg-sky-500/10 px-1.5 py-0 text-[10px] font-semibold uppercase text-sky-700 dark:text-sky-300"
              >
                Sniper
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-tight text-foreground">{meta?.name}</p>
              <p className="text-xs font-medium text-sky-600 dark:text-sky-400">{stage}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{tagline}</p>
            </div>

            <p className="mt-auto text-[11px] text-muted-foreground">
              {entrySol} SOL per trade
            </p>
          </button>
        );
      })}
    </div>
  );
}
