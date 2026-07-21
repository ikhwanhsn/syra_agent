"use client";

import { Sparkles } from "lucide-react";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import {
  aboutCardClass,
  aboutProseClass,
  aboutSectionKickerClass,
} from "@/components/about/aboutStyles";
import {
  SYRA_CAPABILITIES,
  SYRA_DIFFERENTIATION,
  SYRA_PILLARS,
  SYRA_PILLAR_STATUS_LABEL,
  SYRA_PRODUCT_FLOW,
} from "@/content/syraAbout";
import { SYRA_LIVE_SUBLINE } from "@/lib/syraBranding";
import { cn } from "@/lib/utils";

export function AboutProductPanel() {
  return (
    <div className="about-tab-panel space-y-5 sm:space-y-6">
      <AboutSectionHeader
        kicker="Product"
        title="From install to first paid call"
        description="Three steps — install MCP or SDK, settle USDC on 402, call crypto intelligence."
        align="center"
      />

      <div className="about-flow-track grid gap-3 md:grid-cols-3">
        {SYRA_PRODUCT_FLOW.map((step, index) => (
          <article
            key={step.step}
            className={cn(
              aboutCardClass,
              "about-flow-step group rounded-[1.15rem] p-5 sm:p-6",
              index === 1 && "md:-translate-y-1",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="about-flow-badge font-mono text-[10px] font-medium tracking-[0.18em] text-muted-foreground/70">
                {step.step}
              </span>
              <span className="about-flow-node h-2 w-2 rounded-full bg-foreground/20 group-hover:bg-foreground/45" aria-hidden />
            </div>
            <h3 className="mt-4 font-display text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg">
              {step.title}
            </h3>
            <p className="mt-2.5 text-[13.5px] leading-[1.65] text-muted-foreground/90">{step.description}</p>
          </article>
        ))}
      </div>

      <AboutSectionHeader
        kicker="Machine money"
        title="Five pillars — honest status"
        description={`${SYRA_LIVE_SUBLINE}. Earn, Treasury, Invest, and Grow graduate as they hit production criteria — discover via GET /pillars.`}
      />

      <div className="about-pillar-bento grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SYRA_PILLARS.map(({ icon: Icon, title, description, status }, index) => (
          <article
            key={title}
            className={cn(
              aboutCardClass,
              "group rounded-[1.15rem] p-5 sm:p-6",
              index === 0 && "about-pillar-spotlight sm:col-span-2 lg:col-span-1",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 about-pillar-icon text-foreground/75">
                <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
              </span>
              {status ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    status === "live" && "bg-primary/15 text-primary",
                    status === "beta" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                    status === "infra" && "bg-muted text-muted-foreground",
                    status === "roadmap" && "bg-muted/60 text-muted-foreground/80",
                  )}
                >
                  {SYRA_PILLAR_STATUS_LABEL[status]}
                </span>
              ) : null}
            </div>
            <h3 className="mt-4 font-display text-[15px] font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
            <p className="mt-2 text-[13px] leading-[1.62] text-muted-foreground/90">{description}</p>
          </article>
        ))}
      </div>

      <AboutSectionHeader
        kicker="Capabilities"
        title="What builders use today"
        align="center"
      />

      <div className="about-capability-grid grid grid-cols-1 gap-px overflow-hidden rounded-[1.15rem] border border-border/35 bg-border/25 sm:grid-cols-2 lg:grid-cols-3">
        {SYRA_CAPABILITIES.map(({ title, description }) => (
          <div key={title} className="about-capability-cell bg-background/85 px-4 py-4 sm:px-5 sm:py-5">
            <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
            <p className="mt-1.5 text-[12.5px] leading-[1.62] text-muted-foreground/90">{description}</p>
          </div>
        ))}
      </div>

      <section className={cn(aboutCardClass, "about-bet-panel rounded-[1.2rem] px-6 py-8 sm:px-8")}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-foreground/50" aria-hidden />
          <p className={aboutSectionKickerClass}>Our bet</p>
        </div>
        <h3 className="mt-4 max-w-3xl font-display text-xl font-semibold tracking-[-0.035em] text-foreground sm:text-2xl">
          {SYRA_DIFFERENTIATION.headline}
        </h3>
        <p className={cn(aboutProseClass, "mt-4 max-w-3xl")}>{SYRA_DIFFERENTIATION.body}</p>
      </section>
    </div>
  );
}
