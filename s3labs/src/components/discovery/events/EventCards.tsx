import { Calendar, Globe, MapPin, Star } from "lucide-react";

import { DiscoveryListThumb } from "@/components/discovery/DiscoveryListThumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  categoryLabel,
  EVENT_CATEGORY_STYLES,
  parseCalendarDate,
} from "@/lib/discoveryFormatters";
import type { EventRecord } from "@/lib/eventsApi";
import { normalizeImageUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

function eventDateLabel(item: EventRecord): string {
  if (item.dateText) return item.dateText;
  if (item.startAt) {
    return new Date(item.startAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return "Date TBD";
}

interface EventDateChipProps {
  item: EventRecord;
  className?: string;
}

export function EventDateChip({ item, className }: EventDateChipProps) {
  const parts = parseCalendarDate(item.startAt, item.dateText);

  if (!parts) {
    return (
      <div
        className={cn(
          "flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-border/60 bg-muted/40",
          className,
        )}
      >
        <Calendar className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-border/60 bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
        {parts.month}
      </span>
      <span className="text-xl font-bold tabular-nums leading-none text-foreground">
        {parts.day}
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
        {parts.weekday}
      </span>
    </div>
  );
}

interface EventBentoCardProps {
  item: EventRecord;
  isSaved: boolean;
  featured?: boolean;
  onSelect: () => void;
  onToggleSaved: () => void;
}

export function EventBentoCard({
  item,
  isSaved,
  featured = false,
  onSelect,
  onToggleSaved,
}: EventBentoCardProps) {
  const organizer = item.organizer || item.source || "Organizer";
  const categoryStyle = EVENT_CATEGORY_STYLES[item.category];
  const thumb = normalizeImageUrl(item.thumbnailUrl);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/50 transition-all duration-500",
        "hover:-translate-y-1 hover:border-primary/25 hover:shadow-elevated",
        isSaved && "ring-1 ring-primary/20",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex h-full min-h-0 w-full flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div
          className={cn(
            "relative shrink-0 overflow-hidden",
            featured ? "h-52 sm:h-56" : "h-44",
          )}
        >
          {thumb ? (
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={cn(
                "flex h-full w-full items-center justify-center bg-gradient-to-br",
                categoryStyle.accent,
              )}
            >
              <DiscoveryListThumb
                imageUrl={null}
                label={organizer}
                className="h-16 w-16"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute left-4 top-4">
            <EventDateChip item={item} />
          </div>
          <div className="absolute right-4 top-4">
            <Badge variant="outline" className={categoryStyle.badge}>
              {categoryLabel(item.category)}
            </Badge>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-5 pb-14">
          <div className="shrink-0">
            <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {organizer}
            </p>
            <h2
              className={cn(
                "mt-1 line-clamp-2 font-semibold leading-snug tracking-tight text-foreground",
                featured ? "min-h-[3.5rem] text-xl sm:text-2xl" : "min-h-[3rem] text-lg",
              )}
            >
              {item.title}
            </h2>
          </div>
          <p className="line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-muted-foreground">
            {item.description || eventDateLabel(item)}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              {eventDateLabel(item)}
            </span>
            <span className="inline-flex items-center gap-1">
              {item.isOnline ? (
                <>
                  <Globe className="h-3.5 w-3.5" aria-hidden />
                  Online
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {item.location || "Location TBD"}
                </>
              )}
            </span>
          </div>
        </div>
      </button>

      <Button
        type="button"
        size="icon"
        variant="ghost"
        className={cn(
          "absolute bottom-4 right-4 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm",
          isSaved && "text-primary",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSaved();
        }}
        aria-label={isSaved ? "Remove from saved" : "Save event"}
        aria-pressed={isSaved}
      >
        <Star className={cn("h-4 w-4", isSaved && "fill-current")} />
      </Button>
    </article>
  );
}
