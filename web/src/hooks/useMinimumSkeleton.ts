import { useEffect, useRef, useState } from "react";

export const SKELETON_MIN_MS = 450;

/** Keep skeleton visible for at least `minMs` so fast responses do not flash. */
export function useMinimumSkeleton(active: boolean, minMs = SKELETON_MIN_MS): boolean {
  const [visible, setVisible] = useState(active);
  const loadStartedAt = useRef<number | null>(active ? Date.now() : null);

  useEffect(() => {
    if (active) {
      loadStartedAt.current = Date.now();
      setVisible(true);
      return;
    }

    const started = loadStartedAt.current;
    if (started == null) {
      setVisible(false);
      return;
    }

    const remaining = minMs - (Date.now() - started);
    if (remaining <= 0) {
      loadStartedAt.current = null;
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      loadStartedAt.current = null;
      setVisible(false);
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [active, minMs]);

  return visible;
}

/**
 * Wait `delayMs` before showing skeleton; once shown, keep visible for at least `minMs`
 * after loading ends. Avoids blink on fast responses while still covering slow refetches.
 */
export function useDelayedMinimumSkeleton(
  active: boolean,
  delayMs = SKELETON_MIN_MS,
  minMs = SKELETON_MIN_MS,
): boolean {
  const [visible, setVisible] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    if (active) {
      if (visible) return;

      delayTimer = window.setTimeout(() => {
        shownAtRef.current = Date.now();
        setVisible(true);
      }, delayMs);

      return () => {
        if (delayTimer) window.clearTimeout(delayTimer);
      };
    }

    if (!visible) return;

    const shownAt = shownAtRef.current ?? Date.now();
    const remaining = minMs - (Date.now() - shownAt);
    if (remaining <= 0) {
      shownAtRef.current = null;
      setVisible(false);
      return;
    }

    hideTimer = window.setTimeout(() => {
      shownAtRef.current = null;
      setVisible(false);
    }, remaining);

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [active, delayMs, minMs, visible]);

  return visible;
}
