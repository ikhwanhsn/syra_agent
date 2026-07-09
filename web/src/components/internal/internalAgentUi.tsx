import type { ReactNode } from "react";
import { ArrowRight, Bot, Clock, Handshake, Newspaper, TrendingUp, type LucideIcon } from "lucide-react";
import { Link } from "@/lib/navigation";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INTERNAL_BASE_PATH } from "@/lib/internalRoutes";

export type AgentRunStatus = "ready" | "waiting" | "error" | "loading";

export function formatAgentDate(iso: string | undefined): string {
  if (!iso) return "Not yet";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const STATUS_CONFIG: Record<
  AgentRunStatus,
  { label: string; className: string }
> = {
  ready: {
    label: "Ready",
    className: "bg-emerald-600/12 text-emerald-700 dark:text-emerald-400 border-emerald-600/25",
  },
  waiting: {
    label: "Waiting for first run",
    className: "bg-muted text-muted-foreground border-border/70",
  },
  error: {
    label: "Something went wrong",
    className: "bg-destructive/12 text-destructive border-destructive/25",
  },
  loading: {
    label: "Loading…",
    className: "bg-muted/60 text-muted-foreground border-border/60",
  },
};

export function AgentStatusPill({ status }: { status: AgentRunStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

export function priorityLabel(priority: string): string {
  switch (priority) {
    case "high":
      return "High priority";
    case "medium":
      return "Medium priority";
    case "low":
      return "Low priority";
    default:
      return priority;
  }
}

export function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-emerald-600/12 text-emerald-700 dark:text-emerald-400 border-emerald-600/25";
    case "medium":
      return "bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/25";
    case "low":
      return "bg-muted text-muted-foreground border-border/70";
    default:
      return "";
  }
}

export function InternalAgentsHero({
  onRefresh,
  refreshing,
}: {
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className={cn(overviewCardShell, "overflow-hidden rounded-3xl px-5 py-7 sm:px-8 sm:py-8")}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{ background: overviewAccentBackground("internal") }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
            <Bot className="h-3.5 w-3.5 text-foreground/80" aria-hidden />
            Syra internal
          </div>
          <div>
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Internal hub
            </h1>
            <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Scout agents, partnership pipeline, and internal tools — one place for the team to
              understand traction and decide what to ship next.
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Trend Scout at 6:00 WIB · Partnership Scout at 6:15 WIB · Growth Scout at 6:30 WIB · Telegram digests
          </p>
        </div>
        {onRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 rounded-xl border-border/70 bg-background/60 backdrop-blur-sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh all"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function AgentOverviewCard({
  icon: Icon,
  name,
  description,
  schedule,
  status,
  lastRun,
  highlight,
  stats,
  href,
  ctaLabel = "Open report",
}: {
  icon: LucideIcon;
  name: string;
  description: string;
  schedule: string;
  status: AgentRunStatus;
  lastRun?: string;
  highlight?: string;
  stats?: { label: string; value: string | number }[];
  href: string;
  ctaLabel?: string;
}) {
  return (
    <article className={cn(overviewCardShell, "flex h-full flex-col overflow-hidden rounded-2xl")}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{ background: overviewAccentBackground("internal") }}
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/55 bg-background/50 shadow-inner">
              <Icon className="h-5 w-5 text-foreground" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">{name}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
          <AgentStatusPill status={status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {schedule}
          </span>
          <span>
            Last update:{" "}
            <span className="font-medium text-foreground">{formatAgentDate(lastRun)}</span>
          </span>
        </div>

        {stats && stats.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border/50 bg-background/40 px-3 py-2.5"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        {highlight ? (
          <div className="mt-4 rounded-xl border border-border/50 bg-background/45 p-4">
            <p className={overviewKickerClass}>Latest summary</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-4">{highlight}</p>
          </div>
        ) : null}

        <div className="mt-auto pt-5">
          <Button variant="outline" className="w-full gap-2 rounded-xl sm:w-auto" asChild>
            <Link to={href}>
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export function InternalDetailHero({
  name,
  description,
  lastRun,
  onRefresh,
  refreshing,
  backTo = INTERNAL_BASE_PATH,
}: {
  name: string;
  description: string;
  lastRun?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  backTo?: string;
}) {
  return (
    <div className={cn(overviewCardShell, "overflow-hidden rounded-2xl px-5 py-6 sm:px-6")}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{ background: overviewAccentBackground("internal") }}
        aria-hidden
      />
      <div className="relative space-y-3">
        <Button variant="ghost" size="sm" className="-ml-2 h-8 gap-1 text-muted-foreground" asChild>
          <Link to={backTo}>← Back to agents</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{name}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated:{" "}
              <span className="font-medium text-foreground">{formatAgentDate(lastRun)}</span>
            </p>
          </div>
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 rounded-xl"
              onClick={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function InsightPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(overviewCardShell, "rounded-2xl p-5 sm:p-6", className)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{ background: overviewAccentBackground("internal") }}
        aria-hidden
      />
      <div className="relative">
        <p className={overviewKickerClass}>{title}</p>
        <div className="mt-3 text-sm leading-relaxed text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function SimpleBulletList({ items, emptyLabel = "Nothing here yet." }: { items: string[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((t, i) => (
        <li key={`${i}-${t.slice(0, 48)}`} className="flex gap-2.5 text-sm leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function IdeaCard({
  title,
  priority,
  surface,
  children,
}: {
  title: string;
  priority?: string;
  surface?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/55 bg-background/40 p-4 transition-colors hover:bg-background/55">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="font-medium text-foreground">{title}</h3>
        {priority ? (
          <Badge variant="outline" className={cn("text-[10px] font-normal", priorityBadgeClass(priority))}>
            {priorityLabel(priority)}
          </Badge>
        ) : null}
        {surface ? (
          <Badge variant="secondary" className="text-[10px] font-normal capitalize">
            {surface}
          </Badge>
        ) : null}
      </div>
      <div className="space-y-1.5 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export const AGENT_ICONS = {
  "trend-scout": Newspaper,
  "partnership-scout": Handshake,
  "growth-scout": TrendingUp,
} as const satisfies Record<string, LucideIcon>;
