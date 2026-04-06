import { motion } from "framer-motion";
import { ArrowRight, Play, Trophy } from "lucide-react";
import { ParticleField } from "./ParticleField";
import { OrbitRings } from "./OrbitRings";
import { HeroStats } from "./HeroStats";
import { DashboardPreview } from "./DashboardPreview";
import { LINK_AGENT, LINK_DEMO } from "../../config/global";

export const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20 pb-12 sm:pt-24 sm:pb-16"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-60 grid-pattern" />
      <div className="absolute inset-0 opacity-40 grid-pattern-accent" />
      <ParticleField />
      <OrbitRings />

      {/* Soft ambient light — minimal color (SAID-style canvas) */}
      <div className="absolute top-0 left-1/4 w-[560px] h-[560px] bg-primary/[0.07] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[480px] h-[480px] bg-primary/[0.05] rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[380px] h-[380px] bg-accent/[0.07] rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid min-w-0 items-center gap-8 sm:gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="min-w-0 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 glass-card border border-primary/15 bg-primary/[0.04] shadow-none"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-success/90 shadow-[0_0_8px_hsl(var(--success)/0.45)] animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Powered by{" "}
                <span className="font-medium text-foreground/90">x402</span>
                {" & "}
                <span className="font-medium text-foreground/90">MPP</span>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
            >
              <span className="text-foreground">AI Trading</span>
              <br />
              <span className="neon-text">Infrastructure Layer</span>
              <br />
              <span className="text-foreground">for Smart Money</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto mb-8 w-full max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0"
            >
              Institutional-grade intelligence, automated execution, and
              real-time decisions. Track smart money, analyze sentiment, and
              execute with precision.
            </motion.p>

            {/* <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <a
                href={LINK_AGENT}
                target="_blank"
                className="flex items-center justify-center w-4/5 gap-2 mx-auto sm:mx-0 sm:w-auto btn-primary group"
              >
                Launch Agent
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href={LINK_DEMO}
                target="_blank"
                className="flex items-center justify-center w-4/5 gap-2 mx-auto sm:mx-0 sm:w-auto btn-secondary"
              >
                <Play className="w-4 h-4" />
                Watch Demo
              </a>
            </motion.div> */}

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start"
            >
              <a
                href={LINK_AGENT}
                target="_blank"
                className="flex items-center justify-center w-4/5 gap-2 mx-auto sm:mx-0 sm:w-auto btn-primary group"
              >
                Launch Agent
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href={LINK_DEMO}
                target="_blank"
                className="flex items-center justify-center w-4/5 gap-2 mx-auto sm:mx-0 sm:w-auto btn-secondary"
              >
                <Play className="w-4 h-4" />
                Watch Demo
              </a>
              <a
                href="/leaderboard"
                className="hidden"
              >
                <Trophy className="w-4 h-4" />
                {/* Leaderboard */}
              </a>
            </motion.div>

            {/* Stats */}
            <div className="hidden lg:block">
              <HeroStats />
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative min-w-0 w-full"
          >
            <DashboardPreview />
          </motion.div>
        </div>

        {/* Mobile Stats */}
        <div className="lg:hidden">
          <HeroStats />
        </div>
      </div>
    </section>
  );
};
