import { motion } from "framer-motion";
import {
  RISE_DOCS,
  ExternalLink,
  FeeAllocationCard,
  fadeUp,
  HeroArtwork,
  RiseTokenDetailsCard,
  SectionEyebrow,
} from "./primitives";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";

function ProgramNarrative({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.section
      {...(reduceMotion
        ? {}
        : { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } })}
      className="mb-20"
      aria-labelledby="program-narrative-heading"
    >
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-card/90 via-card/55 to-muted/20 shadow-[0_0_0_1px_hsl(0_0%_100%/0.04)_inset,0_40px_100px_-40px_hsl(0_0%_0%/0.35)] sm:rounded-3xl dark:from-card/70 dark:via-card/40">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_0%_0%,hsl(var(--ring)/0.12),transparent_55%)]" />
        <div className="relative grid min-w-0 max-w-full items-center gap-8 p-4 min-[500px]:p-6 min-[500px]:gap-10 sm:gap-12 sm:p-8 md:p-10 lg:grid-cols-2 lg:gap-14 lg:p-12 lg:pl-14 lg:pr-10">
          <div className="order-2 flex min-w-0 flex-col justify-center lg:order-1">
            <SectionEyebrow>Program</SectionEyebrow>
            <h2
              id="program-narrative-heading"
              className="mt-1 max-w-3xl text-2xl font-bold leading-tight tracking-[-0.02em] text-balance sm:text-3xl md:text-4xl"
            >
              <span className="neon-text">Syra × RISE</span>{" "}
              <span className="text-foreground/90">in production, not a slide deck</span>
            </h2>
            <p className="mt-4 max-w-[34rem] text-[0.95rem] leading-[1.65] text-muted-foreground sm:text-base sm:leading-7 text-pretty">
              A public collaboration to stress-test a next-generation RISE launch on Solana. The Syra community token
              on Pump remains the long-term base case; <strong>Up Only</strong> is the RISE tranche to learn the
              protocol in live markets, with published fee routing to liquidity.{" "}
            </p>
            <div className="mt-8 flex w-full min-w-0 flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:items-center">
              <Button
                asChild
                className="btn-primary min-h-12 w-full min-[400px]:h-12 min-[400px]:w-auto rounded-xl px-6 text-[0.9rem] shadow-lg shadow-black/15 sm:px-7"
              >
                <a className="inline-flex items-center justify-center" href={RISE_DOCS.createToken} target="_blank" rel="noopener noreferrer">
                  RISE: create a token
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="min-h-12 w-full min-[400px]:h-12 min-[400px]:w-auto rounded-xl border border-border/60 bg-background/30 px-6 text-[0.9rem] backdrop-blur-sm hover:bg-background/55 sm:px-7"
              >
                <a className="inline-flex items-center justify-center" href={RISE_DOCS.intro} target="_blank" rel="noopener noreferrer">
                  RISE intro
                </a>
              </Button>
            </div>
          </div>
          <div className="order-1 w-full min-w-0 max-lg:pt-1 lg:order-2">
            <HeroArtwork reduceMotion={reduceMotion} belowFold />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function WhatWeLearn() {
  return (
    <section className="mb-20" aria-labelledby="learning-heading">
      <div className="grid min-w-0 gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="min-w-0">
          <SectionEyebrow>What we are learning</SectionEyebrow>
          <h2
            id="learning-heading"
            className="mt-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl md:text-4xl text-balance"
          >
            What <span className="neon-text">$UPONLY</span> is testing for Syra
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg sm:leading-relaxed">
            We validate end-to-end creation, trade, and documented borrow / floor behavior so our agents and education
            tracks reference RISE with first-party context — not a promise of any price path.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              "UX and clarity of RISE launch and trading in real use.",
              "How Syra audiences respond to a floor + borrow design vs a classic memecoin curve.",
              "Signals for when Syra should deep-link to RISE in answers and automations.",
            ].map((line) => (
              <li key={line} className="flex gap-3 text-sm sm:text-base text-muted-foreground">
                <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card/50">
                  <Sparkles className="h-3 w-3 text-foreground/70" aria-hidden />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card min-w-0 rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-success" aria-hidden />
            Build posture
          </div>
          <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">
            This is the live Syra × RISE <strong>Up Only</strong> spec page. It is not in the main site nav: share the{" "}
            <code className="rounded border border-border/50 bg-background/30 px-1 font-mono text-xs">/uponly/overview</code> path
            with partners. Read RISE’s{" "}
            <ExternalLink href="https://docs.rise.rich/legal/terms" className="text-sm">
              terms
            </ExternalLink>{" "}
            and{" "}
            <ExternalLink href="https://docs.rise.rich/legal/privacy" className="text-sm">
              privacy notice
            </ExternalLink>{" "}
            before using the platform.
          </p>
        </div>
      </div>
    </section>
  );
}

function Resources() {
  return (
    <section
      className="min-w-0 max-w-full rounded-2xl border border-border/60 bg-gradient-to-b from-card/55 via-card/30 to-card/10 px-3 py-8 shadow-lg shadow-black/5 backdrop-blur-sm min-[500px]:rounded-3xl min-[500px]:px-5 sm:px-8 sm:py-10 md:px-10 md:py-12"
      id="resources"
    >
      <SectionEyebrow className="text-center">Resources</SectionEyebrow>
      <h2 className="mt-2 text-balance break-words text-center text-lg font-bold tracking-[-0.02em] sm:text-xl md:text-2xl">
        RISE community &amp; docs
      </h2>
      <p className="mx-auto mt-3 max-w-2xl break-words text-center text-sm text-muted-foreground sm:leading-relaxed">
        Full index:{" "}
        <a
          className="font-mono text-xs text-foreground/90 underline-offset-2 hover:underline"
          href="https://docs.rise.rich/llms.txt"
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.rise.rich/llms.txt
        </a>
        — use it to discover every page.
      </p>
      <div className="mt-8 flex w-full min-w-0 max-w-2xl flex-col items-stretch justify-center gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
        <Button asChild variant="secondary" className="min-h-11 w-full justify-center rounded-xl sm:min-h-10 sm:w-auto">
          <a href={RISE_DOCS.x} target="_blank" rel="noopener noreferrer" className="inline-flex">
            RISE on X
            <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="secondary" className="min-h-11 w-full justify-center rounded-xl sm:min-h-10 sm:w-auto">
          <a href={RISE_DOCS.telegram} target="_blank" rel="noopener noreferrer" className="inline-flex">
            Telegram
            <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="outline" className="min-h-11 w-full justify-center rounded-xl sm:min-h-10 sm:w-auto">
          <a href={RISE_DOCS.floor} target="_blank" rel="noopener noreferrer" className="inline-flex">
            Floor mechanism
            <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </a>
        </Button>
      </div>
    </section>
  );
}

export function TokenDetailsSection({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div id="on-chain-details" className="min-w-0 max-w-full scroll-mt-24">
      <motion.header
        {...fadeUp(reduceMotion)}
        className="mb-8 min-w-0 sm:mb-12"
        aria-labelledby="on-chain-heading"
      >
        <SectionEyebrow>On-chain + fees</SectionEyebrow>
        <h2
          id="on-chain-heading"
          className="text-balance break-words text-xl font-bold tracking-[-0.02em] sm:mt-2 sm:text-2xl md:text-3xl"
        >
          $UPONLY <span className="text-foreground/75">identifiers &amp; policy</span>
        </h2>
        <p className="mt-3 max-w-2xl break-words text-sm text-muted-foreground sm:text-base">
          Contract-level transparency for the RISE tranche, plus the Syra fee policy for liquidity. Update{" "}
          <code className="rounded border border-border/50 bg-background/50 px-1.5 py-0.5 font-mono text-xs">
            riseUpOnly.ts
          </code>{" "}
          to publish new stats; they will render here.
        </p>
      </motion.header>
      <div className="mb-20 grid min-w-0 grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1fr_1.02fr] lg:items-stretch">
        <RiseTokenDetailsCard />
        <FeeAllocationCard />
      </div>
      <ProgramNarrative reduceMotion={reduceMotion} />
      <WhatWeLearn />
      <Resources />
    </div>
  );
}
