import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUND_LANDING } from "@/data/fundLanding";
import { cn } from "@/lib/utils";
import { HeroIllustration } from "./HeroIllustration";
import { HomeStatsStrip } from "./HomeStatsStrip";
import { LANDING_EASE } from "./landingMotion";

const heroIntro = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

const heroChild = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: LANDING_EASE },
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
        <div className="grid min-w-0 grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          <motion.div
            className="flex min-w-0 w-full flex-col justify-center"
            variants={v}
            initial={reduceMotion ? false : "hidden"}
            animate={reduceMotion ? false : "show"}
          >
            <motion.p variants={item} className="landing-eyebrow text-uof/90">
              {FUND_LANDING.heroTitle}
            </motion.p>

            <motion.h1
              variants={item}
              id="uof-landing-hero"
              className="landing-display mt-4 text-balance text-foreground sm:mt-5"
            >
              {FUND_LANDING.brandLine}
            </motion.h1>

            <motion.div
              variants={item}
              className="mt-6 h-px w-full max-w-lg bg-gradient-to-r from-border via-border/60 to-transparent sm:mt-7"
            />

            <motion.p
              variants={item}
              className="mt-6 max-w-xl text-pretty text-base leading-[1.65] text-foreground/85 sm:mt-7 sm:max-w-2xl sm:text-lg sm:leading-relaxed"
            >
              {FUND_LANDING.heroSubtitle}
            </motion.p>

            <motion.p
              variants={item}
              className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] lg:max-w-[36rem]"
            >
              {FUND_LANDING.heroBody}
            </motion.p>

            <motion.div
              variants={item}
              className="mt-7 flex w-full min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap sm:mt-8"
            >
              <Button
                asChild
                size="lg"
                className="h-11 min-h-[2.75rem] w-full rounded-md bg-foreground px-7 font-semibold text-background shadow-none hover:bg-foreground/90 min-[480px]:w-auto sm:h-12 sm:min-h-[3rem] sm:px-8 sm:min-w-[13rem]"
              >
                <Link to="/#thesis" className="inline-flex items-center justify-center gap-2">
                  {FUND_LANDING.thesisCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-11 min-h-[2.75rem] w-full rounded-md border-border/70 bg-transparent px-7 font-medium hover:bg-foreground/[0.04] min-[480px]:w-auto sm:h-12 sm:min-h-[3rem] sm:px-8"
              >
                <Link to="/#mandate" className="inline-flex items-center justify-center gap-2">
                  {FUND_LANDING.mandateCta}
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="flex min-w-0 w-full items-center justify-center lg:max-w-none lg:justify-end"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: reduceMotion ? 0 : 0.2,
              ease: LANDING_EASE,
            }}
          >
            <HeroIllustration className="w-full max-w-[18rem] sm:max-w-[19.5rem] lg:max-w-[21rem] xl:max-w-[23rem]" />
          </motion.div>
        </div>

        <motion.div
          className="mt-8 sm:mt-10 lg:mt-12"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={reduceMotion ? false : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.35, ease: LANDING_EASE }}
        >
          <HomeStatsStrip />
        </motion.div>
      </header>
    </div>
  );
}
