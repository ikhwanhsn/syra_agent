import { Link } from "@/lib/navigation";
import { ArrowLeft, Droplets, FlaskConical, Loader2, RefreshCw, Sparkles, Wallet } from "lucide-react";
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

const anchorLinks = [
  { href: "#real-agent", label: "Live agent", icon: Wallet },
  { href: "#simulation", label: "Paper lab", icon: FlaskConical },
] as const;

export function LpExperimentHero({
  embedded = false,
  loading = false,
  failed = false,
  openPositions = 0,
  onRefresh,
}: LpExperimentHeroProps) {
  const live = !failed && !loading;

  return (
    <header className={cn(overviewCardShell, "overflow-hidden rounded-3xl ring-1 ring-violet-500/12")}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.6]"
        style={{
          background: `${overviewAccentBackground("experiment")}, radial-gradient(520px 220px at 88% -5%, hsl(262 83% 58% / 0.14), transparent 58%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
        }}
        aria-hidden
      />

      <div className="relative px-5 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {!embedded ? (
                <Link to="/overview" aria-label="Back to dashboard overview">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-border/55 bg-background/45 backdrop-blur-md transition-transform hover:-translate-y-px"
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

            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/15 to-violet-500/5 shadow-[inset_0_1px_0_0_hsl(var(--background)/0.8)] backdrop-blur-md sm:h-14 sm:w-14">
                <Droplets className="h-7 w-7 text-violet-600 dark:text-violet-400" aria-hidden />
              </div>
              <div className="min-w-0 pt-0.5">
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] lg:text-[2.15rem]">
                  Liquidity pool agents
                </h1>
                <p className="mt-2.5 max-w-2xl text-pretty text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                  AI strategies compete on live Meteora pools in simulation — no wallet risk. Fund your Syra agent
                  wallet when you are ready to deploy real on-chain liquidity and earn trading fees.
                </p>
                <nav className="mt-4 flex flex-wrap gap-2" aria-label="Page sections">
                  {anchorLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={href}
                      href={href}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/40 px-3 py-1.5",
                        "text-xs font-medium text-muted-foreground backdrop-blur-md transition-[color,border-color,transform] duration-200",
                        "hover:-translate-y-px hover:border-violet-500/30 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 text-violet-500/80" aria-hidden />
                      {label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {loading ? (
                <Badge
                  variant="outline"
                  className="rounded-lg border-border/50 bg-background/40 px-2.5 py-1 font-medium backdrop-blur-md"
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
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  Live feed
                </Badge>
              )}
              {live && openPositions > 0 ? (
                <span className="rounded-lg border border-border/45 bg-background/35 px-2.5 py-1 text-xs tabular-nums text-muted-foreground backdrop-blur-md">
                  <span className="font-medium text-foreground">{openPositions}</span> open sim position
                  {openPositions === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 gap-2 rounded-xl border-border/55 bg-background/45 px-4 font-medium backdrop-blur-md transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-px hover:border-violet-500/25 hover:shadow-sm"
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
