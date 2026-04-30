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
      className={cn("scroll-mt-24 mb-12 sm:mb-20", className)}
      aria-labelledby="uof-landing-final-cta"
    >
      <Card className="landing-final-cta relative overflow-hidden rounded-2xl border-border/45 bg-gradient-to-br from-card/70 via-card/45 to-uof/[0.07] p-10 sm:rounded-[1.35rem] sm:p-14 md:p-16">
        <div
          className="pointer-events-none absolute inset-0 uof-hero-mesh opacity-[0.42]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Allocator desk
          </p>
          <h2
            id="uof-landing-final-cta"
            className="landing-section-title mt-4 text-foreground md:text-[2.125rem]"
          >
            Price the same upside we allocate to
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base md:text-[1.0625rem]">
            Mandate, treasury mechanics, and live RISE desk tools live in one place—so you can diligence like an allocator
            before sizing <span className="font-mono text-foreground/88">$UPONLY</span>.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 min-[400px]:flex-row md:mt-12">
            <Button
              asChild
              size="lg"
              className="h-12 min-w-[13rem] rounded-lg bg-uof !text-[hsl(var(--uof-foreground))] px-8 font-semibold shadow-[0_10px_32px_-8px_hsl(var(--uof)/0.45)] hover:bg-uof/92"
            >
              <Link to="/dashboard" className="inline-flex items-center justify-center gap-2">
                Open live desk
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-lg border-border/55 bg-background/45 px-8 font-medium backdrop-blur-sm hover:bg-background/70"
            >
              <Link to="/#mandate" className="inline-flex">
                Review mandate
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
