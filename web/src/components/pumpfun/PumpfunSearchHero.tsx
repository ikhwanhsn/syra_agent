import { useCallback, useState } from "react";
import { Loader2, Search, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MemecoinAnalysisQuota } from "@/lib/pumpfunAnalysisApi";
import { isPumpfunScanUnlimitedTier } from "@/lib/pumpfunScanQuota";
import { cn } from "@/lib/utils";

const EXAMPLE_MINTS = [
  { label: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
  { label: "WIF", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
] as const;

export interface PumpfunSearchHeroProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: (mint: string) => void | Promise<void>;
  isLoading?: boolean;
  quota?: MemecoinAnalysisQuota;
  quotaLoading?: boolean;
  scanLimitReached?: boolean;
  walletConnected?: boolean;
  /** One wallet-free scan left today. */
  guestScanEligible?: boolean;
  /** True while silently restoring Syra session for an already-connected wallet. */
  authPending?: boolean;
  onConnectWallet?: () => void;
  onScanLimitClick?: () => void;
  className?: string;
}

export function PumpfunSearchHero({
  value,
  onChange,
  onAnalyze,
  isLoading,
  quota,
  quotaLoading,
  scanLimitReached,
  walletConnected = false,
  guestScanEligible = false,
  authPending = false,
  onConnectWallet,
  onScanLimitClick,
  className,
}: PumpfunSearchHeroProps) {
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("syra.pumpfun.recentMints");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const canScan = walletConnected || guestScanEligible;
  const needsWalletForNextScan = !walletConnected && !guestScanEligible;

  const saveRecent = useCallback((mint: string) => {
    setRecent((prev) => {
      const next = [mint, ...prev.filter((m) => m !== mint)].slice(0, 3);
      try {
        localStorage.setItem("syra.pumpfun.recentMints", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const submit = useCallback(() => {
    if (needsWalletForNextScan) {
      onConnectWallet?.();
      return;
    }
    if (scanLimitReached) {
      onScanLimitClick?.();
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    void onAnalyze(trimmed);
  }, [
    onAnalyze,
    onConnectWallet,
    onScanLimitClick,
    needsWalletForNextScan,
    saveRecent,
    scanLimitReached,
    value,
  ]);

  const pick = useCallback(
    (mint: string) => {
      if (needsWalletForNextScan) {
        onConnectWallet?.();
        return;
      }
      if (scanLimitReached) {
        onScanLimitClick?.();
        return;
      }
      onChange(mint);
      saveRecent(mint);
      void onAnalyze(mint);
    },
    [onAnalyze, onChange, onConnectWallet, onScanLimitClick, needsWalletForNextScan, saveRecent, scanLimitReached],
  );

  const showUsage =
    canScan &&
    !authPending &&
    !isPumpfunScanUnlimitedTier(quota?.tier) &&
    (quotaLoading || quota != null);
  const usedPct =
    quota && quota.limit > 0
      ? Math.min(100, Math.round((quota.used / quota.limit) * 100))
      : 0;

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card/90 p-5 sm:p-6",
        className,
      )}
    >
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Token Analyzer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a Solana mint or EVM token address to analyze, track your calls, and flex on social.
          </p>
        </div>

        {guestScanEligible ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-sm text-foreground">
              <span className="font-medium">1 free scan today</span>
              <span className="text-muted-foreground">
                {" "}
                — no wallet needed. Connect to use your remaining daily scans and save call history.
              </span>
            </p>
          </div>
        ) : null}

        {needsWalletForNextScan ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                  <Wallet className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">Connect wallet to scan again</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Your free daily scan was used. Connect to unlock your remaining scans, call history, and flex cards.
                  </p>
                </div>
              </div>
              <Button type="button" variant="neon" className="shrink-0" onClick={onConnectWallet}>
                Connect wallet
              </Button>
            </div>
          </div>
        ) : walletConnected && authPending ? (
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Preparing your session…
          </div>
        ) : null}

        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder={
                canScan
                  ? "Solana mint or EVM token address (0x…)"
                  : needsWalletForNextScan
                    ? "Connect wallet to scan again"
                    : "Solana mint or EVM token address (0x…)"
              }
              className="h-11 pl-9 font-mono text-sm"
              spellCheck={false}
              autoComplete="off"
              disabled={!canScan}
            />
          </div>
          <Button
            type="button"
            variant="neon"
            className="h-11 shrink-0 px-5"
            disabled={
              !canScan ||
              authPending ||
              (!scanLimitReached && !value.trim()) ||
              isLoading
            }
            onClick={submit}
          >
            {isLoading
              ? "…"
              : needsWalletForNextScan
                ? "Connect"
                : scanLimitReached
                  ? "Limit"
                  : guestScanEligible && !walletConnected
                    ? "Try free"
                    : "Scan"}
          </Button>
        </div>

        {showUsage ? (
          <div className="space-y-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
              <span className="font-medium text-foreground">
                {quotaLoading
                  ? "Loading daily limit…"
                  : quota
                    ? scanLimitReached
                      ? `Daily limit reached (${quota.used}/${quota.limit})`
                      : `${quota.used}/${quota.limit} scans used today`
                    : null}
              </span>
              {!quotaLoading && quota && scanLimitReached ? (
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={onScanLimitClick}
                >
                  View limits
                </button>
              ) : null}
            </div>
            {!quotaLoading && quota && quota.limit > 0 ? (
              <div
                className="h-1 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={quota.used}
                aria-valuemin={0}
                aria-valuemax={quota.limit}
                aria-label="Daily scans used"
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    scanLimitReached ? "bg-destructive" : "bg-primary",
                  )}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {canScan ? (
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_MINTS.map((item) => (
              <Button
                key={item.mint}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-full px-2.5 text-xs"
                disabled={authPending}
                onClick={() => pick(item.mint)}
              >
                {item.label}
              </Button>
            ))}
            {recent.map((mint) => (
              <Button
                key={mint}
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 max-w-[120px] truncate rounded-full px-2.5 font-mono text-xs"
                disabled={authPending}
                onClick={() => pick(mint)}
              >
                {mint.slice(0, 4)}…{mint.slice(-4)}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
