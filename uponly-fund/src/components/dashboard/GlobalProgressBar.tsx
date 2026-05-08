import { useEffect, useRef, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Top-of-page 1px progress strip tied to TanStack `useIsFetching()`.
 *
 * Replaces the per-card spinner flicker with a single, calm signal that tells
 * the user "data is moving" without occupying screen real estate. Fades in
 * after a 220ms delay so quick (<220ms) refetches never produce a visible
 * flash, and lingers ~180ms after the last in-flight query so it doesn't
 * strobe between bursts of refetches.
 */
const APPEAR_DELAY_MS = 220;
const HIDE_DELAY_MS = 180;

export function GlobalProgressBar() {
  const fetchingCount = useIsFetching();
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (fetchingCount > 0) {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (!visible && showTimerRef.current === null) {
        showTimerRef.current = window.setTimeout(() => {
          showTimerRef.current = null;
          setVisible(true);
        }, APPEAR_DELAY_MS);
      }
      return;
    }
    if (showTimerRef.current !== null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (visible && hideTimerRef.current === null) {
      hideTimerRef.current = window.setTimeout(() => {
        hideTimerRef.current = null;
        setVisible(false);
      }, HIDE_DELAY_MS);
    }
  }, [fetchingCount, visible]);

  useEffect(() => {
    return () => {
      if (showTimerRef.current !== null) window.clearTimeout(showTimerRef.current);
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[10010] h-[2px]"
      role="presentation"
    >
      <AnimatePresence>
        {visible ? (
          <motion.div
            key="bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="h-full w-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-[hsl(var(--uof))] to-transparent"
              initial={{ x: "-40%" }}
              animate={{ x: "120%" }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
              style={{ width: "40%" }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
