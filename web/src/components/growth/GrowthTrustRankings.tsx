"use client";

import { ArrowUpRight } from "lucide-react";
import { SYRA_TRUST_RANKINGS } from "@/content/syraAbout";
import { cn } from "@/lib/utils";
import {
  growthKickerClass,
  growthPanelClass,
  growthStatValueClass,
} from "@/components/growth/growthHomeStyles";

/**
 * Ecosystem trust rankings strip for growth home — static, link-out proof near Buy $SYRA.
 */
export function GrowthTrustRankings({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto max-w-2xl", className)}>
      <p className={cn(growthKickerClass, "mb-3 text-center")}>
        Trusted across the agent economy
      </p>

      <div
        className={cn(
          growthPanelClass,
          "divide-y divide-border/40 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0",
        )}
        role="list"
      >
        {SYRA_TRUST_RANKINGS.map((item) => (
          <a
            key={item.id}
            role="listitem"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.ariaLabel}
            className={cn(
              "group relative flex min-h-11 flex-col gap-1 px-5 py-4 text-left transition-[background-color] duration-200",
              "hover:bg-foreground/[0.03]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              "sm:min-h-0 sm:px-4 sm:py-5",
              "first:rounded-t-[1.35rem] last:rounded-b-[1.35rem]",
              "sm:first:rounded-l-[1.35rem] sm:first:rounded-tr-none sm:last:rounded-r-[1.35rem] sm:last:rounded-bl-none",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className={cn(growthStatValueClass, "text-xl sm:text-2xl")}>{item.rank}</span>
              <ArrowUpRight
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground/55 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground/70"
                aria-hidden
              />
            </div>
            <span className="text-sm font-medium leading-snug text-foreground">{item.label}</span>
            <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
              {item.sub}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
