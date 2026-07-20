"use client";

import { Layers } from "lucide-react";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import {
  aboutCardClass,
  aboutCardQuietClass,
  aboutKickerClass,
  aboutProseClass,
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
        description="Crypto intelligence APIs agents can fund on every call — live product, open development, bootstrapped team."
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

      <div className="grid gap-3 lg:grid-cols-2">
        <section className={cn(aboutCardClass, "about-problem-tint about-narrative-panel rounded-[1.2rem] px-6 py-7 sm:px-7")}>
          <p className={aboutKickerClass}>The problem</p>
          <h3 className="mt-3 font-display text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
            {SYRA_PROBLEM.title}
          </h3>
          <div className="mt-5 space-y-3.5 border-t border-border/30 pt-5">
            {SYRA_PROBLEM.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className={aboutProseClass}>
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section
          className={cn(
            aboutCardClass,
            "about-solution-tint about-narrative-panel about-narrative-panel-accent rounded-[1.2rem] border-foreground/12 px-6 py-7 sm:px-7",
          )}
        >
          <p className={aboutKickerClass}>How we solve it</p>
          <h3 className="mt-3 font-display text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
            {SYRA_SOLUTION.title}
          </h3>
          <div className="mt-5 space-y-3.5 border-t border-border/30 pt-5">
            {SYRA_SOLUTION.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="text-[14px] leading-[1.72] text-foreground/86 sm:text-[15px]">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      </div>

      <section className={cn(aboutCardQuietClass, "rounded-[1.2rem] px-6 py-7 sm:px-8")}>
        <AboutSectionHeader kicker="Infrastructure" title={SYRA_WHY_SOLANA.title} className="mb-0" />
        <div className="mt-5 space-y-3.5 border-t border-border/30 pt-5">
          {SYRA_WHY_SOLANA.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className={cn(aboutProseClass, "max-w-3xl")}>
              {paragraph}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
