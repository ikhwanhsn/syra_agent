"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "@/lib/navigation";
import { Info, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FuelAgentModal } from "@/components/chat/FuelAgentModal";
import { AgentWalletsManager } from "@/components/settings/AgentWalletsManager";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useManagedAgentWallets } from "@/hooks/useManagedAgentWallets";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_MEDIUM,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";
import { AgentBillingDashboard } from "@/components/wallet/AgentBillingDashboard";
import { AgentPortfolioPanel } from "@/components/wallet/AgentPortfolioPanel";
import { WalletPageHeader, type WalletPageView } from "@/components/wallet/WalletPageHeader";
import { WalletSectionHeader } from "@/components/wallet/WalletSectionHeader";
import { WalletTreasuryHero } from "@/components/wallet/WalletTreasuryHero";
import { walletInfoCallout, walletPageStack, walletSectionStack } from "@/components/wallet/walletPageStyles";

function parseFlowTab(value: string | null): "deposit" | "withdraw" {
  return value === "withdraw" ? "withdraw" : "deposit";
}

function parseWalletPurpose(value: string | null): AgentWalletPurpose {
  if (value === "lp") return "lp";
  if (value === "earn" || value === "treasury" || value === "invest" || value === "grow") return value;
  return "spend";
}

function parsePageView(value: string | null): WalletPageView {
  return value === "portfolio" ? "portfolio" : "treasuries";
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
        "flex flex-col items-center px-6 py-14 text-center sm:px-10",
      )}
    >
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default function AgentWalletPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openConnectModal } = useConnectModal();
  const wallets = useManagedAgentWallets();
  const [moveFundsOpen, setMoveFundsOpen] = useState(false);

  const urlTab = useMemo(() => parseFlowTab(searchParams.get("tab")), [searchParams]);
  const urlWallet = useMemo(() => parseWalletPurpose(searchParams.get("wallet")), [searchParams]);
  const urlView = useMemo(() => parsePageView(searchParams.get("view")), [searchParams]);
  const [pageView, setPageView] = useState<WalletPageView>(urlView);

  useEffect(() => {
    setPageView(urlView);
  }, [urlView]);

  const selectPageView = (view: WalletPageView) => {
    setPageView(view);
    const next = new URLSearchParams(searchParams);
    if (view === "portfolio") next.set("view", "portfolio");
    else next.delete("view");
    const qs = next.toString();
    navigate(qs ? `/wallet?${qs}` : "/wallet", { replace: true });
  };

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
          <div className={walletPageStack}>
            <WalletPageHeader
              view={pageView}
              onViewChange={selectPageView}
              connectedLabel={treasuryReady ? wallets.shortAddress : null}
              showTabs={treasuryReady}
            />

            {!wallets.connected ? (
              <WalletPageMessage
                title="Connect your Solana wallet"
                description="Link the wallet you use to sign in. Your agent treasuries are separate from your personal balance and stay under your control."
                action={
                  <Button className="rounded-xl px-6" onClick={openConnectModal}>
                    <Wallet className="mr-2 h-4 w-4" aria-hidden />
                    Connect wallet
                  </Button>
                }
              />
            ) : wallets.setupLoading ? (
              <div className={walletSectionStack} aria-busy="true" aria-label="Loading wallets">
                <div className="h-40 animate-pulse rounded-2xl bg-muted/30" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted/30" />
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
            ) : pageView === "portfolio" ? (
              <div id="wallet-panel-portfolio" role="tabpanel" aria-labelledby="wallet-view-portfolio">
                <AgentPortfolioPanel
                  chatAddress={wallets.managedChatWallet?.agentAddress}
                  lpAddress={wallets.managedLpWallet?.agentAddress}
                  enabled={treasuryReady}
                />
              </div>
            ) : (
              <div
                id="wallet-panel-treasuries"
                role="tabpanel"
                aria-labelledby="wallet-view-treasuries"
                className={walletSectionStack}
              >
                <WalletTreasuryHero
                  totalUsdc={wallets.totalUsdc}
                  totalSol={wallets.totalSol}
                  estimatedTreasuryUsd={wallets.estimatedTreasuryUsd}
                  solPriceUsd={wallets.solPriceUsd}
                  chatUsdc={wallets.chatUsdcBalance}
                  chatSol={wallets.chatSolBalance}
                  lpUsdc={wallets.lpAgentUsdcBalance}
                  lpSol={wallets.lpAgentSolBalance}
                  hasLpWallet={Boolean(wallets.managedLpWallet)}
                  refreshing={refreshing}
                  onRefresh={() => void wallets.handleRefreshAll()}
                />

                <div className={walletInfoCallout}>
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <p>
                    <span className="font-medium text-foreground">Treasuries</span> track operational SOL and
                    USDC for paying agents. Switch to{" "}
                    <button
                      type="button"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                      onClick={() => selectPageView("portfolio")}
                    >
                      Portfolio
                    </button>{" "}
                    to see every SPL token your agents hold, including swap receipts and memecoins.
                  </p>
                </div>

                <section className={walletSectionStack} aria-labelledby="billing-heading">
                  <WalletSectionHeader
                    id="billing-heading"
                    title="Spend & policy"
                    description="Daily caps, recent tool usage, and billing limits that protect your treasuries."
                  />
                  <AgentBillingDashboard compact />
                </section>

                <section className={walletSectionStack} aria-labelledby="agent-wallets-heading">
                  <WalletSectionHeader
                    id="agent-wallets-heading"
                    title="Agent wallets"
                    description="Deposit or withdraw SOL and USDC. Each agent has its own on-chain address."
                  />
                  <AgentWalletsManager
                    embedded
                    layout="simple"
                    spendWallet={wallets.managedSpendWallet}
                    chatWallet={wallets.managedChatWallet}
                    lpWallet={wallets.managedLpWallet}
                    pillarEntries={wallets.pillarEntries}
                    spendSolBalance={wallets.spendSolBalance}
                    spendUsdcBalance={wallets.spendUsdcBalance}
                    chatSolBalance={wallets.chatSolBalance}
                    chatUsdcBalance={wallets.chatUsdcBalance}
                    lpSolBalance={wallets.lpAgentSolBalance}
                    lpUsdcBalance={wallets.lpAgentUsdcBalance}
                    spendBalanceLoading={wallets.setupLoading}
                    chatBalanceLoading={wallets.setupLoading}
                    lpBalanceLoading={
                      !wallets.managedLpWallet
                        ? false
                        : !wallets.lpWalletReady || wallets.lpAgentSolBalance == null
                    }
                    refreshingBalances={wallets.refreshingBalances}
                    refreshingChatBalances={wallets.refreshingBalances}
                    refreshingLpBalances={wallets.refreshingBalances}
                    hasLinkedWallet={wallets.hasSolana}
                    syraAuthenticated={wallets.syraAuthenticated}
                    onCopy={wallets.copyToClipboard}
                    copiedField={wallets.copiedField}
                    onFundSpend={() => openMoveFunds("deposit", "spend")}
                    onFundChat={() => openMoveFunds("deposit", "spend")}
                    onFundLp={() => openMoveFunds("deposit", "lp")}
                    onFundPillar={(p) => openMoveFunds("deposit", p)}
                    onWithdrawSpend={() => openMoveFunds("withdraw", "spend")}
                    onWithdrawChat={() => openMoveFunds("withdraw", "spend")}
                    onWithdrawLp={() => openMoveFunds("withdraw", "lp")}
                    onWithdrawPillar={(p) => openMoveFunds("withdraw", p)}
                    onRefreshBalances={() => void wallets.handleRefreshAll()}
                    onRefreshChatBalances={() => void wallets.handleRefreshAll()}
                    onRefreshLpBalances={() => void wallets.handleRefreshAll()}
                    onCreateSpendWallet={() => void wallets.handleCreateSpendWallet()}
                    onCreateChatWallet={() => void wallets.handleCreateSpendWallet()}
                    creatingSpend={wallets.creatingSpend}
                    creatingChat={wallets.creatingChat}
                  />
                </section>
              </div>
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
