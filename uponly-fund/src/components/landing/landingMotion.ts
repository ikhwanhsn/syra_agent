/**
 * Shared motion presets for the marketing landing (framer-motion).
 * Easing: smooth deceleration — feels institutional, not bouncy.
 */
export const LANDING_EASE = [0.22, 1, 0.36, 1] as const;

export const landingViewport = {
  once: true,
  margin: "-10% 0px -6% 0px",
  amount: 0.2,
} as const;

export const landingViewportTight = {
  once: true,
  margin: "-6% 0px",
  amount: 0.25,
} as const;

export const landingTransition = (duration = 0.58, delay = 0) => ({
  duration,
  delay,
  ease: LANDING_EASE,
});

/** Parent stays invisible until scroll — children stagger after */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.06,
    },
  },
};

/** Stats strip: whole block rises + columns stagger (single coherent entrance) */
export const staggerContainerRaise = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.08,
      duration: 0.52,
      ease: LANDING_EASE,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: LANDING_EASE },
  },
};

export const staggerItemSm = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: LANDING_EASE },
  },
};
