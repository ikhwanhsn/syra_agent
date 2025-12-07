import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { ParticleField } from "./ParticleField";
import { OrbitRings } from "./OrbitRings";
import { HeroStats } from "./HeroStats";
import { DashboardPreview } from "./DashboardPreview";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background Elements */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <ParticleField />
      <OrbitRings />
      
      {/* Gradient overlays */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-muted-foreground">Powered by x402 Technology</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
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
              className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Institutional-grade intelligence, automated execution, and real-time 
              decisions. Track smart money, analyze sentiment, and execute with precision.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <a href="#app" className="btn-primary flex items-center justify-center gap-2 group">
                Launch App
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="#docs" className="btn-secondary flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Watch Demo
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
