import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { KolLeaderboardEntry } from "@/lib/kolApi";
import { shortenAddress } from "@/lib/solanaKol";

function formatSol(sol: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  }).format(sol);
}

interface CampaignLeaderboardProps {
  entries: KolLeaderboardEntry[];
  campaignStatus: string;
}

export function CampaignLeaderboard({ entries, campaignStatus }: CampaignLeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="panel-glass rounded-2xl p-8 text-center text-muted-foreground text-sm">
        No KOL submissions yet. Be the first to reply or quote the campaign post.
      </div>
    );
  }

  const payoutLabel = campaignStatus === "completed" ? "Paid" : "Projected";

  return (
    <div className="panel-glass rounded-2xl border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>KOL</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Likes</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead className="text-right">{payoutLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const payoutSol =
              entry.payout?.sol ??
              entry.projectedSol;
            return (
              <TableRow key={entry.id}>
                <TableCell className="font-mono text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">@{entry.authorHandle}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {shortenAddress(entry.kolWallet, 6)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {entry.mode}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{entry.latestScore.toFixed(1)}</TableCell>
                <TableCell className="text-right">{entry.latestMetrics.likeCount}</TableCell>
                <TableCell className="text-right">{entry.latestMetrics.viewCount}</TableCell>
                <TableCell className="text-right font-medium text-primary">
                  {formatSol(payoutSol)} SOL
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
