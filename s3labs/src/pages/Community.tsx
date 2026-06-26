import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import CommunitySection from "@/components/CommunitySection";
import CTASection from "@/components/CTASection";
import { Button } from "@/components/ui/button";

function CommunityContent() {
  return (
    <>
      <section className={cn(pageContent, "pb-8")}>
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">Community</p>
          <h1 className="heading-display">
            Operator network for{" "}
            <span className="text-gradient">Solana builders</span>
          </h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            500+ founders, developers, and operators sharing playbooks, collab opportunities,
            and early access to S3 Labs programs and events.
          </p>
          <Button variant="hero" size="lg" className="btn-premium rounded-full mt-8" asChild>
            <a href="https://t.me/s3labs" target="_blank" rel="noopener noreferrer">
              Join on Telegram
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </section>

      <CommunitySection />
      <CTASection />
    </>
  );
}

const Community = () => (
  <SitePageShell>
    <CommunityContent />
  </SitePageShell>
);

export default Community;
