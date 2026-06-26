import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SignalDirection } from "@/lib/btc2/types";

const signalColors: Record<SignalDirection, string> = {
  bullish: "bg-emerald-500",
  neutral: "bg-amber-500",
  bearish: "bg-red-500",
};

export function FactorBar({
  score,
  signal,
  className,
}: {
  score: number;
  signal: SignalDirection;
  className?: string;
}) {
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-muted/60", className)}>
      <motion.div
        className={cn("h-full rounded-full", signalColors[signal])}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ type: "spring", stiffness: 60, damping: 18 }}
      />
    </div>
  );
}
