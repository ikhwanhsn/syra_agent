import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { LabChain, LabTreasuryStatus } from "@/lib/labsX402Api";
import { getTreasuryBannerView } from "@/lib/labsTreasuryBannerCopy";

function truncateAddr(addr: string | null | undefined, head = 6, tail = 4): string {
  const a = String(addr || "").trim();
  if (!a) return "(none)";
  if (a.length <= head + tail + 1) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}

function nativeLabel(chain: LabChain): string {
  if (chain === "algorand") return "ALGO";
  if (chain === "base") return "ETH";
  if (chain === "xlayer") return "OKB";
  return "SOL";
}

interface TreasuryHealthBannerProps {
  treasury: LabTreasuryStatus | undefined;
  isLoading: boolean;
  chain: LabChain;
  onDistribute: () => void;
  isDistributing: boolean;
  onResume: () => void;
  isResuming: boolean;
  resumeError?: string | null;
}

export function TreasuryHealthBanner({
  treasury,
  isLoading,
  chain,
  onDistribute,
  isDistributing,
  onResume,
  isResuming,
  resumeError,
}: TreasuryHealthBannerProps) {
  if (isLoading && !treasury) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <AlertTitle>Treasury</AlertTitle>
        <AlertDescription>Checking lab wallet and deposit hub balances…</AlertDescription>
      </Alert>
    );
  }

  if (!treasury) return null;

  const native = nativeLabel(chain);
  const view = getTreasuryBannerView(treasury, chain);
  const funderAddr = treasury.funderAddress || treasury.payToAddress;
  const funderUsdc = Number(treasury.funderUsdc ?? treasury.payToUsdc ?? 0);
  const funderNative = Number(
    treasury.funderNative ?? treasury.payToSpendableNative ?? treasury.payToSpendableAlgo ?? 0,
  );
  const payToNative = Number(
    treasury.payToSpendableNative ?? treasury.payToSpendableAlgo ?? 0,
  );

  if (view.tone === "healthy") {
    return (
      <Alert className="border-emerald-500/30 bg-emerald-500/5">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <AlertTitle>{view.title}</AlertTitle>
        <AlertDescription className="space-y-1">
          <p>
            Richest funder {truncateAddr(funderAddr)} holds{" "}
            <span className="font-mono">${funderUsdc.toFixed(4)}</span> USDC
            {chain === "algorand" ? (
              <>
                {" "}
                and <span className="font-mono">{funderNative.toFixed(4)}</span> spendable {native}
              </>
            ) : null}
            . {view.body}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (view.tone === "recoverable") {
    return (
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <RefreshCw className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden />
        <AlertTitle>{view.title}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{view.body}</p>
          <p className="text-xs opacity-90">
            Funder USDC: <span className="font-mono">${funderUsdc.toFixed(4)}</span>
            {chain === "algorand" ? (
              <>
                {" "}
                · spendable {native}: <span className="font-mono">{funderNative.toFixed(4)}</span>
              </>
            ) : null}
            {treasury.payToAddress ? (
              <>
                {" "}
                · PayTo USDC:{" "}
                <span className="font-mono">${Number(treasury.payToUsdc ?? 0).toFixed(4)}</span>
                {chain === "algorand" ? (
                  <>
                    {" "}
                    · PayTo {native}:{" "}
                    <span className="font-mono">{payToNative.toFixed(4)}</span>
                  </>
                ) : null}
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={isResuming || !treasury.canFundAny}
              onClick={onResume}
              title="Clear treasury pause and resume auto-call"
            >
              {isResuming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              )}
              Resume auto-call
            </Button>
          </div>
          {resumeError ? <p className="text-xs">{resumeError}</p> : null}
        </AlertDescription>
      </Alert>
    );
  }

  const isNativeReason = treasury.reason === "payto_native_underfunded";

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" aria-hidden />
      <AlertTitle>{view.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{view.body}</p>
        <p className="text-xs opacity-90">
          Funder USDC: <span className="font-mono">${funderUsdc.toFixed(4)}</span>
          {chain === "algorand" ? (
            <>
              {" "}
              · spendable {native}: <span className="font-mono">{funderNative.toFixed(4)}</span>
            </>
          ) : null}
          {treasury.payToAddress ? (
            <>
              {" "}
              · PayTo USDC:{" "}
              <span className="font-mono">${Number(treasury.payToUsdc ?? 0).toFixed(4)}</span>
              {chain === "algorand" || isNativeReason ? (
                <>
                  {" "}
                  · PayTo {native}: <span className="font-mono">{payToNative.toFixed(4)}</span>
                </>
              ) : null}
            </>
          ) : null}
          {treasury.hubAddress ? (
            <>
              {" "}
              · Hub USDC:{" "}
              <span className="font-mono">${Number(treasury.hubUsdc ?? 0).toFixed(4)}</span>
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2">
          {treasury.hubHasFunds ? (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              disabled={isDistributing}
              onClick={onDistribute}
            >
              {isDistributing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Wallet className="h-3.5 w-3.5" aria-hidden />
              )}
              Distribute from hub
            </Button>
          ) : null}
          {treasury.paused || !treasury.canFundAny ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              disabled={isResuming || !treasury.canFundAny}
              onClick={onResume}
              title={
                treasury.canFundAny
                  ? "Clear treasury pause and resume auto-call"
                  : "Fund any lab wallet or the deposit hub before resuming"
              }
            >
              {isResuming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              )}
              Resume auto-call
            </Button>
          ) : null}
        </div>
        {resumeError ? <p className="text-xs">{resumeError}</p> : null}
      </AlertDescription>
    </Alert>
  );
}
