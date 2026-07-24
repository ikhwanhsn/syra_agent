"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Gift, Loader2 } from "lucide-react";
import { Link } from "@/lib/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { getApiBaseUrl } from "@/lib/chatApi";
import { usePublicMetrics } from "@/lib/publicMetricsApi";
import { GrowthBuybackProofPanel } from "@/components/growth/GrowthBuybackProofPanel";
import { GrowthFooter } from "@/components/growth/GrowthFooter";
import { PlaygroundPageShell } from "@/components/playground/PlaygroundPageShell";
import { PLAYGROUND_PAGE_CLASS } from "@/components/playground/playgroundStyles";
import { overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { RewardsStatsSkeleton } from "@/components/RouteFallback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  growthKickerClass,
  growthPanelClass,
  growthProseClass,
  growthStatValueClass,
} from "@/components/growth/growthHomeStyles";

interface RewardsMeResponse {
  success: boolean;
  data?: {
    wallet: string;
    lifetimeSpendUsd: number;
    lifetimePoints: number;
    pendingPoints: number;
    claimableSyra: number;
    claimedSyra: number;
    lastSpendAt: string | null;
    lastClaimAt: string | null;
    lastClaimTx: string | null;
    pointsToSyraRate: number;
    note: string;
  };
  error?: string;
}

function rewardsBase() {
  return `${getApiBaseUrl().replace(/\/$/, "")}/rewards`;
}

async function fetchRewardsMe(wallet: string, signal?: AbortSignal): Promise<RewardsMeResponse> {
  const url = `${rewardsBase()}/me?wallet=${encodeURIComponent(wallet)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "x-connected-wallet": wallet },
    signal,
  });
  if (!res.ok) throw new Error(`Rewards API ${res.status}`);
  return res.json() as Promise<RewardsMeResponse>;
}

async function claimRewardsApi(wallet: string, amountSyra?: number) {
  const res = await fetch(`${rewardsBase()}/claim`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-connected-wallet": wallet,
    },
    body: JSON.stringify({ wallet, amountSyra }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Claim failed (${res.status})`);
  }
  return json as {
    success: boolean;
    amountSyra: number;
    txSignature?: string;
    solscanUrl?: string;
    simulated?: boolean;
    claimableSyra: number;
    claimedSyra: number;
  };
}

function formatNum(n: number | null | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function RewardsPage() {
  const { address, connected, connectForChain } = useWalletContext();
  const [manualWallet, setManualWallet] = useState("");
  const queryClient = useQueryClient();
  const { data: metrics } = usePublicMetrics();

  const wallet = useMemo(() => {
    if (connected && address) return address;
    return manualWallet.trim() || "";
  }, [connected, address, manualWallet]);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["syra-rewards-me", wallet],
    queryFn: ({ signal }) => fetchRewardsMe(wallet, signal),
    enabled: Boolean(wallet),
    refetchInterval: 60_000,
  });

  const me = data?.data;
  const claimMutation = useMutation({
    mutationFn: () => claimRewardsApi(wallet),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["syra-rewards-me", wallet] });
      void queryClient.invalidateQueries({ queryKey: ["public-metrics"] });
    },
  });

  const connect = useCallback(() => {
    void connectForChain("solana");
  }, [connectForChain]);

  return (
    <PlaygroundPageShell>
      <div className={cn(PLAYGROUND_PAGE_CLASS)}>
        <header className="mb-8 max-w-2xl space-y-3 sm:mb-10">
          <p className={overviewKickerClass}>$SYRA rewards</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Use Syra. Earn $SYRA.
          </h1>
          <p className={cn(growthProseClass)}>
            Settled x402 spend accrues points. Epoch funding converts points into claimable $SYRA from
            the buyback treasury. Hold or stake $SYRA for live API fee discounts.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-9 rounded-lg" asChild>
              <Link to="/token">← Token proof</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-lg" asChild>
              <Link to="/marketplace">Make a paid call</Link>
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-lg" asChild>
              <Link to="/staking">Stake $SYRA</Link>
            </Button>
          </div>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className={cn(growthPanelClass, "p-5")}>
            <p className={growthKickerClass}>Earners</p>
            <p className={cn(growthStatValueClass, "mt-1 text-2xl")}>
              {formatNum(metrics?.rewards?.uniqueEarners, 0)}
            </p>
          </div>
          <div className={cn(growthPanelClass, "p-5")}>
            <p className={growthKickerClass}>Spend tracked</p>
            <p className={cn(growthStatValueClass, "mt-1 text-2xl")}>
              ${formatNum(metrics?.rewards?.totalLifetimeSpendUsd)}
            </p>
          </div>
          <div className={cn(growthPanelClass, "p-5")}>
            <p className={growthKickerClass}>Claimed $SYRA</p>
            <p className={cn(growthStatValueClass, "mt-1 text-2xl")}>
              {formatNum(metrics?.rewards?.totalClaimedSyra)}
            </p>
          </div>
        </div>

        <div className={cn(growthPanelClass, "mb-8 p-6 sm:p-8")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={growthKickerClass}>Your wallet</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-foreground">
                Rewards balance
              </h2>
            </div>
            {!connected && (
              <Button type="button" onClick={connect} className="h-11 min-h-11 rounded-xl">
                Connect Solana wallet
              </Button>
            )}
          </div>

          {!wallet && (
            <div className="mt-6 space-y-3">
              <label htmlFor="rewards-wallet" className="text-sm text-muted-foreground">
                Or paste a Solana payer address used for x402 calls
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="rewards-wallet"
                  value={manualWallet}
                  onChange={(e) => setManualWallet(e.target.value)}
                  placeholder="Solana wallet address"
                  className="h-11 font-mono text-sm"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 min-h-11"
                  onClick={() => void refetch()}
                  disabled={!manualWallet.trim()}
                >
                  Look up
                </Button>
              </div>
            </div>
          )}

          {wallet && (
            <p className="mt-4 break-all font-mono text-xs text-muted-foreground">{wallet}</p>
          )}

          {wallet && isPending && (
            <div className="mt-6" role="status" aria-label="Loading rewards">
              <RewardsStatsSkeleton />
            </div>
          )}

          {wallet && isError && (
            <p className="mt-6 text-sm text-muted-foreground" role="alert">
              Could not load rewards for this wallet. Try again.
            </p>
          )}

          {me && (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className={growthKickerClass}>Lifetime spend</p>
                  <p className={cn(growthStatValueClass, "mt-1 text-xl")}>
                    ${formatNum(me.lifetimeSpendUsd)}
                  </p>
                </div>
                <div>
                  <p className={growthKickerClass}>Pending points</p>
                  <p className={cn(growthStatValueClass, "mt-1 text-xl")}>
                    {formatNum(me.pendingPoints)}
                  </p>
                </div>
                <div>
                  <p className={growthKickerClass}>Claimable $SYRA</p>
                  <p className={cn(growthStatValueClass, "mt-1 text-xl")}>
                    {formatNum(me.claimableSyra)}
                  </p>
                </div>
                <div>
                  <p className={growthKickerClass}>Claimed</p>
                  <p className={cn(growthStatValueClass, "mt-1 text-xl")}>
                    {formatNum(me.claimedSyra)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/80">
                Conversion rate after epoch fund: ~{formatNum(me.pointsToSyraRate, 0)} $SYRA per $1
                spend. Points convert when treasury epochs run.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="h-11 min-h-11 gap-2 rounded-xl"
                  disabled={!(me.claimableSyra > 0) || claimMutation.isPending || wallet.startsWith("0x")}
                  onClick={() => claimMutation.mutate()}
                >
                  {claimMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Gift className="h-4 w-4" aria-hidden />
                  )}
                  Claim $SYRA
                </Button>
                {me.lastClaimTx && me.lastClaimTx !== "dev_simulated_claim" && (
                  <a
                    href={`https://solscan.io/tx/${me.lastClaimTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Last claim tx
                    <ExternalLink className="h-3 w-3 opacity-50" aria-hidden />
                  </a>
                )}
              </div>

              {claimMutation.isError && (
                <p className="text-sm text-destructive" role="alert">
                  {(claimMutation.error as Error)?.message || "Claim failed"}
                </p>
              )}
              {claimMutation.isSuccess && (
                <p className="text-sm text-emerald-400" role="status">
                  Claimed {formatNum(claimMutation.data.amountSyra)} $SYRA
                  {claimMutation.data.simulated ? " (simulated — non-production)" : ""}.
                  {claimMutation.data.solscanUrl && (
                    <>
                      {" "}
                      <a
                        href={claimMutation.data.solscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-2 hover:underline"
                      >
                        View on Solscan
                      </a>
                    </>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        <GrowthBuybackProofPanel />
      </div>
      <GrowthFooter />
    </PlaygroundPageShell>
  );
}
