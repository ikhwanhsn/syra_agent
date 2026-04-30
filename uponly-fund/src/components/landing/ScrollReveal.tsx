import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LANDING_EASE,
  landingTransition,
  landingViewport,
  landingViewportTight,
} from "./landingMotion";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Vertical offset in px when entering */
  y?: number;
  delay?: number;
  duration?: number;
  /** Tighter viewport = triggers slightly earlier when scrolling fast */
  viewport?: "default" | "tight";
};

/**
 * Section enters on scroll: fade + slide up. Respects prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  className,
  y = 36,
  delay = 0,
  duration = 0.58,
  viewport = "default",
}: ScrollRevealProps) {
  const reduce = useReducedMotion() ?? false;
  const vp = viewport === "tight" ? landingViewportTight : landingViewport;

  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={vp}
      transition={landingTransition(duration, delay)}
    >
      {children}
    </motion.div>
  );
}

type ScrollRevealScaleProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Softer entrance with subtle scale — good for CTAs and cards */
export function ScrollRevealScale({
  children,
  className,
  delay = 0,
}: ScrollRevealScaleProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={landingViewport}
      transition={{ duration: 0.55, delay, ease: LANDING_EASE }}
    >
      {children}
    </motion.div>
  );
}
