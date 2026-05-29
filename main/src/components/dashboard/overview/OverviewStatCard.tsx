import type { ReactNode } from "react";
import { Link } from "@/lib/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
  overviewMetricValueClass,
  type OverviewAccent,
} from "@/components/dashboard/overview/overviewStyles";

export interface OverviewStatCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  icon?: LucideIcon;
  accent?: OverviewAccent;
  isLoading?: boolean;
  error?: boolean;
  className?: string;
}

export function OverviewStatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  accent = "neutral",
  isLoading,
  error,
  className,
}: OverviewStatCardProps) {
  const body = (
    <article
      className={cn(
        overviewCardShell,
        "group h-full p-4 sm:p-5 transition-all duration-300",
        href && "hover:-translate-y-0.5 hover:border-border/80 hover:shadow-[0_1px_0_0_hsl(var(--border)/0.55),0_28px_56px_-28px_rgba(0,0,0,0.75)]",
        error && "opacity-80",
        className,
      )}
    >
      <div
        className={overviewCardGlow}
        style={{ background: overviewAccentBackground(accent) }}
        aria-hidden
      />
      <div className="relative flex h-full flex-col">
        <header className="mb-3 flex items-start justify-between gap-2">
          <p className={cn(overviewKickerClass, "min-w-0")}>{label}</p>
          {Icon ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/40 text-muted-foreground transition-colors group-hover:border-border/70 group-hover:text-foreground">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
          ) : null}
        </header>

        {isLoading ? (
          <div className="flex flex-1 flex-col justify-center gap-2 py-2">
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted/60" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted/40" />
          </div>
        ) : (
          <>
            <p className={cn(overviewMetricValueClass, error && "text-muted-foreground")}>{value}</p>
            {hint ? <p className="mt-2 text-[11px] leading-snug text-muted-foreground/85">{hint}</p> : null}
          </>
        )}

        {href && !isLoading ? (
          <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            Open workspace
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          </span>
        ) : null}
        {isLoading ? (
          <Loader2 className="absolute right-4 top-4 h-4 w-4 animate-spin text-muted-foreground/50" aria-label="Loading" />
        ) : null}
      </div>
    </article>
  );

  if (!href) return body;

  return (
    <Link
      to={href}
      className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {body}
    </Link>
  );
}
