import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Check,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  Gift,
  Info,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { DailyClaimCard } from "@/components/profile/DailyClaimCard";
import { ProfileSectionHeader } from "@/components/profile/ProfileSectionHeader";
import { ProfileShareAction } from "@/components/profile/ProfileShareAction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoHint } from "@/components/ui/info-hint";
import {
  fetchKolProfile,
  fetchReferralProfile,
  fetchWalletEarnings,
  fetchWalletPoints,
} from "@/lib/kolApi";
import { formatSol } from "@/lib/kolFormat";
import { REFERRAL_POINTS_HINT, POINTS_CREATED_HINT, POINTS_EARLY_BIRD_HINT } from "@/lib/kolRewardEligibility";
import { buildProfileShareFromWallet } from "@/lib/profileShareData";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

function StatTile({
  label,
  value,
  sub,
  hint,
}: {
  label: string;
  value: string;
  sub?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 panel-glass p-4 sm:p-5 min-w-0">
      <p className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground leading-snug inline-flex items-center gap-1">
        {label}
        {hint ? <InfoHint content={hint} label={`About ${label}`} /> : null}
      </p>
      <p className="text-lg min-[400px]:text-xl sm:text-2xl font-semibold tabular-nums mt-2 break-words">
        {value}
      </p>
      {sub ? (
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">{sub}</p>
      ) : null}
    </div>
  );
}

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function shortenAddress(address: string, chars = 6): string {
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

function referralShareUrl(sharePath: string | null, code: string | null): string {
  if (typeof window === "undefined") {
    return sharePath ? `https://s3labs.xyz${sharePath}` : "";
  }
  const path = sharePath ?? (code ? `/r/${code}` : "");
  return path ? `${window.location.origin}${path}` : "";
}

function ProfileContent() {
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const address = wallet.publicKey?.toBase58() ?? null;
  const [refLinkCopied, setRefLinkCopied] = useState(false);

  const pointsQuery = useQuery({
    queryKey: ["wallet-points", address],
    queryFn: () => fetchWalletPoints(address!),
    enabled: Boolean(address && wallet.connected),
    staleTime: 60_000,
  });

  const earningsQuery = useQuery({
    queryKey: ["kol-earnings", address],
    queryFn: () => fetchWalletEarnings(address!),
    enabled: Boolean(address && wallet.connected),
    staleTime: 60_000,
  });

  const referralQuery = useQuery({
    queryKey: ["referral-profile", address],
    queryFn: () => fetchReferralProfile(address!),
    enabled: Boolean(address && wallet.connected),
    staleTime: 30_000,
  });

  const kolProfileQuery = useQuery({
    queryKey: ["kol-profile", pointsQuery.data?.lastHandle],
    queryFn: () => fetchKolProfile(pointsQuery.data!.lastHandle!),
    enabled: Boolean(pointsQuery.data?.lastHandle),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  if (!wallet.connected || !address) {
    return (
      <div className={cn(pageContent, "pb-20 min-w-0")}>
        <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-10 text-center max-w-lg mx-auto mt-8 sm:mt-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <h1 className="heading-section text-2xl mb-2">Your S3Labs Profile</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your wallet to view your S3Labs Points and campaign participation history.
          </p>
          <Button variant="hero" className="rounded-full" onClick={() => setVisible(true)}>
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  const data = pointsQuery.data;
  const earnings = earningsQuery.data;
  const kolProfile = kolProfileQuery.data;
  const minPayoutSol = earnings?.totals.minPayoutSol ?? 0.01;
  const pendingBalanceSol = earnings?.totals.pendingBalanceSol ?? 0;
  const hasPendingPayout = pendingBalanceSol > 0;
  const amountUntilPayout = Math.max(0, minPayoutSol - pendingBalanceSol);
  const isLoading = pointsQuery.isLoading || earningsQuery.isLoading;

  const profileShareData = buildProfileShareFromWallet({
    handle: data?.lastHandle ?? null,
    displayName: kolProfile?.name ?? data?.lastHandle ?? shortenAddress(address ?? "", 4),
    verified: kolProfile?.verified,
    profilePicture: kolProfile?.profilePicture,
    followers: kolProfile?.followers,
    reputationScore: kolProfile?.roles.includes("kol") ? kolProfile.asKol.totalScore : null,
    totalPoints: data?.totalPoints ?? 0,
    earnedSol: earnings?.totals.paidSol ?? 0,
    projectedSol: earnings?.totals.projectedSol ?? 0,
    campaignsParticipated: data?.campaignsParticipated ?? 0,
    campaignsCompleted: kolProfile?.roles.includes("kol")
      ? kolProfile.asKol.campaignsCompleted
      : undefined,
    engagementTotal: kolProfile?.roles.includes("kol")
      ? kolProfile.asKol.engagement.total
      : undefined,
  });

  return (
    <div className={cn(pageContent, "pb-20 min-w-0")}>
      <Link
        to="/kol"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 sm:mb-8 transition-colors max-w-full"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <span className="truncate">Back to KOL marketplace</span>
      </Link>

      {isLoading ? (
        <div className="space-y-6 sm:space-y-8 min-w-0">
          <Skeleton className="h-36 sm:h-40 rounded-2xl" />
          <Skeleton className="h-56 sm:h-64 rounded-2xl" />
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-10 min-w-0">
          <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-card backdrop-blur-xl min-w-0">
            <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-80" aria-hidden />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/14 via-transparent to-primary/6"
              aria-hidden
            />

            <div className="relative border-b border-border/50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-4 sm:gap-x-6 lg:gap-x-8">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 sm:h-20 sm:w-20">
                  <Award className="h-8 w-8 text-primary sm:h-9 sm:w-9" />
                </div>

                <div className="min-w-0 space-y-2">
                  <p className="eyebrow">Your profile</p>
                  <h1 className="heading-section text-xl min-[400px]:text-2xl sm:text-3xl">S3Labs Points</h1>
                  <p className="font-mono text-xs text-muted-foreground break-all leading-relaxed sm:text-sm">
                    <span className="sm:hidden">{shortenAddress(address, 8)}</span>
                    <span className="hidden sm:inline">{address}</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-8 px-2 text-xs text-muted-foreground"
                    onClick={() => void copyAddress()}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                    Copy address
                  </Button>
                </div>

                {data?.lastHandle ? (
                  <div className="col-span-2 flex flex-wrap items-center gap-2 border-t border-border/40 pt-4">
                    <Badge variant="outline" className="max-w-full gap-1">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <span className="truncate">@{data.lastHandle}</span>
                    </Badge>
                    <a
                      href={`https://x.com/${encodeURIComponent(data.lastHandle)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View on X
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <Link
                      to={`/kol/${encodeURIComponent(data.lastHandle)}`}
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      Public profile
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="relative border-b border-border/50 bg-muted/15">
              <div className="grid grid-cols-2 divide-x divide-border/50 lg:grid-cols-3">
                <div className="flex flex-col justify-center gap-1 px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    Total points
                  </div>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight text-primary sm:text-3xl">
                    {formatPoints(data?.totalPoints ?? 0)}
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-1 px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5 text-primary" />
                    Campaigns joined
                  </div>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                    {data?.campaignsParticipated ?? 0}
                  </p>
                </div>
                <div className="col-span-2 flex flex-col justify-center gap-1 border-t border-border/50 px-4 py-4 sm:px-6 sm:py-5 lg:col-span-1 lg:border-t-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <Coins className="h-3.5 w-3.5 text-primary" />
                    SOL earned
                  </div>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
                    {formatSol(earnings?.totals.paidSol ?? 0)}
                    <span className="ml-1.5 text-base font-medium text-muted-foreground sm:text-lg">SOL</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="relative px-4 py-4 sm:px-6 sm:py-5 space-y-3">
              <Button asChild variant="hero" className="w-full rounded-full sm:w-auto">
                <Link to="/profile/missions">
                  <Target className="mr-1.5 h-4 w-4" />
                  Missions
                </Link>
              </Button>
              {profileShareData ? (
                <ProfileShareAction data={profileShareData} prominent />
              ) : null}
            </div>
          </section>

          <DailyClaimCard wallet={address} />

          <section className="space-y-4 min-w-0">
            <ProfileSectionHeader
              icon={<Coins className="w-4 h-4" />}
              title="KOL earnings"
            />

            <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <StatTile
                label="Paid out"
                value={`${formatSol(earnings?.totals.paidSol ?? 0)} SOL`}
                sub="Confirmed on-chain transfers"
              />
              <StatTile
                label="Pending balance"
                value={`${formatSol(pendingBalanceSol, 4)} SOL`}
                sub={
                  hasPendingPayout
                    ? `${formatSol(amountUntilPayout, 4)} SOL until ${formatSol(minPayoutSol)} minimum`
                    : "Nothing waiting to roll over"
                }
              />
              <StatTile
                label="Active projected"
                value={`${formatSol(earnings?.totals.projectedSol ?? 0)} SOL`}
                sub="Live campaigns — not final yet"
              />
            </div>

            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 sm:p-5 lg:p-6 min-w-0">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25">
                  <Info className="w-5 h-5 text-amber-400" aria-hidden />
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="font-semibold text-amber-100/95">
                    Minimum payout: {formatSol(minPayoutSol)} SOL
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {earnings?.payoutPolicy.summary ??
                      "On-chain payouts require at least 0.01 SOL. Smaller campaign earnings roll over and pay out automatically once your combined balance reaches the minimum."}
                  </p>
                  {hasPendingPayout ? (
                    <p className="text-sm text-amber-200/80">
                      Your wallet currently holds{" "}
                      <span className="font-semibold tabular-nums">{formatSol(pendingBalanceSol, 4)} SOL</span>{" "}
                      from completed campaigns. The next time you earn on a campaign and the combined total
                      reaches {formatSol(minPayoutSol)} SOL, everything pays out in one transfer.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      If a campaign ends with a reward below {formatSol(minPayoutSol)} SOL, it stays in
                      your pending balance instead of being sent on-chain.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {earnings?.pendingMinimum.length ? (
              <div className="rounded-2xl border border-border/60 panel-glass overflow-hidden min-w-0">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border/60 flex items-center gap-2 min-w-0">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <h3 className="font-medium text-sm truncate">Held until minimum payout</h3>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border/50">
                  {earnings.pendingMinimum.map((row) => (
                    <div key={row.submission.id} className="p-4 space-y-3 min-w-0">
                      <div className="min-w-0">
                        <Link
                          to={`/kol?campaign=${encodeURIComponent(row.campaign.id)}`}
                          className="font-medium hover:text-primary transition-colors line-clamp-2 text-sm leading-snug"
                        >
                          {row.campaign.title}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          @{row.submission.authorHandle}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm tabular-nums font-medium text-primary">
                          {formatSol(row.payout?.sol ?? row.submission.projectedSol, 4)} SOL
                        </p>
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 text-amber-400 bg-amber-500/10 shrink-0"
                        >
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Campaign</th>
                        <th className="px-4 py-3 font-medium text-right">Earned</th>
                        <th className="px-4 py-3 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.pendingMinimum.map((row) => (
                        <tr
                          key={row.submission.id}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                        >
                          <td className="px-4 py-3 min-w-[160px]">
                            <Link
                              to={`/kol?campaign=${encodeURIComponent(row.campaign.id)}`}
                              className="font-medium hover:text-primary transition-colors line-clamp-1"
                            >
                              {row.campaign.title}
                            </Link>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              @{row.submission.authorHandle}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-primary">
                            {formatSol(row.payout?.sol ?? row.submission.projectedSol, 4)} SOL
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge
                              variant="outline"
                              className="border-amber-500/30 text-amber-400 bg-amber-500/10"
                            >
                              Pending
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-4 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <ProfileSectionHeader
                icon={<Sparkles className="w-4 h-4" />}
                title="Points"
              />
              <Button asChild variant="outline" size="sm" className="rounded-full shrink-0 self-start sm:self-auto">
                <Link to="/profile/points">
                  <Trophy className="mr-1.5 h-3.5 w-3.5" />
                  Points leaderboard
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">
              <StatTile
                label="Daily claims"
                value={formatPoints(data?.dailyClaimPoints ?? 0)}
                sub="0.1 pt/day + streak bonuses"
              />
              <StatTile
                label="Campaign created"
                value={formatPoints(data?.creationPoints ?? 0)}
                sub="5 pts when your campaign goes live"
                hint={POINTS_CREATED_HINT}
              />
              <StatTile
                label="Participation"
                value={formatPoints(data?.participationPoints ?? 0)}
                sub="1 pt per completed campaign"
              />
              <StatTile
                label="Early bird"
                value={formatPoints(data?.earlyPoints ?? 0)}
                sub="Up to 3 pts by who submitted first"
                hint={POINTS_EARLY_BIRD_HINT}
              />
              <StatTile
                label="Referrals"
                value={formatPoints(data?.referralPoints ?? 0)}
                sub="From invitees who join, top 3, or go live"
                hint={REFERRAL_POINTS_HINT}
              />
              <StatTile
                label="Missions"
                value={formatPoints(data?.missionPoints ?? 0)}
                sub="0.3 pts per verified comment on S3Labs posts"
              />
              <StatTile
                label="Campaigns joined"
                value={String(data?.campaignsParticipated ?? 0)}
              />
              <StatTile
                label="Campaigns created"
                value={String(data?.campaignsCreated ?? 0)}
              />
            </div>
          </section>

          <section className="space-y-4 min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-1.5 min-w-0">
                <ProfileSectionHeader
                  icon={<Gift className="w-4 h-4" />}
                  title="Referral"
                />
                <InfoHint
                  content={REFERRAL_POINTS_HINT}
                  label="How do referral points work?"
                />
              </div>
              {referralQuery.data?.code ? (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="rounded-full shrink-0 self-start sm:self-auto"
                >
                  <Link to="/profile/referral">
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    View invited
                    {referralQuery.data.inviteeCount > 0
                      ? ` (${referralQuery.data.inviteeCount})`
                      : ""}
                  </Link>
                </Button>
              ) : null}
            </div>

            {referralQuery.isLoading ? (
              <Skeleton className="h-28 rounded-2xl" />
            ) : referralQuery.data?.code ? (
              <div className="panel-glass space-y-3 rounded-2xl border border-border/60 p-4 sm:p-5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Your referral link
                  </p>
                  <p className="mt-1 font-mono text-sm font-medium">
                    {referralQuery.data.code}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    readOnly
                    value={referralShareUrl(
                      referralQuery.data.sharePath,
                      referralQuery.data.code,
                    )}
                    className="font-mono text-sm"
                    aria-label="Referral share link"
                  />
                  <Button
                    type="button"
                    variant="hero"
                    size="sm"
                    className="rounded-full shrink-0"
                    onClick={async () => {
                      const link = referralShareUrl(
                        referralQuery.data!.sharePath,
                        referralQuery.data!.code,
                      );
                      if (!link) return;
                      await navigator.clipboard.writeText(link);
                      setRefLinkCopied(true);
                      toast.success("Referral link copied");
                      window.setTimeout(() => setRefLinkCopied(false), 2000);
                    }}
                  >
                    {refLinkCopied ? (
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                    ) : (
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share this link. You earn points when people who join with it take part in
                  campaigns, place top 3, or open their own live campaign.
                </p>
              </div>
            ) : (
              <div className="panel-glass space-y-3 rounded-2xl border border-border/60 p-4 sm:p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Create a one-time referral name to share your invite link and earn points from
                  invitees.
                </p>
                <Button asChild variant="hero" size="sm" className="rounded-full">
                  <Link to="/profile/referral">Create referral name</Link>
                </Button>
              </div>
            )}
          </section>

          <section className="space-y-4 min-w-0">
            <ProfileSectionHeader
              icon={<Trophy className="w-4 h-4" />}
              title="Points history"
            />
            {data?.entries.length ? (
              <div className="rounded-2xl border border-border/60 panel-glass overflow-hidden min-w-0">
                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-border/50">
                  {data.entries.map((entry) => (
                    <div key={entry.id} className="p-4 space-y-3 min-w-0">
                      <div className="min-w-0">
                        <Link
                          to={`/kol?campaign=${encodeURIComponent(entry.campaignId)}`}
                          className="font-medium hover:text-primary transition-colors line-clamp-2 text-sm leading-snug"
                        >
                          {entry.campaignTitle ?? "Campaign"}
                        </Link>
                        {entry.handle ? (
                          <p className="text-xs text-muted-foreground mt-1 truncate">@{entry.handle}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {entry.entryType === "campaign_creation" ? "Created" : "KOL"}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums text-primary ml-auto">
                          +{formatPoints(entry.totalPoints)} pts
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center rounded-xl border border-border/50 bg-muted/20 p-2">
                        <div className="min-w-0 px-1">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Created</p>
                          <p className="text-xs font-medium tabular-nums mt-0.5">
                            {entry.creationPoints > 0 ? formatPoints(entry.creationPoints) : "—"}
                          </p>
                        </div>
                        <div className="min-w-0 px-1 border-x border-border/40">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Join</p>
                          <p className="text-xs font-medium tabular-nums mt-0.5">
                            {entry.participationPoints > 0
                              ? formatPoints(entry.participationPoints)
                              : "—"}
                          </p>
                        </div>
                        <div className="min-w-0 px-1">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Early</p>
                          <p className="text-xs font-medium tabular-nums mt-0.5 text-primary">
                            {entry.earlyPoints > 0 ? formatPoints(entry.earlyPoints) : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Campaign</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium text-right">Created</th>
                        <th className="px-4 py-3 font-medium text-right">Participation</th>
                        <th className="px-4 py-3 font-medium text-right">Early bird</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.entries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                        >
                          <td className="px-4 py-3 min-w-[160px]">
                            <Link
                              to={`/kol?campaign=${encodeURIComponent(entry.campaignId)}`}
                              className="font-medium hover:text-primary transition-colors line-clamp-1"
                            >
                              {entry.campaignTitle ?? "Campaign"}
                            </Link>
                            {entry.handle ? (
                              <p className="text-xs text-muted-foreground mt-0.5">@{entry.handle}</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 capitalize text-muted-foreground">
                            {entry.entryType === "campaign_creation" ? "Created" : "KOL"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {entry.creationPoints > 0 ? formatPoints(entry.creationPoints) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {entry.participationPoints > 0
                              ? formatPoints(entry.participationPoints)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-primary">
                            {entry.earlyPoints > 0 ? formatPoints(entry.earlyPoints) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium">
                            {formatPoints(entry.totalPoints)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8 text-center min-w-0">
                <p className="font-medium">No points yet</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Launch a KOL campaign (+5 pts) or join one as a KOL (+1 plus early-bird bonus).
                  Points credit automatically when campaigns go live or end.
                </p>
                <Button asChild variant="hero" className="rounded-full mt-6">
                  <Link to="/kol">Browse campaigns</Link>
                </Button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

const Profile = () => (
  <SitePageShell>
    <ProfileContent />
  </SitePageShell>
);

export default Profile;
