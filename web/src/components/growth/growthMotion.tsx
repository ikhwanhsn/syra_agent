"use client";

/* Shared variants + hook live with GrowthCountUp for a single import path. */
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
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

/** Fail-safe: if whileInView never fires (wrong IO root, etc.), force final state. */
const REVEAL_FAILSAFE_MS = 1600;

export const growthRevealViewport = {
  once: true,
  margin: "-96px",
  amount: 0.15 as const,
};

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

type GrowthMotionRootValue = RefObject<Element | null> | null;

const GrowthMotionRootContext = createContext<GrowthMotionRootValue>(null);

/**
 * Provides the nested page scroller (e.g. AppShell `<main>`) so whileInView /
 * useInView observe the real scroll root instead of the window.
 */
export function GrowthMotionRootProvider({
  root,
  children,
}: {
  root: RefObject<Element | null>;
  children: ReactNode;
}) {
  return (
    <GrowthMotionRootContext.Provider value={root}>
      {children}
    </GrowthMotionRootContext.Provider>
  );
}

export function useGrowthMotionRoot(): GrowthMotionRootValue {
  return useContext(GrowthMotionRootContext);
}

/** Walk ancestors for the nearest overflow-y scroll/auto element. */
export function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let el: HTMLElement | null = node?.parentElement ?? null;
  while (el) {
    const overflowY = getComputedStyle(el).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}

/**
 * Shared reveal presets. When reduced motion is on, variants and
 * viewport triggers are omitted so content renders in its final state.
 *
 * Optional `root` overrides the GrowthMotionRootProvider scroll container.
 * `failSafeAnimate` becomes `"show"` after a short timeout so sections never
 * stay stuck at opacity 0 if IntersectionObserver mis-fires.
 */
export function useGrowthReveal(options?: {
  root?: RefObject<Element | null> | null;
}) {
  const reduceMotion = useReducedMotion();
  const reduced = !!reduceMotion;
  const ctxRoot = useGrowthMotionRoot();
  const root = options?.root ?? ctxRoot;
  const [failSafeShow, setFailSafeShow] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setFailSafeShow(true);
      return;
    }
    setFailSafeShow(false);
    const t = window.setTimeout(() => setFailSafeShow(true), REVEAL_FAILSAFE_MS);
    return () => window.clearTimeout(t);
  }, [reduced]);

  const viewport = reduced
    ? undefined
    : {
        ...growthRevealViewport,
        ...(root ? { root } : {}),
      };

  return {
    reduceMotion: reduced,
    root,
    viewport,
    reveal: reduced ? undefined : revealUp,
    item: reduced ? undefined : staggerItem,
    container: (stagger = 0.08, delayChildren = 0.05) =>
      reduced ? undefined : staggerContainer(stagger, delayChildren),
    initial: reduced ? undefined : ("hidden" as const),
    whileInView: reduced ? undefined : ("show" as const),
    /** Above-the-fold: animate to show immediately on mount. */
    animate: reduced ? undefined : ("show" as const),
    /**
     * Scroll sections: pair with whileInView. After timeout (or reduced
     * motion), forces final state so content cannot stay invisible.
     */
    failSafeAnimate: reduced || failSafeShow ? ("show" as const) : undefined,
  };
}

export type GrowthCountUpProps = {
  value: number;
  format: (n: number) => string;
  className?: string;
  /** Override scroll root for useInView (defaults to GrowthMotionRootProvider). */
  root?: RefObject<Element | null> | null;
};

/**
 * Springs from 0 to `value` once the node is in view.
 * Reduced motion: render the formatted final value immediately.
 * Fail-safe: if never observed within REVEAL_FAILSAFE_MS, animate anyway.
 */
export function GrowthCountUp({
  value,
  format,
  className,
  root: rootProp,
}: GrowthCountUpProps) {
  const reduceMotion = useReducedMotion();
  const ctxRoot = useGrowthMotionRoot();
  const root = rootProp ?? ctxRoot;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, {
    once: true,
    margin: "-40px 0px",
    ...(root ? { root } : {}),
  });
  const [failSafe, setFailSafe] = useState(false);
  const spring = useSpring(0, { stiffness: 90, damping: 22, mass: 0.8 });
  const display = useTransform(spring, (v) => format(v));

  useEffect(() => {
    if (reduceMotion) return;
    const t = window.setTimeout(() => setFailSafe(true), REVEAL_FAILSAFE_MS);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    if (inView || failSafe) spring.set(value);
  }, [inView, failSafe, value, spring, reduceMotion]);

  return (
    <motion.span ref={ref} className={cn("tabular-nums", className)}>
      {reduceMotion ? format(value) : display}
    </motion.span>
  );
}

/**
 * Resolve the nearest scroll parent of `nodeRef` before paint and expose it
 * as a stable ref + bound flag. Used so useScroll / whileInView bind once.
 */
export function useScrollContainer(
  nodeRef: RefObject<HTMLElement | null>,
): {
  scrollContainerRef: RefObject<HTMLElement | null>;
  scrollBound: boolean;
} {
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [scrollBound, setScrollBound] = useState(false);

  useLayoutEffect(() => {
    const found = findScrollParent(nodeRef.current);
    if (found) {
      scrollContainerRef.current = found;
      setScrollBound(true);
      return;
    }
    scrollContainerRef.current = null;
    setScrollBound(false);
  }, [nodeRef]);

  return { scrollContainerRef, scrollBound };
}
