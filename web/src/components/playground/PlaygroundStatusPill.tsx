import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types/api";

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; className: string; dotClass: string }
> = {
  idle: {
    label: "Ready",
    className: "bg-muted/50 text-muted-foreground ring-border/50",
    dotClass: "bg-muted-foreground/50",
  },
  loading: {
    label: "Loading",
    className: "bg-primary/10 text-foreground ring-primary/20",
    dotClass: "bg-primary animate-pulse",
  },
  success: {
    label: "Success",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25",
    dotClass: "bg-emerald-500",
  },
  error: {
    label: "Error",
    className: "bg-destructive/10 text-destructive ring-destructive/25",
    dotClass: "bg-destructive",
  },
  payment_required: {
    label: "Payment required",
    className: "bg-amber-500/10 text-amber-800 dark:text-amber-200 ring-amber-500/30",
    dotClass: "bg-amber-500 animate-pulse",
  },
};

export function PlaygroundStatusPill({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
        "transition-[background-color,color,box-shadow] duration-300 ease-out",
        cfg.className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dotClass)} aria-hidden />
      {cfg.label}
    </span>
  );
}
