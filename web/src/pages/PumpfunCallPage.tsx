import { Loader2, Share2 } from "lucide-react";
import { useParams } from "@/lib/navigation";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { PumpfunCallSharePreview } from "@/components/pumpfun/PumpfunCallSharePreview";
import { PumpfunCallShareDesignPicker } from "@/components/pumpfun/PumpfunCallShareDesignPicker";
import { PumpfunCallShareModal } from "@/components/pumpfun/PumpfunCallShareModal";
import {
  getStoredPumpfunShareDesign,
  setStoredPumpfunShareDesign,
  type PumpfunCallShareDesignId,
} from "@/components/pumpfun/pumpfunCallShareDesigns";
import { usePumpfunScanCall } from "@/hooks/usePumpfunScanHistory";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PumpfunCallPage() {
  const { callId } = useParams<{ callId: string }>();
  const callQ = usePumpfunScanCall(callId ?? null);
  const [shareOpen, setShareOpen] = useState(false);
  const [design, setDesign] = useState<PumpfunCallShareDesignId>(getStoredPumpfunShareDesign);

  const handleDesignChange = useCallback((next: PumpfunCallShareDesignId) => {
    setDesign(next);
    setStoredPumpfunShareDesign(next);
  }, []);

  if (callQ.isLoading) {
    return (
      <div className="relative flex min-h-full items-center justify-center">
        <OverviewPageBackdrop />
        <Loader2 className="relative z-[1] h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (callQ.isError || !callQ.data) {
    return (
      <div className="relative min-h-full">
        <OverviewPageBackdrop />
        <div
          className={cn(
            DASHBOARD_CONTENT_SHELL,
            PAGE_PADDING_TOP_MEDIUM,
            PAGE_SAFE_AREA_BOTTOM,
            "relative z-[1] py-20 text-center",
          )}
        >
          <p className="text-sm text-muted-foreground">Call not found or expired.</p>
        </div>
      </div>
    );
  }

  const record = callQ.data;

  return (
    <div className="relative min-h-full">
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "relative z-[1] flex flex-col items-center gap-6 pb-14",
        )}
      >
        <div className="text-center">
          <h1 className="font-display text-xl font-semibold">Token call flex card</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ${record.symbol} · {record.name}
          </p>
        </div>

        <PumpfunCallShareDesignPicker
          value={design}
          onChange={handleDesignChange}
          className="w-full max-w-xl"
        />

        <PumpfunCallSharePreview record={record} design={design} />

        <Button type="button" variant="neon" className="gap-2" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4" />
          Share flex card
        </Button>
      </div>

      <PumpfunCallShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        record={record}
        initialDesign={design}
      />
    </div>
  );
}
