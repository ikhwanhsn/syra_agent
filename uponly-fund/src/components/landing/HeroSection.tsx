import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
          {/* Editorial column — staggered mount */}
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
                  Venture &amp; growth allocator
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-md border-uof/40 bg-uof/[0.09] px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-foreground/90"
                >
                  RISE ecosystem
                </Badge>
              </motion.div>

              <motion.h1
                variants={item}
                id="uof-landing-hero"
                className="landing-display mt-6 max-w-[22rem] text-foreground min-[400px]:max-w-none sm:mt-8"
              >
                <span className="uof-wordmark">Up Only Fund</span>
              </motion.h1>

              <motion.div
                variants={item}
                className="mt-6 h-px max-w-xs bg-gradient-to-r from-border/80 via-border/40 to-transparent sm:mt-8"
              />

              <motion.p
                variants={item}
                className="mt-6 max-w-2xl text-pretty text-base font-medium leading-[1.65] text-foreground/[0.92] sm:mt-7 sm:text-lg sm:leading-relaxed"
              >
                A real allocator on RISE: we deploy{" "}
                <span className="text-foreground">
                  capital, strategy, and operator leverage
                </span>{" "}
                so serious teams can compound distribution, liquidity, and
                product velocity—not a lab experiment, an institutional mandate
                with public disclosures.
              </motion.p>

              <motion.p
                variants={item}
                className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] md:max-w-2xl"
              >
                Syra powers execution rails (agents, APIs, research). Up Only
                Fund is the venture surface—who we back, how the treasury is
                run, and why the liquid{" "}
                <span className="font-mono text-foreground/85">$UPONLY</span>{" "}
                tranche aligns incentives with that growth story.
              </motion.p>

              <motion.div
                variants={item}
                className="mt-9 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap sm:mt-11"
              >
                <Button
                  asChild
                  size="lg"
                  className="h-12 min-h-[3rem] rounded-lg bg-uof !text-[hsl(var(--uof-foreground))] px-8 font-semibold shadow-[0_8px_28px_-6px_hsl(var(--uof)/0.45)] hover:bg-uof/92 sm:min-w-[13.5rem]"
                >
                  <Link
                    to="/#mandate"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    Investment mandate
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
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    Institutional dashboard
                    <ChevronRight className="h-4 w-4 opacity-55" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Visual — delayed fade-rise */}
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
