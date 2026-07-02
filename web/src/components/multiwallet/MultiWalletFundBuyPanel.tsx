import { useCallback, useMemo, useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Loader2, Rocket, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { useWalletContext } from "@/contexts/WalletContext";
import { notify } from "@/lib/notify";
import { buildFundingTransactionBatches } from "@/lib/multiWalletFunding";
import { withRpcFallback } from "@/lib/solanaRpc";
import {
  executeMultiWalletAnsemBuy,
  type MultiWalletRow,
  type MultiWalletTierSummary,
} from "@/lib/multiWalletApi";
import { cn } from "@/lib/utils";

const FUND_CONFIRM_TIMEOUT_MS = 90_000;
const FUND_CONFIRM_POLL_MS = 2_000;

type FundBuyPhase = "idle" | "funding" | "buying" | "done";

interface MultiWalletFundBuyPanelProps {
  wallets: MultiWalletRow[];
  tier: MultiWalletTierSummary | null;
  onComplete: () => Promise<void> | void;
}

async function waitForWalletsFunded(
  publicKeys: string[],
  minLamports: number,
  onProgress?: (confirmed: number, total: number) => void,
): Promise<void> {
  const pending = new Set(publicKeys);
  const start = Date.now();

  while (pending.size > 0 && Date.now() - start < FUND_CONFIRM_TIMEOUT_MS) {
    await withRpcFallback(async (connection) => {
      await Promise.all(
        [...pending].map(async (pk) => {
          const bal = await connection.getBalance(new PublicKey(pk), "confirmed");
          if (bal >= minLamports) pending.delete(pk);
        }),
      );
    });

    onProgress?.(publicKeys.length - pending.size, publicKeys.length);
    if (pending.size > 0) {
      await new Promise((r) => setTimeout(r, FUND_CONFIRM_POLL_MS));
    }
  }

  if (pending.size > 0) {
    throw new Error(
      `Funding not confirmed for ${pending.size} wallet${pending.size === 1 ? "" : "s"} after ${FUND_CONFIRM_TIMEOUT_MS / 1000}s`,
    );
  }
}

export function MultiWalletFundBuyPanel({ wallets, tier, onComplete }: MultiWalletFundBuyPanelProps) {
  const { publicKey, sendAllTransactions } = useWalletContext();
  const [phase, setPhase] = useState<FundBuyPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fundSol = tier?.fundSolPerWallet ?? 0.015;
  const swapSol = tier?.swapSolPerWallet ?? 0.007;
  const ansemMint = tier?.ansemMint ?? "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";

  const targetWallets = useMemo(() => wallets.filter((w) => w.status === "active"), [wallets]);
  const totalFundSol = useMemo(() => targetWallets.length * fundSol, [targetWallets.length, fundSol]);

  const runFundAndBuy = useCallback(async () => {
    if (!publicKey) {
      notify.error("Connect wallet", "Connect your wallet to fund and buy $ANSEM");
      return;
    }
    if (targetWallets.length === 0) {
      notify.error("No wallets", "Generate wallets before funding");
      return;
    }

    setSubmitting(true);
    setPhase("funding");
    setProgress(0);
    setStatusText("Building SOL transfer transactions…");

    try {
      const lamportsPerWallet = Math.floor(fundSol * LAMPORTS_PER_SOL);
      const recipients = targetWallets.map((w) => w.publicKey);

      const { blockhash } = await withRpcFallback((connection) =>
        connection.getLatestBlockhash("finalized"),
      );

      const fundingTransactions = buildFundingTransactionBatches({
        from: publicKey,
        recipients,
        lamportsPerWallet,
        recentBlockhash: blockhash,
      });

      const txLabel =
        fundingTransactions.length === 1
          ? "one transaction"
          : `${fundingTransactions.length} transactions`;
      setStatusText(`Approve once in your wallet (${txLabel}, ${recipients.length} wallets)…`);
      setProgress(15);

      await sendAllTransactions(fundingTransactions);
      setProgress(50);

      notify.success(
        "Funding sent",
        `${targetWallets.length} wallets funded with ${fundSol} SOL each`,
      );

      setPhase("buying");
      const minLamports = Math.floor(fundSol * LAMPORTS_PER_SOL * 0.9);
      setStatusText("Waiting for funding to confirm on-chain…");
      await waitForWalletsFunded(recipients, minLamports, (confirmed, total) => {
        setStatusText(`Funding confirmed ${confirmed} / ${total} wallets…`);
        setProgress(50 + Math.round((confirmed / total) * 25));
      });

      setStatusText(`Swapping ${swapSol} SOL → $ANSEM on each wallet…`);
      const buyResult = await executeMultiWalletAnsemBuy(recipients, swapSol);

      setProgress(100);
      setPhase("done");
      setStatusText(
        `Done — ${buyResult.succeeded} succeeded, ${buyResult.failed} failed out of ${buyResult.total}`,
      );

      if (buyResult.failed > 0) {
        notify.error(
          "Some swaps failed",
          `${buyResult.failed} wallet${buyResult.failed === 1 ? "" : "s"} did not buy $ANSEM`,
        );
      } else {
        notify.success("All swaps submitted", `$ANSEM purchased on ${buyResult.succeeded} wallets`);
      }

      await onComplete();
    } catch (err) {
      setPhase("idle");
      setProgress(0);
      setStatusText(null);
      notify.error("Fund & buy failed", err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  }, [fundSol, onComplete, publicKey, sendAllTransactions, swapSol, targetWallets]);

  return (
    <div className={cn(overviewCardShell, "p-5 sm:p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-primary/80">Fund & buy</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Auto-buy $ANSEM
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Your connected wallet sends{" "}
            <span className="font-medium text-foreground">{fundSol} SOL</span> to each wallet (covers
            swap + token account rent + fees) in a single approval, then Syra swaps up to{" "}
            <span className="font-medium text-foreground">{swapSol} SOL</span> to $ANSEM (less on
            0.01 SOL legacy wallets — use retry if needed) (
            <span className="font-mono text-xs">{ansemMint.slice(0, 6)}…</span>) on every wallet.
          </p>
        </div>
        <Rocket className="mt-1 h-5 w-5 shrink-0 text-primary/70" aria-hidden />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
          <p className="text-xs text-muted-foreground">Wallets</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{targetWallets.length}</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
          <p className="text-xs text-muted-foreground">Total SOL to send</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{totalFundSol.toFixed(3)} SOL</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-muted/10 px-4 py-3">
          <p className="text-xs text-muted-foreground">Per-wallet swap</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{swapSol} SOL → $ANSEM</p>
        </div>
      </div>

      {phase !== "idle" ? (
        <div className="mt-5 space-y-2">
          <Progress value={progress} className="h-2" />
          {statusText ? <p className="text-sm text-muted-foreground">{statusText}</p> : null}
        </div>
      ) : null}

      <Button
        className="mt-5 w-full sm:w-auto"
        disabled={submitting || targetWallets.length === 0}
        onClick={() => void runFundAndBuy()}
      >
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="mr-2 h-4 w-4" />
        )}
        Fund {targetWallets.length || 0} wallets & buy $ANSEM
      </Button>
    </div>
  );
}
