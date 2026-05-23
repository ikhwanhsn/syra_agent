import { Link } from "react-router-dom";
import { ArrowRight, Bot, Layers, Loader2, Settings2, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";

export interface AgentsPageHeroStats {
  userCount: number;
  totalAgents: number;
  solana: number;
}

export interface AgentsPageHeroProps {
  stats: AgentsPageHeroStats;
  isLoading?: boolean;
  isFetching?: boolean;
  className?: string;
}

interface HeroMetricProps {
  label: string;
  value: string;
  icon: LucideIcon;
  isLoading?: boolean;
}

function HeroMetric({ label, value, icon: Icon, isLoading }: HeroMetricProps) {
  return (
    <div className="group/metric flex min-w-0 flex-col gap-1.5 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-center justify-between gap-2">
        <p className={cn(overviewKickerClass, "truncate")}>{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/45 bg-background/40 text-muted-foreground transition-colors group-hover/metric:border-border/65 group-hover/metric:text-foreground">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-16 rounded-lg" />
      ) : (
        <p className={cn(overviewMetricValueClass, "text-xl sm:text-2xl")}>{value}</p>
      )}
    </div>
  );
}

export function AgentsPageHero({ stats, isLoading, isFetching, className }: AgentsPageHeroProps) {
  const showLoading = Boolean(isLoading);

  return (
    <header
      className={cn(
        overviewCardShell,
        "overflow-hidden rounded-3xl",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{ background: overviewAccentBackground("marketplace") }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.14) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.14) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 -top-24 h-[280px] w-[280px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.16), transparent 68%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 bottom-0 h-[200px] w-[200px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(var(--muted-foreground) / 0.1), transparent 65%)" }}
        aria-hidden
      />

      <div className="relative px-5 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
              Agent directory
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/55 bg-background/50 shadow-[inset_0_1px_0_0_hsl(var(--background)/0.8)] backdrop-blur-md sm:h-[3.25rem] sm:w-[3.25rem]">
                <Bot className="h-6 w-6 text-foreground" aria-hidden />
              </div>
              <div className="min-w-0 pt-0.5">
                <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem] lg:text-3xl">
                  Agents
                </h1>
                <p className="mt-2 max-w-2xl text-pretty text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                  Browse Solana agent wallets across Syra. Open any row for treasury balances, profile metadata, and
                  experiment telemetry as labs go live.
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {isFetching ? (
                <Badge
                  variant="outline"
                  className="rounded-lg border-border/50 bg-background/30 px-2.5 py-1 font-medium backdrop-blur-md"
                >
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin opacity-80" aria-hidden />
                  Syncing directory
                </Badge>
              ) : showLoading ? null : (
                <Badge
                  variant="secondary"
                  className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-1 font-medium backdrop-blur-md"
                >
                  {stats.totalAgents.toLocaleString()} wallets indexed
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-1.5 sm:items-end">
              <Button
                size="sm"
                className={cn(
                  "h-10 shrink-0 rounded-xl gap-2 px-4 font-medium",
                  "shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_10px_28px_-12px_hsl(var(--primary)/0.55)]",
                  "transition-[transform,box-shadow] duration-200 hover:-translate-y-px",
                  "hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.35),0_14px_32px_-10px_hsl(var(--primary)/0.6)]",
                )}
                asChild
              >
                <Link to="/dashboard/settings">
                  <Settings2 className="h-4 w-4" aria-hidden />
                  Setup agent
                  <ArrowRight className="h-4 w-4 opacity-80" aria-hidden />
                </Link>
              </Button>
              <p className="text-center text-[11px] text-muted-foreground/80 sm:text-right">
                Wallets, treasury, and behavior
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/45 bg-background/[0.02]">
        <div className="grid grid-cols-2 divide-x divide-border/40">
          <HeroMetric
            label="User wallets"
            value={stats.userCount.toLocaleString()}
            icon={Users}
            isLoading={showLoading}
          />
          <HeroMetric
            label="Solana agents"
            value={stats.totalAgents.toLocaleString()}
            icon={Layers}
            isLoading={showLoading}
          />
        </div>
      </div>
    </header>
  );
}
