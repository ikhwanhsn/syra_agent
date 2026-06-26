import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title: string;
  description: string;
}

function ComingSoonContent({ title, description }: ComingSoonProps) {
  return (
    <div className={cn(pageContent, "pb-20")}>
      <div className="max-w-xl mx-auto text-center panel-glass px-5 sm:px-8 py-12 sm:py-16">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <p className="eyebrow mb-3">Coming soon</p>
        <h1 className="heading-section mb-4">{title}</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">{description}</p>
        <Button variant="heroOutline" size="lg" asChild className="rounded-full gap-2">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function CampaignComingSoon() {
  return (
    <SitePageShell>
      <ComingSoonContent
        title="Campaign Hub"
        description="Full-stack marketing campaigns for Solana projects — plan, fund, and track multi-channel growth in one place. We're building this now."
      />
    </SitePageShell>
  );
}

export function ContestComingSoon() {
  return (
    <SitePageShell>
      <ComingSoonContent
        title="Contests"
        description="Community contests and builder competitions with transparent on-chain rewards. Trading arenas, hackathon challenges, and more — launching soon."
      />
    </SitePageShell>
  );
}
