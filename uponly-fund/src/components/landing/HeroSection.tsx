import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FUND_LANDING } from "@/data/fundLanding";
import { cn } from "@/lib/utils";
import { HeroIllustration } from "./HeroIllustration";
import { LANDING_EASE } from "./landingMotion";

const heroIntro = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.06,
    },
  },
};

const heroChild = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: LANDING_EASE },
  },
};

type HeroSectionProps = {
  className?: string;
};

export function HeroSection({ className }: HeroSectionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const v = reduceMotion ? undefined : heroIntro;
  const item = reduceMotion ? undefined : heroChild;

  return (
    <div className={cn("relative", className)}>
      <header className="relative" aria-labelledby="uof-landing-hero">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14 xl:gap-16">
          <div className="min-w-0 lg:col-span-7 xl:col-span-7 lg:self-start">
            <motion.div
              className="landing-hero-accent border-l-[3px] border-uof pl-5 sm:pl-7 md:pl-8"
              variants={v}
              initial={reduceMotion ? false : "hidden"}
              animate={reduceMotion ? false : "show"}
            >
              <motion.div
                variants={item}
                className="flex flex-wrap items-center gap-2 sm:gap-2.5"
              >
                <Badge
                  variant="secondary"
                  className="rounded-md border border-border/55 bg-background/80 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-foreground/90 shadow-sm"
                >
                  {FUND_LANDING.heroEyebrow}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-md border-uof/40 bg-uof/[0.09] px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-foreground/90"
                >
                  Solana
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-md border-border/55 bg-background/60 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Solana-native allocator
                </Badge>
              </motion.div>

              <motion.p
                variants={item}
                className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.32em] text-muted-foreground sm:mt-7"
              >
                {FUND_LANDING.brandLine}
              </motion.p>

              <motion.h1
                variants={item}
                id="uof-landing-hero"
                className="landing-display mt-3 max-w-[22rem] text-foreground min-[400px]:max-w-none"
              >
                <span className="uof-wordmark">{FUND_LANDING.heroTitle}</span>
              </motion.h1>

              <motion.div
                variants={item}
                className="mt-6 h-px max-w-md bg-gradient-to-r from-uof/70 via-border/50 to-transparent sm:mt-8"
              />

              <motion.p
                variants={item}
                className="mt-6 max-w-2xl text-pretty text-base font-medium leading-[1.65] text-foreground/[0.92] sm:mt-7 sm:text-lg sm:leading-relaxed md:text-xl md:leading-[1.55]"
              >
                {FUND_LANDING.heroSubtitle}
              </motion.p>

              <motion.p
                variants={item}
                className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] md:max-w-2xl"
              >
                {FUND_LANDING.heroBody}
              </motion.p>

              <motion.div
                variants={item}
                className="mt-9 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap sm:mt-11"
              >
                <Button
                  asChild
                  size="lg"
                  className="h-12 min-h-[3rem] rounded-lg bg-uof !text-[hsl(var(--uof-foreground))] px-8 font-semibold shadow-[0_8px_28px_-6px_hsl(var(--uof)/0.45)] hover:bg-uof/92 sm:min-w-[14rem]"
                >
                  <Link
                    to="/terminal"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {FUND_LANDING.dashboardCta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 min-h-[3rem] rounded-lg border-border/65 bg-background/50 px-8 font-medium backdrop-blur-sm hover:bg-background/80"
                >
                  <Link
                    to="/#mandate"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    {FUND_LANDING.mandateCta}
                    <ChevronRight className="h-4 w-4 opacity-55" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className="relative flex min-h-0 w-full flex-col items-center justify-center lg:col-span-5 xl:col-span-5"
            initial={reduceMotion ? false : { opacity: 0, y: 36 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{
              duration: 0.68,
              delay: reduceMotion ? 0 : 0.32,
              ease: LANDING_EASE,
            }}
          >
            <div className="landing-hero-visual-ring relative isolate mx-auto flex w-full max-w-[min(22rem,100%)] justify-center sm:max-w-[24rem] lg:max-w-[min(26rem,100%)] xl:max-w-[28rem]">
              <HeroIllustration />
            </div>
          </motion.div>
        </div>
      </header>
    </div>
  );
}
