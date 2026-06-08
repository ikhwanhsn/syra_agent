import { Crosshair, GraduationCap, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PUMPFUN_PERSONALITIES,
  SNIPER_PERSONALITY_IDS,
  entrySolForPersonality,
} from "@/lib/pumpfunExperimentModel";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

const SNIPER_META: ReadonlyArray<{
  id: number;
  icon: LucideIcon;
  stage: string;
  tagline: string;
}> = [
  {
    id: 0,
    icon: Rocket,
    stage: "Brand new",
    tagline: "Catches tokens right after they launch",
  },
  {
    id: 5,
    icon: Crosshair,
    stage: "On the curve",
    tagline: "Buys while the bonding curve is still active",
  },
  {
    id: 1,
    icon: GraduationCap,
    stage: "Just graduated",
    tagline: "Enters after a token completes its bonding curve",
  },
];

export interface PumpfunSniperAgentsProps {
  selectedPersonalityId: number;
  onSelect: (personalityId: number) => void;
  className?: string;
}

export function PumpfunSniperAgents({
  selectedPersonalityId,
  onSelect,
  className,
}: PumpfunSniperAgentsProps) {
  const snipers = SNIPER_META.filter((s) => SNIPER_PERSONALITY_IDS.has(s.id));

  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {snipers.map(({ id, icon: Icon, stage, tagline }) => {
        const meta = PUMPFUN_PERSONALITIES[id];
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
              "hover:-translate-y-px hover:border-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active && "border-violet-500/40 ring-1 ring-violet-500/25",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-violet-600 dark:text-violet-400">
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
              <p className="text-xs font-medium text-violet-600 dark:text-violet-400">{stage}</p>
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
