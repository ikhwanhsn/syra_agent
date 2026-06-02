import { CheckCircle } from "lucide-react";
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
import { PLAYGROUND_DRAWER_Z } from "@/components/playground/playgroundStyles";
import type { PlaygroundPaymentLane } from "@/lib/paymentLane";
import { cn } from "@/lib/utils";
import type { ApiResponse, PaymentDetails, RequestStatus } from "@/types/api";

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
  onRunAgain,
  onPayAndRetry,
  onResend,
}: PlaygroundResponseSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        overlayClassName={PLAYGROUND_DRAWER_Z}
        className={cn(
          PLAYGROUND_DRAWER_Z,
          "flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg md:max-w-xl lg:max-w-2xl",
        )}
      >
        <SheetHeader className="shrink-0 space-y-2 border-b border-border/60 px-6 py-4 pr-12 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="text-base font-semibold leading-snug">Response</SheetTitle>
            <PlaygroundStatusPill status={status} />
          </div>
          <SheetDescription className="text-left">
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {title}
              {subtitle ? ` · ${subtitle}` : null}
            </span>
          </SheetDescription>
          {onRunAgain ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              disabled={isLoading}
              onClick={onRunAgain}
            >
              Run again
            </Button>
          ) : null}
        </SheetHeader>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {status === "success" ? (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  Payment accepted
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
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
