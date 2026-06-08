import { Link } from "@/lib/navigation";
import { ArrowLeft, Loader2, RefreshCw, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PumpfunAlphaPeriod } from "@/lib/pumpfunAlphaTrendApi";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

const PERIOD_OPTIONS: ReadonlyArray<{ id: PumpfunAlphaPeriod; label: string }> = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

export interface PumpfunExperimentHeroProps {
  embedded?: boolean;
  period: PumpfunAlphaPeriod;
  onPeriodChange: (period: PumpfunAlphaPeriod) => void;
  loading?: boolean;
  failed?: boolean;
  onRefresh: () => void;
}

export function PumpfunExperimentHero({
  embedded = false,
  period,
  onPeriodChange,
  loading = false,
  failed = false,
  onRefresh,
}: PumpfunExperimentHeroProps) {
  return (
    <header className="border-0 bg-transparent shadow-none">
      <div className="px-0 py-2 sm:py-3">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {!embedded ? (
                <Link to="/overview" aria-label="Back to dashboard overview">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-border/55 bg-background/45 backdrop-blur-md"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              ) : null}
              <div
                className={cn(
                  overviewKickerClass,
                  "inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-1 backdrop-blur-md",
                )}
              >
                <Rocket className="h-3.5 w-3.5 text-violet-500" aria-hidden />
                Free practice mode
              </div>
              <Badge
                variant="outline"
                className="rounded-lg border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300"
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                No wallet needed
              </Badge>
            </div>

            <div className="space-y-2">
              {embedded ? (
                <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
                  Learn to trade Pump.fun tokens — risk free
                </h2>
              ) : (
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
                  Learn to trade Pump.fun tokens — risk free
                </h1>
              )}
              <p className="max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
                Watch AI strategies trade new tokens with fake money. Pick one, see how it performs,
                and learn what works — before you risk real SOL.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div
              className="flex rounded-2xl border border-border/55 bg-background/35 p-1"
              role="group"
              aria-label="Time period"
            >
              {PERIOD_OPTIONS.map(({ id, label }) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={period === id ? "secondary" : "ghost"}
                  className="h-9 min-w-14 rounded-xl px-3 text-sm font-medium"
                  onClick={() => onPeriodChange(id)}
                  disabled={loading}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {loading ? (
                <Badge variant="outline" className="rounded-lg border-border/50 bg-background/40 px-2.5 py-1">
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin opacity-80" aria-hidden />
                  Updating
                </Badge>
              ) : failed ? (
                <Badge variant="destructive" className="rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase">
                  Offline
                </Badge>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 gap-2 rounded-xl border-border/55 bg-background/45 px-4 font-medium backdrop-blur-md"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
