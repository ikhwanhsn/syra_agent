import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const CTASection = () => (
  <section className="section-shell relative overflow-hidden" id="get-started">
    <div className="section-divider" />
    <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" aria-hidden />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,600px)] h-[min(92vw,600px)] bg-primary/10 rounded-full blur-[120px] pointer-events-none"
      aria-hidden
    />

    <div className={cn(siteShell, "relative z-10 min-w-0")}>
      <div className="panel-glass max-w-4xl mx-auto px-5 sm:px-8 md:px-12 py-10 sm:py-14 md:py-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" aria-hidden />
        <div className="relative">
          <p className="eyebrow mb-5">Get Started</p>
          <h2 className="heading-section text-foreground mb-5">
            Start Your Web3 Journey
            <span className="text-gradient block mt-1">Today</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands discovering opportunities, building faster, and
            earning more through the S3Labs ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="cta"
              size="xl"
              asChild
              className="group btn-premium w-full sm:w-auto sm:min-w-[220px] max-w-md"
            >
              <a href="#ecosystem">
                Explore Ecosystem
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button
              variant="heroOutline"
              size="xl"
              asChild
              className="rounded-full w-full sm:w-auto sm:min-w-[220px] max-w-md"
            >
              <Link to="/community">
                <Users className="w-5 h-5" />
                Join Community
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
