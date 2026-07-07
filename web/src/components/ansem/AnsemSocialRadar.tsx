import { ExternalLink, MessageCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AnsemListRowSkeleton,
  AnsemSectionHeaderSkeleton,
  AnsemTileGridSkeleton,
} from "@/components/ansem/ansemSkeletons";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import type { AnsemCommunityPayload } from "@/lib/ansemCommunityApi";
import { formatRelativeTime } from "@/lib/agentWalletUi";
import { cn } from "@/lib/utils";
import { AnsemSectionHeader } from "@/components/ansem/AnsemSectionHeader";

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function promotionLabel(type: string): { text: string; className: string } {
  if (type === "direct") {
    return { text: "Shill", className: "border-emerald-500/40 text-emerald-500" };
  }
  if (type === "warning") {
    return { text: "Warning", className: "border-red-500/40 text-red-500" };
  }
  return { text: "Mention", className: "text-muted-foreground" };
}

export function AnsemSocialRadar({
  community,
  isLoading,
  className,
}: {
  community?: AnsemCommunityPayload | null;
  isLoading: boolean;
  className?: string;
}) {
  const kol = community?.kol ?? null;
  const kolError = community?.kolError;
  const summary = kol?.summary;
  const topKols = kol?.topKols ?? [];

  if (isLoading && !community) {
    return (
      <section className={cn("min-w-0 space-y-4", className)}>
        <AnsemSectionHeaderSkeleton />
        <div className={cn(overviewCardShell, "space-y-4 p-5 sm:p-6")}>
          <AnsemTileGridSkeleton count={3} className="lg:grid-cols-3" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <AnsemListRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("min-w-0 space-y-4", className)}>
      <AnsemSectionHeader
        kicker="Social radar"
        title="KOL radar"
        description="Who's talking about $ANSEM on X — cached server-side, refreshed every 15 minutes."
      />

      <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
        {kolError && !kol ? (
          <p className="text-sm text-muted-foreground">KOL data unavailable{kolError ? `: ${kolError}` : ""}</p>
        ) : null}

        {summary ? (
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/40 bg-background/30 p-3">
              <p className={overviewKickerClass}>Accounts</p>
              <p className="font-mono text-xl font-semibold tabular-nums">
                {summary.totalAccountsFound.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/30 p-3">
              <p className={overviewKickerClass}>Combined reach</p>
              <p className="font-mono text-xl font-semibold tabular-nums">
                {formatFollowers(summary.combinedReach)}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-background/30 p-3">
              <p className={overviewKickerClass}>Sentiment</p>
              <p className="text-sm font-medium capitalize text-foreground">
                {summary.overallSentiment || "—"}
              </p>
            </div>
          </div>
        ) : null}

        {!kolError && topKols.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">No recent X posts indexed yet — check back soon.</p>
          </div>
        ) : null}

        {topKols.length > 0 ? (
          <ul className="space-y-3">
            {topKols.slice(0, 8).map((kolRow) => {
              const post = kolRow.sampleTweet;
              const badge = promotionLabel(kolRow.promotionType);
              return (
                <li
                  key={kolRow.username || kolRow.rank}
                  className="rounded-xl border border-border/40 bg-background/20 p-4 transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-start gap-3">
                    {kolRow.profileImageUrl ? (
                      <img
                        src={kolRow.profileImageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full border border-border/50 object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50">
                        <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                      </span>
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {kolRow.displayName || kolRow.username}
                        </span>
                        <span className="text-xs text-muted-foreground">@{kolRow.username}</span>
                        {kolRow.verified ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Verified
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className={cn("text-[10px]", badge.className)}>
                          {badge.text}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          · {formatFollowers(kolRow.followers)} followers
                        </span>
                      </div>
                      {post ? (
                        <>
                          <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">{post.text}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatRelativeTime(post.createdAt)}</span>
                            <span>{post.engagement.toLocaleString()} engagement</span>
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              View post
                              <ExternalLink className="h-3 w-3" aria-hidden />
                            </a>
                          </div>
                        </>
                      ) : (
                        <a
                          href={`https://x.com/${kolRow.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View profile
                          <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
