import { useState } from "react";
import { Loader2, RefreshCw, Search, Trophy } from "lucide-react";
import { AdminDashboardGate } from "@/components/dashboard/AdminDashboardGate";
import { HackathonCard } from "@/components/hackathon/HackathonCard";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useHackathonLatestRun,
  useHackathons,
  useRunHackathonScout,
} from "@/hooks/useHackathons";
import { HACKATHON_STATUSES, HACKATHON_STATUS_LABELS } from "@/lib/hackathonsApi";
import { cn } from "@/lib/utils";

type RegionFilter = "all" | "indonesia" | "global";

function formatRunTime(iso: string | undefined): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function HackathonPage() {
  const [status, setStatus] = useState<string>("all");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [search, setSearch] = useState("");

  const listQ = useHackathons({ status, region, search: search || undefined, limit: 50 });
  const runQ = useHackathonLatestRun();
  const scrapeM = useRunHackathonScout();

  const counts = listQ.data?.counts ?? {};
  const items = listQ.data?.items ?? [];
  const lastRun = runQ.data?.data;

  return (
    <AdminDashboardGate featureLabel="Hackathon tracker">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Trophy className="h-6 w-6 text-primary" aria-hidden />
              Hackathon tracker
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Technology hackathons in Indonesia and worldwide — scraped daily from Devpost and web
              search. Flag status and notes for your team.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 shrink-0"
            disabled={scrapeM.isPending}
            onClick={() => scrapeM.mutate()}
          >
            {scrapeM.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Run scrape now
          </Button>
        </div>

        <div className={cn(overviewCardShell, "flex flex-wrap items-center gap-3 p-4 text-xs text-muted-foreground")}>
          <span>
            Last run: <strong className="text-foreground">{formatRunTime(lastRun?.ranAt ?? runQ.data?.savedAt)}</strong>
          </span>
          {lastRun ? (
            <>
              <span>·</span>
              <span>
                New <strong className="text-foreground">{lastRun.totalNew}</strong>
              </span>
              <span>·</span>
              <span>
                Updated <strong className="text-foreground">{lastRun.totalUpdated}</strong>
              </span>
              <span>·</span>
              <span>
                Devpost {lastRun.devpost.globalFetched + lastRun.devpost.indonesiaFetched} sampled
              </span>
              {lastRun.exa.exaConfigured ? (
                <>
                  <span>·</span>
                  <span>Exa {lastRun.exa.hitsSampled} hits</span>
                </>
              ) : null}
            </>
          ) : null}
          {scrapeM.isSuccess && scrapeM.data?.data ? (
            <span className="text-emerald-600">
              · Scrape done — {scrapeM.data.data.totalNew} new
            </span>
          ) : null}
          {scrapeM.isError ? (
            <span className="text-destructive">· {(scrapeM.error as Error).message}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "indonesia", "global"] as const).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={region === r ? "default" : "outline"}
                onClick={() => setRegion(r)}
              >
                {r === "all" ? "All regions" : r === "indonesia" ? "Indonesia" : "Global"}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              className="pl-9"
              placeholder="Search title, organizer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={status === "all" ? "default" : "outline"}
            onClick={() => setStatus("all")}
          >
            All ({counts.all ?? 0})
          </Button>
          {HACKATHON_STATUSES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "outline"}
              onClick={() => setStatus(s)}
            >
              {HACKATHON_STATUS_LABELS[s]} ({counts[s] ?? 0})
            </Button>
          ))}
        </div>

        {listQ.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
            Loading hackathons…
          </div>
        ) : listQ.isError ? (
          <div className={cn(overviewCardShell, "p-8 text-center text-sm text-destructive")}>
            {(listQ.error as Error).message}
          </div>
        ) : items.length === 0 ? (
          <div className={cn(overviewCardShell, "p-12 text-center text-sm text-muted-foreground")}>
            No hackathons match your filters. Run a scrape to discover events.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Showing {items.length} of {listQ.data?.total ?? 0}
            </p>
            {items.map((h) => (
              <HackathonCard key={h._id} hackathon={h} />
            ))}
          </div>
        )}
      </div>
    </AdminDashboardGate>
  );
}
