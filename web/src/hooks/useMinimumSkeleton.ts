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
