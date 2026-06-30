import { Gift, Globe, MapPin, Star, Timer, Trophy } from "lucide-react";

import { DiscoveryListThumb } from "@/components/discovery/DiscoveryListThumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatPrizeAmount,
  openStateLabel,
} from "@/lib/discoveryFormatters";
import { useCountdown } from "@/hooks/useCountdown";
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

export function CountdownDisplay({ deadline, compact = false }: CountdownDisplayProps) {
  const countdown = useCountdown(deadline);

  if (!countdown.isValid) {
    return (
      <span className="text-xs text-muted-foreground">
        {deadline || "Deadline TBD"}
      </span>
    );
  }

  if (countdown.isExpired) {
    return (
      <span className="text-xs font-medium text-muted-foreground">Deadline passed</span>
    );
  }

  const units = [
    { label: "d", value: countdown.days },
    { label: "h", value: countdown.hours },
    { label: "m", value: countdown.minutes },
    { label: "s", value: countdown.seconds },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 font-mono",
        compact ? "text-[11px]" : "text-sm",
      )}
    >
      <Timer className="h-3.5 w-3.5 text-primary" aria-hidden />
      {units.map((unit) => (
        <span key={unit.label} className="tabular-nums">
          <span className="font-semibold text-foreground">{String(unit.value).padStart(2, "0")}</span>
          <span className="text-muted-foreground">{unit.label}</span>
        </span>
      ))}
    </div>
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

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card/40 transition-all duration-500",
        featured
          ? "border-primary/30 bg-gradient-to-br from-primary/[0.08] via-card/70 to-card/50 p-6 shadow-elevated sm:p-8"
          : "border-border/60 p-5 hover:-translate-y-1 hover:border-primary/25 hover:shadow-elevated",
        isOpen && !featured && "border-emerald-500/20",
        isSaved && "ring-1 ring-primary/20",
      )}
    >
      {featured ? (
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
      ) : null}

      <button
        type="button"
        onClick={onSelect}
        className="relative flex h-full w-full flex-col gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <DiscoveryListThumb
              imageUrl={item.thumbnailUrl}
              label={organizer}
              className={featured ? "h-14 w-14" : "h-11 w-11"}
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {organizer}
              </p>
              <h2
                className={cn(
                  "font-semibold tracking-tight text-foreground",
                  featured ? "text-2xl sm:text-3xl" : "text-lg",
                )}
              >
                {item.title}
              </h2>
            </div>
          </div>
          {featured ? (
            <div className="hidden rounded-full border border-primary/30 bg-primary/10 p-3 text-primary sm:block">
              <Trophy className="h-6 w-6" aria-hidden />
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "rounded-2xl border border-primary/20 bg-primary/[0.06] p-4",
            featured && "sm:p-5",
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            Prize pool
          </p>
          <p
            className={cn(
              "mt-1 font-mono font-bold tracking-tight text-foreground",
              featured ? "text-3xl sm:text-4xl" : "text-2xl",
            )}
          >
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

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <CountdownDisplay deadline={item.deadline} compact={!featured} />
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
          "absolute right-4 top-4 h-9 w-9 rounded-full bg-background/70 backdrop-blur-sm",
          isSaved && "text-primary",
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
