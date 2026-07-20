import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Target,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { VerifyXAccountCard } from "@/components/kol/VerifyXAccountCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdminWallet } from "@/lib/adminWallet";
import {
  fetchMissions,
  KolApiError,
  submitMissionComment,
  syncMissions,
  type S3LabsMission,
} from "@/lib/kolApi";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatTweetDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatSubmitError(error: unknown): string {
  if (error instanceof KolApiError) {
    switch (error.code) {
      case "x_not_verified":
        return "Verify your X account before submitting.";
      case "invalid_tweet_url":
        return "Use a full X post link like https://x.com/handle/status/123…";
      case "handle_mismatch":
        return error.message;
      case "submission_not_related":
        return "Your post must be a reply or quote of this mission's X post.";
      case "duplicate_submission":
        return "You already completed this mission.";
      case "duplicate_post":
        return "This post was already used for a mission.";
      case "tweet_not_found":
        return "Could not find that X post. Check the link and try again.";
      case "twitterapi_unavailable":
      case "twitterapi_error":
        return "X lookup is temporarily unavailable. Try again in a minute.";
      default:
        return error.message;
    }
  }
  return error instanceof Error ? error.message : "Submission failed";
}

function buildReplyIntentUrl(tweetId: string): string {
  return `https://twitter.com/intent/tweet?in_reply_to=${encodeURIComponent(tweetId)}`;
}

function MissionCard({
  mission,
  wallet,
  canSubmit,
  onSubmitted,
}: {
  mission: S3LabsMission;
  wallet: string;
  canSubmit: boolean;
  onSubmitted: () => void;
}) {
  const [tweetUrl, setTweetUrl] = useState("");
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: () =>
      submitMissionComment({
        missionId: mission.id,
        wallet,
        tweetUrl: tweetUrl.trim(),
      }),
    onSuccess: (result) => {
      toast.success(`+${formatPoints(result.submission.pointsAwarded)} points earned`);
      setTweetUrl("");
      void queryClient.invalidateQueries({ queryKey: ["s3labs-missions"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-points", wallet] });
      onSubmitted();
    },
    onError: (error) => {
      toast.error(formatSubmitError(error));
    },
  });

  const isCompleted = mission.submitted;

  return (
    <article
      className={cn(
        "panel-glass rounded-2xl border p-4 sm:p-5 space-y-4 min-w-0 transition-colors",
        isCompleted ? "border-primary/30 bg-primary/[0.04]" : "border-border/60",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 font-normal">
              @{mission.authorHandle}
            </Badge>
            {mission.tweetCreatedAt ? (
              <span className="text-xs text-muted-foreground">
                {formatTweetDate(mission.tweetCreatedAt)}
              </span>
            ) : null}
          </div>
          <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap line-clamp-5">
            {mission.text || "View this post on X to see the mission."}
          </p>
        </div>
        {isCompleted ? (
          <Badge className="shrink-0 gap-1 bg-primary/15 text-primary border-primary/30 hover:bg-primary/15">
            <Check className="h-3 w-3" aria-hidden />
            +{formatPoints(mission.pointsAwarded || mission.pointsReward)}
          </Badge>
        ) : (
          <Badge variant="outline" className="shrink-0 tabular-nums">
            +{formatPoints(mission.pointsReward)} pts
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          {mission.likeCount}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          {mission.replyCount}
        </span>
        <a
          href={mission.tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          View on X
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
        {!isCompleted ? (
          <a
            href={buildReplyIntentUrl(mission.tweetId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            Reply on X
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : null}
        {isCompleted && mission.replyTweetUrl ? (
          <a
            href={mission.replyTweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            Your reply
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : null}
      </div>

      {isCompleted ? (
        <p className="text-sm text-muted-foreground" role="status">
          Mission completed. Points are already in your S3Labs balance.
        </p>
      ) : canSubmit ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!tweetUrl.trim() || submitMutation.isPending) return;
            submitMutation.mutate();
          }}
        >
          <Label htmlFor={`mission-url-${mission.id}`} className="text-xs text-muted-foreground">
            Paste your reply or quote link
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id={`mission-url-${mission.id}`}
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://x.com/you/status/…"
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              disabled={submitMutation.isPending}
              className="font-mono text-sm"
              aria-describedby={`mission-hint-${mission.id}`}
            />
            <Button
              type="submit"
              variant="hero"
              size="sm"
              className="rounded-full shrink-0 min-h-10"
              disabled={!tweetUrl.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                  Checking…
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
          <p id={`mission-hint-${mission.id}`} className="text-[11px] text-muted-foreground leading-relaxed">
            Reply or quote the mission post from your verified X account, then paste the link here.
          </p>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Link your X account above to submit a comment and earn points.
        </p>
      )}
    </article>
  );
}

function MissionsContent() {
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const queryClient = useQueryClient();
  const address = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(address);

  const missionsQuery = useQuery({
    queryKey: ["s3labs-missions", address],
    queryFn: () => fetchMissions({ wallet: address ?? undefined }),
    enabled: Boolean(address && wallet.connected),
    staleTime: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: () => syncMissions(address!, { limit: 1 }),
    onSuccess: (result) => {
      toast.success(
        `Synced ${result.fetched} posts (${result.created} new, ${result.updated} updated)`,
      );
      void queryClient.invalidateQueries({ queryKey: ["s3labs-missions"] });
    },
    onError: (error) => {
      const message =
        error instanceof KolApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Sync failed";
      toast.error(message);
    },
  });

  if (!wallet.connected || !address) {
    return (
      <div className={cn(pageContent, "pb-20 min-w-0")}>
        <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-10 text-center max-w-lg mx-auto mt-8 sm:mt-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <h1 className="heading-section text-2xl mb-2">S3Labs Missions</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your wallet to view missions and earn points by commenting on S3Labs posts.
          </p>
          <Button variant="hero" className="rounded-full" onClick={() => setVisible(true)}>
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  const data = missionsQuery.data;
  const missions = data?.missions ?? [];
  const canSubmit = Boolean(data?.walletVerified);

  return (
    <div className={cn(pageContent, "pb-20 space-y-8 sm:space-y-10 min-w-0")}>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
          <Link to="/profile">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Profile
          </Link>
        </Button>
      </div>

      <header className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl min-w-0">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/14 via-transparent to-primary/6"
          aria-hidden
        />
        <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-8 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="eyebrow">Earn points</p>
              <div className="flex items-center gap-2 min-w-0">
                <Target className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                <h1 className="heading-section text-xl min-[400px]:text-2xl sm:text-3xl">
                  S3Labs Missions
                </h1>
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
                Comment on the latest{" "}
                <a
                  href={`https://x.com/${encodeURIComponent(data?.handle ?? "s3labs_")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @{data?.handle ?? "s3labs_"}
                </a>{" "}
                posts, submit your reply link, and earn{" "}
                <span className="font-medium text-foreground">
                  {formatPoints(data?.pointsReward ?? 0.3)}
                </span>{" "}
                S3Labs Points per mission.
              </p>
            </div>
            {isAdmin ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full shrink-0 self-start min-h-10"
                disabled={syncMutation.isPending}
                onClick={() => syncMutation.mutate()}
              >
                {syncMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                )}
                Sync latest posts
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3 sm:px-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Completed
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {data?.completedCount ?? 0}
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  / {missions.length}
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-3 sm:px-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Mission points
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-primary">
                {formatPoints(data?.totalMissionPoints ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {!canSubmit ? (
        <section className="space-y-3 min-w-0" aria-labelledby="missions-verify-heading">
          <h2 id="missions-verify-heading" className="sr-only">
            Verify X account
          </h2>
          <p className="text-sm text-muted-foreground">
            Link your X account once so we can confirm your comments belong to you.
          </p>
          <VerifyXAccountCard
            onVerified={() => {
              void queryClient.invalidateQueries({ queryKey: ["s3labs-missions"] });
            }}
          />
        </section>
      ) : data?.xHandle ? (
        <p className="text-sm text-muted-foreground">
          Submitting as{" "}
          <span className="font-medium text-foreground">@{data.xHandle}</span>
        </p>
      ) : null}

      <section className="space-y-4 min-w-0" aria-labelledby="missions-list-heading">
        <h2 id="missions-list-heading" className="font-semibold text-base sm:text-lg tracking-tight">
          Open missions
        </h2>

        {missionsQuery.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : missionsQuery.isError ? (
          <div className="panel-glass rounded-2xl border border-destructive/30 p-6 sm:p-8 text-center space-y-4">
            <p className="font-medium">Could not load missions</p>
            <p className="text-sm text-muted-foreground">
              {missionsQuery.error instanceof Error
                ? missionsQuery.error.message
                : "Something went wrong."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => void missionsQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : missions.length === 0 ? (
          <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8 text-center space-y-4 min-w-0">
            <Target className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
            <div className="space-y-2">
              <p className="font-medium">No missions yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {isAdmin
                  ? "Sync the latest @s3labs_ posts to create missions for the community."
                  : "Check back soon — new missions appear when S3Labs posts on X."}
              </p>
            </div>
            {isAdmin ? (
              <Button
                type="button"
                variant="hero"
                className="rounded-full"
                disabled={syncMutation.isPending}
                onClick={() => syncMutation.mutate()}
              >
                {syncMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                    Syncing…
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden />
                    Sync latest posts
                  </>
                )}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                wallet={address}
                canSubmit={canSubmit}
                onSubmitted={() => undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const MissionsPage = () => (
  <SitePageShell>
    <MissionsContent />
  </SitePageShell>
);

export default MissionsPage;
