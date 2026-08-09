"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Link } from "@/lib/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { fetchHolderBenefits } from "@/lib/holderBenefitsApi";
import { formatCompactAmount } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { SyraBuyButton } from "@/components/syra/SyraBuyButton";
import { cn } from "@/lib/utils";
import {
  growthKickerClass,
  growthPanelClass,
  growthProseClass,
  growthStatValueClass,
} from "@/components/growth/growthHomeStyles";

function formatNum(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return "-";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

type HolderBenefitsPanelProps = {
  className?: string;
  /** Optional wallet override (e.g. rewards page manual lookup). */
  walletOverride?: string;
};

export function HolderBenefitsPanel({ className, walletOverride }: HolderBenefitsPanelProps) {
  const { address, connected, connectForChain } = useWalletContext();
  const wallet = useMemo(() => {
    const override = walletOverride?.trim() || "";
    if (override) return override;
    if (connected && address) return address;
    return "";
  }, [walletOverride, connected, address]);

  const { data, isPending, isError } = useQuery({
    queryKey: ["syra-holder-benefits", wallet],
    queryFn: ({ signal }) => fetchHolderBenefits(wallet, signal),
    enabled: Boolean(wallet),
    refetchInterval: 60_000,
  });

  return (
    <section className={cn(growthPanelClass, "p-6 sm:p-8", className)} aria-labelledby="holder-benefits-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={growthKickerClass}>Holder utility</p>
          <h2
            id="holder-benefits-title"
            className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground"
          >
            Free Agent Starter Pack
          </h2>
          <p className={cn(growthProseClass, "mt-2 max-w-xl")}>
            Hold 100k $SYRA for capped free daily agent intel and 10% off every paid x402 call. Stake
            for extra quotas. Use Syra to earn more $SYRA from buybacks.
          </p>
        </div>
        {!wallet && (
          <Button
            type="button"
            className="h-11 min-h-11 shrink-0 rounded-xl"
            onClick={() => void connectForChain("solana")}
          >
            Connect Solana wallet
          </Button>
        )}
      </div>

      {!wallet && (
        <div className="mt-6 flex flex-wrap gap-2">
          <SyraBuyButton variant="default" className="h-10" />
          <Button variant="outline" className="h-10 rounded-xl" asChild>
            <Link to="/staking">Stake $SYRA</Link>
          </Button>
        </div>
      )}

      {wallet && isPending && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading holder benefits…
        </div>
      )}

      {wallet && isError && (
        <p className="mt-6 text-sm text-muted-foreground" role="alert">
          Could not load holder benefits for this wallet.
        </p>
      )}

      {data && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className={growthKickerClass}>Tier</p>
              <p className={cn(growthStatValueClass, "mt-1 text-xl capitalize")}>
                {data.tier || "None"}
              </p>
            </div>
            <div>
              <p className={growthKickerClass}>Discount</p>
              <p className={cn(growthStatValueClass, "mt-1 text-xl")}>{data.discountPct}%</p>
            </div>
            <div>
              <p className={growthKickerClass}>Free calls left today</p>
              <p className={cn(growthStatValueClass, "mt-1 text-xl")}>
                {formatNum(data.holder_quota_remaining)}
              </p>
            </div>
            <div>
              <p className={growthKickerClass}>Reward multiplier</p>
              <p className={cn(growthStatValueClass, "mt-1 text-xl")}>
                {formatNum(data.rewardMultiplier, 2)}×
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
            <p className="flex items-start gap-2 text-sm text-foreground">
              {data.holderEligible ? (
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              ) : null}
              <span>
                Balance {formatCompactAmount(data.balance)} · Staked{" "}
                {formatCompactAmount(data.staked)} · Effective{" "}
                {formatCompactAmount(data.syraAmount)} $SYRA
              </span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{data.savingsNote}</p>
            {data.estimatedSavingsUsd > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Approx. fee relief from tracked spend: ${formatNum(data.estimatedSavingsUsd, 2)}
              </p>
            ) : null}
            {data.solanaOnlyDiscount ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Fee discounts apply to Solana payers only (EVM payers are not discounted).
              </p>
            ) : null}
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {(
              [
                data.buckets.starter,
                data.buckets.stakeT2,
                data.buckets.stakeT3,
                data.buckets.stakeBrain,
              ] as const
            ).map((bucket) => (
              <li
                key={bucket.label}
                className={cn(
                  "rounded-xl border border-border/40 px-4 py-3",
                  bucket.eligible ? "bg-success/[0.04]" : "bg-muted/10 opacity-80",
                )}
              >
                <p className="text-sm font-medium text-foreground">{bucket.label}</p>
                <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                  {bucket.eligible
                    ? `${bucket.remaining} / ${bucket.limit} remaining today`
                    : bucket.minStake
                      ? `Stake ${formatCompactAmount(bucket.minStake)}+ to unlock`
                      : `Hold ${formatCompactAmount(data.holderThreshold)}+ to unlock`}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  {bucket.tools.join(", ")}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            {!data.holderEligible ? <SyraBuyButton variant="default" className="h-10" /> : null}
            <Button variant="outline" className="h-10 rounded-xl" asChild>
              <Link to="/staking">Stake $SYRA</Link>
            </Button>
            <Button variant="outline" className="h-10 rounded-xl" asChild>
              <Link to="/agent">Open agent</Link>
            </Button>
            <Button variant="ghost" className="h-10 rounded-xl text-muted-foreground" asChild>
              <Link to="/marketplace">Marketplace</Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
