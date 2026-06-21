import { useState } from "react";
import { ExternalLink, Loader2, Share2, TrendingUp } from "lucide-react";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PumpfunCallShareModal } from "@/components/pumpfun/PumpfunCallShareModal";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { usePumpfunScanHistory } from "@/hooks/usePumpfunScanHistory";
import {
  formatCompactUsd,
  formatGainMultiplier,
  type PumpfunScanRecord,
} from "@/lib/pumpfunScanHistoryApi";
import { cn } from "@/lib/utils";

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

interface HistoryRowProps {
  record: PumpfunScanRecord;
  onShare: (record: PumpfunScanRecord) => void;
}

function HistoryRow({ record, onShare }: HistoryRowProps) {
  const peakGain = record.peakGainMultiplier ?? record.gainMultiplier;

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
          <Link to={`/pumpfun?mint=${encodeURIComponent(record.mint)}`}>
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
  enabled: boolean;
  authPending?: boolean;
}

export function PumpfunScanHistoryPanel({ enabled, authPending }: PumpfunScanHistoryPanelProps) {
  const historyQ = usePumpfunScanHistory(enabled);
  const [shareRecord, setShareRecord] = useState<PumpfunScanRecord | null>(null);

  if (authPending) {
    return (
      <Card className={cn(overviewCardShell, "flex items-center justify-center gap-2 p-12")}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading your call history…</p>
      </Card>
    );
  }

  if (!enabled) {
    return (
      <Card className={cn(overviewCardShell, "p-8 text-center")}>
        <p className="text-sm text-muted-foreground">
          Connect your wallet to view your scan history and flex cards.
        </p>
      </Card>
    );
  }

  if (historyQ.isLoading) {
    return (
      <Card className={cn(overviewCardShell, "flex items-center justify-center p-12")}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
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

  const records = historyQ.data ?? [];

  return (
    <>
      <Card className={overviewCardShell}>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Your calls</h2>
              <p className="text-xs text-muted-foreground">
                One entry per token — your first call is locked in. Peak gain updates on rescan.
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

          {records.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No scans yet. Scan a token to start building your call history.
            </p>
          ) : (
            <div>
              {records.map((record) => (
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
