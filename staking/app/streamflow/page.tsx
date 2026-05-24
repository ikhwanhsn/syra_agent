"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTheme } from "@/app/ThemeContext";
import { StakingShell } from "@/components/StakingShell";
import { StakingStatsStrip } from "@/components/StakingStatsStrip";
import { useStreamflowStaking } from "@/hooks/useStreamflowStaking";
import type { UserLockRow } from "@/lib/streamflowStaking";
import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";
import { CONFIG } from "@/constants/config";
import { formatUnits } from "@/lib/format";
import { toast } from "sonner";

const EXPLORER_TX = (sig: string) =>
  CONFIG.IS_DEVNET
    ? `https://explorer.solana.com/tx/${sig}?cluster=devnet`
    : `https://explorer.solana.com/tx/${sig}`;

const lockExplorerUrl = (streamId: string) =>
  CONFIG.IS_DEVNET
    ? `https://explorer.solana.com/address/${streamId}?cluster=devnet`
    : `https://explorer.solana.com/address/${streamId}`;

function formatCompactBalance(value: string): string {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return "0";
  if (num >= 1_000_000_000) return `${Math.floor(num / 1_000_000_000)}B`;
  if (num >= 1_000_000) return `${Math.floor(num / 1_000_000)}M`;
  if (num >= 1_000) return `${Math.floor(num / 1_000)}K`;
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function truncateMiddle(s: string, head = 6, tail = 4): string {
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function LockListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border/40 bg-muted/20 p-5"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className="mb-3 h-4 w-28 rounded-md bg-muted-foreground/15" />
          <div className="mb-2 h-3 w-full max-w-[12rem] rounded-md bg-muted-foreground/10" />
          <div className="h-3 w-full max-w-[9rem] rounded-md bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  );
}

const iconExternal = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="opacity-70 transition group-hover:opacity-100"
    aria-hidden
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" x2="21" y1="14" y2="3" />
  </svg>
);

function LockPositionCard(props: {
  row: UserLockRow;
  symbol: string;
  variant: "open" | "history";
}) {
  const { row, symbol, variant } = props;
  const unlockDate = new Date(row.unlocksAtUnix * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (variant === "history") {
    return (
      <article className="glass-card group relative overflow-hidden transition duration-300">
        <div
          className="pointer-events-none absolute inset-y-3 left-0 w-1 rounded-full bg-gradient-to-b from-foreground/25 via-foreground/12 to-transparent opacity-90"
          aria-hidden
        />
        <div className="relative pl-5 pr-4 pb-5 pt-5 sm:pl-6 sm:pr-5 sm:pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Past position
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                    row.closed
                      ? "bg-foreground/[0.06] text-foreground ring-border/60"
                      : "bg-muted/80 text-muted-foreground ring-border/50"
                  }`}
                >
                  {row.closed ? "Settled" : "Released"}
                </span>
              </div>
              <div>
                <p className="break-words text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[2rem] sm:leading-none">
                  {row.depositedFormatted}
                  <span className="ml-2 text-lg font-medium text-muted-foreground sm:text-xl">
                    {symbol}
                  </span>
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  <span className="text-foreground/90">{unlockDate}</span>
                  <span className="mx-2 text-border">·</span>
                  Tokens delivered to your wallet automatically via Streamflow.
                </p>
              </div>
            </div>
            <a
              href={lockExplorerUrl(row.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm transition hover:border-border hover:bg-background sm:min-h-0"
            >
              Contract
              {iconExternal}
            </a>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="glass-card p-4 transition duration-300 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="break-words text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
              {row.depositedFormatted}{" "}
              <span className="text-sm font-medium text-muted-foreground sm:text-base">
                {symbol}
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Unlocks{" "}
            <span className="font-medium text-foreground/90">{unlockDate}</span>
          </p>
        </div>
        <a
          href={lockExplorerUrl(row.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/20 px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/40 sm:min-h-0 sm:px-3 sm:py-1.5"
        >
          Explorer
        </a>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/40 pt-4 text-xs text-muted-foreground">
        <span>
          Auto payout (unlocked):{" "}
          <span className="font-mono font-medium text-foreground">
            {row.unlockedFormatted}
          </span>{" "}
          {symbol}
        </span>
        <span className="hidden sm:inline text-border">·</span>
        <span className="font-mono text-[11px] text-muted-foreground/90">
          {truncateMiddle(row.id)}
        </span>
      </div>
    </article>
  );
}

export default function StreamflowStakingPage() {
  const { resolved: theme } = useTheme();
  const { connected } = useWallet();
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
    loading,
    actionLoading,
    error,
  } = useStreamflowStaking();

  const tokenDecimals = STREAMFLOW_CONFIG.tokenDecimals;
  const symbol = STREAMFLOW_CONFIG.tokenSymbol;
  const networkLabel = CONFIG.IS_DEVNET ? "Devnet" : "Mainnet";

  /**
   * Always read the freshest on-chain balance when applying Max/50%,
   * so the input never targets a stale figure that would later fail
   * with InsufficientFunds at submit time.
   */
  const applyBalanceFraction = useCallback(
    async (numerator: bigint, denominator: bigint) => {
      if (denominator <= 0n) return;
      const maxLockable = await refreshMaxLockAmount();
      if (maxLockable <= 0n) return;
      const raw = (maxLockable * numerator) / denominator;
      if (raw <= 2n) return;
      setAmount(formatUnits(raw, onChainDecimals, onChainDecimals));
    },
    [refreshMaxLockAmount, onChainDecimals]
  );

  const sortedLocks = useMemo(() => locks, [locks]);
  const maxLockableCompact = useMemo(
    () => formatCompactBalance(maxLockableFormatted),
    [maxLockableFormatted]
  );

  const handleLock = async () => {
    if (!connected) {
      toast.error("Connect your wallet first");
      return;
    }
    try {
      const { txId, wasClamped, amountFormatted } = await lockTokens(
        amount,
        STREAMFLOW_CONFIG.lockDurationSeconds
      );
      if (wasClamped) {
        toast.message(
          `Adjusted to maximum lockable: ${amountFormatted} ${symbol}`
        );
      }
      toast.success(
        <>
          Lock created successfully.{" "}
          <a
            href={EXPLORER_TX(txId)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            View transaction
          </a>
        </>
      );
      setAmount("");
      setStatsRefreshNonce((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lock failed");
    }
  };

  return (
    <StakingShell>
      <div className="animate-fade-in min-w-0 pb-8 sm:pb-12" data-theme={theme}>
          <header className="mb-8 w-full min-w-0 space-y-5 sm:mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 glass-card border border-primary/15 bg-primary/[0.04] px-4 py-2 shadow-none">
              <span className="h-2 w-2 shrink-0 rounded-full bg-success/90 shadow-[0_0_8px_hsl(var(--success)/0.45)] animate-pulse" />
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground/90">{symbol}</span>
                {" · "}
                {STREAMFLOW_CONFIG.lockDurationLabel} lock · {networkLabel}
              </span>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] section-eyebrow-gradient">
                Staking
              </p>
              <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                <span className="text-foreground">Lock </span>
                <span className="neon-text">{symbol}</span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Lock{" "}
                <span className="font-medium text-foreground">{symbol}</span> with{" "}
                <a
                  href="https://streamflow.finance/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline decoration-border underline-offset-4 transition hover:decoration-foreground/60"
                >
                  Streamflow
                </a>{" "}
                on Solana. Unlocked balances are delivered to your wallet automatically as they vest.
                This flow is separate from the legacy Anchor staking pool.
              </p>
            </div>
            {error ? (
              <div
                className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </div>
            ) : null}
          </header>

          <StakingStatsStrip
            symbol={symbol}
            tokenDecimals={tokenDecimals}
            connected={connected}
            portfolioLoading={loading}
            openLocks={sortedLocks}
            walletBalanceFormatted={walletBalanceFormatted}
            refreshNonce={statsRefreshNonce}
          />

          <div className="glass-card w-full min-w-0 overflow-hidden">
            <div className="grid min-w-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:divide-x md:divide-border/60">
              {/* Configure */}
              <section className="flex min-w-0 flex-col p-4 sm:p-8 md:p-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      New position
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                      Open a lock
                    </h2>
                  </div>
                </div>

                {!connected ? (
                  <div className="mb-6 rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
                    Connect a wallet to enter an amount and create your lock.
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col space-y-6">
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                      <label
                        htmlFor="streamflow-amount"
                        className="text-sm font-medium text-foreground"
                      >
                        Amount
                      </label>
                      <button
                        type="button"
                        className="w-full text-left text-xs text-muted-foreground transition hover:text-foreground sm:w-auto sm:text-right"
                        title={maxLockableFormatted}
                        onClick={() => void applyBalanceFraction(1n, 1n)}
                        disabled={!connected || maxLockableRaw <= 0n}
                      >
                        <span className="font-medium text-foreground tabular-nums">
                          {maxLockableCompact}
                        </span>{" "}
                        {symbol} available to lock
                      </button>
                    </div>
                    <div className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-background/60 shadow-sm transition focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/25 sm:flex-row sm:items-stretch">
                      <input
                        id="streamflow-amount"
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="min-h-[48px] min-w-0 flex-1 border-0 border-border/60 bg-transparent px-4 py-3 text-lg font-semibold tabular-nums tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 sm:border-0 sm:py-4 sm:text-xl"
                        disabled={!connected || actionLoading}
                        aria-label={`Amount in ${symbol}`}
                      />
                      <div className="flex shrink-0 items-stretch justify-end gap-1 border-t border-border/60 bg-muted/20 p-1.5 sm:border-l sm:border-t-0 sm:pl-2">
                        <button
                          type="button"
                          onClick={() => void applyBalanceFraction(1n, 2n)}
                          disabled={
                            !connected || actionLoading || maxLockableRaw <= 0n
                          }
                          className="min-h-[44px] min-w-[3.25rem] touch-manipulation rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 sm:min-h-0 sm:min-w-0"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => void applyBalanceFraction(1n, 1n)}
                          disabled={
                            !connected || actionLoading || maxLockableRaw <= 0n
                          }
                          className="min-h-[44px] min-w-[3.25rem] touch-manipulation rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35 sm:min-h-0 sm:min-w-0"
                        >
                          Max
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-muted/25 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    Streamflow charges a small{" "}
                    <span className="font-medium text-foreground">SOL</span> network fee when
                    creating a contract. Keep spare SOL in this wallet.
                  </div>

                  <div className="mt-auto space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => void handleLock()}
                      disabled={!connected || actionLoading || loading}
                      className="btn-primary min-h-[52px] w-full touch-manipulation px-5 py-4 text-base active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <span className="relative z-10 flex flex-col items-center gap-0.5">
                        {actionLoading ? (
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                              aria-hidden
                            />
                            Confirm in wallet…
                          </span>
                        ) : (
                          <>
                            <span>
                              Lock for {STREAMFLOW_CONFIG.lockDurationLabel}
                            </span>
                            <span className="text-xs font-medium opacity-90">
                              {symbol} · Streamflow
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Portfolio: open positions + history */}
              <section className="flex min-w-0 flex-col border-t border-border/60 bg-muted/[0.08] p-4 sm:p-8 md:border-t-0 md:p-10 dark:bg-muted/[0.06]">
                <div className="mb-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Portfolio
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                      Staking positions
                    </h2>
                  </div>

                  <div
                    className="flex w-full flex-col gap-2 sm:inline-flex sm:w-auto sm:flex-row sm:rounded-xl sm:border sm:border-border/60 sm:bg-background/50 sm:p-1"
                    role="tablist"
                    aria-label="Portfolio views"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={portfolioTab === "open"}
                      id="portfolio-tab-open"
                      aria-controls="portfolio-panel-open"
                      onClick={() => setPortfolioTab("open")}
                      className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:min-h-0 sm:w-auto sm:px-4 sm:py-2 ${
                        portfolioTab === "open"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      }`}
                    >
                      Open positions
                      {!loading ? (
                        <span
                          className={`tabular-nums ${
                            portfolioTab === "open"
                              ? "opacity-90"
                              : "text-muted-foreground/80"
                          }`}
                        >
                          ({sortedLocks.length})
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
                      className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:min-h-0 sm:w-auto sm:px-4 sm:py-2 ${
                        portfolioTab === "history"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      }`}
                    >
                      History
                      {!loading ? (
                        <span
                          className={`tabular-nums ${
                            portfolioTab === "history"
                              ? "opacity-90"
                              : "text-muted-foreground/80"
                          }`}
                        >
                          ({historyLocks.length})
                        </span>
                      ) : null}
                    </button>
                  </div>
                </div>

                <div className="min-h-[280px] flex-1 md:min-h-[360px]">
                  {loading ? (
                    <LockListSkeleton />
                  ) : portfolioTab === "open" ? (
                    <div
                      id="portfolio-panel-open"
                      role="tabpanel"
                      aria-labelledby="portfolio-tab-open"
                    >
                      {sortedLocks.length === 0 ? (
                        <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-14 text-center md:min-h-[320px]">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-muted-foreground">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </div>
                          <p className="max-w-xs text-sm font-medium text-foreground">
                            No open positions
                          </p>
                          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                            When you lock {symbol} for this wallet, active Streamflow positions
                            appear here with unlock schedule and payout progress.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-4">
                          {sortedLocks.map((row) => (
                            <li key={row.id}>
                              <LockPositionCard row={row} symbol={symbol} variant="open" />
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
                    >
                      {historyLocks.length === 0 ? (
                        <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-14 text-center md:min-h-[320px]">
                          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-muted-foreground">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <path d="M12 8v4l3 3" />
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                          </div>
                          <p className="max-w-xs text-sm font-medium text-foreground">
                            No staking history yet
                          </p>
                          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                            Locks whose unlock date has passed or that are closed on-chain appear
                            here. Data comes from the registry and your wallet&apos;s Streamflow
                            contracts.
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-4">
                          {historyLocks.map((row) => (
                            <li key={row.id}>
                              <LockPositionCard row={row} symbol={symbol} variant="history" />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
      </div>
    </StakingShell>
  );
}
