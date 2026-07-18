import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  Clock,
  Coins,
  FolderKanban,
  Plus,
  RotateCcw,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiveCountdown } from "@/components/ui/LiveCountdown";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCampaignDisplayLabel,
  getCampaignDisplayPhase,
  getCampaignDisplayStyle,
  isCampaignLive,
} from "@/lib/kolCampaignStatus";
import { fetchWalletCampaigns, getKolRewardSol, type KolWalletCampaign } from "@/lib/kolApi";
import { formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

interface ProjectDashboardProps {
  onSelectCampaign: (id: string) => void;
  onCreate: () => void;
}

function ProjectCampaignCard({
  campaign,
  onSelect,
}: {
  campaign: KolWalletCampaign;
  onSelect: (id: string) => void;
}) {
  const phase = getCampaignDisplayPhase(campaign);
  const live = isCampaignLive(campaign);
  const poolSol = getKolRewardSol(campaign);
  const hasRefund =
    campaign.creatorRefundSol != null && campaign.creatorRefundSol > 0;
  const refundFailed = campaign.creatorRefundStatus === "failed";

  const primaryMetric =
    campaign.status === "completed"
      ? {
          label: "Paid out",
          value: `${formatSol(campaign.paidSol)} SOL`,
          tone: "text-primary" as const,
        }
      : campaign.status === "pending_deposit"
        ? {
            label: "Pool to fund",
            value: `${formatSol(poolSol)} SOL`,
            tone: "text-amber-600 dark:text-amber-400" as const,
          }
        : {
            label: "Projected payout",
            value: `${formatSol(campaign.projectedSol)} SOL`,
            tone: "text-foreground" as const,
          };

  const ctaLabel =
    phase === "pending_deposit"
      ? "Continue & pay"
      : phase === "live"
        ? "Manage campaign"
        : phase === "finalizing"
          ? "View payouts"
          : "View results";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[1.35rem] border border-border/55 bg-card/55",
        "shadow-card transition-[transform,border-color,box-shadow] duration-300 ease-out",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated",
        live && "border-primary/20",
        phase === "pending_deposit" && "border-amber-500/25",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-0.5",
          phase === "live" && "bg-primary",
          phase === "finalizing" && "bg-amber-400",
          phase === "pending_deposit" && "bg-amber-400",
          phase === "completed" && "bg-border",
          phase === "cancelled" && "bg-destructive/60",
        )}
        aria-hidden
      />
      {live ? (
        <div
          className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-primary/[0.07] blur-3xl"
          aria-hidden
        />
      ) : null}

      <button
        type="button"
        onClick={() => onSelect(campaign.id)}
        className="relative flex w-full flex-col gap-5 p-5 text-left sm:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-[1.35rem]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="eyebrow">
              {phase === "pending_deposit"
                ? "Needs funding"
                : phase === "live"
                  ? "Live campaign"
                  : phase === "finalizing"
                    ? "Settling"
                    : "Campaign"}
            </p>
            <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl line-clamp-2">
              {campaign.title}
            </h3>
            {campaign.sourceAuthorHandle ? (
              <p className="text-xs text-muted-foreground">
                @{campaign.sourceAuthorHandle}
              </p>
            ) : null}
          </div>
          <Badge
            variant="outline"
            className={cn("shrink-0", getCampaignDisplayStyle(phase))}
          >
            {getCampaignDisplayLabel(phase)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-primary/15 bg-primary/[0.05] px-3.5 py-3 col-span-2 sm:col-span-1">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              <Coins className="h-3 w-3" aria-hidden />
              Pool
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums tracking-tight text-foreground">
              {formatSol(poolSol)}
            </p>
            <p className="text-[11px] text-muted-foreground">SOL</p>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Users className="h-3 w-3" aria-hidden />
              On board
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
              {campaign.participants}
            </p>
            <p className="text-[11px] text-muted-foreground">KOLs</p>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Zap className="h-3 w-3" aria-hidden />
              Engaged
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
              {campaign.engagedParticipants}
            </p>
            <p className="text-[11px] text-muted-foreground">with activity</p>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden />
              Timing
            </p>
            {live ? (
              <div className="mt-1.5">
                <LiveCountdown
                  endAt={campaign.endAt}
                  compact
                  showIcon={false}
                  className="text-foreground"
                />
              </div>
            ) : (
              <p className="mt-1 text-sm font-semibold tracking-tight line-clamp-2">
                {phase === "finalizing" || phase === "completed"
                  ? "Ended"
                  : `${campaign.durationDays}d run`}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              {live ? "remaining" : "duration"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {primaryMetric.label}
            </p>
            <p
              className={cn(
                "mt-0.5 text-xl font-semibold tabular-nums tracking-tight",
                primaryMetric.tone,
              )}
            >
              {primaryMetric.value}
            </p>
            {hasRefund ? (
              <p
                className={cn(
                  "mt-1 inline-flex items-center gap-1 text-xs",
                  refundFailed
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                <RotateCcw className="h-3 w-3" aria-hidden />
                Refunded {formatSol(campaign.creatorRefundSol ?? 0)} SOL
                {refundFailed ? " · failed" : ""}
              </p>
            ) : null}
          </div>

          <span
            className={cn(
              "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium",
              "border border-border/60 bg-background/70 text-foreground",
              "transition-colors duration-150 group-hover:border-primary/35 group-hover:bg-primary/10 group-hover:text-primary",
            )}
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
        </div>
      </button>
    </article>
  );
}

function ProjectCardsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your campaigns…</span>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-56 rounded-[1.35rem]" />
      ))}
    </div>
  );
}

export function ProjectDashboard({
  onSelectCampaign,
  onCreate,
}: ProjectDashboardProps) {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() ?? null;

  const query = useQuery({
    queryKey: ["kol-wallet-campaigns", walletAddress],
    queryFn: () => fetchWalletCampaigns(walletAddress!),
    enabled: Boolean(walletAddress),
    staleTime: 60_000,
  });

  const campaigns = query.data?.campaigns ?? [];

  const summary = useMemo(() => {
    const live = campaigns.filter((c) => isCampaignLive(c)).length;
    const pending = campaigns.filter((c) => c.status === "pending_deposit").length;
    const totalPool = campaigns.reduce((sum, c) => sum + getKolRewardSol(c), 0);
    return { live, pending, totalPool };
  }, [campaigns]);

  if (!walletAddress) {
    return (
      <div className="relative overflow-hidden panel-glass rounded-[1.75rem] border border-border/55 p-8 sm:p-10 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-50" aria-hidden />
        <div className="relative space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <FolderKanban className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">My campaigns</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Connect your Solana wallet to see campaigns you created, spend, and refunds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (query.isLoading) {
    return <ProjectCardsSkeleton />;
  }

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-muted-foreground">
        Couldn&apos;t load your campaigns. Try refreshing.
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="relative overflow-hidden panel-glass rounded-[1.75rem] border border-border/55 p-8 sm:p-12 text-center">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-50" aria-hidden />
        <div className="relative space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <FolderKanban className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">No campaigns yet</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Launch your first campaign — platform fee is waived on your first funded campaign.
              Unused pool SOL is refunded when it ends.
            </p>
          </div>
          <Button variant="hero" className="rounded-full gap-2" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Create campaign
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/50 bg-card/40 p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-60" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow mb-2">Project desk</p>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">My campaigns</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Track pools, engagers, payouts, and refunds across everything you fund.
            </p>
          </div>
          <Button variant="hero" className="rounded-full gap-2 shrink-0" onClick={onCreate}>
            <Plus className="h-4 w-4" />
            New campaign
          </Button>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-border/40 pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
              {campaigns.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Live
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-primary">
              {summary.live}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {summary.pending > 0 ? "Awaiting pay" : "Pool funded"}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
              {summary.pending > 0
                ? summary.pending
                : `${formatSol(summary.totalPool)}`}
            </p>
            {summary.pending === 0 ? (
              <p className="text-[11px] text-muted-foreground">SOL across all</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <ProjectCampaignCard
            key={campaign.id}
            campaign={campaign}
            onSelect={onSelectCampaign}
          />
        ))}
      </div>
    </div>
  );
}
