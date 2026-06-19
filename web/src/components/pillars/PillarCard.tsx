import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PillarId } from "@/lib/pillarsApi";

type PillarCardProps = {
  id: PillarId;
  label: string;
  tagline: string;
  description?: string;
  href: string;
  icon?: LucideIcon;
  stats?: { routeCount?: number; toolCount?: number };
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
  comingSoon = false,
  className,
}: PillarCardProps) {
  return (
    <Card
      className={cn(
        "group border-border/60 bg-card/80 backdrop-blur-sm transition-colors",
        comingSoon ? "opacity-95" : "hover:border-primary/40",
        className,
      )}
    >      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight">{label}</CardTitle>
            <CardDescription className="text-sm font-medium text-primary/90">{tagline}</CardDescription>
          </div>
          {Icon ? (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
              <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
          ) : null}
        </div>
        {description ? <p className="text-sm text-muted-foreground leading-relaxed">{description}</p> : null}
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4 pt-0">
        {stats ? (
          <p className="text-xs text-muted-foreground">
            {stats.routeCount != null ? `${stats.routeCount} routes` : null}
            {stats.routeCount != null && stats.toolCount != null ? " · " : null}
            {stats.toolCount != null ? `${stats.toolCount} tools` : null}
          </p>
        ) : (
          <span />
        )}
        <Link
          to={href}
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium",
            comingSoon ? "text-muted-foreground" : "text-primary hover:underline",
          )}
        >
          {comingSoon ? "Coming soon" : "Open"}
          {!comingSoon ? (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          ) : null}
        </Link>      </CardContent>
    </Card>
  );
}
