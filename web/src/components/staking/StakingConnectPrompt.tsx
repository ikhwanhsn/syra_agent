"use client";

import { Wallet } from "lucide-react";
import { WalletButton } from "@/components/WalletButton";
import { stakingInsetCard } from "@/components/staking/stakingStyles";
import { cn } from "@/lib/utils";

export function StakingConnectPrompt({
  symbol,
  className,
}: {
  symbol: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        stakingInsetCard,
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/60">
          <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Connect wallet</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Required to lock {symbol} and view positions.
          </p>
        </div>
      </div>
      <div className="shrink-0 sm:pl-2">
        <WalletButton />
      </div>
    </div>
  );
}
