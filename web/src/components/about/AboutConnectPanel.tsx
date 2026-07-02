"use client";

import { Link } from "@/lib/navigation";
import { ArrowRight, ArrowUpRight, Bot, Check } from "lucide-react";
import { AboutSectionHeader } from "@/components/about/AboutSectionHeader";
import {
  aboutCardClass,
  aboutCardQuietClass,
  aboutKickerClass,
  aboutProseClass,
  aboutSectionKickerClass,
} from "@/components/about/aboutStyles";
import { SYRA_COMMUNITY_LINKS, SYRA_DISCLAIMER, SYRA_PLATFORMS, SYRA_TRACTION } from "@/content/syraAbout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AboutConnectPanel() {
  return (
    <div className="about-tab-panel space-y-5 sm:space-y-6">
      <AboutSectionHeader
        kicker="Ecosystem"
        title="Shipping in the open"
        description="Live integrations, community channels, and surfaces where Syra runs."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SYRA_TRACTION.map(({ title, description }) => (
          <article
            key={title}
            className={cn(
              aboutCardQuietClass,
              "about-traction-card flex gap-3.5 rounded-[1.1rem] px-4 py-4 sm:px-5 sm:py-5",
            )}
          >
            <span className="about-traction-check mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/45">
              <Check className="h-3.5 w-3.5 text-foreground/65" strokeWidth={2.25} aria-hidden />
            </span>
            <div>
              <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.62] text-muted-foreground/90">{description}</p>
            </div>
          </article>
        ))}
      </div>

      <AboutSectionHeader kicker="Platforms" title="One stack, multiple surfaces" />

      <div className="grid gap-3 sm:grid-cols-2">
        {SYRA_PLATFORMS.map(({ icon: Icon, name, description, href, external }) => {
          const className = cn(
            aboutCardClass,
            "about-platform-link group flex items-start gap-3.5 rounded-[1.15rem] px-4 py-4 sm:px-5 sm:py-5",
          );
          const inner = (
            <>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/50 about-pillar-icon">
                <Icon className="h-[18px] w-[18px] text-foreground/80" strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-[15px] font-semibold text-foreground">{name}</h3>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/35 group-hover:text-foreground/60" aria-hidden />
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

      <section className={cn(aboutCardClass, "about-cta-band overflow-hidden rounded-[1.35rem] px-6 py-8 sm:px-8 sm:py-9")}>
        <div className="about-cta-mesh pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <div>
            <p className={aboutSectionKickerClass}>Connect</p>
            <h3 className="mt-4 font-display text-xl font-semibold tracking-[-0.035em] text-foreground sm:text-2xl">
              Stay in the loop
            </h3>
            <p className={cn(aboutProseClass, "mt-3 max-w-md")}>
              Follow product updates, join the community, or reach support — wherever you operate.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Button variant="primary" size="lg" className="about-hero-cta-primary h-11" asChild>
                <a href="/">
                  <Bot className="mr-2 h-4 w-4" />
                  Try the agent
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="h-11 border-border/50 bg-background/35" asChild>
                <a href="https://x.com/syra_agent" target="_blank" rel="noopener noreferrer">
                  Follow on X
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SYRA_COMMUNITY_LINKS.map(({ label, href, description }) => (
              <a
                key={label}
                href={href}
                {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                className="about-community-link group flex flex-col rounded-xl border border-border/35 bg-background/25 px-3.5 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium text-foreground">{label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/35 group-hover:text-foreground/55" aria-hidden />
                </div>
                <p className="mt-1 text-[11.5px] text-muted-foreground">{description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="about-disclaimer rounded-xl border border-border/25 bg-muted/[0.06] px-5 py-4 sm:px-6">
        <p className={aboutKickerClass}>Legal</p>
        <p className="mt-2.5 text-[12px] leading-[1.65] text-muted-foreground/90">{SYRA_DISCLAIMER}</p>
      </footer>
    </div>
  );
}
