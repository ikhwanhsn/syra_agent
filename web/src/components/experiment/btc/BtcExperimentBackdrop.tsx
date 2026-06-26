import { cn } from "@/lib/utils";

/** Ambient backdrop for BTC quant experiment desk. */
export function BtcExperimentBackdrop() {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(38_92%_50%/0.12),transparent)]",
      )}
      aria-hidden
    />
  );
}
