import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import ProgramPillars from "@/components/landing/ProgramPillars";
import WhoWeHelp from "@/components/WhoWeHelp";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorks from "@/components/HowItWorks";
import ComparisonSection from "@/components/ComparisonSectionProps";
import CTASection from "@/components/CTASection";
import { Button } from "@/components/ui/button";

function ProgramsContent() {
  return (
    <>
      <section className="container relative z-[1] pt-28 pb-12">
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">Programs</p>
          <h1 className="heading-display">
            Growth programs for{" "}
            <span className="text-gradient">Solana builders</span>
          </h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            We help hackathon winners and MVP teams generate revenue, accelerate adoption, and
            scale — with operator-led programs, not generic advice.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button variant="hero" size="lg" className="btn-premium rounded-full" asChild>
              <Link to="/apply">
                Apply your project
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="heroOutline" size="lg" className="rounded-full" asChild>
              <Link to="/portfolio">See portfolio results</Link>
            </Button>
          </div>
        </div>
      </section>

      <ProgramPillars />
      <WhoWeHelp />
      <BenefitsSection />
      <HowItWorks />
      <ComparisonSection />
      <CTASection />
    </>
  );
}

const Programs = () => (
  <SitePageShell>
    <ProgramsContent />
  </SitePageShell>
);

export default Programs;
