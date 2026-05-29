import { Link } from "@/lib/navigation";
import { ArrowLeft, Droplets, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentBackgroundLiveIndicator } from "@/components/experiment/AgentBackgroundLiveIndicator";
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
  openPositions?: number;
  onRefresh: () => void;
}

export function LpExperimentHero({
  embedded = false,
  loading = false,
  failed = false,
  openPositions = 0,
  onRefresh,
}: LpExperimentHeroProps) {
  const live = !failed && !loading;

  return (
    <header className={cn(overviewCardShell, "overflow-hidden rounded-3xl")}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background: `${overviewAccentBackground("experiment")}, radial-gradient(480px 200px at 85% 0%, hsl(262 83% 58% / 0.12), transparent 55%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />

      <div className="relative px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {!embedded ? (
                <Link to="/overview" aria-label="Back to dashboard overview">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-border/55 bg-background/40 backdrop-blur-md"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              ) : null}
              <div
                className={cn(
                  overviewKickerClass,
                  "inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/35 px-3 py-1 backdrop-blur-md",
                )}
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-500" aria-hidden />
                Meteora DLMM lab
              </div>
              <Badge
                variant="outline"
                className="rounded-lg border-violet-500/35 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200"
              >
                Beta
              </Badge>
              {live && openPositions > 0 ? (
                <AgentBackgroundLiveIndicator openPositions={openPositions} />
              ) : null}
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-500/10 shadow-[inset_0_1px_0_0_hsl(var(--background)/0.7)] backdrop-blur-md sm:h-[3.25rem] sm:w-[3.25rem]">
                <Droplets className="h-6 w-6 text-violet-600 dark:text-violet-400" aria-hidden />
              </div>
              <div className="min-w-0 pt-0.5">
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem] lg:text-3xl">
                  Liquidity pool agents
                </h1>
                <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                  AI strategies compete on live Meteora pools in simulation — no wallet risk. Fund your Syra agent
                  wallet below when you are ready to deploy real on-chain liquidity and earn trading fees.
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {loading ? (
                <Badge
                  variant="outline"
                  className="rounded-lg border-border/50 bg-background/35 px-2.5 py-1 font-medium backdrop-blur-md"
                >
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin opacity-80" aria-hidden />
                  Syncing
                </Badge>
              ) : failed ? (
                <Badge variant="destructive" className="rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase">
                  API offline
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="rounded-lg border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300"
                >
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  Live feed
                </Badge>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-2 rounded-xl border-border/55 bg-background/40 px-4 font-medium backdrop-blur-md transition-[transform,box-shadow] duration-200 hover:-translate-y-px"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh data
            </Button>
          </div>
        </div>
      </div>

    </header>
  );
}
