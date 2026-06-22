import { Link } from "@/lib/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PillarId } from "@/lib/pillarsApi";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";

type PillarCardProps = {
  id: PillarId;
  label: string;
  tagline: string;
  description?: string;
  href: string;
  icon?: LucideIcon;
  stats?: { routeCount?: number; toolCount?: number };
  features?: readonly string[];
  accent?: {
    accent: string;
    iconRing: string;
    iconGlow: string;
    borderHover: string;
  };
  step?: number;
  comingSoon?: boolean;
  className?: string;
};

export function PillarCard({
  label,
  tagline,
  description,
  href,
  icon: Icon,
  stats,
  features,
  accent,
  step,
  comingSoon = false,
  className,
}: PillarCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        overviewCardShell,
        "group flex h-full flex-col p-5 transition-all duration-300",
        comingSoon ? "opacity-95" : cn("hover:-translate-y-0.5 hover:shadow-lg", accent?.borderHover),
        className,
      )}
    >
      {accent ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100",
            accent.iconGlow,
          )}
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            {step != null ? (
              <span className={cn("text-[10px] font-bold tabular-nums", accent?.accent ?? "text-muted-foreground")}>
                {String(step).padStart(2, "0")}
              </span>
            ) : null}
            <p className={overviewKickerClass}>{label}</p>
          </div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">{tagline}</h3>
        </div>
        {Icon ? (
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
              accent?.iconRing ?? "border-border/60 bg-muted/40",
            )}
          >
            <Icon className={cn("h-5 w-5", accent?.accent ?? "text-muted-foreground")} aria-hidden />
          </span>
        ) : null}
      </div>

      {description ? (
        <p className="relative mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}

      {features && features.length > 0 ? (
        <ul className="relative mt-3 flex flex-wrap gap-1.5">
          {features.map((feature) => (
            <li key={feature}>
              <Badge
                variant="secondary"
                className="rounded-md border-border/40 bg-background/50 px-2 py-0.5 text-[10px] font-medium"
              >
                {feature}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
        {stats ? (
          <p className="text-[11px] text-muted-foreground">
            {stats.routeCount != null ? `${stats.routeCount} routes` : null}
            {stats.routeCount != null && stats.toolCount != null ? " · " : null}
            {stats.toolCount != null ? `${stats.toolCount} tools` : null}
          </p>
        ) : (
          <span />
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium",
            comingSoon ? "text-muted-foreground" : accent?.accent ?? "text-primary",
          )}
        >
          {comingSoon ? "Coming soon" : "Open pillar"}
          {!comingSoon ? (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          ) : null}
        </span>
      </div>
    </Link>
  );
}
