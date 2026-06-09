import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUND_LANDING } from "@/data/fundLanding";
import { cn } from "@/lib/utils";
import { InstitutionalHeroMetrics } from "./InstitutionalHeroMetrics";
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
        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-12 lg:gap-16 xl:gap-20">
          <motion.div
            className="min-w-0 lg:col-span-7 xl:col-span-7"
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
              className="landing-display mt-5 max-w-[20ch] text-balance text-foreground sm:max-w-none"
            >
              {FUND_LANDING.brandLine}
            </motion.h1>

            <motion.div
              variants={item}
              className="mt-8 h-px w-full max-w-lg bg-gradient-to-r from-border via-border/60 to-transparent"
            />

            <motion.p
              variants={item}
              className="mt-8 max-w-2xl text-pretty text-base leading-[1.7] text-foreground/85 sm:text-lg sm:leading-relaxed"
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
              className="mt-10 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap"
            >
              <Button
                asChild
                size="lg"
                className="h-12 min-h-[3rem] rounded-md bg-foreground px-8 font-semibold text-background shadow-none hover:bg-foreground/90 sm:min-w-[13rem]"
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
                className="h-12 min-h-[3rem] rounded-md border-border/70 bg-transparent px-8 font-medium hover:bg-foreground/[0.04]"
              >
                <Link to="/#mandate" className="inline-flex items-center justify-center gap-2">
                  {FUND_LANDING.mandateCta}
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={item} className="mt-12 lg:mt-14">
              <HomeStatsStrip />
            </motion.div>
          </motion.div>

          <motion.div
            className="min-w-0 lg:col-span-5 xl:col-span-5 lg:sticky lg:top-32"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: reduceMotion ? 0 : 0.2,
              ease: LANDING_EASE,
            }}
          >
            <InstitutionalHeroMetrics />
          </motion.div>
        </div>
      </header>
    </div>
  );
}
