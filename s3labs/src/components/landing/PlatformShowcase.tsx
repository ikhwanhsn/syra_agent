import { Link } from "react-router-dom";
import { ArrowRight, Megaphone, Rocket, Trophy } from "lucide-react";

import SectionHeader from "@/components/landing/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteShell } from "@/lib/siteLayout";

const products = [
  {
    icon: Megaphone,
    title: "KOL Marketplace",
    status: "live" as const,
    href: "/kol",
    description:
      "Projects fund SOL rewards for X posts they want amplified. Verified KOLs submit reply or quote links, climb the engagement leaderboard, and get paid pro-rata on Solana.",
    highlights: [
      "Verify X, then submit one post per campaign",
      "Fund rewards with Solana wallet",
      "Automatic on-chain payouts",
    ],
    cta: "Open KOL Marketplace",
  },
  {
    icon: Rocket,
    title: "Campaign Hub",
    status: "soon" as const,
    href: "/campaign",
    description:
      "End-to-end marketing campaigns for Solana projects — plan objectives, set budgets, coordinate channels, and track performance in one place.",
    highlights: [
      "Multi-channel campaign planning",
      "Budget and milestone tracking",
      "Unified analytics dashboard",
    ],
    cta: "Coming soon",
  },
  {
    icon: Trophy,
    title: "Contests",
    status: "soon" as const,
    href: "/contest",
    description:
      "Community contests and builder competitions — trading arenas, hackathon challenges, and ecosystem events with transparent on-chain rewards.",
    highlights: [
      "Builder and community competitions",
      "Arena-style token leaderboards",
      "On-chain reward distribution",
    ],
    cta: "Coming soon",
  },
] as const;

const PlatformShowcase = () => (
  <section className="section-shell bg-gradient-subtle" id="platform">
    <div className="section-divider" />
    <div className={cn(siteShell, "relative z-10")}>
      <SectionHeader
        eyebrow="Platform"
        title={
          <>
            KOL, campaigns
            <span className="text-gradient block mt-1">& contests</span>
          </>
        }
        description="Distribution and growth tools for Solana projects — KOL Marketplace live today, more launching soon"
      />

      <div className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {products.map((product) => {
          const isLive = product.status === "live";

          return (
            <article
              key={product.href}
              className="card-premium-hover p-6 sm:p-7 flex flex-col h-full"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center shrink-0">
                  <product.icon className="w-5 h-5 text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase tracking-wider shrink-0",
                    isLive
                      ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      : "border-amber-500/40 text-amber-400 bg-amber-500/10",
                  )}
                >
                  {isLive ? "Live" : "Soon"}
                </Badge>
              </div>

              <h3 className="text-base font-semibold text-foreground tracking-tight mb-2">
                {product.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                {product.description}
              </p>

              <ul className="space-y-2 mb-6">
                {product.highlights.map((item) => (
                  <li
                    key={item}
                    className="text-xs text-muted-foreground/90 flex items-start gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              {isLive ? (
                <Button variant="hero" size="sm" asChild className="rounded-full gap-2 w-full">
                  <Link to={product.href}>
                    {product.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="heroOutline"
                  size="sm"
                  asChild
                  className="rounded-full gap-2 w-full"
                >
                  <Link to={product.href}>{product.cta}</Link>
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  </section>
);

export default PlatformShowcase;
