import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ExternalLink, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "syra-colosseum-vote-modal-seen";
const VOTE_URL = "https://colosseum.com/agent-hackathon/projects/ai-solana-trading-assistant";

export const VoteSupportModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload") {
      localStorage.removeItem(STORAGE_KEY);
    }
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setOpen(next);
  };

  const handleVoteClick = () => {
    window.open(VOTE_URL, "_blank", "noopener,noreferrer");
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        <DialogContent
          className="overflow-hidden border-0 p-0 max-w-md bg-transparent shadow-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative rounded-2xl border border-glass-border bg-glass-bg/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_60px_hsl(var(--accent)/0.08)]"
          >
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-30 grid-pattern rounded-2xl pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-neon-gold/10 rounded-full blur-[50px] pointer-events-none" />

            <div className="relative p-6 pt-12 sm:p-8 sm:pt-14">
              {/* Hackathon badge */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full border border-accent/40 bg-accent/10"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium text-accent">
                  Colosseum Agent Hackathon
                </span>
              </motion.div>

              <DialogHeader className="space-y-3 text-left p-0">
                <div className="flex items-start gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.15, stiffness: 200 }}
                    className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-neon-gold/20 border border-accent/30 flex items-center justify-center neon-glow"
                  >
                    <Trophy className="h-6 w-6 text-accent" />
                  </motion.div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                      Support Syra — vote for us
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                      We’re building the{" "}
                      <span className="font-medium text-foreground/90">
                        AI Solana Trading Assistant
                      </span>{" "}
                      at Colosseum. Your vote helps us get more visibility and win the hackathon.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-6 flex flex-col sm:flex-row gap-3"
              >
                <Button
                  onClick={handleVoteClick}
                  className="flex-1 btn-primary gap-2 h-12 text-base font-semibold rounded-xl"
                >
                  Vote for us on Colosseum
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground h-12 rounded-xl"
                >
                  Maybe later
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </DialogContent>
      </AnimatePresence>
    </Dialog>
  );
};
