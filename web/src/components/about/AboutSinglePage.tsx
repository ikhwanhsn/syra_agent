"use client";

import { ArrowRight, ArrowUpRight, Bot, ExternalLink } from "lucide-react";
import { Link } from "@/lib/navigation";
import { AboutSaidBadge } from "@/components/about/AboutSaidBadge";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import {
  SYRA_COMMUNITY_LINKS,
  SYRA_DISCLAIMER,
  SYRA_MISSION,
  SYRA_PILLARS,
  SYRA_PILLAR_STATUS_LABEL,
  SYRA_PLATFORMS,
  SYRA_TAGLINE,
} from "@/content/syraAbout";
import { SYRA_LIVE_SUBLINE } from "@/lib/syraBranding";
import { SYRA_TOKEN_PAGE_PATH } from "@/content/syraFocus";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CORE_PILLARS = SYRA_PILLARS.filter((p) =>
  ["Earn", "Treasury", "Invest", "Spend", "Grow"].includes(p.title),
);

export function AboutSinglePage() {
  return (
    <div className="space-y-14 sm:space-y-16">
      {/* Hero */}
      <header className="space-y-8 text-center sm:text-left">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
            <img src="/logo.jpg" alt="Syra" className="h-full w-full object-cover" draggable={false} />
          </div>
          <div className="min-w-0 space-y-3">
            <p className={overviewKickerClass}>About Syra</p>
            <h1 className="text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {SYRA_TAGLINE}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:mx-0 sm:text-[17px]">
              {SYRA_MISSION}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Button size="default" className="rounded-xl px-5" asChild>
            <Link to="/agent">
              <Bot className="mr-2 h-4 w-4" />
              Open agent
              <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-80" />
            </Link>
          </Button>
          <Button variant="outline" size="default" className="rounded-xl px-5" asChild>
            <a href="https://docs.syraa.fun" target="_blank" rel="noopener noreferrer">
              Documentation
              <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-50" />
            </a>
          </Button>
          <Button variant="outline" size="default" className="rounded-xl px-5" asChild>
            <Link to="/marketplace">Marketplace</Link>
          </Button>
        </div>

        <AboutSaidBadge />
      </header>

      {/* Five pillars */}
      <section>
        <div className="mb-6 max-w-xl">
          <p className={overviewKickerClass}>Machine money</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Five pillars for autonomous agents
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Earn, Treasury, Invest, Spend, and Grow — on Solana. {SYRA_LIVE_SUBLINE}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {CORE_PILLARS.map(({ icon: Icon, title, description, status }) => (
            <article key={title} className={cn(overviewCardShell, "p-5")}>
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/45 bg-muted/20">
                  <Icon className="h-4 w-4 text-foreground/80" strokeWidth={1.75} aria-hidden />
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
              <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Platforms */}
      <section>
        <div className="mb-6">
          <p className={overviewKickerClass}>Product</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Where to use Syra
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {SYRA_PLATFORMS.map(({ icon: Icon, name, description, href, external }) => {
            const className = cn(
              overviewCardShell,
              "group flex items-start gap-3.5 p-4 transition-colors hover:border-border/70 sm:p-5",
            );
            const inner = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/45 bg-muted/15">
                  <Icon className="h-[17px] w-[17px] text-foreground/80" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-foreground">{name}</h3>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground/60" />
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
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
      <section className={cn(overviewCardShell, "overflow-hidden p-6 sm:p-8")}>
        <p className={overviewKickerClass}>Community</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Stay connected</h2>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SYRA_COMMUNITY_LINKS.map(({ label, href, description }) => (
            <a
              key={label}
              href={href}
              {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/30 px-4 py-3 transition-colors hover:border-border/60 hover:bg-background/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-foreground/60" />
            </a>
          ))}
        </div>
      </section>

      {/* Disclaimer + quiet token link */}
      <footer className="space-y-4">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          <Link
            to={SYRA_TOKEN_PAGE_PATH}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            $SYRA token details
          </Link>
          <span className="text-muted-foreground/50"> · mint, staking, buyback disclosure</span>
        </p>
        <div className="rounded-xl border border-border/30 bg-muted/[0.04] px-5 py-4 sm:px-6">
          <p className={overviewKickerClass}>Disclaimer</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{SYRA_DISCLAIMER}</p>
        </div>
      </footer>
    </div>
  );
}
