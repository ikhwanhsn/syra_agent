import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FinalCtaProps = {
  className?: string;
};

export function FinalCta({ className }: FinalCtaProps) {
  return (
    <section
      className={cn("scroll-mt-24", className)}
      aria-labelledby="uof-landing-final-cta"
    >
      <div className="landing-institutional-panel px-8 py-14 text-center sm:px-14 sm:py-16 md:px-20 md:py-20">
        <p className="landing-eyebrow">Conviction allocator</p>
        <h2
          id="uof-landing-final-cta"
          className="landing-section-title mx-auto mt-5 max-w-2xl text-foreground"
        >
          Understand the thesis before you size
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Mandate, 80/20 allocation thesis, and treasury mechanics live in one place—so you can diligence like an
          allocator on Solana before sizing <span className="font-mono text-foreground/88">$UPONLY</span>.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 min-[400px]:flex-row md:mt-12">
          <Button
            asChild
            size="lg"
            className="h-12 min-w-[13rem] rounded-md bg-foreground px-8 font-semibold text-background hover:bg-foreground/90"
          >
            <Link to="/#thesis" className="inline-flex items-center justify-center gap-2">
              Read the thesis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-md border-border/70 bg-transparent px-8 font-medium hover:bg-foreground/[0.04]"
          >
            <Link to="/#mandate">Review mandate</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
