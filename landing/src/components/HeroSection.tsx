import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";
import { ParticleField } from "./ParticleField";
import { OrbitRings } from "./OrbitRings";
import { HeroStats } from "./HeroStats";
import { DashboardPreview } from "./DashboardPreview";
import { Input } from "@/components/ui/input";
import { getAgentAskUrl } from "../../config/global";
import { cn } from "@/lib/utils";

export const HeroSection = () => {
  const [askDraft, setAskDraft] = useState("");

  const openAgentWithQuestion = () => {
    const q = askDraft.trim();
    if (!q) return;
    const url = getAgentAskUrl(q);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onAskSubmit = (e: FormEvent) => {
    e.preventDefault();
    openAgentWithQuestion();
  };

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

            <motion.form
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={onAskSubmit}
              className="mx-auto mb-8 flex w-full max-w-xl min-w-0 flex-col gap-3 sm:mx-0 sm:max-w-none sm:flex-row sm:items-stretch sm:gap-3 lg:justify-start"
            >
              <Input
                value={askDraft}
                onChange={(e) => setAskDraft(e.target.value)}
                placeholder="Ask Syra anything…"
                enterKeyHint="go"
                autoComplete="off"
                name="syra-ask"
                aria-label="Question for Syra agent"
                className={cn(
                  "h-12 min-h-12 flex-1 rounded-xl border-border/60 bg-background/90 px-4 text-base shadow-sm backdrop-blur-sm",
                  "placeholder:text-muted-foreground/80",
                  "focus-visible:ring-primary/30",
                  "dark:bg-background/50",
                )}
              />
              <button
                type="submit"
                disabled={!askDraft.trim()}
                className="btn-primary group inline-flex h-12 min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-0 font-semibold disabled:pointer-events-none disabled:opacity-50 sm:px-8"
              >
                Ask
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.form>

            <a href="/leaderboard" className="hidden">
              <Trophy className="w-4 h-4" />
            </a>

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
