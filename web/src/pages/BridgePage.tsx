import { useCallback, useMemo, useState } from "react";
import type { Token } from "@relayprotocol/relay-kit-ui";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { RelayBridgeProvider } from "@/components/bridge/RelayBridgeProvider";
import { BridgeWidget } from "@/components/bridge/BridgeWidget";
import { SwapMarketPanel } from "@/components/swap/SwapMarketPanel";
import {
  DEFAULT_BRIDGE_FROM,
  DEFAULT_BRIDGE_TO,
  relayTokenToSwapToken,
} from "@/lib/bridgeMarketToken";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export default function BridgePage() {
  const [fromToken, setFromToken] = useState<Token | undefined>(DEFAULT_BRIDGE_FROM);
  const [toToken, setToToken] = useState<Token | undefined>(DEFAULT_BRIDGE_TO);

  const handleTokensChange = useCallback(
    (tokens: { from?: Token; to?: Token }) => {
      setFromToken(tokens.from);
      setToToken(tokens.to);
    },
    [],
  );

  const inputToken = useMemo(
    () => relayTokenToSwapToken(fromToken),
    [fromToken],
  );
  const outputToken = useMemo(
    () => relayTokenToSwapToken(toToken),
    [toToken],
  );

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

        {/*
          Default stretch alignment so the left column is as tall as the market panel.
          Sticky needs a tall parent; items-start was collapsing it to the card height.
        */}
        <div className="grid w-full flex-1 gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] xl:gap-8">
          <aside className="min-w-0">
            <div className="lg:sticky lg:top-4 lg:z-20">
              <RelayBridgeProvider>
                <BridgeWidget onTokensChange={handleTokensChange} />
              </RelayBridgeProvider>
            </div>
          </aside>
          <SwapMarketPanel inputToken={inputToken} outputToken={outputToken} />
        </div>
      </div>
    </div>
  );
}
