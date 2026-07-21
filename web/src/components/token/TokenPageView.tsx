"use client";

import { ExternalLink } from "lucide-react";
import { Link } from "@/lib/navigation";
import { AboutTokenBar } from "@/components/about/AboutTokenBar";
import { GrowthFooter } from "@/components/growth/GrowthFooter";
import { TokenSection } from "@/components/marketing/TokenSection";
import { PlaygroundPageShell } from "@/components/playground/PlaygroundPageShell";
import { PLAYGROUND_PAGE_CLASS } from "@/components/playground/playgroundStyles";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DOCS_TOKENOMICS = "https://docs.syraa.fun/docs/token/tokenomics";
const DOCS_PRICING = "https://docs.syraa.fun/docs/build/pricing";

export function TokenPageView() {
  return (
    <PlaygroundPageShell>
      <div className={cn(PLAYGROUND_PAGE_CLASS)}>
        <header className="mb-8 max-w-2xl space-y-3 sm:mb-10">
          <p className={overviewKickerClass}>$SYRA</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Token details
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-[17px]">
            Mint, buy links, utility, and buyback disclosure for $SYRA. Live product traction is on the
            home metrics page — this page is the token detail surface.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-9 rounded-lg" asChild>
              <Link to="/">← Live metrics</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-lg" asChild>
              <Link to="/staking">Stake $SYRA</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg" asChild>
              <a href={DOCS_TOKENOMICS} target="_blank" rel="noopener noreferrer">
                Tokenomics docs
                <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg" asChild>
              <a href={DOCS_PRICING} target="_blank" rel="noopener noreferrer">
                API pricing
                <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="h-9 rounded-lg text-muted-foreground" asChild>
              <Link to="/marketplace">← Marketplace</Link>
            </Button>
          </div>
        </header>

        <div className="mb-10">
          <AboutTokenBar />
        </div>

        <TokenSection />
      </div>
      <GrowthFooter />
    </PlaygroundPageShell>
  );
}
