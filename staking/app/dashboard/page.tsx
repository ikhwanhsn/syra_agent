"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTheme } from "@/app/ThemeContext";
import { StakingShell } from "@/components/StakingShell";
import { StatsCard } from "@/components/StatsCard";
import { ADMIN_DASHBOARD_WALLET, isAdminWallet } from "@/constants/adminWallet";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import {
  dashboardNetworkLabel,
  dashboardStreamflowMint,
  fetchOperatorRegistryStats,
  walletExplorerUrl,
  type OperatorRegistryStats,
} from "@/lib/dashboardStats";

export default function StakersDashboardPage() {
  const { resolved: theme } = useTheme();
  const { connected, publicKey } = useWallet();
  const admin = isAdminWallet(connected, publicKey?.toBase58());

  const [operator, setOperator] = useState<OperatorRegistryStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!publicKey || !admin) return;
    setLoadError(null);
    try {
      const op = await fetchOperatorRegistryStats({
        network: dashboardNetworkLabel(),
        mint: dashboardStreamflowMint(),
        adminWallet: publicKey.toBase58(),
      });
      setOperator(op);
      if (!op) {
        setLoadError(
          "Could not load stakers. Set NEXT_PUBLIC_SYRA_API_URL to your Syra API. The API must expose GET /staking/dashboard/operator-stats and ADMIN_DASHBOARD_WALLET must match your connected wallet."
        );
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Load failed");
    }
  }, [admin, publicKey]);

  useEffect(() => {
    if (admin && publicKey) void load();
  }, [admin, publicKey, load]);

  const isDevnet = STREAMFLOW_CONFIG.isDevnet;
  const symbol = STREAMFLOW_CONFIG.tokenSymbol;

  return (
    <StakingShell>
      <div className="animate-fade-in min-w-0 space-y-6 sm:space-y-8" data-theme={theme}>
        <header className="min-w-0 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] section-eyebrow-gradient">
            Operator
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="neon-text">Stakers</span>
          </h1>
          <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Wallets with an active Streamflow lock for {symbol}. Operator only — connect the
            approved wallet.
          </p>
        </header>

        {!connected ? (
          <p className="rounded-xl border border-border bg-card/40 px-4 py-4 text-sm text-muted-foreground">
            Connect your wallet to view this page.
          </p>
        ) : !admin ? (
          <div
            className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive"
            role="alert"
          >
            Access denied. This page is restricted to{" "}
            <span className="break-all font-mono text-xs">{ADMIN_DASHBOARD_WALLET}</span>.
          </div>
        ) : (
          <>
            {loadError ? (
              <p className="break-words rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-foreground">
                {loadError}
              </p>
            ) : null}

            {operator ? (
              <>
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  <StatsCard
                    title="Wallets staking"
                    value={String(operator.uniqueWallets)}
                    subValue="Distinct wallets with ≥1 open lock"
                  />
                  <StatsCard
                    title="Open locks"
                    value={String(operator.openLockCount)}
                    subValue="Total active Streamflow locks"
                  />
                  <StatsCard
                    title="Total locked (raw)"
                    value={operator.totalAmountRawOpen}
                    subValue={`${symbol} smallest units (all open locks)`}
                  />
                </section>

                <section className="glass-card p-4 sm:p-6">
                  <h2 className="mb-4 text-base font-semibold tracking-tight">
                    User list
                    <span className="ml-2 font-normal text-muted-foreground">
                      ({operator.stakers.length} wallets)
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
                                <dt className="text-xs text-muted-foreground">
                                  Open locks
                                </dt>
                                <dd className="font-semibold tabular-nums text-foreground">
                                  {row.openLockCount}
                                </dd>
                              </div>
                              <div className="min-w-0">
                                <dt className="text-xs text-muted-foreground">
                                  Total locked (raw)
                                </dt>
                                <dd className="break-all font-mono text-xs font-medium text-foreground">
                                  {row.totalAmountRaw}
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
                              <th className="px-4 py-3 font-medium">Total locked (raw)</th>
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
                                <td className="px-4 py-3 tabular-nums">
                                  {row.openLockCount}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs tabular-nums">
                                  {row.totalAmountRaw}
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
                </section>

                <button
                  type="button"
                  onClick={() => void load()}
                  className="btn-primary min-h-[48px] w-full touch-manipulation px-5 py-3 sm:w-auto"
                >
                  Refresh
                </button>
              </>
            ) : null}
          </>
        )}
      </div>
    </StakingShell>
  );
}
