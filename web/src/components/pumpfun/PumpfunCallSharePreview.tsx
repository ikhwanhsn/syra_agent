import type { Ref } from "react";
import { PumpfunCallShareCard } from "@/components/pumpfun/PumpfunCallShareCard";
import type { PumpfunCallShareDesignId } from "@/components/pumpfun/pumpfunCallShareDesigns";
import {
  PUMPFUN_CALL_SHARE_HEIGHT,
  PUMPFUN_CALL_SHARE_PREVIEW_HEIGHT,
  PUMPFUN_CALL_SHARE_PREVIEW_SCALE,
  PUMPFUN_CALL_SHARE_PREVIEW_WIDTH,
  PUMPFUN_CALL_SHARE_WIDTH,
} from "@/components/pumpfun/pumpfunCallShareDimensions";
import type { PumpfunScanRecord } from "@/lib/pumpfunScanHistoryApi";
import { cn } from "@/lib/utils";

export interface PumpfunCallSharePreviewProps {
  record: PumpfunScanRecord;
  design: PumpfunCallShareDesignId;
  className?: string;
  frameClassName?: string;
}

/** Scales the export card for modal/page preview only — not used for capture. */
export function PumpfunCallSharePreview({
  record,
  design,
  className,
  frameClassName,
}: PumpfunCallSharePreviewProps) {
  return (
    <div
      className={cn("mx-auto w-full", className)}
      style={{ maxWidth: PUMPFUN_CALL_SHARE_PREVIEW_WIDTH }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border border-border/60 bg-[#030303] shadow-2xl",
          frameClassName,
        )}
        style={{
          width: PUMPFUN_CALL_SHARE_PREVIEW_WIDTH,
          height: PUMPFUN_CALL_SHARE_PREVIEW_HEIGHT,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: PUMPFUN_CALL_SHARE_WIDTH,
            height: PUMPFUN_CALL_SHARE_HEIGHT,
            transform: `scale(${PUMPFUN_CALL_SHARE_PREVIEW_SCALE})`,
            transformOrigin: "top left",
            pointerEvents: "none",
          }}
        >
          <PumpfunCallShareCard record={record} design={design} />
        </div>
      </div>
    </div>
  );
}
