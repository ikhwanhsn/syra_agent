import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Sparkline } from "../charts/Sparkline";
import type { LucideIcon } from "lucide-react";
import type { SparklinePoint } from "@/lib/btc2/types";
import { formatPct } from "@/lib/btc2/format";

export interface MetricCardProps {
  label: string;
  value: string;
  changePct?: number;
  sparkline?: SparklinePoint[];
  icon?: LucideIcon;
  className?: string;
}

export function MetricCard({
  label,
  value,
  changePct = 0,
  sparkline,
  icon: Icon,
  className,
}: MetricCardProps) {
  const positive = changePct >= 0;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        overviewCardShell,
        "group rounded-2xl p-4 ring-1 ring-transparent transition-shadow hover:ring-amber-500/15 hover:shadow-[0_0_32px_-8px_hsl(38_92%_50%/0.25)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75">
          {label}
        </p>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground/60" aria-hidden /> : null}
      </div>
      <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs font-medium tabular-nums",
            positive ? "text-emerald-500" : "text-red-500",
          )}
        >
          {formatPct(changePct, true)}
        </span>
        {sparkline && sparkline.length > 1 ? (
          <Sparkline data={sparkline} positive={positive} className="h-8 w-20" />
        ) : null}
      </div>
    </motion.div>
  );
}
