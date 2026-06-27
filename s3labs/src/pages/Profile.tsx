import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Copy,
  ExternalLink,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWalletPoints } from "@/lib/kolApi";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 panel-glass p-4 sm:p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xl sm:text-2xl font-semibold tabular-nums mt-2">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground mt-1">{sub}</p> : null}
    </div>
  );
}

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function shortenAddress(address: string, chars = 6): string {
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

function ProfileContent() {
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const address = wallet.publicKey?.toBase58() ?? null;

  const pointsQuery = useQuery({
    queryKey: ["wallet-points", address],
    queryFn: () => fetchWalletPoints(address!),
    enabled: Boolean(address && wallet.connected),
    staleTime: 60_000,
  });

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    toast.success("Address copied");
  };

  if (!wallet.connected || !address) {
    return (
      <div className={cn(pageContent, "pb-20")}>
        <div className="panel-glass rounded-2xl border border-border/60 p-10 text-center max-w-lg mx-auto mt-12">
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

  return (
    <div className={cn(pageContent, "pb-20")}>
      <Link
        to="/kol"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to KOL marketplace
      </Link>

      {pointsQuery.isLoading ? (
        <div className="space-y-8">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-10">
          <section className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="eyebrow mb-2">Your profile</p>
                <h1 className="heading-display text-2xl sm:text-3xl">S3Labs Points</h1>
                <p className="text-sm text-muted-foreground mt-2 font-mono break-all">{address}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-8 px-2 text-xs text-muted-foreground"
                  onClick={() => void copyAddress()}
                >
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copy address
                </Button>
                {data?.lastHandle ? (
                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      @{data.lastHandle}
                    </Badge>
                    <a
                      href={`https://x.com/${encodeURIComponent(data.lastHandle)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View on X
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-6 shrink-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  Total points
                </div>
                <p className="text-4xl font-semibold tabular-nums text-primary">
                  {formatPoints(data?.totalPoints ?? 0)}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatTile
              label="Participation"
              value={formatPoints(data?.participationPoints ?? 0)}
              sub="1 pt per completed campaign"
            />
            <StatTile
              label="Early bird"
              value={formatPoints(data?.earlyPoints ?? 0)}
              sub="Up to 3 pts split by submit order"
            />
            <StatTile
              label="Campaigns joined"
              value={String(data?.campaignsParticipated ?? 0)}
            />
            <StatTile
              label="Last awarded"
              value={
                data?.lastAwardedAt
                  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                      new Date(data.lastAwardedAt),
                    )
                  : "—"
              }
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-lg">Points history</h2>
            </div>
            {data?.entries.length ? (
              <div className="rounded-2xl border border-border/60 panel-glass overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Campaign</th>
                        <th className="px-4 py-3 font-medium">Rank</th>
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
                          <td className="px-4 py-3 tabular-nums">#{entry.rank}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {formatPoints(entry.participationPoints)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-primary">
                            {formatPoints(entry.earlyPoints)}
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
              <div className="panel-glass rounded-2xl border border-border/60 p-8 text-center">
                <p className="font-medium">No points yet</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Join a KOL campaign, submit your engagement, and earn points when the campaign
                  ends. Earlier submissions earn a larger share of the 3-point early-bird pool.
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
