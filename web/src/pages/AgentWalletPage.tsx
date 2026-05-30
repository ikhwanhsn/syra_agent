"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuelAgentModal } from "@/components/chat/FuelAgentModal";
import { AgentWalletsManager } from "@/components/settings/AgentWalletsManager";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useManagedAgentWallets } from "@/hooks/useManagedAgentWallets";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";

function parseFlowTab(value: string | null): "deposit" | "withdraw" {
  return value === "withdraw" ? "withdraw" : "deposit";
}

function parseWalletPurpose(value: string | null): AgentWalletPurpose {
  return value === "lp" ? "lp" : "chat";
}

function formatUsdc(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSol(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 100) return value.toFixed(2);
  if (value >= 1) return value.toFixed(3);
  return value.toFixed(4);
}

export default function AgentWalletPage() {
  const [searchParams] = useSearchParams();
  const { openConnectModal } = useConnectModal();
  const wallets = useManagedAgentWallets();
  const moveFundsRef = useRef<HTMLDivElement>(null);

  const urlTab = useMemo(() => parseFlowTab(searchParams.get("tab")), [searchParams]);
  const urlWallet = useMemo(() => parseWalletPurpose(searchParams.get("wallet")), [searchParams]);

  useEffect(() => {
    if (!wallets.connected) return;
    wallets.setFundTab(urlTab);
    wallets.setFundWallet(urlWallet);
  }, [urlTab, urlWallet, wallets.connected, wallets.setFundTab, wallets.setFundWallet]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#move-funds" && wallets.connected) {
      moveFundsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [wallets.connected, urlTab, urlWallet]);

  const scrollToMoveFunds = () => {
    moveFundsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const fundChat = () => {
    if (wallets.selectFundTarget("deposit", "chat")) scrollToMoveFunds();
  };

  const fundLp = () => {
    if (wallets.selectFundTarget("deposit", "lp")) scrollToMoveFunds();
  };

  const walletCount =
    (wallets.managedChatWallet ? 1 : 0) + (wallets.managedLpWallet ? 1 : 0);

  return (
    <div className="relative min-h-full">
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "relative space-y-6 pb-8",
        )}
      >
        <header className={cn(overviewCardShell, "overflow-hidden rounded-3xl px-5 py-6 sm:px-8 sm:py-7")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className={overviewKickerClass}>Treasury</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
                Agent wallets
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Deposit, withdraw, and manage every agent treasury on this page — no popups.
              </p>
            </div>
            {wallets.connected ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl gap-2"
                disabled={wallets.refreshingBalances || wallets.refreshingLpBalances}
                onClick={() => void wallets.handleRefreshAll()}
              >
                {wallets.refreshingBalances || wallets.refreshingLpBalances ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh all
              </Button>
            ) : null}
          </div>

          {wallets.connected ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3.5">
                <p className="text-[11px] font-medium text-muted-foreground">Total agent balance</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  ${formatUsdc(wallets.totalUsdc)}
                </p>
                <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                  {formatSol(wallets.totalSol)} SOL
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3.5">
                <p className="text-[11px] font-medium text-muted-foreground">Wallets</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {walletCount}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">Chat + LP treasuries</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3.5">
                <p className="text-[11px] font-medium text-muted-foreground">Linked wallet</p>
                <p className="mt-1 truncate font-mono text-sm font-medium text-foreground">
                  {wallets.shortAddress ?? "—"}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9945FF]" aria-hidden />
                  Solana
                </p>
              </div>
            </div>
          ) : null}
        </header>

        {!wallets.connected ? (
          <div className="rounded-2xl border border-border/50 bg-card/90 p-10 text-center shadow-sm ring-1 ring-inset ring-white/[0.04]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Wallet className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Connect your wallet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Connect a Solana wallet to view and manage your agent treasuries.
            </p>
            <Button className="mt-6 rounded-xl px-5" onClick={openConnectModal}>
              Connect wallet
            </Button>
          </div>
        ) : wallets.setupLoading ? (
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-2xl bg-muted/30" />
            <div className="h-48 animate-pulse rounded-2xl bg-muted/30" />
          </div>
        ) : wallets.setupLoadError ? (
          <div className="rounded-2xl border border-border/50 bg-card/90 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load your agent wallets. Sign in with your wallet and try again.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => void wallets.handleRetryLoad()}
            >
              Retry
            </Button>
          </div>
        ) : wallets.authPending ? (
          <div className="rounded-2xl border border-border/50 bg-card/90 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Sign in with your wallet to load and manage agent treasuries.
            </p>
            <Button type="button" className="mt-4 rounded-xl" onClick={() => void wallets.handleRetryLoad()}>
              Sign in
            </Button>
          </div>
        ) : (
          <>
            <div id="move-funds" ref={moveFundsRef} className="scroll-mt-24">
              <FuelAgentModal
                variant="page"
                open
                onOpenChange={() => undefined}
                initialFlowTab={wallets.fundTab}
                initialAgentWallet={wallets.fundWallet}
                onDepositComplete={() => void wallets.handleRefreshAll()}
              />
            </div>

            <AgentWalletsManager
              embedded
              chatWallet={wallets.managedChatWallet}
              lpWallet={wallets.managedLpWallet}
              chatSolBalance={wallets.chatSolBalance}
              chatUsdcBalance={wallets.chatUsdcBalance}
              lpSolBalance={wallets.lpAgentSolBalance}
              lpUsdcBalance={wallets.lpAgentUsdcBalance}
              chatBalanceLoading={wallets.setupLoading}
              lpBalanceLoading={!wallets.managedLpWallet ? false : wallets.lpAgentSolBalance == null}
              refreshingChatBalances={wallets.refreshingBalances}
              refreshingLpBalances={wallets.refreshingLpBalances}
              hasLinkedWallet={wallets.hasSolana}
              syraAuthenticated={wallets.syraAuthenticated}
              onCopy={wallets.copyToClipboard}
              copiedField={wallets.copiedField}
              onFundChat={fundChat}
              onFundLp={fundLp}
              onRefreshChatBalances={() => void wallets.handleRefreshChatBalances()}
              onRefreshLpBalances={() => void wallets.handleRefreshLpBalances()}
              onCreateChatWallet={() => void wallets.handleCreateChatWallet()}
              onCreateLpWallet={() => void wallets.handleCreateLpWallet()}
              creatingChat={wallets.creatingChat}
              creatingLp={wallets.creatingLp}
            />
          </>
        )}
      </div>
    </div>
  );
}
