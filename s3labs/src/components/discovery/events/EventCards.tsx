import { Calendar, Globe, MapPin, Star } from "lucide-react";

import { DiscoveryListThumb } from "@/components/discovery/DiscoveryListThumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveCountdown } from "@/components/ui/LiveCountdown";
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
          "flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-border/50 bg-background/85 backdrop-blur-md",
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
        "flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-border/50 bg-background/85 backdrop-blur-md",
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
        {parts.month}
      </span>
      <span className="text-xl font-semibold tabular-nums leading-none text-foreground">
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

  if (featured) {
    return (
      <article
        className={cn(
          "group relative overflow-hidden rounded-[1.75rem] border border-primary/20",
          "bg-gradient-to-br from-primary/[0.07] via-card/80 to-card/55 shadow-elevated",
          "transition-[transform,border-color,box-shadow] duration-300 ease-out",
          "hover:-translate-y-0.5 hover:border-primary/35",
          isSaved && "ring-1 ring-primary/20",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-40"
          aria-hidden
        />
        <div className="relative grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <button
            type="button"
            onClick={onSelect}
            className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[280px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {thumb ? (
              <img
                src={thumb}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
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
                  className="h-20 w-20"
                />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-background/40" />
            <div className="absolute left-4 top-4">
              <EventDateChip item={item} />
            </div>
          </button>

          <div className="relative flex flex-col p-6 sm:p-8">
            <p className="eyebrow mb-3">
              <Calendar className="h-4 w-4" aria-hidden />
              Featured event
            </p>
            <button
              type="button"
              onClick={onSelect}
              className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
            >
              <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {organizer}
              </p>
              <h2 className="mt-1 text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
                {item.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.description || eventDateLabel(item)}
              </p>
            </button>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={categoryStyle.badge}>
                {categoryLabel(item.category)}
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {eventDateLabel(item)}
              </span>
              {item.startAt && new Date(item.startAt).getTime() > Date.now() ? (
                <LiveCountdown
                  endAt={item.startAt}
                  compact
                  showIcon={false}
                  className="text-xs text-muted-foreground"
                  expiredLabel="Started"
                />
              ) : null}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
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

            <div className="mt-auto flex items-center justify-between gap-3 pt-6">
              <Button
                variant="hero"
                className="rounded-full"
                onClick={onSelect}
              >
                View event
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
                aria-label={isSaved ? "Remove from saved" : "Save event"}
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
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/55 bg-card/55",
        "shadow-card transition-[transform,border-color,box-shadow] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated",
        isSaved && "ring-1 ring-primary/20",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex h-full min-h-0 w-full flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative h-44 shrink-0 overflow-hidden">
          {thumb ? (
            <img
              src={thumb}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
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
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
          <div className="absolute left-3.5 top-3.5">
            <EventDateChip item={item} />
          </div>
          <div className="absolute right-3.5 top-3.5">
            <Badge variant="outline" className={cn("backdrop-blur-md bg-background/70", categoryStyle.badge)}>
              {categoryLabel(item.category)}
            </Badge>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-5 pb-14">
          <div className="shrink-0">
            <p className="truncate text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {organizer}
            </p>
            <h2 className="mt-1 line-clamp-2 min-h-[3rem] text-lg font-semibold leading-snug tracking-tight text-foreground">
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
            {item.startAt && new Date(item.startAt).getTime() > Date.now() ? (
              <LiveCountdown
                endAt={item.startAt}
                compact
                showIcon={false}
                className="text-xs text-muted-foreground"
                expiredLabel="Started"
              />
            ) : null}
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
          "absolute bottom-4 right-4 h-9 w-9 rounded-full border border-border/40 bg-background/80 backdrop-blur-sm",
          isSaved && "text-primary border-primary/30",
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
