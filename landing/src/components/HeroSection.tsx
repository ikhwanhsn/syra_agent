import { motion } from "framer-motion";
import { ArrowRight, Play, Trophy } from "lucide-react";
import { ParticleField } from "./ParticleField";
import { OrbitRings } from "./OrbitRings";
import { HeroStats } from "./HeroStats";
import { DashboardPreview } from "./DashboardPreview";
import { LINK_AGENT, LINK_DEMO } from "../../config/global";

export const HeroSection = () => {
  return (
    <section className="relative flex items-center justify-center min-h-screen pt-24 pb-16 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-50 grid-pattern" />
      <ParticleField />
      <OrbitRings />

      {/* Gradient overlays */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 glass-card"
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">
                Powered by x402 Technology
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
              className="w-4/5 mx-auto mb-8 text-lg sm:max-w-xl text-muted-foreground lg:mx-0"
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
                className="flex items-center justify-center w-4/5 gap-2 mx-auto sm:mx-0 sm:w-auto btn-secondary"
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
            className="relative"
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
