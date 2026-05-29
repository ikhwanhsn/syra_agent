import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

export type LpStatTone = "default" | "positive" | "negative" | "warning" | "accent";

const toneValueClass: Record<LpStatTone, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-red-600 dark:text-red-400",
  warning: "text-foreground",
  accent: "text-violet-700 dark:text-violet-300",
};

export interface LpStatTileProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
  tone?: LpStatTone;
  highlight?: boolean;
  className?: string;
}

export function LpStatTile({
  label,
  value,
  subValue,
  icon: Icon,
  tone = "default",
  highlight = false,
  className,
}: LpStatTileProps) {
  return (
    <div
      className={cn(
        "group relative flex min-w-0 flex-col gap-2.5 rounded-2xl border px-4 py-3.5",
        "bg-background/50 backdrop-blur-sm transition-[border-color,box-shadow] duration-200",
        highlight
          ? "border-violet-500/35 shadow-[inset_0_1px_0_0_hsl(var(--background)/0.8)]"
          : "border-border/45 hover:border-violet-500/20",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn(overviewKickerClass, "truncate normal-case tracking-[0.12em]")}>{label}</p>
        {Icon ? (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/45",
              "bg-background/60 text-muted-foreground transition-colors",
              "group-hover:border-violet-500/25 group-hover:text-violet-600 dark:group-hover:text-violet-400",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "font-mono text-lg font-semibold tabular-nums tracking-tight sm:text-xl",
            toneValueClass[tone],
          )}
        >
          {value}
        </p>
        {subValue ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{subValue}</p>
        ) : null}
      </div>
    </div>
  );
}
