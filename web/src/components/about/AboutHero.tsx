"use client";

import { ArrowRight, BookOpen, Bot, ExternalLink } from "lucide-react";
import { AboutTokenBar } from "@/components/about/AboutTokenBar";
import {
  aboutDisplayTitleClass,
  aboutHeroClass,
  aboutKickerClass,
  aboutProseClass,
} from "@/components/about/aboutStyles";
import { SYRA_MISSION, SYRA_STATS, SYRA_TAGLINE, SYRA_VISION } from "@/content/syraAbout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_STATS = SYRA_STATS.filter((s) => ["Founded", "Chain", "Stage"].includes(s.label));

export function AboutHero() {
  return (
    <header className={cn(aboutHeroClass, "about-hero-premium")}>
      <div className="about-hero-shine pointer-events-none absolute inset-x-0 top-0 h-px" aria-hidden />
      <div className="about-hero-noise pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div className="about-grid-bg" aria-hidden />
      <div className="about-hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="about-hero-aurora pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14 xl:px-14 xl:py-16">
        <div className="flex flex-col gap-10 lg:gap-12">
          {/* Top meta row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
                <div
                  className="absolute -inset-1 rounded-[1.35rem] bg-gradient-to-br from-foreground/15 via-transparent to-foreground/5 blur-md"
                  aria-hidden
                />
                <div className="about-logo-frame relative flex h-full w-full overflow-hidden rounded-[1.25rem]">
                  <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" draggable={false} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={aboutKickerClass}>About Syra</span>
                  <span className="h-3 w-px bg-border/60" aria-hidden />
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/45 bg-background/50 px-3 py-1 backdrop-blur-sm">
                    <span className="about-live-dot h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Live on Solana
                    </span>
                  </span>
                </div>
                <p className="text-[13px] font-medium text-muted-foreground/80">Agent finance · x402 · DeFi</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              {HERO_STATS.map(({ label, value }) => (
                <div
                  key={label}
                  className="about-hero-stat-chip rounded-xl border border-border/40 bg-background/35 px-3.5 py-2 backdrop-blur-sm"
                >
                  <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground/65">{label}</p>
                  <p className="about-stat-value mt-0.5 font-display text-[15px] font-semibold tracking-tight text-foreground">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Headline + actions */}
          <div className="grid gap-10 xl:grid-cols-[1fr_16.5rem] xl:items-end xl:gap-14">
            <div className="min-w-0 max-w-3xl">
              <h1 className={cn(aboutDisplayTitleClass, "text-balance")}>
                <span className="about-headline-gradient block">{SYRA_TAGLINE.split(" for ")[0]}</span>
                <span className="mt-1 block text-foreground/92">
                  for{" "}
                  <span className="about-headline-accent">{SYRA_TAGLINE.split(" for ")[1] ?? SYRA_TAGLINE}</span>
                </span>
              </h1>
              <p className={cn(aboutProseClass, "mt-6 max-w-2xl text-pretty text-[16px] sm:text-[17px]")}>
                {SYRA_MISSION}
              </p>
              <p className="mt-4 max-w-2xl text-pretty text-[14px] leading-[1.75] text-muted-foreground/70 sm:text-[15px]">
                {SYRA_VISION}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row xl:flex-col">
              <Button
                variant="primary"
                size="lg"
                className="about-hero-cta-primary h-12 w-full justify-center shadow-lg"
                asChild
              >
                <a href="/">
                  <Bot className="mr-2 h-4 w-4" />
                  Open agent
                  <ArrowRight className="ml-2 h-4 w-4 opacity-80" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="about-hero-cta-secondary h-12 w-full justify-center border-border/50 bg-background/40 backdrop-blur-sm"
                asChild
              >
                <a href="https://docs.syraa.fun" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Documentation
                  <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-45" />
                </a>
              </Button>
            </div>
          </div>

          {/* Token dock */}
          <div className="about-hero-token-rail">
            <AboutTokenBar />
          </div>
        </div>
      </div>
    </header>
  );
}
