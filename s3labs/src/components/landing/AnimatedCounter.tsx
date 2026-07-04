import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  format?: "plain" | "compact";
  durationMs?: number;
  className?: string;
}

function formatNumber(value: number, format: "plain" | "compact"): string {
  if (format === "compact" && value >= 1000) {
    const thousands = value / 1000;
    const rounded =
      thousands >= 10
        ? Math.round(thousands).toString()
        : (Math.round(thousands * 10) / 10).toString();
    return `${rounded.replace(/\.0$/, "")}K`;
  }

  return Math.round(value).toLocaleString("en-US");
}

function buildLabel(
  value: number,
  prefix: string,
  suffix: string,
  format: "plain" | "compact",
): string {
  const numberPart = formatNumber(value, format);
  if (format === "compact" && value >= 1000) {
    const plus = suffix.includes("+") ? "+" : "";
    return `${prefix}${numberPart}${plus}`;
  }
  return `${prefix}${numberPart}${suffix}`;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  format = "plain",
  durationMs = 1600,
  className,
}: AnimatedCounterProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [current, setCurrent] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (!inView) return;

    if (reduceMotion) {
      setCurrent(value);
      return;
    }

    let frameId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCurrent(value * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [inView, reduceMotion, value, durationMs]);

  const label = buildLabel(current, prefix, suffix, format);
  const accessible = buildLabel(value, prefix, suffix, format);

  return (
    <span
      ref={ref}
      className={cn("tabular-nums", className)}
      aria-label={accessible}
    >
      {label}
    </span>
  );
}

export default AnimatedCounter;
