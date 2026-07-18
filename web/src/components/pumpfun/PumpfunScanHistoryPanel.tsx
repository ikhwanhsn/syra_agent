import { useMemo, useState } from "react";
import { ExternalLink, Share2, TrendingUp } from "lucide-react";
import { PumpfunListPanelSkeleton } from "@/components/pumpfun/PumpfunListPanelSkeleton";
import {
  matchesTokenSearch,
  PumpfunListToolbar,
  type PumpfunListFilterOption,
} from "@/components/pumpfun/PumpfunListToolbar";
import { useDelayedMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PumpfunCallShareModal } from "@/components/pumpfun/PumpfunCallShareModal";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { PUMPFUN_LIST_LIMIT, usePumpfunScanHistory } from "@/hooks/usePumpfunScanHistory";
import {
  formatCompactUsd,
  formatGainMultiplier,
  type PumpfunScanRecord,
} from "@/lib/pumpfunScanHistoryApi";
import { cn } from "@/lib/utils";

const HISTORY_FILTERS: readonly PumpfunListFilterOption[] = [
  { value: "all", label: "All calls" },
  { value: "winners", label: "2x+" },
  { value: "10x", label: "10x+" },
  { value: "flat", label: "Under 2x" },
] as const;

function gainBadgeClass(gain: number | null): string {
  const g = gain ?? 1;
  if (g >= 100) return "border-yellow-500/40 bg-yellow-500/10 text-yellow-400";
  if (g >= 10) return "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
  if (g >= 2) return "border-blue-500/40 bg-blue-500/10 text-blue-400";
  return "border-border/60 bg-muted/30 text-muted-foreground";
}

function formatScanTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function peakGainOf(record: PumpfunScanRecord): number {
  return record.peakGainMultiplier ?? record.gainMultiplier ?? 1;
}

function filterHistoryRecord(record: PumpfunScanRecord, filter: string): boolean {
  const peak = peakGainOf(record);
  if (filter === "winners") return peak >= 2;
  if (filter === "10x") return peak >= 10;
  if (filter === "flat") return peak < 2;
  return true;
}

interface HistoryRowProps {
  record: PumpfunScanRecord;
  onShare: (record: PumpfunScanRecord) => void;
}

function HistoryRow({ record, onShare }: HistoryRowProps) {
  const peakGain = peakGainOf(record);

  return (
    <div className="flex flex-col gap-3 border-b border-border/40 py-4 last:border-0 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
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
            ${record.symbol} · {formatScanTime(record.scannedAt)}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/80">
            Call {formatCompactUsd(record.scanMarketCapUsd)} → Peak{" "}
            {formatCompactUsd(record.peakMarketCapUsd)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span
          className={cn(
            "inline-flex min-w-[72px] items-center justify-center gap-1 rounded-full border px-3 py-1 font-mono text-sm font-bold tabular-nums",
            gainBadgeClass(peakGain),
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          {formatGainMultiplier(peakGain)}
        </span>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" asChild>
          <Link to={`/analyzer?mint=${encodeURIComponent(record.mint)}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </Link>
        </Button>
        <Button
          type="button"
          variant="neon"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => onShare(record)}
        >
          <Share2 className="h-3.5 w-3.5" />
          Flex
        </Button>
      </div>
    </div>
  );
}

export interface PumpfunScanHistoryPanelProps {
  walletConnected: boolean;
  syraAuthenticated: boolean;
  authPending?: boolean;
  signingIn?: boolean;
  onConnectWallet?: () => void;
  onSignIn?: () => void | Promise<void>;
}

export function PumpfunScanHistoryPanel({
  walletConnected,
  syraAuthenticated,
  authPending,
  signingIn,
  onConnectWallet,
  onSignIn,
}: PumpfunScanHistoryPanelProps) {
  const historyEnabled = walletConnected && syraAuthenticated;
  const historyQ = usePumpfunScanHistory(historyEnabled);
  const [shareRecord, setShareRecord] = useState<PumpfunScanRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const sessionLoading = Boolean(authPending || signingIn);
  const showSessionSkeleton = useDelayedMinimumSkeleton(sessionLoading, 450);
  const showHistorySkeleton = useDelayedMinimumSkeleton(historyQ.isLoading, 450);

  const records = useMemo(
    () => (historyQ.data ?? []).slice(0, PUMPFUN_LIST_LIMIT),
    [historyQ.data],
  );

  const filtered = useMemo(() => {
    return records.filter(
      (record) =>
        filterHistoryRecord(record, filter) &&
        matchesTokenSearch(search, [record.symbol, record.name, record.mint]),
    );
  }, [records, search, filter]);

  if (!walletConnected) {
    return (
      <Card className={cn(overviewCardShell, "p-8 text-center")}>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to view your scan history and flex cards.
        </p>
        {onConnectWallet ? (
          <Button type="button" variant="neon" size="sm" className="mt-4" onClick={onConnectWallet}>
            Connect wallet
          </Button>
        ) : null}
      </Card>
    );
  }

  if (showSessionSkeleton) {
    return <PumpfunListPanelSkeleton rows={10} />;
  }

  if (!syraAuthenticated) {
    return (
      <Card className={cn(overviewCardShell, "p-8 text-center")}>
        <p className="text-sm text-muted-foreground">
          Sign in with your connected wallet to view your scan history and flex cards.
        </p>
        {onSignIn ? (
          <Button type="button" variant="neon" size="sm" className="mt-4" onClick={() => void onSignIn()}>
            Sign in
          </Button>
        ) : null}
      </Card>
    );
  }

  if (showHistorySkeleton) {
    return <PumpfunListPanelSkeleton rows={10} />;
  }

  if (historyQ.isError) {
    return (
      <Card className={cn(overviewCardShell, "p-6")}>
        <p className="text-sm text-destructive">
          {historyQ.error instanceof Error ? historyQ.error.message : "Failed to load history"}
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => historyQ.refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card className={overviewCardShell}>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Your calls</h2>
              <p className="text-xs text-muted-foreground">
                Latest {PUMPFUN_LIST_LIMIT} calls — peak gain updates on rescan.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => historyQ.refetch()}
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
            filterOptions={HISTORY_FILTERS}
            resultCount={filtered.length}
            totalCount={records.length}
            className="mb-4"
          />

          {records.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No scans yet. Scan a token to start building your call history.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No calls match your search or filter.
            </p>
          ) : (
            <div>
              {filtered.map((record) => (
                <HistoryRow key={record.callId} record={record} onShare={setShareRecord} />
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
