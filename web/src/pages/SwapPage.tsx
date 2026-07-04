import { useCallback, useState } from "react";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { SwapCard } from "@/components/swap/SwapCard";
import { SwapMarketPanel } from "@/components/swap/SwapMarketPanel";
import {
  DEFAULT_INPUT_TOKEN,
  DEFAULT_OUTPUT_TOKEN,
  type SelectedSwapToken,
} from "@/components/swap/TokenSelectDialog";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export default function SwapPage() {
  const [inputToken, setInputToken] = useState<SelectedSwapToken>(DEFAULT_INPUT_TOKEN);
  const [outputToken, setOutputToken] = useState<SelectedSwapToken>(DEFAULT_OUTPUT_TOKEN);

  const handleTokensChange = useCallback(
    (tokens: { input: SelectedSwapToken; output: SelectedSwapToken }) => {
      setInputToken(tokens.input);
      setOutputToken(tokens.output);
    },
    [],
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
            Swap tokens
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Trade any Solana token at the best price. Routes powered by Jupiter.
          </p>
        </div>

        {/*
          Default stretch alignment so the left column is as tall as the market panel.
          Sticky needs a tall parent; items-start was collapsing it to the card height.
        */}
        <div className="grid w-full flex-1 gap-6 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)] xl:gap-8">
          <aside className="min-w-0">
            <div className="lg:sticky lg:top-4 lg:z-20">
              <SwapCard onTokensChange={handleTokensChange} />
            </div>
          </aside>
          <SwapMarketPanel inputToken={inputToken} outputToken={outputToken} />
        </div>
      </div>
    </div>
  );
}
