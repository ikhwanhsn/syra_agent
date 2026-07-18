import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { PageLoader } from "@/components/PageLoader";
import { KolPointsInfo } from "@/components/kol/KolPointsInfo";
import { VerifyXAccountCard } from "@/components/kol/VerifyXAccountCard";
import { Button } from "@/components/ui/button";
import { claimCampaignReward, fetchWalletEarnings, fetchWalletPoints, KolApiError } from "@/lib/kolApi";
import { shortenAddress } from "@/lib/solanaKol";
import { Badge } from "@/components/ui/badge";

function formatSol(sol: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(sol);
}

export function EarningsDashboard() {
  const wallet = useWallet();
  const queryClient = useQueryClient();
  const address = wallet.publicKey?.toBase58();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["kol-earnings", address],
    queryFn: () => fetchWalletEarnings(address!),
    enabled: Boolean(address),
  });

  const pointsQuery = useQuery({
    queryKey: ["wallet-points", address],
    queryFn: () => fetchWalletPoints(address!),
    enabled: Boolean(address),
  });

  return (
    <div className="space-y-6 min-w-0">
      <KolPointsInfo />
      <VerifyXAccountCard compactWhenVerified onVerified={() => refetch()} />

      <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">My Earnings</p>
            <h2 className="heading-section">KOL wallet dashboard</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Auto-tracked every 24h. Verify X and claim SOL after campaigns end.
            </p>
          </div>
        </div>

        {!address ? (
          <p className="text-sm text-muted-foreground mt-6">Connect your wallet from the navbar to view earnings.</p>
        ) : isLoading ? (
          <div className="mt-6">
            <PageLoader label="Loading earnings" variant="inline" />
          </div>
        ) : data ? (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Projected (active)</p>
              <p className="text-2xl font-semibold text-primary mt-1">
                {formatSol(data.totals.projectedSol)} SOL
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Awaiting send</p>
              <p className="text-2xl font-semibold text-emerald-400 mt-1 tabular-nums">
                {formatSol(data.totals.claimableSol ?? 0)} SOL
              </p>
            </div>
            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid out</p>
              <p className="text-2xl font-semibold mt-1">{formatSol(data.totals.paidSol)} SOL</p>
            </div>
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Pending balance</p>
              <p className="text-2xl font-semibold mt-1 text-amber-400 tabular-nums">
                {formatSol(data.totals.pendingBalanceSol)} SOL
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Min {formatSol(data.totals.minPayoutSol)} SOL to pay on-chain
              </p>
            </div>
            <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">S3Labs Points</p>
              <p className="text-2xl font-semibold text-primary mt-1 tabular-nums">
                {pointsQuery.data?.totalPoints ?? 0}
              </p>
              <Link to="/profile" className="text-xs text-primary hover:underline mt-1 inline-block">
                View points history →
              </Link>
            </div>
          </div>
        ) : null}

        {address && data ? (
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs text-muted-foreground hover:text-primary mt-4"
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        ) : null}
      </div>

      {data?.claimable?.length ? (
        <section className="space-y-3">
          <h3 className="font-semibold">Awaiting auto-send</h3>
          <div className="grid gap-3">
            {data.claimable.map((row) => (
              <ClaimableRow
                key={row.submission.id}
                row={row}
                wallet={address!}
                hasCreatedCampaign={data.claimEligibility?.hasCreatedCampaign ?? false}
                onClaimed={() => {
                  refetch();
                  queryClient.invalidateQueries({ queryKey: ["kol-x-verification", address] });
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {data?.active.length ? (
        <section className="space-y-3">
          <h3 className="font-semibold">Active campaigns</h3>
          <div className="grid gap-3">
            {data.active.map((row) => (
              <div
                key={row.submission.id}
                className="panel-glass rounded-xl border border-border/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{row.campaign.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    @{row.submission.authorHandle} · score {row.submission.latestScore.toFixed(1)}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-primary font-semibold">
                    {formatSol(row.submission.projectedSol)} SOL
                  </p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {row.submission.mode}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data?.paid.length ? (
        <section className="space-y-3">
          <h3 className="font-semibold">Paid history</h3>
          <div className="grid gap-3">
            {data.paid.map((row) => (
              <div
                key={row.submission.id}
                className="panel-glass rounded-xl border border-border/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{row.campaign.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {row.submission.kolWallet
                      ? shortenAddress(row.submission.kolWallet, 6)
                      : `@${row.submission.authorHandle}`}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="font-semibold">{formatSol(row.payout?.sol ?? 0)} SOL</p>
                  {row.payout?.txSignature ? (
                    <a
                      href={`https://solscan.io/tx/${row.payout.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-1"
                    >
                      View tx
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ClaimableRow({
  row,
  wallet,
  hasCreatedCampaign,
  onClaimed,
}: {
  row: NonNullable<Awaited<ReturnType<typeof fetchWalletEarnings>>["claimable"]>[number];
  wallet: string;
  hasCreatedCampaign: boolean;
  onClaimed: () => void;
}) {
  const navigate = useNavigate();
  const claimBlocked =
    row.campaign.requireCreatedOneCampaign === true && !hasCreatedCampaign;

  const mutation = useMutation({
    mutationFn: () => claimCampaignReward(row.campaign.id, { wallet }),
    onSuccess: (data) => {
      if (data.status === "pending_minimum") {
        toast.message("Reward held in pool until 0.01 SOL minimum");
      } else {
        toast.success("Reward sent!");
      }
      onClaimed();
    },
    onError: (e: Error) => {
      if (e instanceof KolApiError && e.code === "require_created_campaign") {
        toast.error(e.message);
        return;
      }
      toast.error(e.message);
    },
  });

  const earnedSol = row.submission.earnedSol ?? row.submission.projectedSol ?? 0;

  return (
    <div className="panel-glass rounded-xl border border-emerald-500/25 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{row.campaign.title}</p>
        <p className="text-xs text-muted-foreground mt-1">
          @{row.submission.authorHandle} · score {row.submission.latestScore.toFixed(1)}
        </p>
        {claimBlocked ? (
          <p className="text-xs text-amber-400 mt-2">
            Create your own campaign and deposit SOL to open it before you can
            receive this reward.
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className="text-emerald-400 font-semibold tabular-nums">
          {formatSol(earnedSol)} SOL
        </p>
        {claimBlocked ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => navigate("/kol?tab=create")}
          >
            Create &amp; deposit SOL
          </Button>
        ) : (
          <Button
            variant="hero"
            size="sm"
            className="rounded-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Claiming…
              </>
            ) : (
              "Claim fallback"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
