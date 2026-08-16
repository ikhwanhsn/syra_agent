"use client";

import { Layers } from "lucide-react";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import { BouncyAccordion } from "@/components/motion/bouncy-accordion";
import {
  aboutCardClass,
  aboutKickerClass,
  aboutStatValueClass,
} from "@/components/about/aboutStyles";
import {
  SYRA_HIGHLIGHT,
  SYRA_PROBLEM,
  SYRA_SOLUTION,
  SYRA_STATS,
  SYRA_WHY_SOLANA,
} from "@/content/syraAbout";
import { cn } from "@/lib/utils";

export function AboutOverviewPanel() {
  const featuredStatIndex = SYRA_STATS.findIndex((s) => s.value === "Live");

  return (
    <div className="about-tab-panel space-y-5 sm:space-y-6">
      <AboutSectionHeader
        kicker="Company"
        title="Building pay-per-call rails on Solana"
        description="Crypto intelligence APIs agents can fund on every call, live product, open development, bootstrapped team."
      />

      <div className="about-bento-grid grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-3">
        {SYRA_STATS.map(({ label, value, detail }, index) => {
          const isFeatured = index === featuredStatIndex;
          return (
            <div
              key={label}
              className={cn(
                aboutCardClass,
                "rounded-[1.15rem] px-4 py-4 sm:rounded-[1.25rem] sm:px-5 sm:py-5",
                isFeatured ? "about-bento-featured col-span-2 sm:col-span-2" : "col-span-1",
              )}
            >
              <p className={aboutKickerClass}>{label}</p>
              <p
                className={cn(
                  aboutStatValueClass,
                  "mt-2.5",
                  isFeatured ? "text-2xl sm:text-3xl" : "text-xl sm:text-[1.45rem]",
                )}
              >
                {value}
              </p>
              {detail ? (
                <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground/85 sm:text-[12px]">{detail}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <section className={cn(aboutCardClass, "about-editorial-band overflow-hidden rounded-[1.35rem] px-6 py-8 sm:px-8 sm:py-9")}>
        <div className="about-editorial-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex gap-5 sm:gap-6">
          <span className="about-pillar-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/45">
            <Layers className="h-5 w-5 text-foreground/80" strokeWidth={1.65} aria-hidden />
          </span>
          <div>
            <p className={aboutKickerClass}>Positioning</p>
            <p className="mt-3 font-display text-[1.15rem] font-medium leading-[1.45] tracking-[-0.03em] text-foreground sm:text-[1.35rem]">
              {SYRA_HIGHLIGHT}
            </p>
          </div>
        </div>
      </section>

      <BouncyAccordion
        defaultValue="problem"
        className="overflow-hidden rounded-[1.2rem]"
        items={[
          {
            id: "problem",
            title: SYRA_PROBLEM.title,
            description: SYRA_PROBLEM.body.join(" "),
          },
          {
            id: "solution",
            title: SYRA_SOLUTION.title,
            description: SYRA_SOLUTION.body.join(" "),
          },
          {
            id: "solana",
            title: SYRA_WHY_SOLANA.title,
            description: SYRA_WHY_SOLANA.body.join(" "),
          },
        ]}
      />
    </div>
  );
}
