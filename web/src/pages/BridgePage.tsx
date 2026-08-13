import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { RelayBridgeProvider } from "@/components/bridge/RelayBridgeProvider";
import { BridgeWidget } from "@/components/bridge/BridgeWidget";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export default function BridgePage() {
  return (
    <div className="relative flex min-h-full flex-col">
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative z-[1] flex flex-1 flex-col",
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
        )}
      >
        <div className="mb-6 max-w-2xl sm:mb-8">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Bridge assets
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Move tokens across chains instantly. Routes powered by Relay.
          </p>
        </div>

        <div className="flex w-full flex-1 justify-center lg:justify-start">
          <RelayBridgeProvider>
            <BridgeWidget />
          </RelayBridgeProvider>
        </div>
      </div>
    </div>
  );
}
