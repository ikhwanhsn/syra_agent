import { ArrowUpRight, Briefcase, MapPin, Star } from "lucide-react";

import { DiscoveryListThumb } from "@/components/discovery/DiscoveryListThumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { faviconFromPageUrl } from "@/lib/imageUrl";
import {
  formatRelativeDate,
  JOB_CATEGORY_STYLES,
} from "@/lib/discoveryFormatters";
import type { JobListing } from "@/lib/jobsApi";
import { cn } from "@/lib/utils";

interface JobSpotlightCardProps {
  job: JobListing;
  isInteresting: boolean;
  onNavigate: () => void;
}

export function JobSpotlightCard({
  job,
  isInteresting,
  onNavigate,
}: JobSpotlightCardProps) {
  const company = job.company || "Company not listed";
  const categoryStyle = JOB_CATEGORY_STYLES[job.category];
  const location = job.remote ? "Remote" : job.location || "Location TBD";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-primary/20",
        "bg-gradient-to-br from-primary/[0.09] via-card/90 to-card/70 shadow-elevated",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <p className="eyebrow mb-4">
            <Briefcase className="h-4 w-4" aria-hidden />
            Spotlight pick
          </p>

          <div className="flex items-start gap-4">
            <DiscoveryListThumb
              imageUrl={faviconFromPageUrl(job.url)}
              label={company}
              className="h-16 w-16 shrink-0 ring-2 ring-primary/20"
            />
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2rem] lg:leading-tight">
                {job.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {company}
                <span className="mx-2 text-border" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {location}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={categoryStyle.badge}>
              {categoryStyle.label}
            </Badge>
            {job.remote ? <Badge variant="outline">Remote</Badge> : null}
            {job.salaryLabel ? (
              <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 font-mono text-xs font-medium text-foreground backdrop-blur-sm">
                {job.salaryLabel}
              </span>
            ) : null}
            {isInteresting ? (
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                <Star className="mr-1 h-3 w-3 fill-current" />
                Saved
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:items-end lg:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Posted {formatRelativeDate(job.lastSeenAt ?? job.publishedAt)}
          </p>
          <Button
            variant="hero"
            className="w-full rounded-full sm:w-auto"
            onClick={onNavigate}
          >
            View role
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </article>
  );
}

interface JobTicketCardProps {
  job: JobListing;
  isInteresting: boolean;
  isApplied: boolean;
  onNavigate: () => void;
  onToggleSaved: () => void;
}

export function JobTicketCard({
  job,
  isInteresting,
  isApplied,
  onNavigate,
  onToggleSaved,
}: JobTicketCardProps) {
  const company = job.company || "Company not listed";
  const categoryStyle = JOB_CATEGORY_STYLES[job.category];
  const location = job.remote ? "Remote" : job.location || "Location TBD";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/60",
        "transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated",
        isInteresting && "border-primary/25 bg-primary/[0.04]",
        isApplied && "ring-1 ring-emerald-500/35",
      )}
    >
      <div
        className={cn("absolute inset-x-0 top-0 h-1", categoryStyle.accent)}
        aria-hidden
      />

      <button
        type="button"
        onClick={onNavigate}
        className="flex flex-1 flex-col p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex items-start justify-between gap-3">
          <DiscoveryListThumb
            imageUrl={faviconFromPageUrl(job.url)}
            label={company}
            className="h-12 w-12"
          />
          <Badge variant="outline" className={cn("shrink-0 text-[10px]", categoryStyle.badge)}>
            {categoryStyle.label}
          </Badge>
        </div>

        <h2 className="mt-4 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-foreground">
          {job.title}
        </h2>

        <p className="mt-1.5 truncate text-sm font-medium text-muted-foreground">
          {company}
        </p>

        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {location}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          {job.salaryLabel ? (
            <span className="rounded-full bg-muted/80 px-2.5 py-1 font-mono text-[11px] font-medium text-foreground">
              {job.salaryLabel}
            </span>
          ) : null}
          {isApplied ? (
            <Badge
              variant="outline"
              className="h-5 border-emerald-500/30 bg-emerald-500/10 px-1.5 text-[10px] text-emerald-700 dark:text-emerald-400"
            >
              Applied
            </Badge>
          ) : null}
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {formatRelativeDate(job.lastSeenAt ?? job.publishedAt)}
          </span>
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-border/50 px-4 py-3">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 gap-1.5 rounded-lg px-2 text-muted-foreground",
            isInteresting && "text-primary",
          )}
          onClick={onToggleSaved}
          aria-label={isInteresting ? "Remove from saved" : "Save job"}
          aria-pressed={isInteresting}
        >
          <Star className={cn("h-4 w-4", isInteresting && "fill-current")} />
          {isInteresting ? "Saved" : "Save"}
        </Button>
        <Button
          size="sm"
          variant="default"
          className="h-8 rounded-full px-4"
          onClick={onNavigate}
        >
          View
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </article>
  );
}
