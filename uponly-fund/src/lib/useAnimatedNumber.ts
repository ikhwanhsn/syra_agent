import { useEffect, useRef, useState } from "react";

type Options = {
  /** Duration in ms */
  duration?: number;
  /** Skip animation (e.g. reduced motion) */
  disabled?: boolean;
};

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Animates from 0 toward `end` when `end` is finite. Returns current animated value (or 0 before first run).
 */
export function useAnimatedNumber(end: number | null, options: Options = {}): number {
  const { duration = 900, disabled = false } = options;
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(frameRef.current);
    if (end === null || !Number.isFinite(end)) {
      setValue(0);
      return;
    }
    if (disabled) {
      setValue(end);
      return;
    }
    const from = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      setValue(from + (end - from) * easeOutCubic(t));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setValue(end);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [end, duration, disabled]);

  if (end === null || !Number.isFinite(end)) {
    return 0;
  }
  return value;
}
