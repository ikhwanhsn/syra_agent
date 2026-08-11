"use client";

/* Shared variants + hook live with GrowthCountUp for a single import path. */
/* eslint-disable react-refresh/only-export-components */

import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

export const GROWTH_EASE = [0.16, 1, 0.3, 1] as const;

export const growthRevealViewport = {
  once: true,
  margin: "-96px",
} as const;

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: GROWTH_EASE },
  },
};

export function staggerContainer(
  stagger = 0.08,
  delayChildren = 0.05,
): Variants {
  return {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: GROWTH_EASE },
  },
};

/**
 * Shared reveal presets. When reduced motion is on, variants and
 * viewport triggers are omitted so content renders in its final state.
 */
export function useGrowthReveal() {
  const reduceMotion = useReducedMotion();
  const reduced = !!reduceMotion;

  return {
    reduceMotion: reduced,
    viewport: reduced ? undefined : growthRevealViewport,
    reveal: reduced ? undefined : revealUp,
    item: reduced ? undefined : staggerItem,
    container: (stagger = 0.08, delayChildren = 0.05) =>
      reduced ? undefined : staggerContainer(stagger, delayChildren),
    initial: reduced ? undefined : ("hidden" as const),
    whileInView: reduced ? undefined : ("show" as const),
    animate: reduced ? undefined : ("show" as const),
  };
}

export type GrowthCountUpProps = {
  value: number;
  format: (n: number) => string;
  className?: string;
};

/**
 * Springs from 0 to `value` once the node is in view.
 * Reduced motion: render the formatted final value immediately.
 */
export function GrowthCountUp({ value, format, className }: GrowthCountUpProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  const spring = useSpring(0, { stiffness: 90, damping: 22, mass: 0.8 });
  const display = useTransform(spring, (v) => format(v));

  useEffect(() => {
    if (reduceMotion) return;
    if (inView) spring.set(value);
  }, [inView, value, spring, reduceMotion]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {reduceMotion ? format(value) : display}
    </motion.span>
  );
}
