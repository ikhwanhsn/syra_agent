import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChangePill,
  LevelChip,
  RiseTradeButton,
  StatTile,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  formatRelativeAge,
} from "@/components/rise/RiseShared";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";

export type BubbleDetailCopy = {
  viewToken: string;
  subtitle: string;
  kpiPrice: string;
  kpi24h: string;
  kpiMcap: string;
  kpiFloorMcap: string;
  kpiVol24h: string;
  kpiHolders: string;
  kpiAge: string;
  kpiLevel: string;
};

type BubbleDetailDialogProps = {
  /** When null, dialog stays closed. */
  market: RiseMarketRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewToken: (market: RiseMarketRow) => void;
  copy: BubbleDetailCopy;
};

export function BubbleDetailDialog({ market, open, onOpenChange, onViewToken, copy }: BubbleDetailDialogProps) {
  const m = market;
  return (
    <Dialog open={open && m !== null} onOpenChange={onOpenChange}>
      {m ? (
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border/60 sm:max-w-md">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <TokenAvatar imageUrl={m.imageUrl} symbol={m.symbol} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-left text-xl">{m.symbol ? `$${m.symbol}` : "—"}</DialogTitle>
                  <VerifiedBadge verified={m.isVerified} />
                  <LevelChip level={m.level} />
                </div>
                <DialogDescription className="text-left">{m.name || copy.subtitle}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatTile label={copy.kpiPrice} value={formatPriceSmart(m.priceUsd)} />
            <div className="rounded-xl border border-border/40 bg-background/30 p-3 shadow-sm sm:col-span-1">
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-[0.65rem]">
                {copy.kpi24h}
              </p>
              <div className="mt-1">
                <ChangePill pct={m.priceChange24hPct} />
              </div>
            </div>
            <StatTile label={copy.kpiMcap} value={formatUsd(m.marketCapUsd, { compact: true })} />
            <StatTile label={copy.kpiFloorMcap} value={formatUsd(m.floorMarketCapUsd, { compact: true })} />
            <StatTile label={copy.kpiVol24h} value={formatUsd(m.volume24hUsd, { compact: true })} />
            <StatTile label={copy.kpiHolders} value={formatInt(m.holders)} />
            <StatTile label={copy.kpiAge} value={formatRelativeAge(m.ageHours)} />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              <RiseTradeButton mint={m.mint} size="md" className="w-full sm:w-auto" />
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => onViewToken(m)}>
                {copy.viewToken}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
