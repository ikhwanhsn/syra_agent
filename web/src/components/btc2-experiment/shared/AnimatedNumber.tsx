import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  decimals?: number;
}

export function AnimatedNumber({
  value,
  format,
  className,
  decimals = 2,
}: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => {
    if (format) return format(v);
    return v.toFixed(decimals);
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className={cn("font-mono tabular-nums", className)}>
      {display}
    </motion.span>
  );
}
