"use client";

import { ArrowRight, BarChart3, BookOpen, Bot, ExternalLink } from "lucide-react";
import { Link } from "@/lib/navigation";
import type { AboutTabId } from "@/components/about/aboutTabs";
import {
  aboutDisplayTitleClass,
  aboutHeroClass,
  aboutKickerClass,
  aboutProseClass,
} from "@/components/about/aboutStyles";
import { SYRA_MISSION, SYRA_STATS, SYRA_TAGLINE } from "@/content/syraAbout";
import { SYRA_TOKEN_PAGE_PATH } from "@/content/syraFocus";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HERO_STATS = SYRA_STATS.filter((s) => ["Founded", "Chain", "Stage"].includes(s.label));

interface AboutHeroProps {
  onSelectTab?: (tab: AboutTabId) => void;
  activeTab?: AboutTabId;
}

export function AboutHero({ onSelectTab, activeTab }: AboutHeroProps) {
  return (
    <header className={cn(aboutHeroClass, "about-hero-premium about-hero-compact")}>
      <div className="about-hero-shine pointer-events-none absolute inset-x-0 top-0 h-px" aria-hidden />
      <div className="about-hero-noise pointer-events-none absolute inset-0 opacity-[0.3]" aria-hidden />
      <div className="about-grid-bg" aria-hidden />
      <div className="about-hero-mesh pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-7 lg:gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                <div className="about-logo-frame relative flex h-full w-full overflow-hidden rounded-[1.1rem]">
                  <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" draggable={false} />
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={aboutKickerClass}>About Syra</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/45 bg-background/50 px-2.5 py-0.5">
                    <span className="about-live-dot h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Live
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-[12px] font-medium text-muted-foreground/80">Pay-per-call · Solana · x402</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {HERO_STATS.map(({ label, value }) => (
                <div
                  key={label}
                  className="about-hero-stat-chip rounded-lg border border-border/40 bg-background/35 px-3 py-1.5 backdrop-blur-sm"
                >
                  <p className="text-[8px] font-medium uppercase tracking-[0.14em] text-muted-foreground/65">{label}</p>
                  <p className="about-stat-value mt-0.5 font-display text-[13px] font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10">
            <div className="min-w-0 max-w-2xl">
              <h1 className={cn(aboutDisplayTitleClass, "text-balance !text-[1.85rem] sm:!text-[2.35rem] lg:!text-[2.65rem]")}>
                <span className="about-headline-gradient block">{SYRA_TAGLINE.split(" for ")[0]}</span>
                <span className="mt-0.5 block text-foreground/92">
                  for <span className="about-headline-accent">{SYRA_TAGLINE.split(" for ")[1] ?? SYRA_TAGLINE}</span>
                </span>
              </h1>
              <p className={cn(aboutProseClass, "mt-4 max-w-xl text-pretty text-[15px] sm:text-[16px]")}>{SYRA_MISSION}</p>
            </div>

            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
              <Button variant="primary" size="default" className="about-hero-cta-primary h-10 px-4" asChild>
                <a href="/agent">
                  <Bot className="mr-2 h-4 w-4" />
                  Open agent
                  <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-80" />
                </a>
              </Button>
              {onSelectTab ? (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className={cn(
                    "h-10 border-border/50 bg-background/40 px-4",
                    activeTab === "analytics" && "border-foreground/20 bg-foreground/[0.05]",
                  )}
                  onClick={() => onSelectTab("analytics")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              ) : null}
              <Button variant="outline" size="default" className="h-10 border-border/50 bg-background/40 px-4" asChild>
                <a href="https://docs.syraa.fun" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Docs
                  <ExternalLink className="ml-2 h-3 w-3 opacity-45" />
                </a>
              </Button>
            </div>
          </div>

          <div className="about-hero-token-rail pt-1">
            <p className="text-sm text-muted-foreground">
              <Link
                to={SYRA_TOKEN_PAGE_PATH}
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                $SYRA token details
              </Link>
              <span className="text-muted-foreground/50"> · mint, staking, buyback</span>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
