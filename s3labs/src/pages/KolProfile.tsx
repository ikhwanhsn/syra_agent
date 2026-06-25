import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Megaphone,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignGrid } from "@/components/kol/CampaignCard";
import { KolProfileAvatar } from "@/components/kol/KolProfileAvatar";
import { fetchKolProfile } from "@/lib/kolApi";
import { formatCompact, formatFollowers, formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 panel-glass p-4 sm:p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold tabular-nums mt-2">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground mt-1">{sub}</p> : null}
    </div>
  );
}

function KolProfileContent() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["kol-profile", username],
    queryFn: () => fetchKolProfile(username!),
    enabled: Boolean(username),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  const profile = profileQuery.data;

  return (
    <div className="relative z-[1] container pt-28 pb-20">
        <Link
          to="/kol"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to marketplace
        </Link>

        {profileQuery.isLoading ? (
          <ProfileSkeleton />
        ) : profileQuery.isError || !profile ? (
          <div className="panel-glass rounded-2xl border border-destructive/30 p-10 text-center">
            <p className="font-semibold text-lg">Profile not found</p>
            <p className="text-sm text-muted-foreground mt-2">
              No marketplace activity for @{username?.replace(/^@/, "") ?? "unknown"} yet.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-full">
              <Link to="/kol">Browse campaigns</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            <section className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 sm:items-start">
                <KolProfileAvatar
                  handle={profile.handle}
                  name={profile.name}
                  profilePicture={profile.profilePicture}
                  size="lg"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {profile.roles.includes("project") ? (
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="w-3 h-3" />
                        Project
                      </Badge>
                    ) : null}
                    {profile.roles.includes("kol") ? (
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        KOL
                      </Badge>
                    ) : null}
                  </div>

                  <h1 className="heading-display flex flex-wrap items-center gap-2">
                    <span>{profile.name}</span>
                    {profile.verified ? (
                      <BadgeCheck className="w-6 h-6 text-primary shrink-0" aria-label="Verified" />
                    ) : null}
                  </h1>

                  <p className="text-muted-foreground mt-1">@{profile.handle}</p>

                  {profile.followers != null ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      {formatFollowers(profile.followers)} followers on X
                      {profile.xProfileRefreshedAt ? (
                        <span className="text-border">
                          {" "}
                          · updated{" "}
                          {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                            new Date(profile.xProfileRefreshedAt),
                          )}
                        </span>
                      ) : null}
                    </p>
                  ) : null}

                  {profile.description ? (
                    <p className="text-sm text-muted-foreground mt-4 max-w-2xl leading-relaxed">
                      {profile.description}
                    </p>
                  ) : null}

                  <a
                    href={`https://x.com/${encodeURIComponent(profile.handle)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary mt-4 hover:underline"
                  >
                    View on X
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {profile.roles.includes("project") ? (
                <>
                  <StatTile
                    label="Campaigns"
                    value={String(profile.asProject.campaignCount)}
                    sub={`${profile.asProject.activeCampaignCount} active`}
                  />
                  <StatTile
                    label="Total funded"
                    value={`${formatSol(profile.asProject.totalFundedSol)} SOL`}
                    sub={`${formatSol(profile.asProject.totalKolPoolSol)} SOL KOL pool`}
                  />
                </>
              ) : null}
              {profile.roles.includes("kol") ? (
                <>
                  <StatTile
                    label="Reputation score"
                    value={profile.asKol.totalScore.toFixed(1)}
                    sub={`${profile.asKol.reputationScore.toFixed(1)} from ${profile.asKol.campaignsCompleted} completed · ${profile.asKol.activeScore.toFixed(1)} active`}
                  />
                  <StatTile
                    label="Earned"
                    value={`${formatSol(profile.asKol.earnedSol)} SOL`}
                    sub={
                      profile.asKol.projectedSol > 0
                        ? `${formatSol(profile.asKol.projectedSol)} SOL projected`
                        : "Confirmed payouts"
                    }
                  />
                  <StatTile
                    label="Engagement"
                    value={formatCompact(profile.asKol.engagement.total)}
                    sub={`${formatCompact(profile.asKol.engagement.views)} views`}
                  />
                  <StatTile
                    label="Campaigns joined"
                    value={String(profile.asKol.campaignCount)}
                  />
                </>
              ) : null}
            </section>

            {profile.asProject.campaigns.length > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-lg">Campaigns created</h2>
                </div>
                <CampaignGrid
                  campaigns={profile.asProject.campaigns.map((c) => ({
                    ...c,
                    submissionCount: c.submissionCount ?? 0,
                  }))}
                  onSelect={(id) => navigate(`/kol?campaign=${encodeURIComponent(id)}`)}
                />
              </section>
            ) : null}

            {profile.asKol.engagements.length > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-lg">KOL engagements</h2>
                </div>
                <div className="grid gap-3">
                  {profile.asKol.engagements.map((row) => (
                    <article
                      key={row.submission.id}
                      className="panel-glass rounded-xl border border-border/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {row.campaign?.title ?? "Campaign"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {row.submission.mode} · score{" "}
                          {(row.submission.finalScore ?? row.submission.latestScore).toFixed(1)}
                          {row.submission.reputationCreditedAt ? " · credited" : ""} ·{" "}
                          {formatCompact(
                            row.submission.latestMetrics.likeCount +
                              row.submission.latestMetrics.retweetCount +
                              row.submission.latestMetrics.viewCount,
                          )}{" "}
                          engagement
                        </p>
                        <a
                          href={row.submission.tweetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline"
                        >
                          View post
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "font-semibold tabular-nums",
                            row.payout ? "text-foreground" : "text-primary",
                          )}
                        >
                          {formatSol(
                            row.payout?.sol ?? row.submission.projectedSol,
                          )}{" "}
                          SOL
                        </p>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {row.payout ? "paid" : "projected"}
                        </Badge>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
    </div>
  );
}

const KolProfile = () => (
  <SitePageShell>
    <KolProfileContent />
  </SitePageShell>
);

export default KolProfile;
