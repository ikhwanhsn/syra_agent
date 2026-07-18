import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Timer } from "lucide-react";

import { useCountdown, type CountdownParts } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

export type LiveCountdownVariant = "inline" | "badge" | "stat" | "blocks";

interface LiveCountdownProps {
  endAt: string | null | undefined;
  variant?: LiveCountdownVariant;
  compact?: boolean;
  showIcon?: boolean;
  expiredLabel?: string;
  invalidLabel?: string;
  className?: string;
}

function pad2(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

function RollingValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion() ?? false;

  if (reduceMotion) {
    return <span className={cn("tabular-nums", className)}>{value}</span>;
  }

  return (
    <span
      className={cn(
        "relative inline-flex h-[1.15em] min-w-[1.35em] items-center justify-center overflow-hidden",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "-55%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "55%", opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 text-center tabular-nums will-change-transform"
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {/* Reserve layout width so neighbors don’t jump */}
      <span className="invisible tabular-nums" aria-hidden>
        {value}
      </span>
    </span>
  );
}

function UnitBlock({
  value,
  label,
  size,
}: {
  value: number;
  label: string;
  size: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-lg border border-border/50 bg-muted/25",
        size === "sm" && "min-w-[2.35rem] px-1.5 py-1",
        size === "md" && "min-w-[2.75rem] px-2 py-1.5",
        size === "lg" && "min-w-[3.25rem] px-2.5 py-2",
      )}
    >
      <RollingValue
        value={pad2(value)}
        className={cn(
          "font-semibold text-foreground",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-xl sm:text-2xl",
        )}
      />
      <span
        className={cn(
          "font-medium uppercase tracking-[0.14em] text-muted-foreground",
          size === "sm" && "text-[8px]",
          size === "md" && "text-[9px]",
          size === "lg" && "text-[10px]",
        )}
      >
        {label}
      </span>
    </span>
  );
}

function InlineUnits({
  parts,
  compact,
}: {
  parts: CountdownParts;
  compact?: boolean;
}) {
  const units = [
    { key: "d", value: parts.days, label: "d" },
    { key: "h", value: parts.hours, label: "h" },
    { key: "m", value: parts.minutes, label: "m" },
    { key: "s", value: parts.seconds, label: "s" },
  ] as const;

  // Hide leading zero days when compact and under 24h for cleaner cards.
  const visible = compact && parts.days === 0 ? units.slice(1) : units;

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 font-mono",
        compact ? "text-[11px]" : "text-sm",
      )}
    >
      {visible.map((unit, index) => (
        <span key={unit.key} className="inline-flex items-baseline">
          {index > 0 ? (
            <span className="mx-0.5 text-muted-foreground/70" aria-hidden>
              :
            </span>
          ) : null}
          <RollingValue
            value={pad2(unit.value)}
            className="font-semibold text-foreground"
          />
          <span className="ml-0.5 text-muted-foreground">{unit.label}</span>
        </span>
      ))}
    </span>
  );
}

function accessibleLabel(parts: CountdownParts): string {
  if (!parts.isValid) return "Time unavailable";
  if (parts.isExpired) return "Ended";
  return `${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes, ${parts.seconds} seconds remaining`;
}

/**
 * Live countdown with seconds + digit roll animation.
 * Use across campaigns, hackathons, and any deadline surface.
 */
export function LiveCountdown({
  endAt,
  variant = "inline",
  compact = false,
  showIcon = variant === "inline" || variant === "badge",
  expiredLabel = "Ended",
  invalidLabel = "—",
  className,
}: LiveCountdownProps) {
  const parts = useCountdown(endAt);
  const label = useMemo(() => accessibleLabel(parts), [parts]);

  if (!parts.isValid) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {invalidLabel}
      </span>
    );
  }

  if (parts.isExpired) {
    return (
      <span className={cn("text-xs font-medium text-muted-foreground", className)}>
        {expiredLabel}
      </span>
    );
  }

  if (variant === "blocks" || variant === "stat") {
    const size = variant === "stat" ? "lg" : compact ? "sm" : "md";
    return (
      <div
        className={cn("inline-flex items-center gap-1.5", className)}
        role="timer"
        aria-live="off"
        aria-label={label}
      >
        <UnitBlock value={parts.days} label="days" size={size} />
        <UnitBlock value={parts.hours} label="hrs" size={size} />
        <UnitBlock value={parts.minutes} label="min" size={size} />
        <UnitBlock value={parts.seconds} label="sec" size={size} />
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        variant === "badge" && "text-amber-400",
        className,
      )}
      role="timer"
      aria-live="off"
      aria-label={label}
    >
      {showIcon ? (
        <Timer
          className={cn(
            "shrink-0 text-primary",
            compact ? "h-3 w-3" : "h-3.5 w-3.5",
            variant === "badge" && "text-amber-400",
          )}
          aria-hidden
        />
      ) : null}
      <InlineUnits parts={parts} compact={compact} />
    </span>
  );
}

/** Keep a ticking string in sync for share copy / plain text consumers. */
export function useLiveCountdownLabel(
  endAt: string | null | undefined,
  options?: { expiredLabel?: string; invalidLabel?: string },
): string {
  const parts = useCountdown(endAt);
  return formatCountdownLabel(parts, options);
}

export function formatCountdownLabel(
  parts: CountdownParts,
  options?: { expiredLabel?: string; invalidLabel?: string },
): string {
  if (!parts.isValid) return options?.invalidLabel ?? "—";
  if (parts.isExpired) return options?.expiredLabel ?? "Ended";
  if (parts.days > 0) {
    return `${parts.days}d ${pad2(parts.hours)}h ${pad2(parts.minutes)}m ${pad2(parts.seconds)}s`;
  }
  if (parts.hours > 0) {
    return `${parts.hours}h ${pad2(parts.minutes)}m ${pad2(parts.seconds)}s`;
  }
  return `${parts.minutes}m ${pad2(parts.seconds)}s`;
}
