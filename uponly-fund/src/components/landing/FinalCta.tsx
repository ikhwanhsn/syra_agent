import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FinalCtaProps = {
  className?: string;
};

export function FinalCta({ className }: FinalCtaProps) {
  return (
    <section
      className={cn("mb-12 sm:mb-20", className)}
      aria-labelledby="uof-landing-final-cta"
    >
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-foreground/[0.03] via-card/50 to-card/25 p-8 sm:p-12">
        <div
          className="pointer-events-none absolute inset-0 uof-hero-mesh opacity-50"
          aria-hidden
        />
        <div className="relative z-10 text-center">
          <h2
            id="uof-landing-final-cta"
            className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl"
          >
            Ready for live markets?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-sm text-muted-foreground sm:text-base">
            This landing page now includes the core tranche + treasury context. Open the dashboard for live market
            data and simulators.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 min-[400px]:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 min-w-[12rem] rounded-xl bg-uof !text-[hsl(var(--uof-foreground))] font-semibold shadow-md hover:bg-uof/90"
            >
              <Link to="/dashboard" className="inline-flex items-center justify-center gap-2">
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-border/50 bg-background/30 font-medium"
            >
              <Link to="/" className="inline-flex">
                Re-read overview
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
