import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { SwapCard } from "@/components/swap/SwapCard";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export default function SwapPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative flex flex-1 flex-col items-center",
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
        )}
      >
        <div className="mb-6 w-full max-w-md text-center sm:mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Swap tokens
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Trade any Solana token at the best price. Routes powered by Jupiter.
          </p>
        </div>
        <div className="w-full max-w-md">
          <SwapCard />
        </div>
      </div>
    </div>
  );
}
