import { useEffect, useMemo, useState } from "react";

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isValid: boolean;
}

function parseDeadline(deadline: string | null | undefined): Date | null {
  if (!deadline?.trim()) return null;
  const parsed = new Date(deadline);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const fallback = Date.parse(deadline);
  if (!Number.isNaN(fallback)) return new Date(fallback);
  return null;
}

function computeParts(target: Date | null): CountdownParts {
  if (!target) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isValid: false };
  }

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isValid: true };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, isExpired: false, isValid: true };
}

/** Live countdown ticking on whole-second boundaries for smoother UI updates. */
export function useCountdown(deadline: string | null | undefined): CountdownParts {
  const target = useMemo(() => parseDeadline(deadline), [deadline]);
  const [parts, setParts] = useState<CountdownParts>(() => computeParts(target));

  useEffect(() => {
    setParts(computeParts(target));
    if (!target) return undefined;

    let intervalId = 0;
    const tick = () => setParts(computeParts(target));

    // Align to the next second so every display flips together.
    const msToNextSecond = 1000 - (Date.now() % 1000);
    const timeoutId = window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 1000);
    }, msToNextSecond);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [target]);

  return parts;
}
