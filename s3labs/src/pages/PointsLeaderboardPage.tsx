import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";

import { SitePageShell } from "@/components/landing/SitePageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPointsLeaderboard } from "@/lib/kolApi";
import { pageContent } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 1) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

function PointsLeaderboardContent() {
  const leaderboardQuery = useQuery({
    queryKey: ["points-leaderboard"],
    queryFn: () => fetchPointsLeaderboard({ limit: 100 }),
    staleTime: 60_000,
  });

  const rows = leaderboardQuery.data?.leaderboard ?? [];

  return (
    <div className={cn(pageContent, "space-y-8 pb-20 min-w-0")}>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-full -ml-2">
          <Link to="/profile">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Profile
          </Link>
        </Button>
      </div>

      <header className="space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="heading-section text-2xl sm:text-3xl">Points leaderboard</h1>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Ranked by total S3Labs points (campaigns, daily claims, and referrals).
        </p>
      </header>

      {leaderboardQuery.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : rows.length === 0 ? (
        <div className="panel-glass rounded-2xl border border-border/60 p-8 text-center text-sm text-muted-foreground">
          No points yet — be the first on the board.
        </div>
      ) : (
        <div className="panel-glass overflow-hidden rounded-2xl border border-border/60 min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium sm:px-5">Rank</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Wallet</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Handle</th>
                  <th className="px-4 py-3 font-medium text-right sm:px-5">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((row) => (
                  <tr key={`${row.rank}-${row.wallet}`} className="hover:bg-muted/20">
                    <td className="px-4 py-3 tabular-nums font-semibold sm:px-5">{row.rank}</td>
                    <td className="px-4 py-3 font-mono text-xs sm:px-5 sm:text-sm">
                      {shortenAddress(row.wallet, 6)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground sm:px-5">
                      {row.handle ? (
                        <Link
                          to={`/kol/${encodeURIComponent(row.handle)}`}
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          @{row.handle}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold sm:px-5">
                      {formatPoints(row.totalPoints)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PointsLeaderboardPage() {
  return (
    <SitePageShell>
      <PointsLeaderboardContent />
    </SitePageShell>
  );
}
