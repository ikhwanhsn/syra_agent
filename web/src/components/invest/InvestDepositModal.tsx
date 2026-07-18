import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  depositInvest,
  type InvestOpportunity,
} from "@/lib/pillarsApi";
import { solscanTxUrl } from "@/lib/jupiterSwapExecute";
import { Link } from "@/lib/navigation";

type InvestDepositModalProps = {
  open: boolean;
  opportunity: InvestOpportunity | null;
  onOpenChange: (open: boolean) => void;
};

function formatError(raw: string): string {
  if (/authentication|401|session/i.test(raw)) {
    return "Connect your wallet and sign in to deposit from your invest agent wallet.";
  }
  if (/not provisioned|fund invest/i.test(raw)) {
    return "Invest wallet not provisioned. Open Wallet and fund the Invest treasury first.";
  }
  if (/insufficient sol/i.test(raw)) {
    return raw;
  }
  if (/pending_confirmation|confirmation|policy/i.test(raw)) {
    return raw;
  }
  return raw || "Deposit failed.";
}

export function InvestDepositModal({
  open,
  opportunity,
  onOpenChange,
}: InvestDepositModalProps) {
  const [amount, setAmount] = useState("0.1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const label = opportunity?.label ?? "Protocol";

  const resetState = () => {
    setError(null);
    setSignature(null);
    setPendingMessage(null);
    setSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetState();
      setAmount("0.1");
    }
    onOpenChange(next);
  };

  const handleDeposit = async () => {
    if (!opportunity) return;
    const amountSol = Number(amount);
    if (!Number.isFinite(amountSol) || amountSol <= 0) {
      setError("Enter a valid SOL amount.");
      return;
    }
    if (amountSol < 0.01) {
      setError("Minimum deposit is 0.01 SOL.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSignature(null);
    setPendingMessage(null);

    try {
      const res = await depositInvest({
        adapter: opportunity.adapter,
        amountSol,
      });
      if (!res.success || !res.data) {
        setError(formatError(res.error ?? "Deposit failed."));
        return;
      }

      if (res.data.status === "pending_confirmation") {
        const reasons = res.data.summary?.reasons?.join(", ") || "policy risk";
        setPendingMessage(
          `This deposit needs extra policy confirmation (${reasons}). Try a smaller amount under your per-tx spend cap, or confirm the staged intent from Wallet if prompted.`,
        );
        return;
      }

      if (res.data.status === "ok" && res.data.signature) {
        setSignature(res.data.signature);
        return;
      }

      setError(formatError(res.error ?? "Unexpected deposit response."));
    } catch (err) {
      setError(formatError(err instanceof Error ? err.message : String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit into {label}</DialogTitle>
          <DialogDescription>
            Deposits SOL from your invest agent wallet. You receive the liquid staking
            token ({opportunity?.yieldSymbol || (opportunity?.adapter === "jito" ? "JitoSOL" : "mSOL")})
            in that wallet. Not financial advice — yields are probabilistic.
          </DialogDescription>
        </DialogHeader>

        {signature ? (
          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Deposit submitted</p>
            <p className="text-xs text-muted-foreground break-all">{signature}</p>
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <a href={solscanTxUrl(signature)} target="_blank" rel="noopener noreferrer">
                View on Solscan
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="invest-deposit-amount" className="text-xs font-medium text-muted-foreground">
                Amount (SOL)
              </label>
              <Input
                id="invest-deposit-amount"
                type="number"
                min={0.01}
                step={0.01}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting}
                className="mt-1.5"
              />
            </div>
            {opportunity?.riskNote ? (
              <p className="text-xs text-muted-foreground leading-relaxed">{opportunity.riskNote}</p>
            ) : null}
            {pendingMessage ? (
              <p className="text-sm text-amber-600 dark:text-amber-400 leading-relaxed">
                {pendingMessage}
              </p>
            ) : null}
            {error ? (
              <div className="space-y-2">
                <p className="text-sm text-destructive leading-relaxed">{error}</p>
                {/not provisioned|fund/i.test(error) ? (
                  <Button variant="outline" size="sm" className="rounded-full" asChild>
                    <Link to="/wallet">Fund invest wallet</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            {signature ? "Close" : "Cancel"}
          </Button>
          {!signature ? (
            <Button className="rounded-full" onClick={() => void handleDeposit()} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
                  Depositing…
                </>
              ) : (
                `Deposit to ${label}`
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
