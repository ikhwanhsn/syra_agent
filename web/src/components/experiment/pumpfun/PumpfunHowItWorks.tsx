import { Coins, LineChart, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PUMPFUN_EXPERIMENT_START_SOL } from "@/lib/pumpfunExperimentModel";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

const STEPS = [
  {
    icon: Zap,
    title: "Spot alpha runners",
    description: "Syra flags tokens pumping hard on live tape — the alpha leading the meta.",
  },
  {
    icon: Coins,
    title: "Find beta plays",
    description: "Aligned tokens with narrative overlap and lower MC — potential followers that may pump like alpha.",
  },
  {
    icon: LineChart,
    title: "Paper-trade both lanes",
    description: `Strategies start with ${PUMPFUN_EXPERIMENT_START_SOL} SOL fake money and test alpha vs beta entries side by side.`,
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
