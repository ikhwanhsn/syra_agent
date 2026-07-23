import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Loader2, RefreshCw, ArrowDownToLine } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { cn } from "@/lib/utils";
import type { LabDepositDistributeResult, LabDepositHub } from "@/lib/labsX402Api";

interface DepositHubPanelProps {
  deposit: LabDepositHub | undefined;
  isLoading: boolean;
  onDistribute: () => void;
  isDistributing: boolean;
  distributeError?: string | null;
  lastResult?: LabDepositDistributeResult | null;
}

function formatBalance(n: number | null | undefined, decimals = 4): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

function formatRelativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const diffSec = Math.round((Date.now() - t) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.floor(diffSec / 3600)}h ago`;
  return new Date(iso).toLocaleString();
}

function chainLabelFor(chain: LabDepositHub["chain"]): string {
  if (chain === "base") return "Base";
  if (chain === "algorand") return "Algorand";
  return "Solana";
}

function isNativeReservedError(error: string | undefined, nativeSymbol: string): boolean {
  if (!error) return false;
  const lower = error.toLowerCase();
  if (nativeSymbol === "SOL") return lower.includes("sol_reserved") || lower.includes("reserved_for_fees");
  if (nativeSymbol === "ALGO")
    return lower.includes("algo_reserved") || lower.includes("reserved_for_fees");
  return lower.includes("eth_reserved") || lower.includes("reserved_for_gas");
}

export function DepositHubPanel({
  deposit,
  isLoading,
  onDistribute,
  isDistributing,
  distributeError,
  lastResult,
}: DepositHubPanelProps) {
  const [copied, setCopied] = useState(false);
  const showSkeleton = useMinimumSkeleton(isLoading);

  if (showSkeleton) {
    return (
      <div
        className={cn(overviewCardShell, "space-y-4 p-5 animate-in fade-in duration-300")}
        aria-busy="true"
        aria-label="Loading deposit hub"
      >
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-40 w-40 mx-auto rounded-xl" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className={cn(overviewCardShell, "p-5 text-sm text-muted-foreground")}>
        Deposit hub unavailable. Try refreshing the page.
      </div>
    );
  }

  const nativeSymbol = deposit.nativeSymbol;
  const networkLabel = chainLabelFor(deposit.chain);
  const gasNoun =
    deposit.chain === "solana" || deposit.chain === "algorand" ? "fees" : "gas";

  const copyAddress = async () => {
    await navigator.clipboard.writeText(deposit.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lastDist =
    formatRelativeTime(deposit.lastDistributedAt) ??
    formatRelativeTime(lastResult?.lastDistributedAt ?? null);

  const okCount = lastResult?.transfers?.filter((t) => t.ok).length ?? 0;
  const failCount = lastResult?.transfers?.filter((t) => !t.ok).length ?? 0;
  const nativeReserved = lastResult?.transfers?.some(
    (t) => t.asset === nativeSymbol && isNativeReservedError(t.error, nativeSymbol),
  );

  return (
    <div className={cn(overviewCardShell, "space-y-4 p-5")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ArrowDownToLine className="h-4 w-4 text-primary" aria-hidden />
            Deposit hub
          </h3>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            {deposit.chain === "algorand" ? (
              <>
                On Algorand, send <strong className="font-medium text-foreground">ALGO first</strong>{" "}
                (~0.25+ so the hub can pay USDC fees above the 0.2 ASA min-balance), wait until this
                hub shows &quot;USDC ready&quot;, then send USDC. Recipients also need ~0.15 ALGO each
                to opt into USDC. If the hub is at exactly 0.2 ALGO, Distribute auto-borrows a small
                fee top-up from PayTo. Sending USDC before hub opt-in triggers a Pera Inbox Router
                warning — cancel that and wait.
              </>
            ) : (
              <>
                Send {nativeSymbol} and USDC on {networkLabel} to this address, then click Distribute
                now. Any non-zero USDC and {nativeSymbol} is split equally across all active payer and
                PayTo wallets (only {gasNoun} for the sends is kept on the deposit wallet).
              </>
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 shrink-0"
          disabled={isDistributing || deposit.recipientsCount < 1}
          onClick={onDistribute}
          title={
            deposit.recipientsCount < 1
              ? "Create at least one payer or PayTo wallet first"
              : "Distribute now"
          }
        >
          {isDistributing ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden />
          )}
          Distribute now
        </Button>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-xl bg-white p-3 shrink-0">
          <QRCodeSVG value={deposit.address} size={148} level="M" />
        </div>
        <div className="flex w-full flex-1 flex-col gap-3 min-w-0">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
            <code className="flex-1 break-all text-xs">{deposit.address}</code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void copyAddress()}
              aria-label="Copy deposit address"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {nativeSymbol}
              </p>
              <p className="font-mono tabular-nums">{formatBalance(deposit.nativeBalance, 6)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">USDC</p>
              <p className="font-mono tabular-nums">{formatBalance(deposit.usdcBalance, 2)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Recipients
              </p>
              <p className="font-mono tabular-nums">{deposit.recipientsCount}</p>
            </div>
          </div>
          {deposit.chain === "algorand" ? (
            <p
              className={
                deposit.optedInUsdc
                  ? "text-[11px] text-emerald-700 dark:text-emerald-400"
                  : "text-[11px] text-amber-700 dark:text-amber-400"
              }
            >
              {deposit.optedInUsdc
                ? "USDC ready — hub is opted into USDC ASA. You can send USDC now."
                : "USDC not ready yet — send ALGO first (~0.2+). Refresh this page after the ALGO arrives so the hub can opt into USDC."}
            </p>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            Manual distribute only — splits whatever USDC/{nativeSymbol} balance is above zero.
            {lastDist ? ` Last distribute: ${lastDist}.` : " No distribute yet."}
          </p>
        </div>
      </div>

      {distributeError ? (
        <Alert variant="destructive">
          <AlertDescription>{distributeError}</AlertDescription>
        </Alert>
      ) : null}

      {lastResult && !lastResult.skipped ? (
        <Alert variant={failCount > 0 && okCount === 0 ? "destructive" : undefined}>
          <AlertDescription>
            Distributed {okCount} transfer{okCount === 1 ? "" : "s"}
            {failCount > 0 ? ` (${failCount} failed)` : ""} to {lastResult.recipientsCount} wallet
            {(lastResult.recipientsCount ?? 0) === 1 ? "" : "s"}.
            {deposit.chain === "algorand" && failCount > 0 ? (
              <>
                {" "}
                {(() => {
                  const failed = (lastResult.transfers ?? []).filter((t) => !t.ok && t.error);
                  const optInFails = failed.filter(
                    (t) =>
                      /opt_in|not_opted|insufficient_algo/i.test(t.error || ""),
                  ).length;
                  if (optInFails > 0) {
                    return `USDC needs each wallet opted into the ASA (~0.15 ALGO each). Fund the hub with more ALGO (~${(optInFails * 0.15).toFixed(1)}+) and distribute again.`;
                  }
                  const sample = failed[0]?.error;
                  return sample ? ` First error: ${sample}` : "";
                })()}
              </>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {lastResult?.skipped &&
      (lastResult.reason === "empty" ||
        lastResult.reason === "nothing_distributable" ||
        lastResult.reason === "below_threshold") ? (
        <Alert>
          <AlertDescription>
            Nothing to distribute — deposit USDC and/or more {nativeSymbol} than {gasNoun} for the
            sends, then try again.
          </AlertDescription>
        </Alert>
      ) : null}

      {nativeReserved ? (
        <Alert>
          <AlertDescription>
            USDC was handled, but {nativeSymbol} stayed on the hub — balance is only enough to cover{" "}
            {gasNoun}. Add a bit more {nativeSymbol} and distribute again.
          </AlertDescription>
        </Alert>
      ) : null}

      {lastResult?.skipped && lastResult.reason === "no_recipients" ? (
        <Alert>
          <AlertDescription>
            No recipient wallets yet. Create a PayTo and/or payer wallets first.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
