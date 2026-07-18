import { Crown, Medal, Share2, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { PumpfunListPanelSkeleton } from "@/components/pumpfun/PumpfunListPanelSkeleton";
import {
  matchesTokenSearch,
  PumpfunListToolbar,
  type PumpfunListFilterOption,
} from "@/components/pumpfun/PumpfunListToolbar";
import { useDelayedMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PumpfunCallShareModal } from "@/components/pumpfun/PumpfunCallShareModal";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { PUMPFUN_LIST_LIMIT, usePumpfunCallerLeaderboard } from "@/hooks/usePumpfunScanHistory";
import {
  formatCompactUsd,
  formatGainMultiplier,
  truncateWallet,
  type PumpfunCallerLeaderboardEntry,
  type PumpfunScanRecord,
} from "@/lib/pumpfunScanHistoryApi";
import { cn } from "@/lib/utils";

const CALLER_FILTERS: readonly PumpfunListFilterOption[] = [
  { value: "all", label: "All callers" },
  { value: "10x", label: "10x+ callers" },
  { value: "100x", label: "100x+ callers" },
] as const;

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

function filterCallerEntry(entry: PumpfunCallerLeaderboardEntry, filter: string): boolean {
  if (filter === "10x") return entry.calls10x > 0 || entry.bestPeakGain >= 10;
  if (filter === "100x") return entry.calls100x > 0 || entry.bestPeakGain >= 100;
  return true;
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const entries = useMemo(
    () => (leaderboardQ.data ?? []).slice(0, PUMPFUN_LIST_LIMIT),
    [leaderboardQ.data],
  );

  const filtered = useMemo(() => {
    return entries.filter(
      (entry) =>
        filterCallerEntry(entry, filter) &&
        matchesTokenSearch(search, [
          entry.callerWallet,
          entry.topCall.symbol,
          entry.topCall.name,
          entry.topCall.mint,
        ]),
    );
  }, [entries, search, filter]);

  const showSkeleton = useDelayedMinimumSkeleton(leaderboardQ.isLoading, 450);

  if (showSkeleton) {
    return <PumpfunListPanelSkeleton rows={10} variant="leaderboard" />;
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
                Top {PUMPFUN_LIST_LIMIT} by peak gain from scan call.
              </p>
            </div>
          </div>

          <PumpfunListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search wallet, symbol, name…"
            filter={filter}
            onFilterChange={setFilter}
            filterOptions={CALLER_FILTERS}
            resultCount={filtered.length}
            totalCount={entries.length}
            className="mb-4"
          />

          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No callers on the board yet. Be the first to scan and call a runner.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No callers match your search or filter.
            </p>
          ) : (
            <div>
              {filtered.map((entry) => (
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
