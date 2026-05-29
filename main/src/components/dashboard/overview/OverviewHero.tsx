import type { ReactNode } from "react";
import { LayoutDashboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface OverviewHeroProps {
  liveSignals?: ReactNode;
  className?: string;
}

export function OverviewHero({ liveSignals, className }: OverviewHeroProps) {
  return (
    <div
      className={cn(
        overviewCardShell,
        "mb-2 overflow-hidden rounded-3xl px-5 py-7 sm:px-8 sm:py-9",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border) / 0.16) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border) / 0.16) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 -top-16 h-[300px] w-[300px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.14), transparent 68%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-[220px] w-[220px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, hsl(var(--muted-foreground) / 0.08), transparent 65%)" }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
            Command center
          </div>
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/55 bg-background/50 shadow-inner backdrop-blur-md">
              <LayoutDashboard className="h-6 w-6 text-foreground" aria-hidden />
            </div>
            <div className="min-w-0 pt-0.5">
              <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Overview
              </h1>
              <p className="mt-1.5 max-w-2xl text-pretty text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
                Every lab and feed in one place. Cards refresh independently — open any tile for the full workspace.
              </p>
            </div>
          </div>
        </div>
        {liveSignals ? <div className="flex flex-wrap gap-2 lg:justify-end">{liveSignals}</div> : null}
      </div>
    </div>
  );
}
