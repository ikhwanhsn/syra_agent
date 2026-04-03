"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTheme } from "@/app/ThemeContext";
import { StakingPageHeader } from "@/components/StakingPageHeader";
import { StatsCard } from "@/components/StatsCard";
import { ADMIN_DASHBOARD_WALLET, isAdminWallet } from "@/constants/adminWallet";
import {
  CONFIG,
  dashboardNetworkLabel,
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
        mint: CONFIG.stakingMint.toBase58(),
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

  const isDevnet = CONFIG.IS_DEVNET;
  const symbol = CONFIG.stakingTokenSymbol;

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      data-theme={theme}
    >
      <StakingPageHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 pb-16">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Stakers
          </h1>
          <p className="max-w-2xl text-muted-foreground leading-relaxed">
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
            <span className="font-mono text-xs">{ADMIN_DASHBOARD_WALLET}</span>.
          </div>
        ) : (
          <>
            {loadError ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200/90">
                {loadError}
              </p>
            ) : null}

            {operator ? (
              <>
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

                <section className="rounded-2xl border border-border/60 bg-card/25 p-6 shadow-sm">
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
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full min-w-[720px] text-left text-sm">
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
                              <td className="max-w-[280px] px-4 py-3">
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
                  )}
                </section>

                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                >
                  Refresh
                </button>
              </>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
