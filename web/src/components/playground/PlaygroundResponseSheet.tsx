import { CheckCircle2, RotateCw } from "lucide-react";
import { ResponseViewer } from "@/components/ResponseViewer";
import { PlaygroundStatusPill } from "@/components/playground/PlaygroundStatusPill";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        overlayClassName={cn(PLAYGROUND_DRAWER_Z, "bg-background/70 backdrop-blur-sm")}
        className={cn(
          PLAYGROUND_DRAWER_Z,
          "flex h-full w-full flex-col gap-0 border-l border-border/50 bg-background/95 p-0 backdrop-blur-xl sm:max-w-lg md:max-w-xl lg:max-w-2xl",
        )}
      >
        <SheetHeader className="relative shrink-0 space-y-0 border-b border-border/50 px-6 py-5 pr-14 text-left">
          <div className={cn(playgroundHeroGlow, "opacity-70")} aria-hidden />
          <div className="relative z-[1] space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle className="font-display text-lg font-semibold tracking-tight">
                Response
              </SheetTitle>
              <PlaygroundStatusPill status={status} />
            </div>
            <SheetDescription className="text-left">
              <span className="line-clamp-2 text-sm text-muted-foreground">
                {title}
                {subtitle ? (
                  <>
                    <span className="mx-1.5 text-border">·</span>
                    <span className="font-mono text-xs">{subtitle}</span>
                  </>
                ) : null}
              </span>
            </SheetDescription>
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
        </SheetHeader>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {status === "success" ? (
            <div
              className={cn(
                playgroundPanelClass,
                "mb-5 flex items-start gap-3 border-emerald-500/25 bg-emerald-500/[0.06] p-4",
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
          <ResponseViewer
            response={response}
            status={status}
            paymentDetails={paymentDetails}
            paymentLane={paymentLane}
            onPayAndRetry={onPayAndRetry}
            onResend={onResend}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
