import { CheckCircle2, RotateCw } from "lucide-react";
import { ResponseViewer } from "@/components/ResponseViewer";
import { PlaygroundStatusPill } from "@/components/playground/PlaygroundStatusPill";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/interior/drawer";
import {
  PLAYGROUND_DRAWER_Z,
  playgroundHeroGlow,
  playgroundPanelClass,
} from "@/components/playground/playgroundStyles";
import type { PlaygroundPaymentLane } from "@/lib/paymentLane";
import type { PaymentChainId, PaymentOptionsByChain } from "@/lib/x402Client";
import { cn } from "@/lib/utils";
import type { ApiResponse, PaymentDetails, RequestStatus } from "@/types/api";
import { PlaygroundNetworkPicker } from "@/components/playground/PlaygroundNetworkPicker";

interface PlaygroundResponseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  status: RequestStatus;
  response: ApiResponse | undefined;
  paymentDetails: PaymentDetails | undefined;
  paymentLane: PlaygroundPaymentLane;
  isLoading: boolean;
  selectedPaymentChain: PaymentChainId;
  onSelectPaymentChain: (chain: PaymentChainId) => void;
  paymentOptionsByChain: PaymentOptionsByChain;
  onRunAgain?: () => void;
  onPayAndRetry: () => void;
  onResend: () => void;
}

export function PlaygroundResponseSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  status,
  response,
  paymentDetails,
  paymentLane,
  isLoading,
  selectedPaymentChain,
  onSelectPaymentChain,
  paymentOptionsByChain,
  onRunAgain,
  onPayAndRetry,
  onResend,
}: PlaygroundResponseSheetProps) {
  const description = subtitle ? `${title} · ${subtitle}` : title;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      width={672}
      title="Response"
      description={description}
      closeLabel="Close response"
      rootClassName={PLAYGROUND_DRAWER_Z}
      overlayClassName={cn(PLAYGROUND_DRAWER_Z, "bg-background/70 backdrop-blur-sm")}
      className="border-l border-border/50 bg-background/95 backdrop-blur-xl"
      bare
      bodyClassName="custom-scrollbar relative px-6 py-5"
    >
      <div className={cn(playgroundHeroGlow, "opacity-70")} aria-hidden />
      <div className="relative z-[1] mb-5 space-y-3">
        <PlaygroundStatusPill status={status} />
        <PlaygroundNetworkPicker
          selectedPaymentChain={selectedPaymentChain}
          onSelectPaymentChain={onSelectPaymentChain}
          paymentOptionsByChain={paymentOptionsByChain}
          paymentLane={paymentLane}
        />
        {onRunAgain ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl"
            disabled={isLoading}
            onClick={onRunAgain}
          >
            <RotateCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Run again
          </Button>
        ) : null}
      </div>

      {status === "success" ? (
        <div
          className={cn(
            playgroundPanelClass,
            "relative z-[1] mb-5 flex items-start gap-3 border-emerald-500/25 bg-emerald-500/[0.06] p-4",
          )}
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Payment accepted
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Your unlocked API response is below.
            </p>
          </div>
        </div>
      ) : null}
      <div className="relative z-[1]">
        <ResponseViewer
          response={response}
          status={status}
          paymentDetails={paymentDetails}
          paymentLane={paymentLane}
          onPayAndRetry={onPayAndRetry}
          onResend={onResend}
        />
      </div>
    </Drawer>
  );
}
