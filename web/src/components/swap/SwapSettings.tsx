import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Popover } from "@/components/interior/popover";
import { BottomSheet } from "@/components/motion/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const SLIPPAGE_PRESETS = [50, 100, 300] as const;

export interface SwapSettingsProps {
  slippageBps: number;
  onSlippageChange: (bps: number) => void;
  disabled?: boolean;
}

function SlippageControls({
  slippageBps,
  onSlippageChange,
}: {
  slippageBps: number;
  onSlippageChange: (bps: number) => void;
}) {
  const customPct = (slippageBps / 100).toFixed(2);
  const isCustom = !SLIPPAGE_PRESETS.includes(slippageBps as (typeof SLIPPAGE_PRESETS)[number]);

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-medium text-muted-foreground">Slippage tolerance</Label>
        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
          Max price movement before the swap reverts.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SLIPPAGE_PRESETS.map((bps) => (
          <button
            key={bps}
            type="button"
            onClick={() => onSlippageChange(bps)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              slippageBps === bps
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground",
            )}
          >
            {(bps / 100).toFixed(2)}%
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0.01}
          max={50}
          step={0.01}
          value={isCustom ? customPct : ""}
          placeholder="Custom"
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n > 0 && n <= 50) {
              onSlippageChange(Math.round(n * 100));
            }
          }}
          className="h-9 rounded-lg font-mono text-sm"
        />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );
}

export function SwapSettings({ slippageBps, onSlippageChange, disabled }: SwapSettingsProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const trigger = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
      onClick={isMobile ? () => setOpen(true) : undefined}
    >
      <Settings2 className="h-3.5 w-3.5" />
      {(slippageBps / 100).toFixed(2)}%
    </Button>
  );

  const controls = (
    <SlippageControls slippageBps={slippageBps} onSlippageChange={onSlippageChange} />
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <BottomSheet
          open={open}
          onOpenChange={setOpen}
          title="Swap settings"
          snapPoints={["auto"]}
        >
          {controls}
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover
      asChild
      label="Swap settings"
      side="bottom"
      align="end"
      className="w-72 rounded-xl border-border/50 p-4"
      trigger={trigger}
    >
      {controls}
    </Popover>
  );
}
