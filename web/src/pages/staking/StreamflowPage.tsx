"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Lock, Timer } from "lucide-react";
import { useSyraSolana } from "@/hooks/useSyraSolana";
import { LockPositionCard } from "@/components/staking/LockPositionCard";
import { StakingConnectPrompt } from "@/components/staking/StakingConnectPrompt";
import { StakingPageHero } from "@/components/staking/StakingPageHero";
import {
  stakingAmountShell,
  stakingCardBody,
  stakingEmptyState,
  stakingInsetCard,
  stakingPanelShell,
  stakingPrimaryCta,
  stakingSectionLabel,
  stakingSectionTitle,
  stakingSegmentedRoot,
  stakingSegmentedTrigger,
} from "@/components/staking/stakingStyles";
import { StakingShell } from "@/components/StakingShell";
import { StakingStatsStrip } from "@/components/StakingStatsStrip";
import {
  parseStakeErrorForNotify,
  StakePreflightChecklist,
} from "@/components/StakePreflightChecklist";
import { useStreamflowStaking } from "@/hooks/useStreamflowStaking";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import { CONFIG } from "@/constants/config";
import { formatCompactAmountFloor, formatUnits, parseUnits } from "@/lib/format";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

const EXPLORER_TX = (sig: string) =>
  CONFIG.IS_DEVNET
    ? `https://explorer.solana.com/tx/${sig}?cluster=devnet`
    : `https://explorer.solana.com/tx/${sig}`;

const lockExplorerUrl = (streamId: string) =>
  CONFIG.IS_DEVNET
    ? `https://explorer.solana.com/address/${streamId}?cluster=devnet`
    : `https://explorer.solana.com/address/${streamId}`;

function LockListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-border/40 bg-muted/15 p-5 sm:p-6"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <div className="mb-2 h-3 w-20 rounded bg-muted-foreground/15" />
          <div className="mb-2 h-7 w-28 rounded bg-muted-foreground/12" />
          <div className="h-3 w-32 max-w-full rounded bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  );
}

function PortfolioEmptyState(props: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const { icon, title, description } = props;
  return (
    <div className={stakingEmptyState}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-background/50 text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {description}
      </p>
    </div>
  );
}

export default function StreamflowStakingPage() {
  const { connected } = useSyraSolana();

  const [amount, setAmount] = useState("");
  const [portfolioTab, setPortfolioTab] = useState<"open" | "history">("open");
  const [statsRefreshNonce, setStatsRefreshNonce] = useState(0);
  const {
    locks,
    historyLocks,
    walletBalanceRaw,
    walletBalanceFormatted,
    lockTokens,
    refreshMaxLockAmount,
    maxLockableFormatted,
    maxLockableRaw,
    tokenDecimals: onChainDecimals,
    readiness,
    readinessLoading,
    refreshReadiness,
    loading,
    actionLoading,
    error,
  } = useStreamflowStaking();

  const symbol = STREAMFLOW_CONFIG.tokenSymbol;
  const networkLabel = CONFIG.IS_DEVNET ? "Devnet" : "Mainnet";

  const applyBalanceFraction = useCallback(
    async (numerator: bigint, denominator: bigint) => {
      if (denominator <= 0n) return;
      const { maxLockable, decimals } = await refreshMaxLockAmount();
      if (maxLockable <= 0n) return;
      const raw = (maxLockable * numerator) / denominator;
      if (raw <= 2n) return;
      setAmount(formatUnits(raw, decimals, decimals));
    },
    [refreshMaxLockAmount],
  );

  const sortedLocks = useMemo(() => locks, [locks]);
  const maxLockableCompact = useMemo(
    () => formatCompactAmountFloor(maxLockableFormatted),
    [maxLockableFormatted],
  );

  const walletBalanceExceedsMax = useMemo(() => {
    if (!connected || maxLockableRaw <= 0n) return false;
    return walletBalanceRaw > maxLockableRaw;
  }, [connected, walletBalanceRaw, maxLockableRaw]);

  useEffect(() => {
    if (!connected) return;
    const timer = window.setTimeout(() => {
      void refreshReadiness(amount);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [connected, amount, refreshReadiness, maxLockableRaw, walletBalanceRaw]);

  const lockBlocked =
    connected && readiness != null && !readiness.canLock && amount.trim().length > 0;

  const handleLock = async () => {
    if (!connected) {
      notify.error("Connect your wallet first");
      return;
    }
    const preflight = await refreshReadiness(amount);
    if (preflight && !preflight.canLock && amount.trim()) {
      const firstError = preflight.issues.find((i) => i.severity === "error");
      notify.error(
        firstError
          ? `${firstError.title} — ${firstError.fix}`
          : "Fix the checklist items before locking.",
      );
      return;
    }
    try {
      let amountToLock = amount;
      const { maxLockable, decimals } = await refreshMaxLockAmount();
      if (maxLockable > 0n && amount.trim()) {
        const requested = parseUnits(amount.trim(), decimals);
        if (requested > maxLockable) {
          amountToLock = formatUnits(maxLockable, decimals, decimals);
          setAmount(amountToLock);
          notify.message(
            `Adjusted to max lockable (${amountToLock} ${symbol}) after Streamflow fees`,
          );
        }
      }
      const { txId, wasClamped, amountFormatted } = await lockTokens(
        amountToLock,
        STREAMFLOW_CONFIG.lockDurationSeconds,
      );
      if (wasClamped) {
        notify.message(`Adjusted to maximum lockable: ${amountFormatted} ${symbol}`);
      }
      notify.success(
        "Lock created successfully",
        <>
          <a
            href={EXPLORER_TX(txId)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            View transaction
          </a>
        </>,
      );
      setAmount("");
      setStatsRefreshNonce((n) => n + 1);
      void refreshReadiness("");
    } catch (e) {
      const parsed = parseStakeErrorForNotify(e);
      notify.error(parsed.title, parsed.description, parsed.durationMs);
    }
  };

  return (
    <StakingShell>
      <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
        <StakingPageHero
          symbol={symbol}
          lockDurationLabel={STREAMFLOW_CONFIG.lockDurationLabel}
          networkLabel={networkLabel}
          error={error}
        />

        <StakingStatsStrip
          symbol={symbol}
          tokenDecimals={onChainDecimals}
          connected={connected}
          portfolioLoading={loading}
          openLocks={sortedLocks}
          walletBalanceFormatted={walletBalanceFormatted}
          maxLockableFormatted={maxLockableFormatted}
          solBalanceFormatted={readiness?.solBalanceFormatted}
          refreshNonce={statsRefreshNonce}
        />

        <div className="grid min-w-0 grid-cols-1 gap-5 pt-2 sm:gap-6 lg:grid-cols-2 lg:items-start lg:gap-8 lg:pt-0">
          {/* Lock form */}
          <section className={stakingPanelShell}>
            <div className={cn(stakingCardBody, "flex flex-col")}>
            <div className="mb-5 sm:mb-6">
              <p className={stakingSectionLabel}>New position</p>
              <h2 className={stakingSectionTitle}>Open a lock</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Locked for {STREAMFLOW_CONFIG.lockDurationLabel}. Vesting via Streamflow.
              </p>
            </div>

            {!connected ? <StakingConnectPrompt symbol={symbol} className="mb-5" /> : null}

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <label htmlFor="streamflow-amount" className="text-sm font-medium text-foreground">
                    Amount
                  </label>
                  <button
                    type="button"
                    className="max-w-full text-left text-xs text-muted-foreground transition hover:text-foreground sm:text-right"
                    title={`Exact max: ${maxLockableFormatted} ${symbol}`}
                    onClick={() => void applyBalanceFraction(1n, 1n)}
                    disabled={!connected || maxLockableRaw <= 0n}
                  >
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {maxLockableFormatted}
                    </span>{" "}
                    {symbol} max
                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground/90">
                      ≈{maxLockableCompact} after fees
                    </span>
                  </button>
                </div>

                {walletBalanceExceedsMax ? (
                  <p className={cn(stakingInsetCard, "text-xs text-muted-foreground")}>
                    Balance exceeds lockable max—use <span className="font-medium text-foreground">Max</span>.
                  </p>
                ) : null}

                <div className={stakingAmountShell}>
                  <input
                    id="streamflow-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="min-h-12 min-w-0 flex-1 bg-transparent px-4 py-3 font-mono text-xl font-semibold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/30 sm:text-2xl"
                    disabled={!connected || actionLoading}
                    aria-label={`Amount in ${symbol}`}
                  />
                  <div className="flex shrink-0 border-t border-border/50 p-1 sm:border-l sm:border-t-0">
                    <button
                      type="button"
                      onClick={() => void applyBalanceFraction(1n, 2n)}
                      disabled={!connected || actionLoading || maxLockableRaw <= 0n}
                      className="min-h-10 flex-1 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:opacity-35 sm:min-w-[3rem] sm:flex-none"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => void applyBalanceFraction(1n, 1n)}
                      disabled={!connected || actionLoading || maxLockableRaw <= 0n}
                      className="min-h-10 flex-1 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:opacity-35 sm:min-w-[3rem] sm:flex-none"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>

              <StakePreflightChecklist
                symbol={symbol}
                readiness={readiness}
                loading={readinessLoading}
                connected={connected}
              />

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleLock()}
                  disabled={
                    !connected ||
                    actionLoading ||
                    loading ||
                    (lockBlocked && amount.trim().length > 0)
                  }
                  className={stakingPrimaryCta}
                >
                  {actionLoading ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                        aria-hidden
                      />
                      Confirm in wallet…
                    </span>
                  ) : (
                    <span>
                      Lock for {STREAMFLOW_CONFIG.lockDurationLabel}
                    </span>
                  )}
                </button>
                {lockBlocked ? (
                  <p className="text-center text-xs text-destructive" role="status">
                    {readiness?.issues.find((i) => i.severity === "error")?.title ??
                      "Fix checklist above"}
                  </p>
                ) : null}
              </div>
            </div>
            </div>
          </section>

          {/* Portfolio */}
          <section className={stakingPanelShell}>
            <div className={cn(stakingCardBody, "flex min-w-0 flex-col")}>
            <div className="mb-5 space-y-4">
              <div>
                <p className={stakingSectionLabel}>Portfolio</p>
                <h2 className={stakingSectionTitle}>Your positions</h2>
              </div>
              <div className={stakingSegmentedRoot} role="tablist" aria-label="Portfolio views">
                <button
                  type="button"
                  role="tab"
                  aria-selected={portfolioTab === "open"}
                  id="portfolio-tab-open"
                  aria-controls="portfolio-panel-open"
                  onClick={() => setPortfolioTab("open")}
                  className={stakingSegmentedTrigger(portfolioTab === "open")}
                >
                  Open
                  {!loading ? (
                    <span className="font-mono text-xs tabular-nums opacity-75">
                      {sortedLocks.length}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={portfolioTab === "history"}
                  id="portfolio-tab-history"
                  aria-controls="portfolio-panel-history"
                  onClick={() => setPortfolioTab("history")}
                  className={stakingSegmentedTrigger(portfolioTab === "history")}
                >
                  History
                  {!loading ? (
                    <span className="font-mono text-xs tabular-nums opacity-75">
                      {historyLocks.length}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              {loading ? (
                <LockListSkeleton />
              ) : portfolioTab === "open" ? (
                <div
                  id="portfolio-panel-open"
                  role="tabpanel"
                  aria-labelledby="portfolio-tab-open"
                  className="min-w-0"
                >
                  {sortedLocks.length === 0 ? (
                    <PortfolioEmptyState
                      icon={<Lock className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
                      title="No open positions"
                      description={`Lock ${symbol} to see active positions and vesting here.`}
                    />
                  ) : (
                    <ul className="space-y-3">
                      {sortedLocks.map((row) => (
                        <li key={row.id} className="min-w-0">
                          <LockPositionCard
                            row={row}
                            symbol={symbol}
                            variant="open"
                            explorerUrl={lockExplorerUrl(row.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div
                  id="portfolio-panel-history"
                  role="tabpanel"
                  aria-labelledby="portfolio-tab-history"
                  className="min-w-0"
                >
                  {historyLocks.length === 0 ? (
                    <PortfolioEmptyState
                      icon={<Timer className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
                      title="No history yet"
                      description="Released or completed locks appear here."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {historyLocks.map((row) => (
                        <li key={row.id} className="min-w-0">
                          <LockPositionCard
                            row={row}
                            symbol={symbol}
                            variant="history"
                            explorerUrl={lockExplorerUrl(row.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            </div>
          </section>
        </div>
      </div>
    </StakingShell>
  );
}
