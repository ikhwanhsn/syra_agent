import { RISE_DOCS, ExternalLink, SectionEyebrow } from "./primitives";
import { RISE_UP_ONLY, getRiseRichTradeUrl } from "@/data/riseUpOnly";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BookOpen, Building2, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export function FinalCta({ className }: { className?: string }) {
  const u = getRiseRichTradeUrl(RISE_UP_ONLY);
  const canBuy = Boolean(u && RISE_UP_ONLY.buyOnRiseEnabled);
  return (
    <div className={cn("mb-20 w-full min-w-0 max-w-full space-y-6 sm:space-y-8", className)} id="final-cta">
      <section
        className="relative min-w-0 max-w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-foreground/[0.04] via-card/40 to-card/20 p-4 text-center sm:rounded-3xl sm:p-8 md:p-10 lg:p-12"
        aria-labelledby="closing-heading"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--ring)/0.15),transparent_55%)]" aria-hidden />
        <div className="relative z-[1] mx-auto min-w-0 max-w-2xl px-1 sm:px-0">
          <SectionEyebrow className="text-center">Execute on conviction</SectionEyebrow>
          <h2
            id="closing-heading"
            className="text-balance break-words text-xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:mt-3 sm:text-2xl md:text-3xl lg:text-4xl"
          >
            If the structure is what sold you, <span className="neon-text">trade the structure</span>
          </h2>
          <p className="mt-3 break-words text-sm text-muted-foreground [overflow-wrap:anywhere] sm:mt-4 sm:text-base sm:leading-relaxed">
            One click to RISE — the venue where the floor, bond curve, and borrow spec you just read is implemented.
            Keep position size at what you can lose entirely.
          </p>
          <p className="mt-4 break-words text-sm text-muted-foreground [overflow-wrap:anywhere] sm:mt-5 sm:text-base sm:leading-relaxed">
            <span className="text-foreground/80">Ecosystem / treasury: </span>
            <Link
              to="/uponly/fund"
              className="inline-flex min-h-10 items-center gap-1.5 font-medium text-foreground/90 underline-offset-2 hover:underline"
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              Up Only Fund
            </Link>
            <span> — Syra-backed mandate to allocate across the RISE ecosystem (transparency page).</span>
          </p>
          <div className="mt-6 flex w-full min-w-0 max-w-md flex-col items-stretch justify-center gap-2.5 min-[500px]:gap-3 sm:mx-auto sm:mt-8 sm:max-w-none sm:flex-row sm:gap-4">
            {canBuy && u ? (
              <Button
                asChild
                className="btn-primary min-h-12 w-full sm:w-auto rounded-xl px-8"
                size="lg"
              >
                <a className="inline-flex items-center justify-center gap-2" href={u} target="_blank" rel="noopener noreferrer">
                  <ShoppingCart className="h-4 w-4" />
                  Buy on RISE
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
            ) : (
              <Button type="button" className="min-h-12 w-full sm:w-auto" disabled>
                <ShoppingCart className="h-4 w-4" />
                Buy (configure riseUpOnly.ts)
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="min-h-12 w-full rounded-xl border-border/60 bg-background/40 sm:w-auto"
              size="lg"
            >
              <a
                className="inline-flex items-center justify-center gap-2"
                href={RISE_DOCS.borrowsAndLoops}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="h-4 w-4" />
                Read borrows &amp; loops
              </a>
            </Button>
          </div>
        </div>
      </section>
      <div
        className="min-w-0 max-w-full break-words rounded-2xl border border-border/40 bg-muted/10 px-3 py-4 text-left text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere] sm:px-6 sm:py-5 sm:text-sm"
        role="note"
      >
        <p className="font-medium text-foreground/90">Important</p>
        <p className="mt-2">
          Nothing on this page is financial advice, an offer, or a solicitation. Cryptocurrency markets are volatile;
          you can lose your entire position. RISE and Syra are independent projects — verify every claim in the
          current documentation and on-chain, not from this page alone. Past and simulated performance is not
          indicative of future results. <strong>Do your own research (DYOR).</strong>
        </p>
        <p className="mt-2">
          Protocol design descriptions are from public RISE docs as of publication; they can change. See{" "}
          <ExternalLink href={RISE_DOCS.intro} className="text-xs sm:text-sm">
            docs.rise.rich
          </ExternalLink>{" "}
          for the latest.
        </p>
      </div>
    </div>
  );
}
