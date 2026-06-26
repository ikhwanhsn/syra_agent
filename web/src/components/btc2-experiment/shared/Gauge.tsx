import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Gauge({
  value,
  max = 100,
  label,
  sublabel,
  color = "amber",
  size = 120,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  color?: "amber" | "emerald" | "red" | "blue";
  size?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const strokeColors = {
    amber: "stroke-amber-500",
    emerald: "stroke-emerald-500",
    red: "stroke-red-500",
    blue: "stroke-blue-500",
  };

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted/40"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={strokeColors[color]}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-lg font-semibold tabular-nums">{label}</span>
        {sublabel ? (
          <span className="text-[10px] text-muted-foreground">{sublabel}</span>
        ) : null}
      </div>
    </div>
  );
}
