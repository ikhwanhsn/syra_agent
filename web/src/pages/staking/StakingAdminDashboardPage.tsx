"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { StakingConnectPrompt } from "@/components/staking/StakingConnectPrompt";
import {
  stakingInsetCard,
  stakingKicker,
  stakingPanelShell,
  stakingPrimaryCta,
  stakingSectionTitle,
} from "@/components/staking/stakingStyles";
import { StakingShell } from "@/components/StakingShell";
import { StatsCard } from "@/components/StatsCard";
import { ADMIN_DASHBOARD_WALLET, isAdminWallet } from "@/constants/adminWallet";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useSyraSolana } from "@/hooks/useSyraSolana";
import {
  clearSyraSession,
  getSyraSessionWallet,
  signOutSyraSession,
} from "@/lib/agentAuthApi";
import {
  dashboardNetworkLabel,
  dashboardStreamflowMint,
  fetchOperatorRegistryStats,
  OperatorStatsFetchError,
  walletExplorerUrl,
  type OperatorRegistryStats,
} from "@/lib/dashboardStats";
import { formatUnits } from "@/lib/format";
import { cn } from "@/lib/utils";

function formatRawAmount(raw: string, decimals: number): string {
  try {
    return formatUnits(BigInt(raw), decimals, Math.min(decimals, 4));
  } catch {
    return raw;
  }
}

export default function StakingAdminDashboardPage() {
  const { connected, address } = useSyraSolana();
  const { requestSyraAuthForWallet, syraAuthenticated } = useSyraAuth();
  const admin = isAdminWallet(connected, address);

  const [operator, setOperator] = useState<OperatorRegistryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);

  const symbol = STREAMFLOW_CONFIG.tokenSymbol;
  const decimals = STREAMFLOW_CONFIG.tokenDecimals;
  const isDevnet = STREAMFLOW_CONFIG.isDevnet;
  const networkLabel = isDevnet ? "Devnet" : "Mainnet";

  const totalLockedFormatted = useMemo(() => {
    if (!operator) return "—";
    return `${formatRawAmount(operator.totalAmountRawOpen, decimals)} ${symbol}`;
  }, [operator, decimals, symbol]);

  const load = useCallback(async () => {
    if (!address || !admin) return;
    setLoading(true);
    setLoadError(null);
    setNeedsSignIn(false);
    try {
      const data = await fetchOperatorRegistryStats({
        network: dashboardNetworkLabel(),
        mint: dashboardStreamflowMint(),
        sessionWallet: address,
      });
      setOperator(data);
    } catch (e) {
      setOperator(null);
      if (e instanceof OperatorStatsFetchError) {
        if (e.code === "auth_required" || e.code === "not_admin") {
          setNeedsSignIn(true);
          setLoadError(e.message);
          return;
        }
        setLoadError(e.message);
        return;
      }
      setLoadError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [address, admin]);

  useEffect(() => {
    if (admin && address) void load();
  }, [admin, address, load]);

  const handleSignIn = async () => {
    if (!address) return;
    setLoading(true);
    setLoadError(null);
    try {
      await signOutSyraSession();
      clearSyraSession();
      const result = await requestSyraAuthForWallet(address);
      if (!result) {
        setNeedsSignIn(true);
        setLoadError("Sign-in was cancelled or failed. Approve the wallet signature prompt.");
        return;
      }
      await load();
    } catch (e) {
      setNeedsSignIn(true);
      setLoadError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const sessionWallet = getSyraSessionWallet()?.address;
  const sessionMismatch =
    Boolean(sessionWallet && address && sessionWallet !== address);

  return (
    <StakingShell>
      <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
        <header className="min-w-0 space-y-3">
          <p className={stakingKicker}>Operator · {networkLabel}</p>
          <h1 className={stakingSectionTitle}>Staking admin</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Registry overview for {symbol} Streamflow locks — staker wallets, open positions, and
            recent activity. Restricted to the approved operator wallet.
          </p>
        </header>

        {!connected ? (
          <StakingConnectPrompt symbol={symbol} />
        ) : !admin ? (
          <div
            className={cn(stakingInsetCard, "border-destructive/40 bg-destructive/5 text-destructive")}
            role="alert"
          >
            Access denied. Connect{" "}
            <span className="break-all font-mono text-xs">{ADMIN_DASHBOARD_WALLET}</span> to view
            this page.
          </div>
        ) : (
          <>
            {sessionMismatch ? (
              <div className={cn(stakingInsetCard, "space-y-3 border-warning/30 bg-warning/10")}>
                <p className="text-sm text-foreground">
                  Connected wallet{" "}
                  <span className="break-all font-mono text-xs">{address}</span> does not match
                  your Syra session{" "}
                  <span className="break-all font-mono text-xs">{sessionWallet}</span>. Sign in
                  again with the admin wallet.
                </p>
                <button
                  type="button"
                  onClick={() => void handleSignIn()}
                  className={cn(stakingPrimaryCta, "sm:w-auto")}
                >
                  Sign in with admin wallet
                </button>
              </div>
            ) : null}

            {loadError ? (
              <div className={cn(stakingInsetCard, "space-y-3 border-warning/30 bg-warning/10")}>
                <p className="text-sm text-foreground">{loadError}</p>
                {needsSignIn ? (
                  <button
                    type="button"
                    onClick={() => void handleSignIn()}
                    className={cn(stakingPrimaryCta, "sm:w-auto")}
                  >
                    Sign in with admin wallet
                  </button>
                ) : null}
              </div>
            ) : null}

            {operator ? (
              <>
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                  <StatsCard
                    title="Wallets staking"
                    value={String(operator.uniqueWallets)}
                    subValue="Distinct wallets with ≥1 open lock"
                  />
                  <StatsCard
                    title="Open locks"
                    value={String(operator.openLockCount)}
                    subValue="Active Streamflow positions"
                  />
                  <StatsCard
                    title="Closed locks"
                    value={String(operator.closedLockCount)}
                    subValue="Released or expired"
                  />
                  <StatsCard
                    title="Total locked"
                    value={totalLockedFormatted}
                    subValue={`${symbol} across all open locks`}
                  />
                </section>

                <section className={stakingPanelShell}>
                  <div className="relative z-[1] min-w-0 p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-semibold tracking-tight">
                      Staker wallets
                      <span className="ml-2 font-normal text-muted-foreground">
                        ({operator.stakers.length})
                      </span>
                    </h2>
                    {operator.stakers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No open locks in the registry for this mint yet.
                      </p>
                    ) : (
                      <>
                        <ul className="min-w-0 space-y-3 md:hidden">
                          {operator.stakers.map((row) => (
                            <li
                              key={row.wallet}
                              className="rounded-xl border border-border/70 bg-background/60 p-4"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Wallet
                              </p>
                              <p className="mt-1 break-all font-mono text-xs leading-relaxed text-foreground">
                                {row.wallet}
                              </p>
                              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <dt className="text-xs text-muted-foreground">Open locks</dt>
                                  <dd className="font-semibold tabular-nums text-foreground">
                                    {row.openLockCount}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-muted-foreground">Locked</dt>
                                  <dd className="font-mono text-xs font-medium tabular-nums text-foreground">
                                    {formatRawAmount(row.totalAmountRaw, decimals)} {symbol}
                                  </dd>
                                </div>
                              </dl>
                              <a
                                href={walletExplorerUrl(row.wallet, isDevnet)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-border bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80"
                              >
                                View on Explorer
                              </a>
                            </li>
                          ))}
                        </ul>
                        <div className="hidden min-w-0 overflow-x-auto rounded-xl border border-border md:block">
                          <table className="w-full min-w-[640px] text-left text-sm lg:min-w-[720px]">
                            <thead className="border-b border-border bg-muted/40">
                              <tr>
                                <th className="px-4 py-3 font-medium">Wallet</th>
                                <th className="px-4 py-3 font-medium">Open locks</th>
                                <th className="px-4 py-3 font-medium">Total locked</th>
                                <th className="px-4 py-3 font-medium">Explorer</th>
                              </tr>
                            </thead>
                            <tbody>
                              {operator.stakers.map((row) => (
                                <tr
                                  key={row.wallet}
                                  className="border-b border-border/70 last:border-0"
                                >
                                  <td className="max-w-[min(280px,40vw)] px-4 py-3">
                                    <span className="break-all font-mono text-xs leading-relaxed">
                                      {row.wallet}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 tabular-nums">{row.openLockCount}</td>
                                  <td className="px-4 py-3 font-mono text-xs tabular-nums">
                                    {formatRawAmount(row.totalAmountRaw, decimals)} {symbol}
                                  </td>
                                  <td className="px-4 py-3">
                                    <a
                                      href={walletExplorerUrl(row.wallet, isDevnet)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary underline underline-offset-2"
                                    >
                                      View
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </section>

                {operator.recentActivity.length > 0 ? (
                  <section className={stakingPanelShell}>
                    <div className="relative z-[1] min-w-0 p-5 sm:p-6">
                      <h2 className="mb-4 text-base font-semibold tracking-tight">
                        Recent activity
                      </h2>
                      <div className="min-w-0 overflow-x-auto rounded-xl border border-border">
                        <table className="w-full min-w-[640px] text-left text-sm">
                          <thead className="border-b border-border bg-muted/40">
                            <tr>
                              <th className="px-4 py-3 font-medium">Wallet</th>
                              <th className="px-4 py-3 font-medium">Amount</th>
                              <th className="px-4 py-3 font-medium">Unlock</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {operator.recentActivity.map((row) => (
                              <tr
                                key={row.streamId}
                                className="border-b border-border/70 last:border-0"
                              >
                                <td className="max-w-[min(220px,35vw)] px-4 py-3">
                                  <span className="break-all font-mono text-xs">{row.wallet}</span>
                                </td>
                                <td className="px-4 py-3 tabular-nums">
                                  {row.amountFormatted ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                  {row.unlockAtIso
                                    ? new Date(row.unlockAtIso).toLocaleDateString()
                                    : "—"}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                      row.closed
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-primary/10 text-primary",
                                    )}
                                  >
                                    {row.closed ? "Closed" : "Open"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                    className={cn(stakingPrimaryCta, "inline-flex items-center gap-2 sm:w-auto")}
                  >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
                    Refresh
                  </button>
                  {syraAuthenticated ? (
                    <p className="text-xs text-muted-foreground">Signed in for API access</p>
                  ) : null}
                </div>
              </>
            ) : loading ? (
              <p className="text-sm text-muted-foreground">Loading registry data…</p>
            ) : null}
          </>
        )}
      </div>
    </StakingShell>
  );
}
