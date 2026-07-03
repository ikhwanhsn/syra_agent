import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, Loader2, Wallet } from "lucide-react";
import { PillarLayout } from "@/components/pillars/PillarLayout";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  fetchMultiWalletRecoveryPreview,
  recoverMultiWalletFunds,
  type MultiWalletRecoveryPreview,
  type MultiWalletRecoveryResponse,
} from "@/lib/multiWalletRecoveryApi";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

export default function MultiWalletRecoverPage() {
  const { connected, address } = useWalletContext();
  const { openConnectModal } = useConnectModal();
  const { requestSyraAuthForWallet } = useSyraAuth();

  const [preview, setPreview] = useState<MultiWalletRecoveryPreview | null>(null);
  const [result, setResult] = useState<MultiWalletRecoveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const ensureSession = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
    setAuthPending(true);
    try {
      const auth = await requestSyraAuthForWallet(address);
      return Boolean(auth?.accessToken);
    } catch (err) {
      notify.error("Sign in required", err instanceof Error ? err.message : "Approve wallet sign-in");
      return false;
    } finally {
      setAuthPending(false);
    }
  }, [address, requestSyraAuthForWallet]);

  const loadPreview = useCallback(async () => {
    if (!connected || !address) {
      setPreview(null);
      setResult(null);
      return;
    }
    setLoading(true);
    try {
      const authed = await ensureSession();
      if (!authed) return;
      const data = await fetchMultiWalletRecoveryPreview();
      setPreview(data);
    } catch (err) {
      notify.error("Load failed", err instanceof Error ? err.message : "Could not load recovery preview");
    } finally {
      setLoading(false);
    }
  }, [address, connected, ensureSession]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const runRecover = useCallback(async () => {
    if (!connected || !address) {
      notify.error("Connect wallet", "Connect your wallet to receive recovered SOL");
      return;
    }
    if (!preview || preview.walletCount === 0) {
      notify.error("Nothing to recover", "No farm wallets found for your connected wallet");
      return;
    }

    setRecovering(true);
    setResult(null);
    setStatusText(`Recovering ${preview.walletCount} wallets — selling $ANSEM and sweeping SOL…`);

    try {
      const authed = await ensureSession();
      if (!authed) return;

      const data = await recoverMultiWalletFunds();
      setResult(data);
      setStatusText(
        `Done — ${data.succeeded} recovered, ${data.skipped} skipped, ${data.failed} failed. ` +
          `${data.totalSolSwept.toFixed(4)} SOL sent to your wallet.`,
      );

      if (data.failed > 0) {
        const firstErr = data.results.find((r) => !r.success)?.error;
        notify.error(
          "Some wallets failed",
          firstErr ?? `${data.failed} wallet${data.failed === 1 ? "" : "s"} could not recover`,
        );
      } else if (data.succeeded === 0 && data.skipped === data.total) {
        notify.error("Nothing recovered", "All wallets were already empty");
      } else {
        notify.success(
          "Recovery complete",
          `${data.totalSolSwept.toFixed(4)} SOL sent to ${address.slice(0, 4)}…${address.slice(-4)}`,
        );
      }

      await loadPreview();
    } catch (err) {
      setStatusText(null);
      notify.error("Recovery failed", err instanceof Error ? err.message : "Could not recover funds");
    } finally {
      setRecovering(false);
    }
  }, [address, connected, ensureSession, loadPreview, preview]);

  return (
    <PillarLayout
      embedded
      title="Recover farm wallets"
      tagline="One-time recovery"
      description="Sell all $ANSEM on your legacy farm wallets and sweep the SOL to your connected wallet."
    >
      {!connected ? (
        <div className={cn(overviewCardShell, "p-8 text-center")}>
          <p className="text-sm text-muted-foreground">
            Connect the wallet that owns your farm wallets to recover funds.
          </p>
          <Button className="mt-4" onClick={openConnectModal}>
            Connect wallet
          </Button>
        </div>
      ) : authPending || (loading && !preview) ? (
        <div className={cn(overviewCardShell, "flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground")}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading recovery preview…
        </div>
      ) : (
        <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary/80">Fund recovery</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">Withdraw all SOL</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Syra sells any remaining $ANSEM on each farm wallet, then sends the SOL to{" "}
                <span className="font-mono text-xs">{address.slice(0, 4)}…{address.slice(-4)}</span>.
              </p>
            </div>
            <ArrowDownToLine className="mt-1 h-5 w-5 shrink-0 text-primary/70" aria-hidden />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
              <p className="text-xs text-muted-foreground">Farm wallets</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{preview?.walletCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
              <p className="text-xs text-muted-foreground">Total SOL on wallets</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {(preview?.totalSol ?? 0).toFixed(4)} SOL
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
              <p className="text-xs text-muted-foreground">Total $ANSEM</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {(preview?.totalAnsem ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {recovering || statusText ? (
            <div className="mt-5 space-y-2">
              <Progress value={recovering ? 60 : 100} className="h-2" />
              {statusText ? <p className="text-sm text-muted-foreground">{statusText}</p> : null}
            </div>
          ) : null}

          {result ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Last run: {result.totalSolSwept.toFixed(4)} SOL swept from {result.succeeded} wallet
              {result.succeeded === 1 ? "" : "s"}.
            </p>
          ) : null}

          <Button
            className="mt-5 w-full sm:w-auto"
            disabled={recovering || !preview || preview.walletCount === 0}
            onClick={() => void runRecover()}
          >
            {recovering ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            Recover all &amp; send SOL to wallet
          </Button>
        </div>
      )}
    </PillarLayout>
  );
}
