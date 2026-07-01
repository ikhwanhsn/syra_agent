import { Crown, Medal, Share2, Trophy } from "lucide-react";
import { PumpfunListPanelSkeleton } from "@/components/pumpfun/PumpfunListPanelSkeleton";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PumpfunCallShareModal } from "@/components/pumpfun/PumpfunCallShareModal";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { usePumpfunCallerLeaderboard } from "@/hooks/usePumpfunScanHistory";
import {
  formatCompactUsd,
  formatGainMultiplier,
  truncateWallet,
  type PumpfunCallerLeaderboardEntry,
  type PumpfunScanRecord,
} from "@/lib/pumpfunScanHistoryApi";
import { cn } from "@/lib/utils";

function rankIcon(rank: number) {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-400" aria-hidden />;
  if (rank === 2) return <Medal className="h-4 w-4 text-zinc-300" aria-hidden />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" aria-hidden />;
  return (
    <span className="font-mono text-xs tabular-nums text-muted-foreground">#{rank}</span>
  );
}

function entryToShareRecord(entry: PumpfunCallerLeaderboardEntry): PumpfunScanRecord {
  const top = entry.topCall;
  return {
    callId: top.callId,
    callerWallet: entry.callerWallet,
    mint: top.mint,
    symbol: top.symbol,
    name: top.name,
    imageUri: top.imageUri,
    scanPriceUsd: null,
    scanMarketCapUsd: top.scanMarketCapUsd,
    currentMarketCapUsd: top.peakMarketCapUsd,
    peakMarketCapUsd: top.peakMarketCapUsd,
    gainMultiplier: top.peakGainMultiplier,
    peakGainMultiplier: top.peakGainMultiplier,
    syraAlphaScore: 0,
    syraAlphaVerdict: "",
    syraAlphaTone: "warning",
    scannedAt: top.scannedAt,
    lastRefreshedAt: null,
  };
}

interface LeaderboardRowProps {
  entry: PumpfunCallerLeaderboardEntry;
  onShareTop: (entry: PumpfunCallerLeaderboardEntry) => void;
}

function LeaderboardRow({ entry, onShareTop }: LeaderboardRowProps) {
  const top = entry.topCall;

  return (
    <div className="flex flex-col gap-3 border-b border-border/40 py-4 last:border-0 lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">{rankIcon(entry.rank)}</div>
        {top.imageUri ? (
          <img
            src={top.imageUri}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg border border-border/60 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-xs font-bold">
            {top.symbol.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-mono text-sm font-medium">{truncateWallet(entry.callerWallet, 6)}</p>
          <p className="text-xs text-muted-foreground">
            Best: ${top.symbol} · {entry.totalCalls} call{entry.totalCalls !== 1 ? "s" : ""}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            {entry.calls100x > 0
              ? `${entry.calls100x}× 100x+ · `
              : entry.calls10x > 0
                ? `${entry.calls10x}× 10x+ · `
                : ""}
            Peak {formatCompactUsd(top.peakMarketCapUsd)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 pl-11 lg:pl-0">
        <span className="inline-flex min-w-[80px] items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-sm font-bold tabular-nums text-emerald-400">
          {formatGainMultiplier(entry.bestPeakGain)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => onShareTop(entry)}
        >
          <Share2 className="h-3.5 w-3.5" />
          Top call
        </Button>
      </div>
    </div>
  );
}

export function PumpfunCallerLeaderboard() {
  const leaderboardQ = usePumpfunCallerLeaderboard();
  const [shareRecord, setShareRecord] = useState<PumpfunScanRecord | null>(null);

  const showSkeleton = useMinimumSkeleton(leaderboardQ.isLoading);

  if (showSkeleton) {
    return <PumpfunListPanelSkeleton variant="leaderboard" />;
  }

  if (leaderboardQ.isError) {
    return (
      <Card className={cn(overviewCardShell, "p-6")}>
        <p className="text-sm text-destructive">
          {leaderboardQ.error instanceof Error
            ? leaderboardQ.error.message
            : "Failed to load leaderboard"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => leaderboardQ.refetch()}
        >
          Retry
        </Button>
      </Card>
    );
  }

  const entries = leaderboardQ.data ?? [];

  return (
    <>
      <Card className={overviewCardShell}>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
              <Trophy className="h-4 w-4 text-yellow-400" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">Best callers</h2>
              <p className="text-xs text-muted-foreground">
                Ranked by peak gain from scan call — flex the alpha.
              </p>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No callers on the board yet. Be the first to scan and call a runner.
            </p>
          ) : (
            <div>
              {entries.map((entry) => (
                <LeaderboardRow
                  key={entry.callerWallet}
                  entry={entry}
                  onShareTop={(e) => setShareRecord(entryToShareRecord(e))}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {shareRecord ? (
        <PumpfunCallShareModal
          open
          onClose={() => setShareRecord(null)}
          record={shareRecord}
        />
      ) : null}
    </>
  );
}
