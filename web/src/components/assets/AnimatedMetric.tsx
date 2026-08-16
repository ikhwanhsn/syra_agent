import { useEffect, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { cn } from "@/lib/utils";

interface AnimatedMetricProps {
  value: number | null | undefined;
  format: (n: number) => string;
  className?: string;
  /** When true, positive change flashes green, negative red */
  deltaMode?: boolean;
}

export function AnimatedMetric({ value, format, className, deltaMode = false }: AnimatedMetricProps) {
  const prev = useRef<number | null | undefined>(undefined);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value == null || !Number.isFinite(value)) {
      prev.current = value;
      return;
    }
    if (prev.current != null && Number.isFinite(prev.current) && value !== prev.current) {
      const direction = value > (prev.current as number) ? "up" : "down";
      setFlash(deltaMode ? direction : null);
      const timer = window.setTimeout(() => setFlash(null), 450);
      prev.current = value;
      return () => window.clearTimeout(timer);
    }
    prev.current = value;
  }, [value, deltaMode]);

  const ready = value != null && Number.isFinite(value);

  return (
    <span
      className={cn(
        "inline-block font-mono tabular-nums transition-[color,transform] duration-300 ease-out",
        flash === "up" && "text-success scale-[1.02]",
        flash === "down" && "text-destructive scale-[0.98]",
        className,
      )}
    >
      {ready ? (
        <AnimatedNumber value={value} format={format} startOnView={false} />
      ) : (
        "-"
      )}
    </span>
  );
}
