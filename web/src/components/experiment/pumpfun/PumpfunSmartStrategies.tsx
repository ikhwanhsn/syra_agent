import { Brain, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import {

  PUMPFUN_EXIT_STRATEGIES,

  PUMPFUN_PERSONALITIES,

  entrySolForPersonality,

} from "@/lib/pumpfunExperimentModel";

import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";



/** Curated beginner-friendly picks — quality-scored entries with sensible exits. */

const BEGINNER_PICKS = [

  { p: 3, e: 4, label: "Best for beginners", reason: "Picks high-quality tokens and cuts losses fast" },

  { p: 4, e: 6, label: "Balanced", reason: "Quality filter with trailing stops on winners" },

  { p: 8, e: 8, label: "Conservative", reason: "Strictest scoring — fewer trades, lower risk" },

] as const;



export interface PumpfunSmartStrategiesProps {

  selectedPersonalityId: number;

  selectedExitId: number;

  onSelect: (personalityId: number, exitId: number) => void;

  className?: string;

}



export function PumpfunSmartStrategies({

  selectedPersonalityId,

  selectedExitId,

  onSelect,

  className,

}: PumpfunSmartStrategiesProps) {

  return (

    <div className={cn("space-y-4", className)}>

      <div className={cn(overviewCardShell, "flex gap-4 rounded-2xl p-4 sm:p-5")}>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">

          <Brain className="h-4 w-4" aria-hidden />

        </span>

        <div className="min-w-0 space-y-1">

          <p className="text-sm font-semibold text-foreground">Smart strategies score every token</p>

          <p className="text-sm leading-relaxed text-muted-foreground">

            They skip low-quality launches, cap how many positions are open, and exit losers quickly.

            Great starting point if you are new to memecoin trading.

          </p>

        </div>

      </div>



      <div className="grid gap-3 sm:grid-cols-3">

        {BEGINNER_PICKS.map(({ p, e, label, reason }) => {

          const buy = PUMPFUN_PERSONALITIES[p];

          const sell = PUMPFUN_EXIT_STRATEGIES[e];

          const active = selectedPersonalityId === p && selectedExitId === e;



          return (

            <button

              key={`${p}-${e}`}

              type="button"

              onClick={() => onSelect(p, e)}

              className={cn(

                overviewCardShell,

                "flex flex-col gap-3 rounded-2xl p-4 text-left transition-all duration-200",

                "hover:-translate-y-px hover:border-emerald-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",

                active && "border-emerald-500/40 ring-1 ring-emerald-500/25",

              )}

            >

              <div className="flex flex-wrap items-center gap-1.5">

                <Badge

                  variant="outline"

                  className="rounded-md border-emerald-500/35 bg-emerald-500/10 px-1.5 py-0 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300"

                >

                  {label}

                </Badge>

                <span className="text-[11px] text-muted-foreground">

                  {entrySolForPersonality(p)} SOL per trade

                </span>

              </div>

              <p className="text-sm font-semibold text-foreground">

                {buy?.name}

              </p>

              <p className="text-xs text-muted-foreground">Sells with: {sell?.name}</p>

              <p className="text-xs leading-relaxed text-muted-foreground">{reason}</p>

            </button>

          );

        })}

      </div>



      <div className="flex items-center gap-2 text-xs text-muted-foreground">

        <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />

        <span>Want more risk? Check sniper agents below, or browse all 225 combos in Live results.</span>

      </div>

    </div>

  );

}


