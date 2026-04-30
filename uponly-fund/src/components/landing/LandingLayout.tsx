import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { siteShell } from "@/lib/siteLayout";
import { LANDING_EASE, landingViewportTight } from "./landingMotion";
import { ScrollReveal } from "./ScrollReveal";

/**
 * Full-bleed landing bands (Binance Labs / allocator-style vertical rhythm).
 */
const VARIANTS = {
  transparent: "",
  muted: "border-y border-border/40 bg-muted/[0.22] dark:bg-muted/[0.12]",
  surface:
    "border-y border-border/35 bg-gradient-to-b from-card/50 via-card/25 to-transparent",
  deep: "border-y border-border/30 bg-[linear-gradient(180deg,hsl(var(--card)/0.55)_0%,hsl(var(--background)/0.92)_55%,transparent_100%)]",
  cta: "border-t border-border/40 bg-gradient-to-b from-muted/25 via-background to-muted/[0.15]",
} as const;

export type LandingBandVariant = keyof typeof VARIANTS;

type LandingBandProps = {
  variant?: LandingBandVariant;
  className?: string;
  contentClassName?: string;
  /** Scroll-driven entrance for band content (default on) */
  scrollReveal?: boolean;
  children: ReactNode;
};

export function LandingBand({
  variant = "transparent",
  className,
  contentClassName,
  scrollReveal = true,
  children,
}: LandingBandProps) {
  const inner = (
    <div
      className={cn(
        siteShell,
        "py-14 md:py-[4.5rem] lg:py-24",
        contentClassName,
      )}
    >
      {scrollReveal ? (
        <ScrollReveal y={40} duration={0.62}>
          {children}
        </ScrollReveal>
      ) : (
        children
      )}
    </div>
  );

  return (
    <div
      className={cn("relative w-full min-w-0", VARIANTS[variant], className)}
    >
      {inner}
    </div>
  );
}

/** Rule between stacked sections — draws in on scroll */
export function LandingRule({ className }: { className?: string }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div
      className={cn(
        "my-14 h-px w-full origin-center bg-gradient-to-r from-transparent via-border/70 to-transparent md:my-20",
        className,
      )}
      initial={reduce ? false : { scaleX: 0, opacity: 0 }}
      whileInView={reduce ? undefined : { scaleX: 1, opacity: 1 }}
      viewport={landingViewportTight}
      transition={{ duration: 0.75, ease: LANDING_EASE }}
      aria-hidden
    />
  );
}
