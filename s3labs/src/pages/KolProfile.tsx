import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Coins,
  ExternalLink,
  Eye,
  Megaphone,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignGrid } from "@/components/kol/CampaignCard";
import { KolProfileAvatar } from "@/components/kol/KolProfileAvatar";
import { ProfileShareAction } from "@/components/profile/ProfileShareAction";
import type { KolProfile } from "@/lib/kolApi";
import { fetchKolProfile } from "@/lib/kolApi";
import { formatCompact, formatFollowers, formatSol } from "@/lib/kolFormat";
import { buildProfileShareFromKolProfile } from "@/lib/profileShareData";

interface MetricCellProps {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function MetricCell({ icon, label, value, sub, highlight }: MetricCellProps) {
  return (
    <div className="flex min-w-0 flex-col justify-center gap-1 px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl",
          highlight && "text-primary",
        )}
      >
        {value}
      </p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function MetricsRail({
  title,
  children,
  columns,
}: {
  title?: string;
  children: ReactNode;
  columns: 2 | 3 | 4;
}) {
  const gridClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-2 lg:grid-cols-4";

  return (
    <div className="border-t border-border/50 bg-muted/15">
      {title ? (
        <p className="border-b border-border/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:px-6">
          {title}
        </p>
      ) : null}
      <div
        className={cn(
          "grid divide-y divide-border/50 sm:divide-x sm:divide-y-0",
          gridClass,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ProfileHero({ profile }: { profile: KolProfile }) {
  const xUrl = `https://x.com/${encodeURIComponent(profile.handle)}`;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/14 via-transparent to-primary/6"
        aria-hidden
      />

      {/* Top bar */}
      <div className="relative flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {profile.roles.includes("project") ? (
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
              <Sparkles className="w-3 h-3" />
              Project
            </Badge>
          ) : null}
          {profile.roles.includes("kol") ? (
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
              <Users className="w-3 h-3" />
              KOL
            </Badge>
          ) : null}
          {profile.verified ? (
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              <BadgeCheck className="w-3 h-3" />
              Verified
            </Badge>
          ) : null}
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-full shrink-0 gap-1.5">
          <a href={xUrl} target="_blank" rel="noopener noreferrer">
            View on X
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>
      </div>

      {/* Identity — bio spans full width below avatar row so no dead space under image */}
      <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-4 sm:gap-x-6 lg:gap-x-8">
          <KolProfileAvatar
            handle={profile.handle}
            name={profile.name}
            profilePicture={profile.profilePicture}
            size="lg"
            className="h-20 w-20 rounded-2xl sm:h-24 sm:w-24 lg:h-28 lg:w-28"
          />

          <div className="min-w-0 space-y-2">
            <p className="eyebrow">Marketplace profile</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="heading-section text-2xl sm:text-3xl lg:text-4xl">{profile.name}</h1>
              {profile.verified ? (
                <BadgeCheck className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" aria-label="Verified" />
              ) : null}
            </div>
            <p className="text-base text-muted-foreground">@{profile.handle}</p>
            {profile.followers != null ? (
              <p className="text-sm text-muted-foreground">
                {formatFollowers(profile.followers)} followers on X
                {profile.xProfileRefreshedAt ? (
                  <span className="text-muted-foreground/70">
                    {" "}
                    · updated{" "}
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                      new Date(profile.xProfileRefreshedAt),
                    )}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          {profile.description ? (
            <p className="col-span-2 self-start text-sm leading-relaxed text-muted-foreground sm:text-base border-t border-border/40 pt-4">
              {profile.description}
            </p>
          ) : null}
        </div>
      </div>

      {profile.roles.includes("kol") ? (
        <MetricsRail title="KOL performance" columns={4}>
          <MetricCell
            icon={<Star className="h-3.5 w-3.5 text-primary" />}
            label="Reputation"
            value={profile.asKol.totalScore.toFixed(1)}
            sub={`${profile.asKol.reputationScore.toFixed(1)} lifetime · ${profile.asKol.activeScore.toFixed(1)} active`}
          />
          <MetricCell
            icon={<Coins className="h-3.5 w-3.5 text-primary" />}
            label="Earned"
            value={`${formatSol(profile.asKol.earnedSol)} SOL`}
            sub={
              profile.asKol.projectedSol > 0
                ? `${formatSol(profile.asKol.projectedSol)} SOL projected`
                : "Confirmed payouts"
            }
            highlight
          />
          <MetricCell
            icon={<Zap className="h-3.5 w-3.5 text-primary" />}
            label="Engagement"
            value={formatCompact(profile.asKol.engagement.total)}
            sub={`${formatCompact(profile.asKol.engagement.views)} views`}
          />
          <MetricCell
            icon={<Trophy className="h-3.5 w-3.5 text-primary" />}
            label="Campaigns"
            value={String(profile.asKol.campaignCount)}
            sub={`${profile.asKol.campaignsCompleted} completed`}
          />
        </MetricsRail>
      ) : null}

      {profile.roles.includes("project") ? (
        <MetricsRail title="Project activity" columns={4}>
          <MetricCell
            icon={<Megaphone className="h-3.5 w-3.5 text-primary" />}
            label="Campaigns"
            value={String(profile.asProject.campaignCount)}
            sub={`${profile.asProject.activeCampaignCount} active`}
          />
          <MetricCell
            icon={<Zap className="h-3.5 w-3.5 text-primary" />}
            label="Active now"
            value={String(profile.asProject.activeCampaignCount)}
            sub={`${profile.asProject.completedCampaignCount} completed`}
          />
          <MetricCell
            icon={<Coins className="h-3.5 w-3.5 text-primary" />}
            label="Total funded"
            value={`${formatSol(profile.asProject.totalFundedSol)} SOL`}
            sub="All campaigns"
            highlight
          />
          <MetricCell
            icon={<Users className="h-3.5 w-3.5 text-primary" />}
            label="KOL pool"
            value={`${formatSol(profile.asProject.totalKolPoolSol)} SOL`}
            sub="Paid to creators"
          />
        </MetricsRail>
      ) : null}

      <div className="relative border-t border-border/50 px-4 py-4 sm:px-6 sm:py-5">
        <ProfileShareAction
          data={buildProfileShareFromKolProfile(profile)}
          thirdPerson
          prominent
        />
      </div>
    </section>
  );
}

function EngagementRow({
  row,
  onOpenCampaign,
}: {
  row: KolProfile["asKol"]["engagements"][number];
  onOpenCampaign: (id: string) => void;
}) {
  const score = row.submission.finalScore ?? row.submission.latestScore;
  const engagementTotal =
    row.submission.latestMetrics.likeCount +
    row.submission.latestMetrics.retweetCount +
    row.submission.latestMetrics.viewCount;
  const payoutSol = row.payout?.sol ?? row.submission.projectedSol;
  const isPaid = Boolean(row.payout);

  return (
    <article className="grid gap-4 border-b border-border/40 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6 sm:py-5">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {row.campaign ? (
            <button
              type="button"
              onClick={() => onOpenCampaign(row.campaign!.id)}
              className="truncate text-left font-semibold hover:text-primary transition-colors"
            >
              {row.campaign.title}
            </button>
          ) : (
            <p className="truncate font-semibold">Campaign</p>
          )}
          <Badge variant="outline" className="capitalize shrink-0">
            {row.submission.mode}
          </Badge>
          {row.submission.reputationCreditedAt ? (
            <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
              Credited
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 text-primary" />
            Score {score.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            {formatCompact(engagementTotal)} engagement
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3 text-primary" />
            {formatCompact(row.submission.latestMetrics.viewCount)} views
          </span>
        </div>

        <a
          href={row.submission.tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View post on X
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:text-right">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {isPaid ? "Paid out" : "Projected"}
          </p>
          <p
            className={cn(
              "text-xl font-semibold tabular-nums sm:text-2xl",
              isPaid ? "text-foreground" : "text-primary",
            )}
          >
            {formatSol(payoutSol)} SOL
          </p>
        </div>
        <Badge variant="outline" className="capitalize shrink-0">
          {isPaid ? "Paid" : "Projected"}
        </Badge>
      </div>
    </article>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[420px] rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
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
    <div className={cn(pageContent, "min-w-0 pb-20")}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-6 gap-2 rounded-full text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link to="/kol">
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>
      </Button>

      {profileQuery.isLoading ? (
        <ProfileSkeleton />
      ) : profileQuery.isError || !profile ? (
        <div className="rounded-2xl border border-destructive/30 panel-glass p-10 text-center">
          <p className="text-lg font-semibold">Profile not found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No marketplace activity for @{username?.replace(/^@/, "") ?? "unknown"} yet.
          </p>
          <Button asChild variant="outline" className="mt-6 rounded-full">
            <Link to="/kol">Browse campaigns</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <ProfileHero profile={profile} />

          {profile.asProject.campaigns.length > 0 ? (
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl">
              <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Megaphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg tracking-tight">Campaigns created</h2>
                    <p className="text-sm text-muted-foreground">
                      {profile.asProject.campaigns.length} campaign
                      {profile.asProject.campaigns.length !== 1 ? "s" : ""} launched
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit capitalize">
                  {profile.asProject.activeCampaignCount} active
                </Badge>
              </div>
              <div className="p-4 sm:p-6">
                <CampaignGrid
                  campaigns={profile.asProject.campaigns.map((c) => ({
                    ...c,
                    submissionCount: c.submissionCount ?? 0,
                  }))}
                  onSelect={(id) => navigate(`/kol?campaign=${encodeURIComponent(id)}`)}
                />
              </div>
            </section>
          ) : null}

          {profile.asKol.engagements.length > 0 ? (
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl">
              <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg tracking-tight">KOL engagements</h2>
                    <p className="text-sm text-muted-foreground">
                      {profile.asKol.engagements.length} submission
                      {profile.asKol.engagements.length !== 1 ? "s" : ""} across campaigns
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit">
                  {formatSol(profile.asKol.earnedSol)} SOL earned
                </Badge>
              </div>
              <div className="divide-y divide-border/40">
                {profile.asKol.engagements.map((row) => (
                  <EngagementRow
                    key={row.submission.id}
                    row={row}
                    onOpenCampaign={(id) => navigate(`/kol?campaign=${encodeURIComponent(id)}`)}
                  />
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
