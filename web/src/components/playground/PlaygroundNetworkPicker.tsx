import { Button } from "@/components/ui/button";
import {
  PLAYGROUND_PAYMENT_CHAINS,
  type PaymentChainId,
  type PaymentOptionsByChain,
  hasPaymentOptionsByChain,
} from "@/lib/x402Client";
import type { PlaygroundPaymentLane } from "@/lib/paymentLane";
import { cn } from "@/lib/utils";

interface PlaygroundNetworkPickerProps {
  selectedPaymentChain: PaymentChainId;
  onSelectPaymentChain: (chain: PaymentChainId) => void;
  paymentOptionsByChain: PaymentOptionsByChain;
  paymentLane: PlaygroundPaymentLane;
  className?: string;
}

export function PlaygroundNetworkPicker({
  selectedPaymentChain,
  onSelectPaymentChain,
  paymentOptionsByChain,
  paymentLane,
  className,
}: PlaygroundNetworkPickerProps) {
  if (paymentLane === "mpp") return null;

  const has402Options = hasPaymentOptionsByChain(paymentOptionsByChain);

  const chainAvailable = (id: PaymentChainId) =>
    !has402Options || Boolean(paymentOptionsByChain[id]);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Payment network
      </p>
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label="Payment network"
      >
        {PLAYGROUND_PAYMENT_CHAINS.map((c) => {
          const available = chainAvailable(c.id);
          return (
            <Button
              key={c.id}
              type="button"
              size="sm"
              role="tab"
              aria-selected={selectedPaymentChain === c.id}
              aria-disabled={!available}
              variant={selectedPaymentChain === c.id ? "default" : "outline"}
              className={cn(
                "h-7 rounded-full px-2.5 text-[11px]",
                !available && "cursor-not-allowed opacity-45",
              )}
              disabled={!available}
              onClick={() => available && onSelectPaymentChain(c.id)}
            >
              {c.label}
            </Button>
          );
        })}
      </div>
      {!has402Options ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          PayAI mainnets only. Solana is the default USDC rail.
        </p>
      ) : null}
    </div>
  );
}
