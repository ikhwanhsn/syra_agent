import { Globe, MapPin, Star, Trophy } from "lucide-react";

import { DiscoveryListThumb } from "@/components/discovery/DiscoveryListThumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveCountdown } from "@/components/ui/LiveCountdown";
import {
  formatPrizeAmount,
  openStateLabel,
} from "@/lib/discoveryFormatters";
import type { HackathonRecord } from "@/lib/hackathonApi";
import { cn } from "@/lib/utils";

function hackathonMetaLine(item: HackathonRecord): string {
  const parts: string[] = [];
  const organizer = item.organizer || item.source;
  if (organizer) parts.push(organizer);
  if (item.location) parts.push(item.location);
  else parts.push(item.isIndonesia ? "Indonesia" : "Global");
  return parts.join(" · ");
}

interface CountdownDisplayProps {
  deadline: string | null;
  compact?: boolean;
}

/** @deprecated Prefer LiveCountdown directly — kept for existing imports. */
export function CountdownDisplay({ deadline, compact = false }: CountdownDisplayProps) {
  return (
    <LiveCountdown
      endAt={deadline}
      compact={compact}
      showIcon
      expiredLabel="Deadline passed"
      invalidLabel={deadline || "Deadline TBD"}
    />
  );
}

interface HackathonArenaCardProps {
  item: HackathonRecord;
  isSaved: boolean;
  featured?: boolean;
  onSelect: () => void;
  onToggleSaved: () => void;
}

export function HackathonArenaCard({
  item,
  isSaved,
  featured = false,
  onSelect,
  onToggleSaved,
}: HackathonArenaCardProps) {
  const organizer = item.organizer || item.source || "Organizer";
  const openLabel = openStateLabel(item.openState);
  const prize = formatPrizeAmount(item.prizePool, item.prizeAmountUsd);
  const isOpen = item.openState === "open";

  if (featured) {
    return (
      <article
        className={cn(
          "group relative overflow-hidden rounded-[1.75rem] border border-primary/20",
          "bg-gradient-to-br from-primary/[0.08] via-card/80 to-card/55 shadow-elevated",
          "transition-[transform,border-color,box-shadow] duration-300 ease-out",
          "hover:-translate-y-0.5 hover:border-primary/35",
          isSaved && "ring-1 ring-primary/20",
        )}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-40"
          aria-hidden
        />

        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <button
            type="button"
            onClick={onSelect}
            className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
          >
            <p className="eyebrow mb-4">
              <Trophy className="h-4 w-4" aria-hidden />
              Featured hackathon
            </p>
            <div className="flex items-start gap-4">
              <DiscoveryListThumb
                imageUrl={item.thumbnailUrl}
                label={organizer}
                className="h-14 w-14 shrink-0 ring-2 ring-primary/20"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {organizer}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {item.title}
                </h2>
              </div>
            </div>
            <p className="mt-4 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {item.description || hackathonMetaLine(item)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {openLabel ? (
                <Badge
                  variant="outline"
                  className={cn(
                    isOpen
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground",
                  )}
                >
                  {openLabel}
                </Badge>
              ) : null}
              <Badge variant="outline" className="gap-1">
                {item.isIndonesia ? (
                  "Indonesia"
                ) : (
                  <>
                    <Globe className="h-3 w-3" aria-hidden />
                    Global
                  </>
                )}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {item.location || "Online / TBD"}
              </span>
            </div>
          </button>

          <div className="flex flex-col gap-4 lg:min-w-[14rem] lg:items-end lg:text-right">
            <div className="w-full rounded-2xl border border-primary/20 bg-primary/[0.07] px-5 py-4 lg:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Prize pool
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {prize}
              </p>
            </div>
            <LiveCountdown
              endAt={item.deadline}
              variant="blocks"
              compact
              expiredLabel="Deadline passed"
              invalidLabel={item.deadline || "Deadline TBD"}
            />
            <div className="flex w-full items-center gap-2 lg:justify-end">
              <Button variant="hero" className="flex-1 rounded-full lg:flex-none" onClick={onSelect}>
                View hackathon
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(
                  "h-10 w-10 rounded-full border border-border/50 bg-background/60",
                  isSaved && "text-primary border-primary/30",
                )}
                onClick={onToggleSaved}
                aria-label={isSaved ? "Remove from saved" : "Save hackathon"}
                aria-pressed={isSaved}
              >
                <Star className={cn("h-4 w-4", isSaved && "fill-current")} />
              </Button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/55 bg-card/55 p-5",
        "shadow-card transition-[transform,border-color,box-shadow] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated",
        isOpen && "border-emerald-500/20",
        isSaved && "ring-1 ring-primary/20",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="relative flex h-full w-full flex-col gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      >
        <div className="flex items-start justify-between gap-4 pr-10">
          <div className="flex items-center gap-3 min-w-0">
            <DiscoveryListThumb
              imageUrl={item.thumbnailUrl}
              label={organizer}
              className="h-11 w-11 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {organizer}
              </p>
              <h2 className="line-clamp-2 text-lg font-semibold tracking-tight text-foreground">
                {item.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/[0.05] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Prize pool
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-foreground">
            {prize}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {openLabel ? (
            <Badge
              variant="outline"
              className={cn(
                isOpen
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "text-muted-foreground",
              )}
            >
              {openLabel}
            </Badge>
          ) : null}
          <Badge variant="outline" className="gap-1">
            {item.isIndonesia ? (
              "Indonesia"
            ) : (
              <>
                <Globe className="h-3 w-3" aria-hidden />
                Global
              </>
            )}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {item.description || hackathonMetaLine(item)}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
          <CountdownDisplay deadline={item.deadline} compact />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {item.location || "Online / TBD"}
          </span>
        </div>
      </button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn(
          "absolute right-3 top-3 h-9 w-9 rounded-full border border-border/40 bg-background/70 backdrop-blur-sm",
          isSaved && "text-primary border-primary/30",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSaved();
        }}
        aria-label={isSaved ? "Remove from saved" : "Save hackathon"}
        aria-pressed={isSaved}
      >
        <Star className={cn("h-4 w-4", isSaved && "fill-current")} />
      </Button>
    </article>
  );
}
