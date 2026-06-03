"use client";

import { Link } from "@/lib/navigation";
import { ArrowUpRight, BookOpen, Bot, ExternalLink, Layers, Sparkles } from "lucide-react";
import {
  aboutCardClass,
  aboutKickerClass,
  aboutRootClass,
  aboutSectionTitleClass,
} from "@/components/about/aboutStyles";
import {
  SYRA_CAPABILITIES,
  SYRA_COMMUNITY_LINKS,
  SYRA_DIFFERENTIATION,
  SYRA_DISCLAIMER,
  SYRA_HIGHLIGHT,
  SYRA_MISSION,
  SYRA_PILLARS,
  SYRA_PLATFORMS,
  SYRA_PROBLEM,
  SYRA_PRODUCT_FLOW,
  SYRA_SOLUTION,
  SYRA_STATS,
  SYRA_TAGLINE,
  SYRA_TRACTION,
  SYRA_VISION,
  SYRA_WHY_SOLANA,
} from "@/content/syraAbout";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewAccentBackground, overviewKickerClass, overviewMetricValueClass } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

interface AboutPageViewProps {
  embedded?: boolean;
}

function SectionHeader({
  kicker,
  title,
  description,
  className,
}: {
  kicker: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 sm:mb-7", className)}>
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-border/80" aria-hidden />
        <p className={aboutKickerClass}>{kicker}</p>
      </div>
      <h2 className={cn(aboutSectionTitleClass, "mt-3")}>{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function AboutPageView({ embedded = false }: AboutPageViewProps) {
  const shellClass = cn(
    embedded ? "px-2 pb-8 pt-2 sm:px-4" : DASHBOARD_CONTENT_SHELL,
    !embedded && PAGE_PADDING_TOP_MEDIUM,
    !embedded && PAGE_SAFE_AREA_BOTTOM,
    "relative z-[1] mx-auto max-w-5xl",
  );

  return (
    <div className={cn(aboutRootClass, embedded ? "bg-background" : "")}>
      {!embedded ? <OverviewPageBackdrop /> : null}
      <div className="about-ambient pointer-events-none absolute inset-0 -z-[1]" aria-hidden />
      <div className="about-orb about-orb-a pointer-events-none absolute -z-[1]" aria-hidden />
      <div className="about-orb about-orb-b pointer-events-none absolute -z-[1]" aria-hidden />

      <div className={shellClass}>
        <div className="space-y-14 sm:space-y-16 lg:space-y-20">
          {/* Hero */}
          <header
            className={cn(
              aboutCardClass,
              "about-hero-glow about-animate overflow-hidden rounded-[1.75rem] sm:rounded-[2rem]",
            )}
          >
            <div className="about-grid-bg" aria-hidden />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.55]"
              style={{ background: overviewAccentBackground("neutral") }}
              aria-hidden
            />

            <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
              <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between lg:gap-14">
                <div className="flex flex-col items-center gap-6 text-center sm:gap-7 lg:flex-1 lg:flex-row lg:items-start lg:text-left">
                  <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 sm:h-20 sm:w-20">
                    <div
                      className="absolute inset-0 rounded-[1.35rem] bg-foreground/[0.08] blur-2xl"
                      aria-hidden
                    />
                    <div className="relative flex h-full w-full overflow-hidden rounded-[1.35rem] border border-border/55 bg-gradient-to-br from-card via-card to-muted/30 ring-1 ring-inset ring-white/[0.07]">
                      <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" draggable={false} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-3.5 py-1.5 backdrop-blur-md">
                      <span className="about-live-dot h-1.5 w-1.5 rounded-full bg-foreground/80" aria-hidden />
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Live on Solana
                      </span>
                    </div>

                    <h1 className="mt-5 font-display text-balance text-[2.1rem] font-semibold leading-[1.06] tracking-[-0.045em] sm:text-[2.75rem] lg:text-[3rem]">
                      <span className="about-headline-gradient block">{SYRA_TAGLINE}</span>
                    </h1>
                    <p className="mt-4 max-w-xl text-pretty text-[15px] leading-[1.72] text-muted-foreground sm:text-[17px] lg:max-w-none">
                      {SYRA_MISSION}
                    </p>
                    <p className="mt-3 max-w-xl text-pretty text-[14px] leading-relaxed text-muted-foreground/80 lg:max-w-none">
                      {SYRA_VISION}
                    </p>
                  </div>
                </div>

                <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row lg:w-[15.5rem] lg:flex-col">
                  <Button variant="primary" size="lg" className="w-full justify-center shadow-lg" asChild>
                    <a href="https://agent.syraa.fun" target="_blank" rel="noopener noreferrer">
                      <Bot className="mr-2 h-4 w-4" />
                      Open agent
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" className="w-full justify-center border-border/60" asChild>
                    <a href="https://docs.syraa.fun" target="_blank" rel="noopener noreferrer">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Documentation
                      <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-50" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Stats */}
          <section
            className="about-animate about-animate-delay-1 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5"
            aria-label="Company snapshot"
          >
            {SYRA_STATS.map(({ label, value, detail }, index) => (
              <div
                key={label}
                className={cn(
                  aboutCardClass,
                  "group rounded-2xl px-4 py-4 sm:px-5 sm:py-5",
                  index === 2 && "about-stat-featured sm:col-span-1",
                )}
              >
                <p className={aboutKickerClass}>{label}</p>
                <p
                  className={cn(
                    overviewMetricValueClass,
                    "mt-2 text-xl transition-transform duration-300 group-hover:scale-[1.02] sm:text-2xl",
                  )}
                >
                  {value}
                </p>
                {detail ? (
                  <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">{detail}</p>
                ) : null}
              </div>
            ))}
          </section>

          {/* Highlight */}
          <section
            className={cn(
              aboutCardClass,
              "about-animate about-animate-delay-2 overflow-hidden rounded-2xl border-foreground/[0.12] px-6 py-8 sm:px-9 sm:py-9",
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{ background: overviewAccentBackground("internal") }}
              aria-hidden
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/50 about-pillar-icon text-foreground/85"
                aria-hidden
              >
                <Layers className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className={aboutKickerClass}>Positioning</p>
                <blockquote className="mt-3">
                  <p className="font-display text-[1.05rem] font-medium leading-[1.5] tracking-[-0.025em] text-foreground sm:text-xl">
                    {SYRA_HIGHLIGHT}
                  </p>
                </blockquote>
              </div>
            </div>
          </section>

          {/* Product flow */}
          <section className="about-animate about-animate-delay-3">
            <SectionHeader
              kicker="How it works"
              title="From autonomous work to onchain economics"
              description="Three layers of machine money — earn, manage, deploy."
            />
            <div className="about-flow-track grid gap-4 md:grid-cols-3">
              {SYRA_PRODUCT_FLOW.map((step) => (
                <article key={step.step} className={cn(aboutCardClass, "about-flow-step rounded-2xl p-5 sm:p-6")}>
                  <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/60">{step.step}</p>
                  <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">{step.description}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Problem & solution */}
          <div className="about-animate about-animate-delay-4 grid gap-4 lg:grid-cols-2 lg:gap-5">
            <section className={cn(aboutCardClass, "about-problem-tint rounded-2xl px-6 py-7 sm:px-8")}>
              <p className={overviewKickerClass}>The problem</p>
              <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {SYRA_PROBLEM.title}
              </h2>
              <div className="mt-5 space-y-3.5">
                {SYRA_PROBLEM.body.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="text-[14px] leading-[1.68] text-muted-foreground sm:text-[15px]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            <section className={cn(aboutCardClass, "about-solution-tint rounded-2xl border-foreground/15 px-6 py-7 sm:px-8")}>
              <p className={overviewKickerClass}>How we solve it</p>
              <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {SYRA_SOLUTION.title}
              </h2>
              <div className="mt-5 space-y-3.5">
                {SYRA_SOLUTION.body.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="text-[14px] leading-[1.68] text-foreground/88 sm:text-[15px]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          </div>

          {/* Why Solana */}
          <section className={cn(aboutCardClass, "about-animate about-animate-delay-5 rounded-2xl px-6 py-8 sm:px-9 sm:py-9")}>
            <SectionHeader kicker="Infrastructure" title={SYRA_WHY_SOLANA.title} className="mb-5" />
            <div className="space-y-4">
              {SYRA_WHY_SOLANA.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="max-w-3xl text-[14px] leading-[1.68] text-muted-foreground sm:text-[15px]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>

          {/* Pillars */}
          <section>
            <SectionHeader
              kicker="Core pillars"
              title="Built for the machine economy"
              description="Financial infrastructure designed for autonomous actors — not human dashboards."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {SYRA_PILLARS.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className={cn(
                    aboutCardClass,
                    "group rounded-2xl p-5 sm:p-6",
                    "hover:-translate-y-0.5",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl border border-border/45 about-pillar-icon",
                      "text-foreground/80 transition-colors duration-300 group-hover:border-border/70",
                    )}
                  >
                    <Icon className="h-[19px] w-[19px]" strokeWidth={1.85} aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-[15px] font-semibold tracking-tight text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Capabilities */}
          <section>
            <SectionHeader
              kicker="What agents can do"
              title="Financial primitives for autonomous actors"
            />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
              {SYRA_CAPABILITIES.map(({ title, description }, index) => (
                <div
                  key={title}
                  className={cn(
                    aboutCardClass,
                    "group flex gap-4 rounded-xl px-4 py-4 sm:px-5",
                    "hover:bg-card/80",
                  )}
                >
                  <span
                    className={cn(
                      "about-cap-index shrink-0 font-mono text-2xl font-light leading-none text-foreground/15",
                      "transition-colors duration-300 group-hover:text-foreground/25",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Differentiation */}
          <section
            className={cn(
              aboutCardClass,
              "rounded-2xl px-6 py-8 sm:px-9 sm:py-9",
              "border-dashed border-border/55",
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-foreground/50" aria-hidden />
              <p className={aboutKickerClass}>Our bet</p>
            </div>
            <h2 className="mt-3 max-w-2xl font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {SYRA_DIFFERENTIATION.headline}
            </h2>
            <p className="mt-4 max-w-3xl text-[14px] leading-[1.68] text-muted-foreground sm:text-[15px]">
              {SYRA_DIFFERENTIATION.body}
            </p>
          </section>

          {/* Traction */}
          <section>
            <SectionHeader kicker="Traction" title="Shipping in the open" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SYRA_TRACTION.map(({ title, description }) => (
                <article
                  key={title}
                  className={cn(aboutCardClass, "flex gap-4 rounded-2xl px-5 py-5")}
                >
                  <span className="about-live-dot mt-1.5 h-2 w-2 shrink-0 rounded-full bg-foreground/70" aria-hidden />
                  <div>
                    <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Platforms */}
          <section>
            <SectionHeader kicker="Where Syra runs" title="One stack, multiple surfaces" />
            <div className="grid gap-3 sm:grid-cols-2">
              {SYRA_PLATFORMS.map(({ icon: Icon, name, description, href, external }) => {
                const className = cn(
                  aboutCardClass,
                  "group flex items-start gap-4 rounded-2xl px-5 py-4 sm:py-5",
                  "hover:-translate-y-0.5",
                );
                const inner = (
                  <>
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/50 about-pillar-icon",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] text-foreground/80" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display text-[15px] font-semibold text-foreground">{name}</h3>
                        <ArrowUpRight
                          className="h-3.5 w-3.5 text-muted-foreground/35 transition-all duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-foreground/60"
                          aria-hidden
                        />
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                    </div>
                  </>
                );

                if (external) {
                  return (
                    <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={className}>
                      {inner}
                    </a>
                  );
                }

                return (
                  <Link key={name} to={href} className={className}>
                    {inner}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Community */}
          <section className={cn(aboutCardClass, "rounded-2xl px-6 py-8 sm:px-9 sm:py-9")}>
            <SectionHeader kicker="Connect" title="Stay in the loop" className="mb-6" />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SYRA_COMMUNITY_LINKS.map(({ label, href, description }) => (
                <a
                  key={label}
                  href={href}
                  {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  className={cn(
                    "group flex flex-col rounded-xl border border-border/40 bg-background/25 px-4 py-3.5",
                    "transition-all duration-300 hover:border-border/70 hover:bg-background/55 hover:shadow-sm",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-foreground">{label}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground/35 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-foreground/55"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{description}</p>
                </a>
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <footer className="rounded-2xl border border-border/35 bg-muted/10 px-5 py-5 sm:px-6">
            <p className={aboutKickerClass}>Legal</p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{SYRA_DISCLAIMER}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
