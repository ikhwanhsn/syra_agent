import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ExternalLink, Megaphone, Search } from "lucide-react";
import { useState } from "react";
import { playgroundStaggerStyle, playgroundTabPanelEnter } from "@/components/playground/playgroundMotion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  fetchCampaigns,
  fetchKolStats,
  getKolRewardSol,
  S3LABS_KOL_URL,
  type KolCampaign,
} from "@/lib/kolApi";
import { formatTimeLeft } from "@/lib/kolFormat";
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

function formatCardSol(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 10) return n.toFixed(1);
  if (n >= 1) return n.toFixed(2);
  if (n > 0) return n.toFixed(3);
  return "0";
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
  const href = campaignHref(campaign.id);

  return (
    <li
      className={cn(
        "group relative list-none overflow-hidden rounded-[1.35rem]",
        "border border-border/40 bg-card/40",
        "shadow-[0_1px_0_0_hsl(var(--border)/0.35)]",
        "transition-[border-color,box-shadow,transform,background-color] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-border/70 hover:bg-card/70",
        "hover:shadow-[0_1px_0_0_hsl(var(--border)/0.4),0_24px_48px_-32px_rgba(0,0,0,0.45)]",
        "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
      )}
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent"
        aria-hidden
      />

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0 z-0 rounded-[1.35rem] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`Join ${campaign.title}`}
      />

      <div className="relative z-[1] flex flex-col gap-5 p-5 pointer-events-none sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/30 bg-muted/20 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <Megaphone className="h-6 w-6 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground line-clamp-1">
                  {campaign.title}
                </h3>
                <p className="mt-0.5 text-[13px] font-medium tracking-wide text-muted-foreground">
                  {shortHandle(campaign.sourceAuthorHandle)}
                  {endingSoon ? (
                    <>
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="text-amber-700 dark:text-amber-400">Ending soon</span>
                    </>
                  ) : null}
                </p>
              </div>
              <span className="shrink-0 pt-1 text-[11px] tabular-nums text-muted-foreground/80">
                {campaign.submissionCount ?? 0} posts
              </span>
            </div>
          </div>
        </div>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {campaign.description?.trim() ||
            campaign.sourceTweetText?.trim() ||
            "Promote on X and earn a share of the reward pool."}
        </p>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {formatCardSol(rewardSol)}
              <span className="ml-1.5 text-sm font-medium text-muted-foreground">SOL</span>
            </p>
            <p className="shrink-0 text-[13px] font-medium tabular-nums text-muted-foreground">
              {formatTimeLeft(campaign.endAt)}
            </p>
          </div>
        </div>

        <div className="pointer-events-auto mt-auto flex items-center justify-end pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-9 gap-1.5 rounded-full px-3.5 text-[13px] text-muted-foreground hover:text-foreground"
            asChild
          >
            <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              Join
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
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

export function EarnKolPanel({}: EarnKolPanelProps) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("reward");

  const campaignsQ = useQuery({
    queryKey: ["earn", "kol-campaigns", "active"],
    queryFn: () => fetchCampaigns("active"),
    staleTime: 60_000,
  });

  useQuery({
    queryKey: ["earn", "kol-stats"],
    queryFn: fetchKolStats,
    staleTime: 60_000,
  });

  const campaigns = campaignsQ.data?.campaigns ?? [];
  const showSkeleton = useMinimumSkeleton(campaignsQ.isLoading);
  const q = search.trim().toLowerCase();

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

  return (
    <section className={cn("space-y-8", playgroundTabPanelEnter)}>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-lg">
          <h2 className="font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2rem]">
            Promote
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Funded campaigns on X.
          </p>
        </div>
        <Button
          className="h-11 shrink-0 gap-2 rounded-full px-5 text-[13px] font-medium shadow-sm"
          variant="outline"
          asChild
        >
          <a href={S3LABS_KOL_URL} target="_blank" rel="noreferrer">
            Marketplace
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className={cn(
              "h-11 rounded-full border-border/40 bg-muted/20 pl-10 pr-4 shadow-none",
              "placeholder:text-muted-foreground/50",
              "focus-visible:border-border/60 focus-visible:bg-background/80 focus-visible:ring-1 focus-visible:ring-foreground/10",
            )}
            aria-label="Search campaigns"
          />
        </div>

        <div
          className="inline-flex rounded-full border border-border/40 bg-muted/15 p-1"
          role="listbox"
          aria-label="Sort"
        >
          {(
            [
              { value: "reward" as const, label: "Reward" },
              { value: "ending" as const, label: "Ending" },
              { value: "activity" as const, label: "Active" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={sortMode === opt.value}
              className={cn(
                "rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors",
                sortMode === opt.value
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setSortMode(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {showSkeleton ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[15.5rem] animate-pulse rounded-[1.35rem] border border-border/30 bg-muted/15"
              style={playgroundStaggerStyle(i)}
            />
          ))}
        </div>
      ) : campaignsQ.isError ? (
        <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
          <p className="font-display text-lg font-semibold tracking-tight">Couldn’t load campaigns</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Try again in a moment.</p>
          <Button className="mt-6 rounded-full" variant="outline" onClick={() => void campaignsQ.refetch()}>
            Retry
          </Button>
        </div>
      ) : visibleCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/40 bg-muted/20">
            <Megaphone className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">
            {q ? "No matches" : "No live campaigns"}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {q ? "Try a different search." : "Check the marketplace for new campaigns."}
          </p>
          {q ? (
            <Button className="mt-6 rounded-full" variant="outline" onClick={() => setSearch("")}>
              Clear
            </Button>
          ) : (
            <Button className="mt-6 gap-1.5 rounded-full" asChild>
              <a href={S3LABS_KOL_URL} target="_blank" rel="noreferrer">
                Marketplace
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCampaigns.map((campaign, index) => (
            <KolCampaignCard key={campaign.id} campaign={campaign} staggerIndex={index} />
          ))}
        </ul>
      )}
    </section>
  );
}
