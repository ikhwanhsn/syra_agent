import { Link } from "@/lib/navigation";
import { ArrowLeft, Droplets, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";

export interface LpExperimentHeroProps {
  embedded?: boolean;
  loading?: boolean;
  failed?: boolean;
  onRefresh: () => void;
}

export function LpExperimentHero({
  embedded = false,
  loading = false,
  failed = false,
  onRefresh,
}: LpExperimentHeroProps) {
  return (
    <header className={cn(overviewCardShell, "overflow-hidden rounded-3xl ring-1 ring-violet-500/12")}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{ background: overviewAccentBackground("experiment") }}
        aria-hidden
      />

      <div className="relative px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-4">
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
                <Droplets className="h-3.5 w-3.5 text-violet-500" aria-hidden />
                Liquidity pools
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
                Earn fees from Meteora pools
              </h1>
              <p className="max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
                AI strategies practice on live pools with no money at risk. When you are ready, turn on your
                agent to deploy real SOL and earn trading fees.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {loading ? (
              <Badge variant="outline" className="rounded-lg border-border/50 bg-background/40 px-2.5 py-1">
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin opacity-80" aria-hidden />
                Syncing
              </Badge>
            ) : failed ? (
              <Badge variant="destructive" className="rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase">
                Offline
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-lg border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300"
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Live
              </Badge>
            )}
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
    </header>
  );
}
