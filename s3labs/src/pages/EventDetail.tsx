import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Calendar,
  ExternalLink,
  EyeOff,
  Globe,
  MapPin,
  Star,
  Tag,
} from "lucide-react";

import { DiscoveryDetailShell } from "@/components/discovery/DiscoveryDetailShell";
import { EventDateChip } from "@/components/discovery/events/EventCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDiscoveryDetail } from "@/hooks/useDiscoveryDetail";
import { useEventSaves } from "@/hooks/useDiscoverySaves";
import {
  categoryLabel,
  EVENT_CATEGORY_STYLES,
  formatDate,
} from "@/lib/discoveryFormatters";
import {
  patchEvent,
  type EventRecord,
  type EventStatus,
} from "@/lib/eventsApi";
import { isAdminWallet } from "@/lib/adminWallet";
import { normalizeImageUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

const EVENT_STATUSES: EventStatus[] = [
  "new",
  "interested",
  "registered",
  "attended",
  "skipped",
];

function EventDetailContent({ event }: { event: EventRecord }) {
  const navigate = useNavigate();
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);
  const queryClient = useQueryClient();
  const { toggleFlag, getFlags } = useEventSaves();
  const flags = getFlags(event._id);
  const [notesDraft, setNotesDraft] = useState(event.notes ?? "");
  const categoryStyle = EVENT_CATEGORY_STYLES[event.category];
  const cover = normalizeImageUrl(event.thumbnailUrl);

  const patchMutation = useMutation({
    mutationFn: (patch: { status?: EventStatus; notes?: string }) =>
      patchEvent(address!, event._id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const handleHide = () => {
    toggleFlag(event._id, "hidden");
    void navigate("/events");
  };

  const registerCta = (
    <Button variant="hero" className="w-full gap-2 rounded-xl" asChild>
      <a href={event.lumaUrl} target="_blank" rel="noopener noreferrer">
        Register on Luma
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
    </Button>
  );

  return (
    <DiscoveryDetailShell
      backHref="/events"
      backLabel="Back to events"
      stickyCta={registerCta}
      hero={
        <div className="relative overflow-hidden rounded-3xl border border-border/60">
          <div className="relative h-56 sm:h-72">
            {cover ? (
              <img
                src={cover}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={cn(
                  "flex h-full w-full items-center justify-center bg-gradient-to-br",
                  categoryStyle.accent,
                )}
              >
                <Calendar className="h-16 w-16 text-primary/60" aria-hidden />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <div className="flex flex-wrap items-end gap-4">
                <EventDateChip item={event} className="shadow-elevated" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {event.organizer || event.source}
                  </p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {event.title}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      sidebar={
        <div className="panel-glass space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={categoryStyle.badge}>
              {categoryLabel(event.category)}
            </Badge>
            <Badge variant="outline" className="gap-1">
              {event.isIndonesia ? (
                "Indonesia"
              ) : (
                <>
                  <Globe className="h-3 w-3" aria-hidden />
                  Global
                </>
              )}
            </Badge>
            {event.isOnline ? <Badge variant="outline">Online</Badge> : null}
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Date</dt>
                <dd className="mt-0.5 font-medium">
                  {event.dateText || formatDate(event.startAt) || "Not listed"}
                </dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd className="mt-0.5 font-medium">
                  {event.location || (event.isOnline ? "Online" : "Not listed")}
                </dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Category</dt>
                <dd className="mt-0.5 font-medium capitalize">{event.category}</dd>
              </div>
            </div>
          </dl>

          {isAdmin ? (
            <div className="space-y-4 border-t border-border/50 pt-4">
              <div className="space-y-2">
                <Label>Pipeline status</Label>
                <Select
                  value={event.status}
                  onValueChange={(v) => patchMutation.mutate({ status: v as EventStatus })}
                  disabled={patchMutation.isPending}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-notes">Internal notes</Label>
                <Textarea
                  id="event-notes"
                  rows={4}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Team notes…"
                />
                <Button
                  variant="hero"
                  size="sm"
                  className="rounded-lg"
                  disabled={patchMutation.isPending || notesDraft === (event.notes ?? "")}
                  onClick={() => patchMutation.mutate({ notes: notesDraft })}
                >
                  Save notes
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={flags.saved ? "default" : "outline"}
              size="sm"
              className="rounded-lg"
              onClick={() => toggleFlag(event._id, "saved")}
            >
              <Star className={cn("mr-1.5 h-4 w-4", flags.saved && "fill-current")} />
              {flags.saved ? "Saved" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg text-muted-foreground"
              onClick={handleHide}
            >
              <EyeOff className="mr-1.5 h-4 w-4" />
              Hide
            </Button>
          </div>

          <div className="hidden lg:block">{registerCta}</div>
        </div>
      }
    >
      {event.description ? (
        <section className="panel-glass p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">About this event</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {event.description}
          </p>
        </section>
      ) : null}

      {event.themes.length > 0 ? (
        <section className="panel-glass p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Themes</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {event.themes.map((theme) => (
              <Badge key={theme} variant="outline">
                {theme}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}
    </DiscoveryDetailShell>
  );
}

export default function EventDetail() {
  const { record, isLoading, isNotFound } = useDiscoveryDetail<EventRecord>("events");

  if (isLoading) {
    return (
      <DiscoveryDetailShell
        backHref="/events"
        backLabel="Back to events"
        isLoading
      />
    );
  }

  if (isNotFound || !record) {
    return (
      <DiscoveryDetailShell
        backHref="/events"
        backLabel="Back to events"
        notFound={{
          title: "Event not found",
          description: "This event may have been removed or the link is outdated.",
        }}
      />
    );
  }

  return <EventDetailContent event={record} />;
}
