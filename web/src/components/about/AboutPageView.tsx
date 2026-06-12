"use client";

import { Link } from "@/lib/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { AboutSectionReveal } from "@/components/about/AboutSectionReveal";
import {
  aboutCardClass,
  aboutCardQuietClass,
  aboutDisplayTitleClass,
  aboutKickerClass,
  aboutProseClass,
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
import {
  overviewAccentBackground,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";
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
  align = "left",
  className,
}: {
  kicker: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 sm:mb-10",
        align === "center" && "mx-auto max-w-2xl text-center",
        className,
      )}
    >
      <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
        <span className="h-px w-10 bg-border/80" aria-hidden />
        <p className={aboutKickerClass}>{kicker}</p>
        {align === "center" ? <span className="h-px w-10 bg-border/80" aria-hidden /> : null}
      </div>
      <h2 className={cn(aboutSectionTitleClass, "mt-4 text-balance")}>{title}</h2>
      {description ? <p className={cn(aboutProseClass, "mt-3 max-w-2xl text-pretty")}>{description}</p> : null}
    </div>
  );
}

export function AboutPageView({ embedded = false }: AboutPageViewProps) {
  const shellClass = cn(
    embedded ? "px-2 pb-8 pt-2 sm:px-4" : DASHBOARD_CONTENT_SHELL,
    !embedded && PAGE_PADDING_TOP_MEDIUM,
    !embedded && PAGE_SAFE_AREA_BOTTOM,
    "relative z-[1] mx-auto max-w-6xl",
  );

  const featuredStatIndex = SYRA_STATS.findIndex((s) => s.value === "Live");

  return (
    <div className={cn(aboutRootClass, embedded ? "bg-background" : "")}>
      {!embedded ? <OverviewPageBackdrop /> : null}
      <div className="about-ambient pointer-events-none absolute inset-0 -z-[1]" aria-hidden />
      <div className="about-orb about-orb-a pointer-events-none absolute -z-[1]" aria-hidden />
      <div className="about-orb about-orb-b pointer-events-none absolute -z-[1]" aria-hidden />

      <div className={shellClass}>
        <div className="space-y-16 sm:space-y-20 lg:space-y-24">
          {/* Hero */}
          <AboutSectionReveal>
            <header
              className={cn(
                aboutCardClass,
                "about-hero-glow about-hero-frame overflow-hidden rounded-[1.85rem] sm:rounded-[2.25rem]",
              )}
            >
              <div className="about-grid-bg" aria-hidden />
              <div className="about-hero-mesh pointer-events-none absolute inset-0" aria-hidden />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.55]"
                style={{ background: overviewAccentBackground("neutral") }}
                aria-hidden
              />

              <div className="relative px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
                <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
                  <div className="min-w-0">
                    <div className="flex flex-col items-center gap-7 text-center sm:gap-8 lg:items-start lg:text-left">
                      <div className="flex flex-col items-center gap-5 sm:flex-row lg:items-center">
                        <div className="relative h-[5rem] w-[5rem] shrink-0 sm:h-[5.5rem] sm:w-[5.5rem]">
                          <div
                            className="absolute inset-0 rounded-[1.4rem] bg-foreground/[0.1] blur-2xl"
                            aria-hidden
                          />
                          <div className="about-logo-frame relative flex h-full w-full overflow-hidden rounded-[1.4rem]">
                            <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" draggable={false} />
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-background/55 px-4 py-2 backdrop-blur-md">
                          <span className="about-live-dot h-2 w-2 rounded-full bg-success/90" aria-hidden />
                          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Live on Solana
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className={aboutKickerClass}>About Syra</p>
                        <h1 className={cn(aboutDisplayTitleClass, "mt-4 text-balance")}>
                          <span className="about-headline-gradient">{SYRA_TAGLINE}</span>
                        </h1>
                        <p className={cn(aboutProseClass, "mt-5 max-w-2xl text-pretty lg:max-w-none")}>
                          {SYRA_MISSION}
                        </p>
                        <p className="mt-3 max-w-2xl text-pretty text-[14px] leading-relaxed text-muted-foreground/75 sm:text-[15px] lg:max-w-none">
                          {SYRA_VISION}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-[17rem] lg:flex-col">
                    <Button variant="primary" size="lg" className="h-12 w-full justify-center shadow-lg" asChild>
                      <a href="/">
                        <Bot className="mr-2 h-4 w-4" />
                        Open agent
                        <ArrowRight className="ml-2 h-4 w-4 opacity-70" />
                      </a>
                    </Button>
                    <Button variant="outline" size="lg" className="h-12 w-full justify-center border-border/60" asChild>
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
          </AboutSectionReveal>

          {/* Stats bento */}
          <AboutSectionReveal delay={0.04}>
            <section aria-label="Company snapshot">
              <div className="about-bento-grid grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4">
                {SYRA_STATS.map(({ label, value, detail }, index) => {
                  const isFeatured = index === featuredStatIndex;
                  return (
                    <div
                      key={label}
                      className={cn(
                        aboutCardClass,
                        "group rounded-[1.35rem] px-5 py-5 sm:px-6 sm:py-6",
                        isFeatured
                          ? "about-bento-featured col-span-2 row-span-2 sm:col-span-3 sm:row-span-2"
                          : "col-span-1 sm:col-span-3",
                      )}
                    >
                      <p className={aboutKickerClass}>{label}</p>
                      <p
                        className={cn(
                          overviewMetricValueClass,
                          "mt-3 transition-transform duration-300 group-hover:scale-[1.015]",
                          isFeatured && "text-3xl sm:text-4xl lg:text-[2.75rem]",
                        )}
                      >
                        {value}
                      </p>
                      {detail ? (
                        <p
                          className={cn(
                            "mt-3 leading-snug text-muted-foreground",
                            isFeatured ? "max-w-xs text-[13px] sm:text-[14px]" : "text-[11.5px]",
                          )}
                        >
                          {detail}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </AboutSectionReveal>

          {/* Positioning quote */}
          <AboutSectionReveal delay={0.06}>
            <section
              className={cn(
                aboutCardClass,
                "about-editorial-band overflow-hidden rounded-[1.75rem] px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14",
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{ background: overviewAccentBackground("internal") }}
                aria-hidden
              />
              <div className="relative grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
                <span
                  className="about-pillar-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/50 text-foreground/85"
                  aria-hidden
                >
                  <Layers className="h-6 w-6" strokeWidth={1.65} />
                </span>
                <div>
                  <p className={aboutKickerClass}>Positioning</p>
                  <blockquote className="mt-4 max-w-4xl">
                    <p className="about-editorial-quote font-display text-[1.35rem] font-medium leading-[1.42] tracking-[-0.03em] text-foreground sm:text-[1.65rem] lg:text-[1.85rem]">
                      {SYRA_HIGHLIGHT}
                    </p>
                  </blockquote>
                </div>
              </div>
            </section>
          </AboutSectionReveal>

          {/* Product flow */}
          <AboutSectionReveal delay={0.04}>
            <section>
              <SectionHeader
                kicker="How it works"
                title="From autonomous work to onchain economics"
                description="Three layers of machine money — earn, manage, deploy."
                align="center"
              />
              <div className="about-flow-track grid gap-4 md:grid-cols-3">
                {SYRA_PRODUCT_FLOW.map((step, index) => (
                  <article
                    key={step.step}
                    className={cn(
                      aboutCardClass,
                      "about-flow-step group rounded-[1.35rem] p-6 sm:p-7",
                      index === 1 && "md:-translate-y-1",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="about-flow-badge font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground/70">
                        {step.step}
                      </span>
                      <span
                        className="about-flow-node h-2.5 w-2.5 rounded-full bg-foreground/25 transition-colors duration-300 group-hover:bg-foreground/55"
                        aria-hidden
                      />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{step.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </AboutSectionReveal>

          {/* Problem & solution */}
          <AboutSectionReveal delay={0.04}>
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
              <section className={cn(aboutCardClass, "about-problem-tint about-narrative-panel rounded-[1.35rem] px-7 py-8 sm:px-9")}>
                <p className={overviewKickerClass}>The problem</p>
                <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {SYRA_PROBLEM.title}
                </h2>
                <div className="mt-6 space-y-4">
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
                  "about-solution-tint about-narrative-panel about-narrative-panel-accent rounded-[1.35rem] border-foreground/15 px-7 py-8 sm:px-9",
                )}
              >
                <p className={overviewKickerClass}>How we solve it</p>
                <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {SYRA_SOLUTION.title}
                </h2>
                <div className="mt-6 space-y-4">
                  {SYRA_SOLUTION.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 32)} className="text-[15px] leading-[1.72] text-foreground/88 sm:text-[16px]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            </div>
          </AboutSectionReveal>

          {/* Why Solana */}
          <AboutSectionReveal delay={0.04}>
            <section className={cn(aboutCardQuietClass, "rounded-[1.35rem] px-7 py-8 sm:px-9 sm:py-10")}>
              <SectionHeader kicker="Infrastructure" title={SYRA_WHY_SOLANA.title} className="mb-0" />
              <div className="mt-6 space-y-4 border-t border-border/35 pt-6">
                {SYRA_WHY_SOLANA.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className={cn(aboutProseClass, "max-w-3xl")}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          </AboutSectionReveal>

          {/* Pillars bento */}
          <AboutSectionReveal delay={0.04}>
            <section>
              <SectionHeader
                kicker="Core pillars"
                title="Built for the machine economy"
                description="Financial infrastructure designed for autonomous actors — not human dashboards."
              />
              <div className="about-pillar-bento grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {SYRA_PILLARS.map(({ icon: Icon, title, description }, index) => (
                  <article
                    key={title}
                    className={cn(
                      aboutCardClass,
                      "group rounded-[1.35rem] p-6 sm:p-7",
                      "hover:-translate-y-1",
                      index === 0 && "about-pillar-spotlight sm:col-span-2 lg:col-span-1",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl border border-border/45 about-pillar-icon",
                        "text-foreground/80 transition-colors duration-300 group-hover:border-border/70",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <h3 className="mt-5 font-display text-[16px] font-semibold tracking-tight text-foreground sm:text-[17px]">
                      {title}
                    </h3>
                    <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
                  </article>
                ))}
              </div>
            </section>
          </AboutSectionReveal>

          {/* Capabilities */}
          <AboutSectionReveal delay={0.04}>
            <section>
              <SectionHeader
                kicker="What agents can do"
                title="Financial primitives for autonomous actors"
                align="center"
              />
              <div className="about-capability-grid grid grid-cols-1 gap-px overflow-hidden rounded-[1.35rem] border border-border/40 bg-border/30 sm:grid-cols-2 lg:grid-cols-3">
                {SYRA_CAPABILITIES.map(({ title, description }) => (
                  <div key={title} className="about-capability-cell group bg-background/80 px-5 py-5 sm:px-6 sm:py-6">
                    <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </section>
          </AboutSectionReveal>

          {/* Differentiation */}
          <AboutSectionReveal delay={0.04}>
            <section className={cn(aboutCardClass, "about-bet-panel rounded-[1.35rem] px-7 py-9 sm:px-10 sm:py-11")}>
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-foreground/55" aria-hidden />
                <p className={aboutKickerClass}>Our bet</p>
              </div>
              <h2 className="mt-4 max-w-3xl font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.85rem]">
                {SYRA_DIFFERENTIATION.headline}
              </h2>
              <p className={cn(aboutProseClass, "mt-5 max-w-3xl")}>{SYRA_DIFFERENTIATION.body}</p>
            </section>
          </AboutSectionReveal>

          {/* Traction */}
          <AboutSectionReveal delay={0.04}>
            <section>
              <SectionHeader kicker="Traction" title="Shipping in the open" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                {SYRA_TRACTION.map(({ title, description }) => (
                  <article
                    key={title}
                    className={cn(aboutCardQuietClass, "flex gap-4 rounded-[1.25rem] px-5 py-5 sm:px-6 sm:py-6")}
                  >
                    <span
                      className="about-traction-check mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/50"
                      aria-hidden
                    >
                      <Check className="h-3.5 w-3.5 text-foreground/70" strokeWidth={2.25} />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </AboutSectionReveal>

          {/* Platforms */}
          <AboutSectionReveal delay={0.04}>
            <section>
              <SectionHeader kicker="Where Syra runs" title="One stack, multiple surfaces" />
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                {SYRA_PLATFORMS.map(({ icon: Icon, name, description, href, external }) => {
                  const className = cn(
                    aboutCardClass,
                    "about-platform-link group flex items-start gap-4 rounded-[1.35rem] px-5 py-5 sm:px-6 sm:py-6",
                    "hover:-translate-y-1",
                  );
                  const inner = (
                    <>
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/50 about-pillar-icon">
                        <Icon className="h-[19px] w-[19px] text-foreground/80" strokeWidth={2} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display text-[16px] font-semibold text-foreground">{name}</h3>
                          <ArrowUpRight
                            className="h-4 w-4 text-muted-foreground/35 transition-all duration-300 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-foreground/65"
                            aria-hidden
                          />
                        </div>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>
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
          </AboutSectionReveal>

          {/* Community + CTA */}
          <AboutSectionReveal delay={0.04}>
            <section className={cn(aboutCardClass, "about-cta-band overflow-hidden rounded-[1.75rem] px-7 py-10 sm:px-10 sm:py-12")}>
              <div className="about-cta-mesh pointer-events-none absolute inset-0" aria-hidden />
              <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-12">
                <div>
                  <p className={aboutKickerClass}>Connect</p>
                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
                    Stay in the loop
                  </h2>
                  <p className={cn(aboutProseClass, "mt-3 max-w-md")}>
                    Follow product updates, join the community, or reach support — wherever you operate.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button variant="primary" size="lg" className="h-11" asChild>
                      <a href="/">
                        Try the agent
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="outline" size="lg" className="h-11 border-border/60" asChild>
                      <a href="https://x.com/syra_agent" target="_blank" rel="noopener noreferrer">
                        Follow on X
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {SYRA_COMMUNITY_LINKS.map(({ label, href, description }) => (
                    <a
                      key={label}
                      href={href}
                      {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                      className={cn(
                        "about-community-link group flex flex-col rounded-xl border border-border/40 bg-background/30 px-4 py-3.5",
                        "transition-all duration-300 hover:border-border/70 hover:bg-background/60",
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
              </div>
            </section>
          </AboutSectionReveal>

          {/* Disclaimer */}
          <footer className="about-disclaimer rounded-2xl border border-border/30 bg-muted/10 px-6 py-5 sm:px-7">
            <p className={aboutKickerClass}>Legal</p>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">{SYRA_DISCLAIMER}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
