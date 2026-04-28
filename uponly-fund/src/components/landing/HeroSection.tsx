import { useReducedMotion, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroIllustration } from "./HeroIllustration";

const UOF_COIN = "/images/experiment/rise_uponly.png" as const;
const RISE_PARTNER_LOGO = "/images/partners/rise.jpg";
const RISE_LOGO_PLACEHOLDER = "/images/partners/placeholder.svg" as const;

function fadeUp(reduce: boolean) {
  return {
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: reduce ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  };
}

function EcosystemStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex w-fit max-w-full min-w-0 items-center gap-2.5 rounded-2xl border border-border/45 bg-gradient-to-b from-card/60 to-card/20 py-2.5 pl-2.5 pr-3 shadow-sm backdrop-blur-md min-[400px]:gap-3 min-[400px]:py-3 min-[400px]:pl-3 min-[400px]:pr-4",
        className,
      )}
      aria-label="Up Only Fund, UP ONLY, RISE on Solana"
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 bg-black ring-1 ring-uof/15 min-[400px]:h-9 min-[400px]:w-9"
        aria-hidden
      >
        <img
          src={UOF_COIN}
          alt=""
          width={36}
          height={36}
          className="h-full w-full object-contain p-px"
          loading="eager"
          decoding="async"
        />
      </div>
      <div className="h-5 w-px shrink-0 bg-border/60 min-[400px]:h-6" aria-hidden />
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 sm:gap-3">
        <span className="text-[0.7rem] font-semibold tracking-[0.1em] text-foreground/90">UP ONLY</span>
        <img
          src={RISE_PARTNER_LOGO}
          alt=""
          width={128}
          height={128}
          className="h-5 w-auto max-w-[4.5rem] object-contain min-[400px]:h-6 min-[400px]:max-w-[5rem]"
          loading="eager"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src.endsWith(RISE_LOGO_PLACEHOLDER)) return;
            el.src = RISE_LOGO_PLACEHOLDER;
          }}
        />
        <span className="pl-0.5 text-[0.7rem] font-semibold tracking-[0.1em] text-foreground/90">
          RISE · Solana
        </span>
      </div>
    </div>
  );
}

type HeroSectionProps = {
  className?: string;
};

export function HeroSection({ className }: HeroSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <div className={cn("mb-4 sm:mb-6", className)}>
      <motion.header
        {...fadeUp(reduceMotion)}
        className="relative"
        aria-labelledby="uof-landing-hero"
      >
        <EcosystemStrip className="mb-8 sm:mb-10" />

        <div className="grid grid-cols-1 items-center gap-10 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-12 2xl:grid-cols-[minmax(0,1fr)_27rem] 2xl:gap-16">
          <div className="min-w-0 max-w-3xl lg:max-w-none 2xl:pr-2">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="border border-border/50 bg-foreground/[0.04] px-2.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-foreground/90"
              >
                Tech utility program fund
              </Badge>
              <Badge
                variant="outline"
                className="border-uof/30 bg-uof/[0.08] text-[0.6rem] font-medium text-foreground/90"
              >
                Independent program
              </Badge>
            </div>

            <h1
              id="uof-landing-hero"
              className="max-w-[22rem] font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground min-[400px]:max-w-2xl min-[400px]:text-[2.35rem] sm:max-w-3xl sm:text-5xl sm:leading-[1.02] md:text-6xl md:leading-[0.98] lg:max-w-[20ch] lg:text-[2.6rem] lg:leading-[1.05] xl:max-w-[18ch] xl:text-5xl 2xl:text-6xl 2xl:leading-[0.98]"
            >
              <span className="uof-wordmark">Up Only Fund</span>
            </h1>

            <p className="mt-4 max-w-2xl text-pretty text-base font-medium leading-relaxed text-foreground/88 sm:mt-5 sm:text-lg sm:leading-relaxed">
              A mandate-led treasury for the RISE era—built for operators who want{" "}
              <span className="text-foreground">clarity</span> before they size risk. Not a pooled retail product in v1; a
              published way to fund tech utility in the stack.
            </p>

            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              Syra supports the rails (agent, APIs, execution culture). This site is the program: what we fund, how we
              disclose it, and where the liquid <span className="font-mono text-foreground/80">$UPONLY</span> tranche lives
              as a separate surface.
            </p>

            <div className="mt-8 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-stretch sm:mt-10">
              <Button
                asChild
                size="lg"
                className="h-12 min-h-[3rem] rounded-xl bg-uof !text-[hsl(var(--uof-foreground))] font-semibold shadow-lg shadow-uof/10 hover:bg-uof/90 sm:min-w-[13rem]"
              >
                <Link to="/#mandate" className="inline-flex items-center justify-center gap-2">
                  Read the overview
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 min-h-[3rem] rounded-xl border-border/60 bg-background/40 font-medium backdrop-blur-sm"
              >
                <Link to="/dashboard" className="inline-flex items-center justify-center gap-2">
                  Open dashboard
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </Link>
              </Button>
            </div>
          </div>

          <HeroIllustration className="lg:self-start" />
        </div>
      </motion.header>
    </div>
  );
}
