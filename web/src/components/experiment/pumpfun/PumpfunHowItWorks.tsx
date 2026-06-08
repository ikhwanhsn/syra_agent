import { Coins, LineChart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PUMPFUN_EXPERIMENT_START_SOL } from "@/lib/pumpfunExperimentModel";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

const STEPS = [
  {
    icon: Zap,
    title: "We spot new tokens",
    description: "Fresh Pump.fun launches appear automatically on the live feed.",
  },
  {
    icon: Coins,
    title: "Strategies buy with fake SOL",
    description: `Each strategy starts with ${PUMPFUN_EXPERIMENT_START_SOL} SOL of play money — nothing real is spent.`,
  },
  {
    icon: LineChart,
    title: "You see who wins",
    description: "Compare returns, pick a style you like, and learn what works before going live.",
  },
] as const;

export function PumpfunHowItWorks({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {STEPS.map(({ icon: Icon, title, description }, i) => (
        <article
          key={title}
          className={cn(
            overviewCardShell,
            "relative flex flex-col gap-3 rounded-2xl p-4 transition-[border-color,box-shadow] duration-200 hover:border-violet-500/20",
          )}
        >
          <span className="absolute right-4 top-4 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground/50">
            {i + 1}
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-violet-600 dark:text-violet-400">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
