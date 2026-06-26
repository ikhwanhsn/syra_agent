import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import PortfolioStatsHero from "@/components/landing/PortfolioStatsHero";
import PortfolioCaseStudies from "@/components/landing/PortfolioCaseStudies";
import ProjectsShowcase from "@/components/ProjectsShowcase";
import FounderTestimonials from "@/components/FounderTestimonials";
import CTASection from "@/components/CTASection";
import { Button } from "@/components/ui/button";

function PortfolioContent() {
  return (
    <>
      <section className={cn(pageContent, "pb-8")}>
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">Portfolio</p>
          <h1 className="heading-display">
            Proof over{" "}
            <span className="text-gradient">promises</span>
          </h1>
          <p className="text-muted-foreground mt-5 text-lg leading-relaxed">
            From hackathon winners to revenue-generating products — real outcomes from founders
            we&apos;ve partnered with on Solana.
          </p>
          <Button variant="hero" size="lg" className="btn-premium rounded-full mt-8" asChild>
            <Link to="/apply">
              Apply your project
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      <PortfolioStatsHero />
      <ProjectsShowcase />
      <PortfolioCaseStudies />
      <FounderTestimonials />
      <CTASection />
    </>
  );
}

const Portfolio = () => (
  <SitePageShell>
    <PortfolioContent />
  </SitePageShell>
);

export default Portfolio;
