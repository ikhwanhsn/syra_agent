import { useEffect, useState } from "react";
import { ShoppingCart, ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRiseRichTradeUrl, RISE_UP_ONLY } from "@/data/riseUpOnly";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const UPONLY_HERO_SENTINEL_ID = "uponly-hero-sentinel";

type StickyBuyBarProps = {
  /** Refetch when route data changes */
  className?: string;
};

export function StickyBuyBar({ className }: StickyBuyBarProps) {
  const reduce = useReducedMotion() ?? false;
  const [open, setOpen] = useState(true);
  const [showBar, setShowBar] = useState(false);
  const u = getRiseRichTradeUrl(RISE_UP_ONLY);
  const canBuy = Boolean(u && RISE_UP_ONLY.buyOnRiseEnabled);

  useEffect(() => {
    const el = document.getElementById(UPONLY_HERO_SENTINEL_ID);
    if (!el) {
      return;
    }
    const ob = new IntersectionObserver(
      (entries) => {
        const hit = entries[0];
        if (!hit) return;
        setShowBar(!hit.isIntersecting);
      },
      { rootMargin: "0px 0px 0px 0px", threshold: 0 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  if (!open) {
    return null;
  }

  return (
    <AnimatePresence>
        {showBar && canBuy && u ? (
          <motion.aside
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[10000] flex w-full min-w-0 max-w-full flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-4 sm:max-w-sm",
              "rounded-t-2xl border-0 sm:rounded-2xl sm:border sm:border-border/60",
              className,
            )}
            initial={reduce ? undefined : { y: 80, opacity: 0 }}
            animate={reduce ? undefined : { y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            role="complementary"
            aria-label="Buy $UPONLY on RISE"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0.5rem))" }}
          >
            <div className="border border-border/60 border-b-0 bg-card/95 px-3 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl sm:rounded-2xl sm:border-b sm:px-4 sm:py-3">
              <div className="mb-1 flex min-h-11 items-center justify-between gap-2 sm:mb-2 sm:min-h-0">
                <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-foreground/90 sm:text-sm">
                  $UPONLY
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 min-h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground sm:h-9 sm:w-9"
                  aria-label="Dismiss buy bar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Button
                asChild
                className="h-12 w-full gap-2 rounded-xl text-sm font-medium sm:text-base"
              >
                <a href={u} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 shrink-0" />
                  <span>Buy on RISE</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
                </a>
              </Button>
            </div>
          </motion.aside>
        ) : null}
    </AnimatePresence>
  );
}
