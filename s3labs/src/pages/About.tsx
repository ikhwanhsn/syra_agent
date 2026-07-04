import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import MissionSection from "@/components/MissionSection";
import TeamSection from "@/components/TeamSection";
import WhyUsSection from "@/components/WhyUsSection";
import CTASection from "@/components/CTASection";
import { Button } from "@/components/ui/button";

function AboutContent() {
  return (
    <>
      <section className={cn(pageContent, "pb-8")}>
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">About</p>
          <h1 className="heading-display">
            Operator-led{" "}
            <span className="text-gradient">growth studio</span>
          </h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            S3 Labs is the growth partner for Solana developers with hackathon wins or live
            MVPs. We back execution, not narratives — pairing revenue programs, distribution,
            and a 500+ founder network.
          </p>
          <Button variant="hero" size="lg" className="btn-premium rounded-full mt-8" asChild>
            <Link to="/">
              Explore ecosystem
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      <MissionSection />
      <TeamSection />
      <WhyUsSection />
      <CTASection />
    </>
  );
}

const About = () => (
  <SitePageShell>
    <AboutContent />
  </SitePageShell>
);

export default About;
