import { useState } from "react";
import { ExternalLink, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { HackathonStatusSelect } from "@/components/hackathon/HackathonStatusSelect";
import { useUpdateHackathon } from "@/hooks/useHackathons";
import type { Hackathon, HackathonStatus } from "@/lib/hackathonsApi";
import { cn } from "@/lib/utils";

interface HackathonCardProps {
  hackathon: Hackathon;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function HackathonCard({ hackathon }: HackathonCardProps) {
  const updateM = useUpdateHackathon();
  const [notes, setNotes] = useState(hackathon.notes);
  const [notesDirty, setNotesDirty] = useState(false);

  const link = hackathon.applicationUrl || hackathon.url;

  const handleStatusChange = (status: HackathonStatus) => {
    updateM.mutate({ id: hackathon._id, status });
  };

  const handleSaveNotes = () => {
    if (!notesDirty) return;
    updateM.mutate(
      { id: hackathon._id, notes },
      { onSuccess: () => setNotesDirty(false) },
    );
  };

  return (
    <article className={cn(overviewCardShell, "overflow-hidden p-5")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">
              {hackathon.source}
            </Badge>
            {hackathon.isIndonesia ? (
              <Badge className="bg-emerald-600/90 text-[10px] hover:bg-emerald-600/90">Indonesia</Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                Global
              </Badge>
            )}
            {hackathon.openState ? (
              <Badge variant="outline" className="text-[10px] capitalize">
                {hackathon.openState}
              </Badge>
            ) : null}
          </div>

          <h3 className="text-base font-semibold leading-snug text-foreground">{hackathon.title}</h3>

          {hackathon.organizer ? (
            <p className="text-sm text-muted-foreground">{hackathon.organizer}</p>
          ) : null}

          {hackathon.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground/90">{hackathon.description}</p>
          ) : null}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {hackathon.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {hackathon.location}
              </span>
            ) : null}
            {hackathon.submissionDates ? (
              <span>{hackathon.submissionDates}</span>
            ) : null}
            {hackathon.deadline ? <span>{hackathon.deadline}</span> : null}
            {hackathon.prizePool ? (
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                <Trophy className="h-3 w-3" aria-hidden />
                {hackathon.prizePool}
              </span>
            ) : null}
          </div>

          {hackathon.themes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hackathon.themes.slice(0, 6).map((theme) => (
                <Badge key={theme} variant="secondary" className="text-[10px] font-normal">
                  {theme}
                </Badge>
              ))}
            </div>
          ) : null}

          <p className="text-[11px] text-muted-foreground">
            Discovered {formatDate(hackathon.discoveredAt)}
            {hackathon.registrationsCount != null
              ? ` · ${hackathon.registrationsCount.toLocaleString()} registrations`
              : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:w-48">
          <HackathonStatusSelect
            value={hackathon.status}
            onChange={handleStatusChange}
            disabled={updateM.isPending}
          />
          {link ? (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                View event
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-border/50 pt-4 sm:flex-row sm:items-center">
        <Input
          className="h-8 text-sm"
          placeholder="Notes (team progress, links, contacts…)"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesDirty(e.target.value !== hackathon.notes);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveNotes();
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          className="shrink-0"
          disabled={!notesDirty || updateM.isPending}
          onClick={handleSaveNotes}
        >
          Save notes
        </Button>
      </div>
    </article>
  );
}
