"use client";

import { Link } from "@/lib/navigation";
import { ArrowUpRight, Sparkles } from "lucide-react";
import {
  SYRA_CAPABILITIES,
  SYRA_COMMUNITY_LINKS,
  SYRA_DISCLAIMER,
  SYRA_MISSION,
  SYRA_PILLARS,
  SYRA_PLATFORMS,
  SYRA_SUMMARY,
  SYRA_TAGLINE,
} from "@/content/syraAbout";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

interface AboutPageViewProps {
  embedded?: boolean;
}

export function AboutPageView({ embedded = false }: AboutPageViewProps) {
  return (
    <div className={cn("relative min-h-full w-full", embedded ? "bg-background" : "")}>
      {!embedded ? <OverviewPageBackdrop /> : null}

      <div
        className={cn(
          embedded ? "px-2 pb-8 pt-2 sm:px-4" : DASHBOARD_CONTENT_SHELL,
          !embedded && PAGE_PADDING_TOP_MEDIUM,
          !embedded && PAGE_SAFE_AREA_BOTTOM,
          "relative z-[1] mx-auto max-w-4xl space-y-8 sm:space-y-10",
        )}
      >
        {/* Hero */}
        <header className={cn(overviewCardShell, "overflow-hidden rounded-3xl px-5 py-8 sm:px-8 sm:py-10")}>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{ background: overviewAccentBackground("neutral") }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border) / 0.14) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border) / 0.14) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
            aria-hidden
          />

          <div className="relative flex flex-col items-center text-center">
            <div className="relative mb-6 h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]">
              <div
                className="absolute inset-0 rounded-[1.25rem] bg-foreground/[0.06] blur-xl"
                aria-hidden
              />
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.25rem] border border-border/55 bg-gradient-to-br from-card via-card/95 to-muted/35 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-white/[0.05]">
                <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" draggable={false} />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
              About Syra
            </div>

            <h1 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              {SYRA_TAGLINE}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {SYRA_MISSION}
            </p>
          </div>
        </header>

        {/* Summary */}
        <section className={cn(overviewCardShell, "rounded-2xl px-5 py-6 sm:px-7 sm:py-7")}>
          <p className={overviewKickerClass}>What we build</p>
          <p className="mt-3 text-pretty text-[15px] leading-[1.65] text-foreground/90 sm:text-base">
            {SYRA_SUMMARY}
          </p>
        </section>

        {/* Pillars */}
        <section>
          <div className="mb-4 px-1">
            <p className={overviewKickerClass}>Core pillars</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Built for traders and agents
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {SYRA_PILLARS.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className={cn(
                  overviewCardShell,
                  "group rounded-2xl px-4 py-4 transition-[border-color,box-shadow] duration-200 hover:border-border/70 sm:px-5 sm:py-5",
                )}
              >
                <div className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/40 text-foreground/80 transition-colors group-hover:border-border/70 group-hover:bg-background/60">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Capabilities */}
        <section>
          <div className="mb-4 px-1">
            <p className={overviewKickerClass}>Every analysis includes</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Structured intelligence output
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            {SYRA_CAPABILITIES.map(({ title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border/45 bg-card/30 px-4 py-3.5 backdrop-blur-sm"
              >
                <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Platforms */}
        <section>
          <div className="mb-4 px-1">
            <p className={overviewKickerClass}>Where Syra runs</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              One stack, multiple surfaces
            </h2>
          </div>
          <div className="space-y-3">
            {SYRA_PLATFORMS.map(({ icon: Icon, name, description, href, external }) => {
              const className = cn(
                overviewCardShell,
                "group flex items-start gap-4 rounded-2xl px-4 py-4 transition-[border-color,box-shadow] duration-200 hover:border-border/70 sm:px-5",
              );
              const inner = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/40">
                    <Icon className="h-[18px] w-[18px] text-foreground/80" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[15px] font-semibold text-foreground">{name}</h3>
                      <ArrowUpRight
                        className="h-3.5 w-3.5 text-muted-foreground/40 transition-[color,transform] duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-muted-foreground/70"
                        aria-hidden
                      />
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </>
              );

              if (external) {
                return (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
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
        <section className={cn(overviewCardShell, "rounded-2xl px-5 py-6 sm:px-7 sm:py-7")}>
          <p className={overviewKickerClass}>Connect</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Stay in the loop</h2>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SYRA_COMMUNITY_LINKS.map(({ label, href, description }) => (
              <a
                key={label}
                href={href}
                {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                className={cn(
                  "group rounded-xl border border-border/45 bg-background/30 px-4 py-3",
                  "transition-[border-color,background-color] duration-200",
                  "hover:border-border/70 hover:bg-background/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-foreground">{label}</span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px"
                    aria-hidden
                  />
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <footer className="rounded-xl border border-border/40 bg-muted/15 px-4 py-4 sm:px-5">
          <p className="text-[12px] leading-relaxed text-muted-foreground">{SYRA_DISCLAIMER}</p>
        </footer>
      </div>
    </div>
  );
}
