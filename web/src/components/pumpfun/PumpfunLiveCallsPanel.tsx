import { useMemo, useState } from "react";
import { Radar, TrendingUp } from "lucide-react";
import { PumpfunListPanelSkeleton } from "@/components/pumpfun/PumpfunListPanelSkeleton";
import {
  matchesTokenSearch,
  PumpfunListToolbar,
  type PumpfunListFilterOption,
} from "@/components/pumpfun/PumpfunListToolbar";
import { useDelayedMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { PUMPFUN_LIST_LIMIT, usePumpfunLiveCalls } from "@/hooks/usePumpfunScanHistory";
import {
  formatCompactUsd,
  formatGainMultiplier,
  truncateWallet,
  type PumpfunLiveCallRecord,
} from "@/lib/pumpfunScanHistoryApi";
import { cn } from "@/lib/utils";

const LIVE_FILTERS: readonly PumpfunListFilterOption[] = [
  { value: "all", label: "All calls" },
  { value: "alpha", label: "High alpha" },
  { value: "runners", label: "Runners" },
] as const;

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

function scoreBadgeClass(score: number): string {
  if (score >= 75) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
  if (score >= 50) return "border-amber-500/40 bg-amber-500/10 text-amber-400";
  return "border-rose-500/40 bg-rose-500/10 text-rose-400";
}

function filterLiveRecord(record: PumpfunLiveCallRecord, filter: string): boolean {
  if (filter === "alpha") return record.syraAlphaScore >= 65;
  if (filter === "runners") return (record.peakGainMultiplier ?? 0) >= 1.05;
  return true;
}

interface LiveCallRowProps {
  record: PumpfunLiveCallRecord;
  onScan: (mint: string) => void;
  scanning: boolean;
}

function LiveCallRow({ record, onScan, scanning }: LiveCallRowProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/40 py-4 last:border-0 sm:flex-row sm:items-center">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity hover:opacity-90"
        onClick={() => onScan(record.mint)}
        disabled={scanning}
      >
        {record.imageUri ? (
          <img
            src={record.imageUri}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl border border-border/60 object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-xs font-bold">
            {record.symbol.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{record.name}</p>
          <p className="text-xs text-muted-foreground">
            ${record.symbol} · {formatRelativeTime(record.feedAt)}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">
            {truncateWallet(record.callerWallet, 4)} · mcap {formatCompactUsd(record.scanMarketCapUsd)}
          </p>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {record.peakGainMultiplier != null && record.peakGainMultiplier >= 1.05 ? (
          <span className="inline-flex min-w-[56px] items-center justify-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold text-emerald-400">
            <TrendingUp className="h-3 w-3" aria-hidden />
            {formatGainMultiplier(record.peakGainMultiplier)}
          </span>
        ) : null}
        <span
          className={cn(
            "inline-flex min-w-[44px] items-center justify-center rounded-full border px-2.5 py-1 font-mono text-xs font-bold tabular-nums",
            scoreBadgeClass(record.syraAlphaScore),
          )}
        >
          {record.syraAlphaScore}
        </span>
        <Button
          type="button"
          variant="neon"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => onScan(record.mint)}
          disabled={scanning}
        >
          <Radar className="h-3.5 w-3.5" />
          Scan
        </Button>
      </div>
    </div>
  );
}

export interface PumpfunLiveCallsPanelProps {
  onScanMint: (mint: string) => void | Promise<void>;
  scanning?: boolean;
}

export function PumpfunLiveCallsPanel({ onScanMint, scanning = false }: PumpfunLiveCallsPanelProps) {
  const liveQ = usePumpfunLiveCalls(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const records = useMemo(
    () => (liveQ.data?.items ?? []).slice(0, PUMPFUN_LIST_LIMIT),
    [liveQ.data?.items],
  );

  const filtered = useMemo(() => {
    return records.filter(
      (record) =>
        filterLiveRecord(record, filter) &&
        matchesTokenSearch(search, [
          record.symbol,
          record.name,
          record.mint,
          record.callerWallet,
        ]),
    );
  }, [records, search, filter]);

  const showSkeleton = useDelayedMinimumSkeleton(liveQ.isLoading, 450);

  if (showSkeleton) {
    return <PumpfunListPanelSkeleton rows={10} />;
  }

  if (liveQ.isError) {
    return (
      <Card className={cn(overviewCardShell, "p-6")}>
        <p className="text-sm text-destructive">
          {liveQ.error instanceof Error ? liveQ.error.message : "Failed to load live calls"}
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => liveQ.refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card className={overviewCardShell}>
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Live calls</h2>
            <p className="text-xs text-muted-foreground">
              Latest {PUMPFUN_LIST_LIMIT} community scans — tap a token to analyze.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => liveQ.refetch()}
            disabled={liveQ.isFetching}
          >
            Refresh
          </Button>
        </div>

        <PumpfunListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search symbol, name, mint…"
          filter={filter}
          onFilterChange={setFilter}
          filterOptions={LIVE_FILTERS}
          resultCount={filtered.length}
          totalCount={records.length}
          className="mb-4"
        />

        {records.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No live scans yet. Be the first to scan a token.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No calls match your search or filter.
          </p>
        ) : (
          <div>
            {filtered.map((record) => (
              <LiveCallRow
                key={`${record.callId}-${record.feedAt}`}
                record={record}
                onScan={onScanMint}
                scanning={scanning}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
