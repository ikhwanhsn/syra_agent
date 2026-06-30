import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Calendar,
  ExternalLink,
  EyeOff,
  Gift,
  Globe,
  MapPin,
  Star,
  Trophy,
} from "lucide-react";

import { CountdownDisplay } from "@/components/discovery/hackathons/HackathonCards";
import { DiscoveryDetailShell } from "@/components/discovery/DiscoveryDetailShell";
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
import { useHackathonSaves } from "@/hooks/useDiscoverySaves";
import {
  formatPrizeAmount,
  openStateLabel,
} from "@/lib/discoveryFormatters";
import {
  patchHackathon,
  type HackathonRecord,
  type HackathonStatus,
} from "@/lib/hackathonApi";
import { isAdminWallet } from "@/lib/adminWallet";
import { cn } from "@/lib/utils";

const HACKATHON_STATUSES: HackathonStatus[] = [
  "new",
  "interested",
  "joined",
  "in_progress",
  "submitted",
  "skipped",
  "archived",
];

function HackathonDetailContent({ hackathon }: { hackathon: HackathonRecord }) {
  const navigate = useNavigate();
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);
  const queryClient = useQueryClient();
  const { toggleFlag, getFlags } = useHackathonSaves();
  const flags = getFlags(hackathon._id);
  const [notesDraft, setNotesDraft] = useState(hackathon.notes ?? "");
  const prize = formatPrizeAmount(hackathon.prizePool, hackathon.prizeAmountUsd);
  const applyUrl = hackathon.applicationUrl || hackathon.url;
  const isOpen = hackathon.openState === "open";

  const patchMutation = useMutation({
    mutationFn: (patch: { status?: HackathonStatus; notes?: string }) =>
      patchHackathon(address!, hackathon._id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hackathons"] });
    },
  });

  const handleHide = () => {
    toggleFlag(hackathon._id, "hidden");
    void navigate("/hackathon");
  };

  const applyCta = applyUrl ? (
    <Button variant="hero" className="w-full gap-2 rounded-xl" asChild>
      <a href={applyUrl} target="_blank" rel="noopener noreferrer">
        Open application page
        <ExternalLink className="h-4 w-4" aria-hidden />
      </a>
    </Button>
  ) : null;

  return (
    <DiscoveryDetailShell
      backHref="/hackathon"
      backLabel="Back to hackathons"
      stickyCta={applyCta ?? undefined}
      hero={
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.1] via-card/80 to-card/50 p-6 sm:p-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
            aria-hidden
          />
          <div className="relative">
            <p className="eyebrow mb-4">
              <Trophy className="h-4 w-4" aria-hidden />
              Hackathon arena
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {hackathon.title}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              {hackathon.organizer || hackathon.source}
            </p>
            <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/[0.06] p-5 sm:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Prize pool
              </p>
              <p className="mt-2 font-mono text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {prize}
              </p>
              <div className="mt-4">
                <CountdownDisplay deadline={hackathon.deadline} />
              </div>
            </div>
          </div>
        </div>
      }
      sidebar={
        <div className="panel-glass space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            {openStateLabel(hackathon.openState) ? (
              <Badge
                variant="outline"
                className={cn(
                  isOpen
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "",
                )}
              >
                {openStateLabel(hackathon.openState)}
              </Badge>
            ) : null}
            <Badge variant="outline" className="gap-1">
              {hackathon.isIndonesia ? (
                "Indonesia"
              ) : (
                <>
                  <Globe className="h-3 w-3" aria-hidden />
                  Global
                </>
              )}
            </Badge>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Deadline</dt>
                <dd className="mt-0.5 font-medium">{hackathon.deadline || "Not listed"}</dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Prize pool</dt>
                <dd className="mt-0.5 font-mono font-medium">{prize}</dd>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <dt className="text-xs text-muted-foreground">Location</dt>
                <dd className="mt-0.5 font-medium">
                  {hackathon.location || "Online / TBD"}
                </dd>
              </div>
            </div>
          </dl>

          {isAdmin ? (
            <div className="space-y-4 border-t border-border/50 pt-4">
              <div className="space-y-2">
                <Label>Pipeline status</Label>
                <Select
                  value={hackathon.status}
                  onValueChange={(v) => patchMutation.mutate({ status: v as HackathonStatus })}
                  disabled={patchMutation.isPending}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HACKATHON_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hackathon-notes">Internal notes</Label>
                <Textarea
                  id="hackathon-notes"
                  rows={4}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Team notes…"
                />
                <Button
                  variant="hero"
                  size="sm"
                  className="rounded-lg"
                  disabled={patchMutation.isPending || notesDraft === (hackathon.notes ?? "")}
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
              onClick={() => toggleFlag(hackathon._id, "saved")}
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

          {applyCta ? <div className="hidden lg:block">{applyCta}</div> : null}
        </div>
      }
    >
      {hackathon.description ? (
        <section className="panel-glass p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">About this hackathon</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
            {hackathon.description}
          </p>
        </section>
      ) : null}

      {hackathon.themes.length > 0 ? (
        <section className="panel-glass p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Themes</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {hackathon.themes.map((theme) => (
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

export default function HackathonDetail() {
  const { record, isLoading, isNotFound } =
    useDiscoveryDetail<HackathonRecord>("hackathons");

  if (isLoading) {
    return (
      <DiscoveryDetailShell
        backHref="/hackathon"
        backLabel="Back to hackathons"
        isLoading
      />
    );
  }

  if (isNotFound || !record) {
    return (
      <DiscoveryDetailShell
        backHref="/hackathon"
        backLabel="Back to hackathons"
        notFound={{
          title: "Hackathon not found",
          description: "This hackathon may have been removed or the link is outdated.",
        }}
      />
    );
  }

  return <HackathonDetailContent hackathon={record} />;
}
