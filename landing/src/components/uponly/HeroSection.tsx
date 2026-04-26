import { useReducedMotion, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BookOpen, Building2, LineChart, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, RISE_DOCS, RiseBuyTokenCta, SectionEyebrow } from "./primitives";
import { LiveMarketStrip } from "./LiveMarketStrip";
import { UP_ONLY_FUND } from "@/data/upOnlyFund";
import syraMark from "/images/logo.jpg";

const RISE_PARTNER_LOGO = "/images/partners/rise.jpg";
const RISE_LOGO_PLACEHOLDER = "/images/partners/placeholder.svg" as const;

type HeroSectionProps = {
  className?: string;
};

function HeroBullet({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 min-[500px]:gap-3.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background/40 text-foreground/80 shadow-sm">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug text-foreground/95 min-[500px]:text-[0.9375rem]">{title}</p>
        <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground min-[500px]:text-sm">{children}</p>
      </div>
    </li>
  );
}

function PartnerStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center justify-center gap-2.5 rounded-2xl border border-border/45 bg-gradient-to-b from-card/50 to-card/[0.15] py-2.5 pl-3 pr-2.5 shadow-sm backdrop-blur-sm sm:justify-start sm:gap-3.5 sm:px-4 sm:py-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center justify-center gap-1.5 sm:gap-2.5">
        <img
          src={syraMark}
          alt="Syra"
          width={128}
          height={128}
          className="h-8 w-8 shrink-0 rounded-md object-contain sm:h-9 sm:w-9"
          loading="eager"
          decoding="async"
        />
        <span className="select-none text-sm font-light text-muted-foreground/80 sm:text-base" aria-hidden>
          ×
        </span>
        <img
          src={RISE_PARTNER_LOGO}
          alt="RISE"
          width={128}
          height={128}
          className="h-7 w-auto max-w-[5.5rem] object-contain min-[400px]:max-w-[6.25rem] sm:h-8 sm:max-w-[6.75rem]"
          loading="eager"
          decoding="async"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src.endsWith(RISE_LOGO_PLACEHOLDER)) return;
            el.src = RISE_LOGO_PLACEHOLDER;
          }}
        />
      </div>
      <p className="ml-auto hidden min-w-0 pl-2 text-right text-[0.65rem] font-medium uppercase leading-tight tracking-[0.12em] text-muted-foreground/90 sm:block sm:max-w-[12rem] sm:leading-snug min-[600px]:max-w-none min-[600px]:tracking-[0.16em] sm:text-xs">
        Official <span className="text-foreground/85">Syra × RISE</span> tranche
      </p>
    </div>
  );
}

export function HeroSection({ className }: HeroSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <div className={cn("mb-10 sm:mb-14", className)}>
      <header {...fadeUp(reduceMotion)} aria-labelledby="uponly-hero-heading">
        <Link
          to="/"
          className="mb-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-md py-1 pr-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:mb-7"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <PartnerStrip className="mb-7 sm:mb-8" />

        <div className="mb-4 flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
          <Badge
            variant="secondary"
            className="border border-border/50 bg-background/50 px-2.5 py-0.5 text-[0.6rem] font-mono font-normal uppercase tracking-[0.15em] shadow-sm sm:px-3 sm:py-1 sm:tracking-[0.18em]"
          >
            Solana · RISE
          </Badge>
          <Badge
            variant="outline"
            className="border border-border/50 bg-card/30 text-[0.6rem] font-mono font-normal tabular-nums text-foreground/90 sm:text-[0.65em]"
          >
            Roadmap · $100M mcap
          </Badge>
        </div>

        <div className="mt-1 grid w-full min-w-0 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-12">
          <div className="min-w-0 lg:col-span-7">
            <SectionEyebrow>What is $UPONLY</SectionEyebrow>
            <h1
              id="uponly-hero-heading"
              className="mt-2.5 text-balance break-words text-[1.4rem] font-bold leading-[1.12] tracking-[-0.02em] min-[380px]:text-2xl min-[480px]:text-3xl sm:mt-3 sm:text-4xl md:leading-[1.08] md:text-[2.4rem] lg:text-[2.5rem] xl:text-[2.75rem]"
            >
              <span className="neon-text">$UPONLY</span>
              <span className="text-foreground/85"> — the Syra-backed RISE token you trade on-chain</span>
            </h1>
            <p className="mt-3.5 max-w-2xl text-pretty text-sm leading-[1.65] text-muted-foreground sm:mt-4 sm:text-base sm:leading-relaxed">
              A Solana <strong className="font-medium text-foreground/90">SPL</strong> token, listed on{" "}
              <strong className="font-medium text-foreground/90">RISE</strong> (rise.rich). It is the first Syra ×
              RISE <strong className="font-medium text-foreground/90">tranche</strong>—the liquid way to get exposure
              to RISE’s structure (protocol floor, elastic supply, 0% ongoing borrow interest in the RISE spec) and a
              public <strong className="font-medium text-foreground/90">$100M</strong> market cap milestone, all
              described in the docs and verifiable on-chain. Not financial advice; you can lose your entire
              position.
            </p>

            <ul className="mt-6 space-y-3.5 sm:mt-7 sm:space-y-4" aria-label="Why this token matters">
              <HeroBullet icon={Shield} title="Rules-first, not price promises">
                Downside and mechanics come from the published RISE protocol design—not from marketing claims you
                can’t audit.
              </HeroBullet>
              <HeroBullet icon={LineChart} title="A live market, not a slide deck">
                Trade the same tranche the page documents; live stats and progress to $100M are below the fold.
              </HeroBullet>
              <HeroBullet icon={BookOpen} title="Separate: Up Only Fund (UOF)">
                {UP_ONLY_FUND.name} is Syra’s <strong className="font-medium text-foreground/85">treasury</strong> for
                ecosystem allocation—the token and the fund are different products. The linked treasury card in this
                section opens the full mandate and transparency page.
              </HeroBullet>
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-2 sm:mt-7">
              <Sparkles className="h-4 w-4 text-foreground/50" aria-hidden />
              <a
                href={RISE_DOCS.intro}
                className="text-sm font-medium text-foreground/90 underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the RISE introduction
              </a>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 lg:col-span-5 lg:pt-1.5">
            <div
              className="rounded-2xl border border-border/50 bg-gradient-to-b from-card/55 to-card/20 p-1 shadow-sm backdrop-blur-sm"
              style={{ boxShadow: "0 1px 0 0 hsl(0 0% 100% / 0.04) inset, 0 18px 40px -18px hsl(0 0% 0% / 0.35)" }}
            >
              <div className="rounded-[0.9rem] border border-border/35 bg-background/20 px-4 py-4 sm:px-5 sm:py-5">
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/90">
                  Trade
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get $UPONLY on the RISE venue. Verify the mint and always size to what you can afford to lose.
                </p>
                <RiseBuyTokenCta className="mt-4 w-full" />
                <p className="mt-2.5 text-center text-[0.65rem] text-muted-foreground/90 sm:text-left">
                  RISE (rise.rich) · DYOR
                </p>
              </div>
            </div>

            <Link
              to="/uponly/fund"
              className="group block rounded-2xl border border-border/50 bg-card/25 p-4 shadow-sm transition-colors hover:border-success/25 hover:bg-card/40 sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/45 bg-background/50 text-foreground/85">
                  <Building2 className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground/90">
                    {UP_ONLY_FUND.name}{" "}
                    <span className="font-mono text-[0.6rem] text-foreground/70">({UP_ONLY_FUND.shortName})</span>
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-foreground">Ecosystem treasury</p>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                    {UP_ONLY_FUND.publicSummary}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/90 transition-colors group-hover:text-foreground">
                    Mandate &amp; transparency
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </div>
            </Link>

            <Button
              asChild
              variant="ghost"
              className="h-11 w-full min-w-0 justify-center gap-2 border border-border/55 bg-background/30 sm:min-h-11"
            >
              <a className="inline-flex items-center justify-center" href="#how-floor-works">
                <span>How the floor works</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
              </a>
            </Button>
          </div>
        </div>
      </header>
      <motion.div {...fadeUp(reduceMotion)} className="mt-8 sm:mt-10" id="live-markets">
        <LiveMarketStrip />
      </motion.div>
      <div id="uponly-hero-sentinel" className="pointer-events-none h-px w-full scroll-mt-0" aria-hidden />
    </div>
  );
}
