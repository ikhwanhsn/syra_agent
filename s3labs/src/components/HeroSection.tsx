import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteShell } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const HeroSection = () => {
  const reduceMotion = useReducedMotion() ?? false;

  const fade = (delay: number) =>
    reduceMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease },
        };

  return (
    <section className="relative min-h-[88dvh] sm:min-h-[92vh] flex items-center justify-center pt-[max(7rem,calc(env(safe-area-inset-top,0px)+5.5rem))] pb-12 sm:pb-16 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" aria-hidden />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.35]" aria-hidden />
      <div
        className="pointer-events-none absolute top-[15%] left-[8%] w-[min(28rem,70vw)] h-[min(28rem,70vw)] bg-primary/15 rounded-full blur-[100px] animate-float"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[10%] right-[5%] w-[min(20rem,55vw)] h-[min(20rem,55vw)] bg-accent/10 rounded-full blur-[90px] animate-float"
        style={{ animationDelay: "2.5s" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(40rem,90vw)] h-[min(40rem,90vw)] bg-primary/5 rounded-full blur-[120px]"
        aria-hidden
      />

      <div className={cn(siteShell, "relative z-10 min-w-0")}>
        <div className="max-w-5xl mx-auto text-center min-w-0">
          <motion.div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full panel-glass mb-8"
            {...fade(0)}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden />
            <span className="text-xs font-semibold tracking-wide text-foreground/90 uppercase">
              AI-Powered Web3 Ecosystem
            </span>
          </motion.div>

          <motion.h1
            className="heading-display text-foreground mb-7"
            {...fade(0.1)}
          >
            <span className="block">The AI-Powered</span>
            <span className="text-gradient">Ecosystem for Web3.</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            {...fade(0.2)}
          >
            Discover opportunities, launch ideas faster, connect with the Web3
            ecosystem, and unlock new ways to earn using AI-powered products.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            {...fade(0.3)}
          >
            <Button
              variant="hero"
              size="xl"
              asChild
              className="group btn-premium w-full sm:w-auto sm:min-w-[220px] max-w-md mx-auto sm:mx-0"
            >
              <a href="#ecosystem">
                Explore Ecosystem
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button
              variant="heroOutline"
              size="xl"
              asChild
              className="rounded-full w-full sm:w-auto sm:min-w-[220px] max-w-md mx-auto sm:mx-0"
            >
              <a href="#products">Start Building</a>
            </Button>
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground/80 mt-10"
            {...fade(0.4)}
          >
            Discover. Build. Earn.
          </motion.p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
