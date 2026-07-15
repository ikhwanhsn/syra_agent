import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Clock3,
  Coins,
  ExternalLink,
  Megaphone,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { playgroundStaggerStyle, playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import {
  playgroundApiCardClass,
  playgroundChipClass,
  playgroundEmptyStateClass,
  playgroundFilterRailClass,
  playgroundHeroCard,
  playgroundHeroGlow,
  playgroundSearchClass,
  playgroundStatLabel,
  playgroundStatTile,
  playgroundStatValue,
  playgroundToolbarClass,
} from "@/components/playground/playgroundStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  fetchCampaigns,
  fetchKolStats,
  fetchWalletEarnings,
  getKolRewardSol,
  S3LABS_KOL_URL,
  type KolCampaign,
} from "@/lib/kolApi";
import { formatSol, formatTimeLeft } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

type SortMode = "reward" | "ending" | "activity";

function campaignHref(campaignId: string): string {
  return `${S3LABS_KOL_URL}?campaign=${encodeURIComponent(campaignId)}`;
}

function shortHandle(handle: string | null | undefined): string {
  if (!handle?.trim()) return "Campaign";
  return handle.startsWith("@") ? handle : `@${handle}`;
}

function timeLeftMs(endAt: string | null): number {
  if (!endAt) return Number.POSITIVE_INFINITY;
  return new Date(endAt).getTime() - Date.now();
}

function KolCampaignCard({
  campaign,
  staggerIndex = 0,
}: {
  campaign: KolCampaign;
  staggerIndex?: number;
}) {
  const rewardSol = getKolRewardSol(campaign);
  const endingSoon = timeLeftMs(campaign.endAt) > 0 && timeLeftMs(campaign.endAt) < 24 * 60 * 60 * 1000;

  return (
    <li
      className={cn(
        playgroundApiCardClass(false),
        "list-none animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
      )}
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-500/[0.07] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="inline-flex rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
              Live
            </span>
            {endingSoon ? (
              <span className="inline-flex rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-800 ring-1 ring-amber-500/20 dark:text-amber-300">
                Ending soon
              </span>
            ) : null}
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1 text-[11px] font-medium tabular-nums text-muted-foreground ring-1 ring-border/40"
            title="Submissions"
          >
            <Users className="h-3 w-3" aria-hidden />
            {campaign.submissionCount ?? 0}
          </span>
        </div>

        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/40 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.35)]">
            <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[15px] font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
              {campaign.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {campaign.description?.trim() ||
                campaign.sourceTweetText?.trim() ||
                "Promote on X and earn a share of the reward pool."}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.3)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Reward pool</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
              {formatSol(rewardSol)} <span className="text-xs font-medium text-muted-foreground">SOL</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.3)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Time left</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{formatTimeLeft(campaign.endAt)}</span>
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-3">
          <p className="min-w-0 truncate text-[11px] text-muted-foreground/90" title={campaign.sourceAuthorHandle ?? undefined}>
            {shortHandle(campaign.sourceAuthorHandle)}
            {campaign.sourceAuthorVerified ? " · Verified" : ""}
          </p>
          <Button size="sm" className="h-9 gap-1.5 rounded-xl px-3.5 shadow-sm" asChild>
            <a href={campaignHref(campaign.id)} target="_blank" rel="noreferrer">
              Join
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </li>
  );
}

type EarnKolPanelProps = {
  walletAddress: string | null;
  connected: boolean;
};

export function EarnKolPanel({ walletAddress, connected }: EarnKolPanelProps) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("reward");

  const campaignsQ = useQuery({
    queryKey: ["earn", "kol-campaigns", "active"],
    queryFn: () => fetchCampaigns("active"),
    staleTime: 60_000,
  });

  const statsQ = useQuery({
    queryKey: ["earn", "kol-stats"],
    queryFn: fetchKolStats,
    staleTime: 60_000,
  });

  const earningsQ = useQuery({
    queryKey: ["earn", "kol-earnings", walletAddress],
    queryFn: () => fetchWalletEarnings(walletAddress!),
    enabled: Boolean(walletAddress),
    staleTime: 30_000,
  });

  const campaigns = campaignsQ.data?.campaigns ?? [];
  const showSkeleton = useMinimumSkeleton(campaignsQ.isLoading);
  const q = search.trim().toLowerCase();

  const poolTotal = campaigns.reduce((sum, c) => sum + getKolRewardSol(c), 0);

  const visibleCampaigns = [...campaigns]
    .filter((c) => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.sourceTweetText.toLowerCase().includes(q) ||
        (c.sourceAuthorHandle ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortMode === "ending") return timeLeftMs(a.endAt) - timeLeftMs(b.endAt);
      if (sortMode === "activity") return (b.submissionCount ?? 0) - (a.submissionCount ?? 0);
      return getKolRewardSol(b) - getKolRewardSol(a);
    });

  const activeSubmissions = earningsQ.data?.active?.slice(0, 3) ?? [];

  return (
    <section className={cn("space-y-5", playgroundTabPanelEnter)}>
      <div className={playgroundHeroCard}>
        <div className={cn(overviewCardGlow, playgroundHeroGlow)} aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className={overviewKickerClass}>Earn · Promote</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Promote on X
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Join funded campaigns, post on X, and earn SOL when the pool settles. Browse live rewards below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Live</p>
              <p className={playgroundStatValue}>
                {statsQ.data?.activeCampaigns ?? campaigns.length}
              </p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Open pool</p>
              <p className={playgroundStatValue}>{formatSol(poolTotal, 2)}</p>
            </div>
            <div className={playgroundStatTile}>
              <p className={playgroundStatLabel}>Paid all-time</p>
              <p className={playgroundStatValue}>
                {formatSol(statsQ.data?.totalPaidSol ?? 0, 2)}
              </p>
            </div>
            <Button className="h-11 gap-1.5 rounded-xl px-4 shadow-sm" variant="outline" asChild>
              <a href={S3LABS_KOL_URL} target="_blank" rel="noreferrer">
                Marketplace
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      {connected ? (
        <div className={cn(overviewCardShell, "grid gap-3 p-4 sm:grid-cols-2 sm:p-5")}>
          <div className="rounded-xl border border-border/40 bg-background/45 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your projected</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight">
              {formatSol(earningsQ.data?.totals.projectedSol ?? 0)}{" "}
              <span className="text-sm font-medium text-muted-foreground">SOL</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-background/45 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your paid</p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight">
              {formatSol(earningsQ.data?.totals.paidSol ?? 0)}{" "}
              <span className="text-sm font-medium text-muted-foreground">SOL</span>
            </p>
          </div>
          {activeSubmissions.length > 0 ? (
            <div className="sm:col-span-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Active submissions
              </p>
              <ul className="space-y-2">
                {activeSubmissions.map(({ submission, campaign }) => (
                  <li
                    key={submission.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{campaign.title}</p>
                      <p className="text-xs text-muted-foreground">
                        @{submission.authorHandle} · score {(submission.latestScore ?? 0).toFixed(1)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                        {formatSol(submission.projectedSol)} SOL
                      </span>
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg px-2" asChild>
                        <a href={campaignHref(campaign.id)} target="_blank" rel="noreferrer">
                          View
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={cn(
            overviewCardShell,
            "flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <Coins className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Connect a wallet to track projected and paid SOL from your promotions.
            </p>
          </div>
        </div>
      )}

      <div className={playgroundToolbarClass}>
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns, handles, tweet copy…"
            className={playgroundSearchClass}
            aria-label="Search campaigns"
          />
        </div>
        <p className="text-xs tabular-nums text-muted-foreground sm:shrink-0">
          {visibleCampaigns.length} campaign{visibleCampaigns.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className={playgroundFilterRailClass} role="listbox" aria-label="Sort campaigns">
        {(
          [
            { value: "reward", label: "Highest reward" },
            { value: "ending", label: "Ending soon" },
            { value: "activity", label: "Most activity" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={sortMode === opt.value}
            className={playgroundChipClass(sortMode === opt.value)}
            onClick={() => setSortMode(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showSkeleton ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[17rem] animate-pulse rounded-2xl border border-border/40 bg-muted/20"
              style={playgroundStaggerStyle(i)}
            />
          ))}
        </div>
      ) : campaignsQ.isError ? (
        <div className={playgroundEmptyStateClass}>
          <p className="font-display text-lg font-semibold tracking-tight">Couldn’t load campaigns</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The promote marketplace is temporarily unavailable. Try again in a moment.
          </p>
          <Button className="mt-5 rounded-xl" variant="outline" onClick={() => void campaignsQ.refetch()}>
            Retry
          </Button>
        </div>
      ) : visibleCampaigns.length === 0 ? (
        <div className={playgroundEmptyStateClass}>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
            <Megaphone className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">
            {q ? "No matches" : "No live campaigns"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {q
              ? "Try a different search, or clear it to see every live campaign."
              : "Check the marketplace for new funded campaigns to promote."}
          </p>
          {q ? (
            <Button className="mt-5 rounded-xl" variant="outline" onClick={() => setSearch("")}>
              Clear search
            </Button>
          ) : (
            <Button className="mt-5 gap-1.5 rounded-xl" asChild>
              <a href={S3LABS_KOL_URL} target="_blank" rel="noreferrer">
                Open marketplace
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCampaigns.map((campaign, index) => (
            <KolCampaignCard key={campaign.id} campaign={campaign} staggerIndex={index} />
          ))}
        </ul>
      )}
    </section>
  );
}
