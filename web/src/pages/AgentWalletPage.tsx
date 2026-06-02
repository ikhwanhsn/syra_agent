"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuelAgentModal } from "@/components/chat/FuelAgentModal";
import { AgentWalletsManager } from "@/components/settings/AgentWalletsManager";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useManagedAgentWallets } from "@/hooks/useManagedAgentWallets";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
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

function WalletPageMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        overviewCardShell,
        "flex flex-col items-center px-6 py-12 text-center sm:px-10",
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default function AgentWalletPage() {
  const [searchParams] = useSearchParams();
  const { openConnectModal } = useConnectModal();
  const wallets = useManagedAgentWallets();
  const [moveFundsOpen, setMoveFundsOpen] = useState(false);

  const urlTab = useMemo(() => parseFlowTab(searchParams.get("tab")), [searchParams]);
  const urlWallet = useMemo(() => parseWalletPurpose(searchParams.get("wallet")), [searchParams]);

  const treasuryReady =
    wallets.connected && !wallets.setupLoading && !wallets.setupLoadError && !wallets.authPending;

  useEffect(() => {
    if (!wallets.connected) return;
    wallets.setFundTab(urlTab);
    wallets.setFundWallet(urlWallet);
  }, [urlTab, urlWallet, wallets.connected, wallets.setFundTab, wallets.setFundWallet]);

  useEffect(() => {
    if (!treasuryReady) return;
    if (window.location.hash === "#move-funds") {
      setMoveFundsOpen(true);
    }
  }, [treasuryReady, urlTab, urlWallet]);

  const openMoveFunds = (tab: "deposit" | "withdraw", wallet: AgentWalletPurpose) => {
    if (!wallets.selectFundTarget(tab, wallet)) return;
    setMoveFundsOpen(true);
  };

  const refreshing = wallets.refreshingBalances || wallets.refreshingLpBalances;

  return (
    <>
    <div className="relative min-h-full">
      <OverviewPageBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_MEDIUM,
          PAGE_SAFE_AREA_BOTTOM,
          "relative pb-10",
        )}
      >
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Wallets</h1>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              Agent treasuries hold the SOL and USDC your AI uses. Deposit or withdraw from any active wallet.
            </p>
          </header>

          {!wallets.connected ? (
            <WalletPageMessage
              title="Connect your Solana wallet"
              description="Link the wallet you use to sign in. Your agent treasuries stay separate from your personal balance."
              action={
                <Button className="rounded-xl px-6" onClick={openConnectModal}>
                  <Wallet className="mr-2 h-4 w-4" aria-hidden />
                  Connect wallet
                </Button>
              }
            />
          ) : wallets.setupLoading ? (
            <div className="space-y-4" aria-busy="true" aria-label="Loading wallets">
              <div className="h-36 animate-pulse rounded-2xl bg-muted/30" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted/30" />
                ))}
              </div>
            </div>
          ) : wallets.setupLoadError ? (
            <WalletPageMessage
              title="Could not load wallets"
              description="Sign in with your wallet and try again."
              action={
                <Button variant="outline" className="rounded-xl" onClick={() => void wallets.handleRetryLoad()}>
                  Retry
                </Button>
              }
            />
          ) : wallets.authPending ? (
            <WalletPageMessage
              title="Verify your wallet"
              description="One quick signature links your wallet to Syra so we can load your agent treasuries securely."
              action={
                <Button className="rounded-xl gap-2 px-6" onClick={() => void wallets.handleRetryLoad()}>
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Sign in
                </Button>
              }
            />
          ) : (
            <>
              <section
                className={cn(
                  overviewCardShell,
                  "relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7",
                )}
                aria-label="Total balance"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{
                    background:
                      "radial-gradient(480px 200px at 0% -20%, hsl(var(--primary) / 0.12), transparent 55%)",
                  }}
                  aria-hidden
                />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Total across agents
                    </p>
                    <div>
                      <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[2.5rem]">
                        {formatTreasuryUsd(wallets.totalUsdc)}
                      </p>
                      <p className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">
                        {wallets.totalSol != null ? `${formatSol(wallets.totalSol)} SOL` : "— SOL"}
                      </p>
                    </div>
                    {wallets.shortAddress ? (
                      <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/25 px-3 py-1 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9945FF]" aria-hidden />
                        <span className="font-mono text-foreground/90">{wallets.shortAddress}</span>
                        <span className="text-muted-foreground/80">connected</span>
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-xl gap-2 self-start sm:self-auto"
                    disabled={refreshing}
                    onClick={() => void wallets.handleRefreshAll()}
                  >
                    {refreshing ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="h-4 w-4" aria-hidden />
                    )}
                    Refresh balances
                  </Button>
                </div>
              </section>

              <section className="space-y-4" aria-labelledby="agent-wallets-heading">
                <div>
                  <h2 id="agent-wallets-heading" className="text-base font-semibold text-foreground">
                    Your agent wallets
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chat and LP treasuries are live. Trading and arbitrage wallets are on the way.
                  </p>
                </div>
                <AgentWalletsManager
                  embedded
                  layout="simple"
                  showComingSoon
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
                  onFundChat={() => openMoveFunds("deposit", "chat")}
                  onFundLp={() => openMoveFunds("deposit", "lp")}
                  onWithdrawChat={() => openMoveFunds("withdraw", "chat")}
                  onWithdrawLp={() => openMoveFunds("withdraw", "lp")}
                  onRefreshChatBalances={() => void wallets.handleRefreshChatBalances()}
                  onRefreshLpBalances={() => void wallets.handleRefreshLpBalances()}
                  onCreateChatWallet={() => void wallets.handleCreateChatWallet()}
                  onCreateLpWallet={() => void wallets.handleCreateLpWallet()}
                  creatingChat={wallets.creatingChat}
                  creatingLp={wallets.creatingLp}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
    {treasuryReady ? (
      <FuelAgentModal
        open={moveFundsOpen}
        onOpenChange={setMoveFundsOpen}
        initialFlowTab={wallets.fundTab}
        initialAgentWallet={wallets.fundWallet}
        onDepositComplete={() => void wallets.handleRefreshAll()}
      />
    ) : null}
    </>
  );
}
