import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useState wrapper that round-trips its value through localStorage so user
 * preferences (sidebar collapsed, preferred bubble-map metric, screener
 * filters, etc.) survive reload. Server-safe (falls back to initial value
 * when window is undefined). Writes are debounced via the next animation
 * frame so rapid changes (drag toggles) only persist once.
 *
 * @param key Stable storage key, namespaced by feature (e.g. `sidebar-collapsed`).
 * @param initialValue Value used on first mount when no stored entry exists.
 * @param validate Optional guard that must return `true` for stored value to be accepted.
 *                 Useful when the persisted shape may have been written by an older build.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  validate?: (raw: unknown) => raw is T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const fullKey = `uof:${key}`;
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialRef.current;
    try {
      const raw = window.localStorage.getItem(fullKey);
      if (raw === null) return initialRef.current;
      const parsed = JSON.parse(raw) as unknown;
      if (validate && !validate(parsed)) return initialRef.current;
      return parsed as T;
    } catch {
      return initialRef.current;
    }
  });

  const writeTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (writeTimerRef.current !== null) {
      window.cancelAnimationFrame(writeTimerRef.current);
    }
    writeTimerRef.current = window.requestAnimationFrame(() => {
      writeTimerRef.current = null;
      try {
        window.localStorage.setItem(fullKey, JSON.stringify(value));
      } catch {
        /* quota exceeded / private mode — silently ignore. */
      }
    });
    return () => {
      if (writeTimerRef.current !== null) {
        window.cancelAnimationFrame(writeTimerRef.current);
        writeTimerRef.current = null;
      }
    };
  }, [fullKey, value]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue(next);
  }, []);

  return [value, set];
}
