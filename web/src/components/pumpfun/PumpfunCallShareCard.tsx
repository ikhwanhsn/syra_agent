import { forwardRef } from "react";
import type { PumpfunScanRecord } from "@/lib/pumpfunScanHistoryApi";
import type { PumpfunCallShareDesignId } from "@/components/pumpfun/pumpfunCallShareDesigns";
import {
  PumpfunCallShareCardClassic,
  PumpfunCallShareCardHero,
  PumpfunCallShareCardIntel,
  PumpfunCallShareCardSignal,
  PumpfunCallShareCardTerminal,
} from "@/components/pumpfun/pumpfunCallShareVariants";
export {
  PUMPFUN_CALL_SHARE_WIDTH,
  PUMPFUN_CALL_SHARE_HEIGHT,
} from "@/components/pumpfun/pumpfunCallShareDimensions";

const SHARE_CARD_BY_DESIGN = {
  intel: PumpfunCallShareCardIntel,
  terminal: PumpfunCallShareCardTerminal,
  hero: PumpfunCallShareCardHero,
  classic: PumpfunCallShareCardClassic,
  signal: PumpfunCallShareCardSignal,
} as const;

export interface PumpfunCallShareCardProps {
  record: PumpfunScanRecord;
  design?: PumpfunCallShareDesignId;
  className?: string;
}

export const PumpfunCallShareCard = forwardRef<HTMLDivElement, PumpfunCallShareCardProps>(
  function PumpfunCallShareCard({ record, design = "intel", className }, ref) {
    const Component = SHARE_CARD_BY_DESIGN[design];
    return <Component ref={ref} record={record} className={className} />;
  },
);
