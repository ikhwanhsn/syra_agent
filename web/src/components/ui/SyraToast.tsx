import type { ReactNode } from "react";
import { AlertCircle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SyraToastVariant = "success" | "error" | "info" | "default";

const VARIANT_STYLES: Record<
  SyraToastVariant,
  {
    Icon: typeof Check;
    icon: string;
    iconWrap: string;
    accent: string;
    progress: string;
  }
> = {
  success: {
    Icon: Check,
    icon: "text-emerald-600 dark:text-emerald-400",
    iconWrap: "bg-emerald-500/10 ring-emerald-500/25 dark:bg-emerald-400/10 dark:ring-emerald-400/20",
    accent: "from-emerald-500 via-emerald-500/40 to-transparent",
    progress: "bg-emerald-500/70 dark:bg-emerald-400/80",
  },
  error: {
    Icon: AlertCircle,
    icon: "text-red-600 dark:text-red-400",
    iconWrap: "bg-red-500/10 ring-red-500/25 dark:bg-red-400/10 dark:ring-red-400/20",
    accent: "from-red-500 via-red-500/40 to-transparent",
    progress: "bg-red-500/70 dark:bg-red-400/80",
  },
  info: {
    Icon: Info,
    icon: "text-foreground/80 dark:text-foreground/90",
    iconWrap: "bg-foreground/5 ring-foreground/10 dark:bg-white/8 dark:ring-white/12",
    accent: "from-foreground/50 via-foreground/20 to-transparent",
    progress: "bg-foreground/35 dark:bg-foreground/45",
  },
  default: {
    Icon: Info,
    icon: "text-foreground/80",
    iconWrap: "bg-muted ring-border/60",
    accent: "from-foreground/40 via-foreground/15 to-transparent",
    progress: "bg-foreground/30",
  },
};

export interface SyraToastProps {
  variant?: SyraToastVariant;
  title: ReactNode;
  description?: ReactNode;
  onClose?: () => void;
  /** Animate the bottom progress bar (matches Sonner duration). */
  showProgress?: boolean;
  durationMs?: number;
}

export function SyraToast({
  variant = "default",
  title,
  description,
  onClose,
  showProgress = true,
  durationMs = 4500,
}: SyraToastProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = styles.Icon;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "syra-toast relative flex w-[min(100vw-2rem,24rem)] gap-3 overflow-hidden rounded-2xl",
        "border border-border/55 bg-popover/92 p-4 pr-11",
        "shadow-[0_20px_50px_-14px_rgba(0,0,0,0.28)] backdrop-blur-xl",
        "dark:border-white/[0.08] dark:bg-[hsl(220_12%_7%/0.92)]",
        "dark:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.65)]",
        "animate-in slide-in-from-left-4 fade-in duration-300",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b",
          styles.accent,
        )}
      />

      <div
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          styles.iconWrap,
        )}
      >
        <Icon className={cn("h-[18px] w-[18px]", styles.icon)} strokeWidth={2.25} aria-hidden />
      </div>

      <div className="min-w-0 flex-1 pt-px">
        <p className="text-[13px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg",
            "text-muted-foreground/70 transition-colors",
            "hover:bg-muted/60 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      ) : null}

      {showProgress ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-foreground/[0.06]"
          aria-hidden
        >
          <div
            className={cn("syra-toast-progress h-full origin-left", styles.progress)}
            style={{ animationDuration: `${durationMs}ms` }}
          />
        </div>
      ) : null}
    </div>
  );
}
