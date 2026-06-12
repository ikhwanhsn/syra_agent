import { ArrowUpRight, Building2, Coins, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { venueStatusLabel, xstocksAssetUrl, type SpcxVenueQuote } from "@/lib/spcxApi";
import { SpcxSection } from "@/components/spcx/SpcxSection";
import { spcxCardQuietClass } from "@/components/spcx/spcxStyles";

interface PlaybookStep {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Coins;
  ctaLabel: string;
  ctaHref: string;
  badge?: string;
  bestFor: string;
}

function buildSteps(venues: SpcxVenueQuote[]): PlaybookStep[] {
  const xstocks = venues.find((v) => v.venue === "xstocks");
  const backpack = venues.find((v) => v.venue === "backpack");
  const ondo = venues.find((v) => v.venue === "ondo");

  return [
    {
      step: 1,
      title: "Buy with crypto wallet",
      subtitle: "Fastest · 24/7",
      description:
        xstocks?.accessNote ||
        "Swap USDC or SOL for SPCXx on Solana. Best if you already use a crypto wallet.",
      icon: Coins,
      ctaLabel: "Go to buy panel",
      ctaHref: "#spcx-trade",
      badge: xstocks ? venueStatusLabel(xstocks.status) : "On-chain",
      bestFor: "Crypto users",
    },
    {
      step: 2,
      title: "Buy on an exchange",
      subtitle: "Kraken · Bybit",
      description:
        "Trade through the xStocks program on major exchanges. Works like buying any other stock or crypto.",
      icon: Building2,
      ctaLabel: "View xStocks page",
      ctaHref: xstocksAssetUrl(xstocks?.symbol ?? "SPCXx"),
      badge: xstocks ? xstocks.symbol : "SPCXx",
      bestFor: "Exchange users",
    },
    {
      step: 3,
      title: "Buy via brokerage",
      subtitle: "Backpack · Ondo",
      description:
        backpack?.accessNote ||
        ondo?.accessNote ||
        "Custodied tracks for users who prefer traditional brokerage-style access.",
      icon: Landmark,
      ctaLabel: "Compare all options",
      ctaHref: "#spcx-venues",
      badge: backpack ? venueStatusLabel(backpack.status) : "Brokerage",
      bestFor: "Long-term holders",
    },
  ];
}

export function SpcxIpoPlaybook({ venues }: { venues: SpcxVenueQuote[] }) {
  const steps = buildSteps(venues);

  return (
    <SpcxSection
      id="spcx-playbook"
      kicker="Choose your path"
      title="3 ways to get SpaceX exposure"
      description="Pick the route that matches how you already invest — we track all of them in one place."
      icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.step} className={spcxCardQuietClass}>
            <CardContent className="flex flex-1 flex-col p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {step.step}
                </div>
                {step.badge ? (
                  <Badge variant="outline" className="rounded-lg text-[10px]">
                    {step.badge}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {step.subtitle}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <step.icon className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">{step.title}</h3>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              <p className="mt-3 text-xs text-muted-foreground/80">
                Best for: <span className="font-medium text-foreground">{step.bestFor}</span>
              </p>
              <Button variant="outline" size="sm" className="mt-4 w-full gap-2 rounded-xl" asChild>
                <a href={step.ctaHref}>
                  {step.ctaLabel}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </SpcxSection>
  );
}
