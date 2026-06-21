import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import type { PumpfunScanRecord } from "@/lib/pumpfunScanHistoryApi";
import { cn } from "@/lib/utils";

export interface PumpfunScanShareBarProps {
  scanRecord: PumpfunScanRecord | null;
  onShare: () => void;
  className?: string;
}

export function PumpfunScanShareBar({ scanRecord, onShare, className }: PumpfunScanShareBarProps) {
  if (!scanRecord) return null;

  return (
    <div
      className={cn(
        overviewCardShell,
        "flex flex-col gap-3 border-emerald-500/25 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        className,
      )}
    >
      <div>
        <p className="text-sm font-medium">Call saved to your history</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Flex this scan on X, Telegram, or Discord with a branded PNG card.
        </p>
      </div>
      <Button type="button" variant="neon" size="sm" className="shrink-0 gap-1.5" onClick={onShare}>
        <Share2 className="h-4 w-4" />
        Flex this call
      </Button>
    </div>
  );
}
