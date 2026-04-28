import { RISE_DOCS, ExternalLink, SectionEyebrow } from "../primitives";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BookOpen, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { UP_ONLY_FUND } from "@/data/upOnlyFund";

type FinalCtaProps = { className?: string };

export function FinalCta({ className }: FinalCtaProps) {
  const x = UP_ONLY_FUND.twitterUrl;
  return (
    <div className={cn("mb-20 w-full min-w-0 max-w-full space-y-6 sm:space-y-8", className)} id="final-cta">
      <section
        className="relative min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-foreground/[0.04] via-card/40 to-card/20 p-4 text-center sm:rounded-3xl sm:p-8 md:p-10 lg:p-12"
        aria-labelledby="uof-closing-heading"
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--ring)/0.15),transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-[1] mx-auto min-w-0 max-w-2xl px-1 sm:px-0">
          <SectionEyebrow className="text-center">Stay in the loop</SectionEyebrow>
          <h2
            id="uof-closing-heading"
            className="text-balance break-words text-xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:mt-3 sm:text-2xl md:text-3xl lg:text-4xl"
          >
            Follow the <span className="neon-text">mandate</span> — and the RISE spec
          </h2>
          <p className="mt-3 break-words text-sm text-muted-foreground [overflow-wrap:anywhere] sm:mt-4 sm:text-base sm:leading-relaxed">
            {UP_ONLY_FUND.name} updates will be published on this page first. RISE’s protocol and legal terms are the
            authority for the venue itself.
          </p>
          <div className="mt-6 flex w-full min-w-0 max-w-md flex-col items-stretch justify-center gap-2.5 min-[500px]:gap-3 sm:mx-auto sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-4">
            <Button
              asChild
              className="btn-primary min-h-12 w-full min-[400px]:w-auto rounded-xl px-6 sm:px-8"
              size="lg"
            >
              <Link to="/uponly/overview" className="inline-flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                $UPONLY tranche
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="min-h-12 w-full rounded-xl border-border/60 bg-background/40 min-[400px]:w-auto"
              size="lg"
            >
              <a
                className="inline-flex items-center justify-center gap-2"
                href={RISE_DOCS.intro}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="h-4 w-4" />
                RISE intro
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </Button>
            {x ? (
              <Button asChild variant="secondary" className="min-h-12 w-full min-[400px]:w-auto rounded-xl" size="lg">
                <a className="inline-flex items-center justify-center gap-2" href={x} target="_blank" rel="noopener noreferrer">
                  X / updates
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
            {UP_ONLY_FUND.contactUrl ? (
              <Button asChild variant="secondary" className="min-h-12 w-full min-[400px]:w-auto rounded-xl" size="lg">
                <a
                  className="inline-flex items-center justify-center gap-2"
                  href={UP_ONLY_FUND.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </section>
      <div
        className="min-w-0 max-w-full break-words rounded-2xl border border-border/40 bg-muted/10 px-3 py-4 text-left text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere] sm:px-6 sm:py-5 sm:text-sm"
        role="note"
      >
        <p className="font-medium text-foreground/90">Important</p>
        <p className="mt-2">
          Not financial advice, not a pooled product in v1. DYOR and verify in current{" "}
          <ExternalLink href="https://docs.rise.rich" className="text-xs sm:text-sm">
            RISE documentation
          </ExternalLink>{" "}
          and on-chain. Crypto can go to zero; protocol descriptions can change.
        </p>
      </div>
    </div>
  );
}
