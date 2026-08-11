"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { SYRA_TRUST_RANKINGS } from "@/content/syraAbout";
import { cn } from "@/lib/utils";
import { GrowthCountUp, useGrowthReveal } from "@/components/growth/growthMotion";
import {
  growthEyebrowClass,
  growthMonoChipClass,
  growthPanelClass,
  growthStatValueClass,
} from "@/components/growth/growthHomeStyles";

/**
 * Ecosystem trust rankings strip for growth home, static, link-out proof near Buy $SYRA.
 */
function parseRankNumber(rank: string): number | null {
  const match = rank.match(/^#(\d+)$/);
  if (!match) return null;
  return Number(match[1]);
}

export function GrowthTrustRankings({ className }: { className?: string }) {
  const { viewport, item, container, initial, whileInView } = useGrowthReveal();

  return (
    <div className={cn("relative mx-auto w-full max-w-2xl", className)}>
      {/* Soft spotlight, pulls the strip forward in the hero */}
      <div
        className="pointer-events-none absolute -inset-x-6 -inset-y-5 -z-10 motion-reduce:hidden"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `
              radial-gradient(ellipse 70% 55% at 50% 40%, hsl(var(--foreground) / 0.09), transparent 68%),
              radial-gradient(ellipse 40% 45% at 18% 55%, hsl(var(--foreground) / 0.04), transparent 55%)
            `,
          }}
        />
      </div>

      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn(growthEyebrowClass, "before:w-4")}>Achievements</p>
          <span className={growthMonoChipClass}>agent economy</span>
        </div>
        <p className="font-display text-sm font-medium tracking-tight text-foreground/80 sm:text-[15px]">
          Trusted across the agent economy
        </p>
      </div>

      <motion.div
        className={cn(
          growthPanelClass,
          "relative divide-y divide-border/40",
          "ring-1 ring-inset ring-foreground/[0.04]",
          "shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_32px_72px_-36px_rgba(0,0,0,0.65)]",
          "sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0",
        )}
        role="list"
        variants={container(0.08, 0.06)}
        initial={initial}
        whileInView={whileInView}
        viewport={viewport}
      >
        {/* Inner sheen, static depth, no looping animation */}
        <div
          className="pointer-events-none absolute inset-0 opacity-70 motion-reduce:opacity-40"
          aria-hidden
          style={{
            background: `
              linear-gradient(135deg, hsl(var(--foreground) / 0.055) 0%, transparent 42%),
              radial-gradient(ellipse 55% 80% at 0% 0%, hsl(var(--foreground) / 0.06), transparent 55%)
            `,
          }}
        />

        {SYRA_TRUST_RANKINGS.map((ranking, index) => {
          const isLead = index === 0;
          const rankNumber = parseRankNumber(ranking.rank);
          return (
            <motion.a
              key={ranking.id}
              role="listitem"
              href={ranking.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ranking.ariaLabel}
              variants={item}
              className={cn(
                "group relative flex min-h-11 flex-col gap-1 overflow-hidden px-5 py-4 text-left",
                "transition-[background-color,transform] duration-200 ease-out",
                "hover:bg-foreground/[0.04] active:scale-[0.99]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                "sm:min-h-0 sm:px-4 sm:py-5 sm:active:scale-100",
                "first:rounded-t-2xl last:rounded-b-2xl",
                "sm:first:rounded-l-2xl sm:first:rounded-tr-none sm:last:rounded-r-2xl sm:last:rounded-bl-none",
                isLead && "sm:bg-foreground/[0.02]",
              )}
            >
              {/* Hover shine sweep */}
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 -translate-x-full opacity-0",
                  "bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent",
                  "transition-none",
                  "motion-safe:transition-[transform,opacity] motion-safe:duration-500 motion-safe:ease-out",
                  "motion-safe:group-hover:translate-x-full motion-safe:group-hover:opacity-100",
                )}
                aria-hidden
              />

              <div className="relative flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    growthStatValueClass,
                    "text-2xl sm:text-[1.65rem]",
                    isLead && "gradient-text",
                    !isLead &&
                      "transition-transform duration-200 motion-safe:group-hover:translate-y-[-1px]",
                  )}
                >
                  {rankNumber != null ? (
                    <>
                      #
                      <GrowthCountUp
                        value={rankNumber}
                        format={(n) => String(Math.round(n))}
                      />
                    </>
                  ) : (
                    ranking.rank
                  )}
                </span>
                <ArrowUpRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-muted-foreground/55",
                    "transition-[transform,color] duration-200",
                    "group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/75",
                  )}
                  aria-hidden
                />
              </div>
              <span className="relative text-sm font-medium leading-snug text-foreground">
                {ranking.label}
              </span>
              <span className="relative text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
                {ranking.sub}
              </span>
            </motion.a>
          );
        })}
      </motion.div>
    </div>
  );
}
