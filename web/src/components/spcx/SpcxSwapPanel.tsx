import { useCallback, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { ArrowRightLeft, ExternalLink, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { agentToolsApi } from "@/lib/chatApi";
import { solscanTxUrl, bestLiveVenue, type SpcxIntelligenceReport } from "@/lib/spcxApi";
import {
  SWAP_PRESET_TOKENS,
  SPCXX_MINT,
  humanToBaseUnits,
} from "@/lib/swapPresets";
import { cn } from "@/lib/utils";
import { spcxCardClass } from "@/components/spcx/spcxStyles";

type SpendPreset = "SOL" | "USDC";

interface JupiterSwapData {
  submittedSignature?: string;
  submittedOnChain?: boolean;
  submitError?: string;
  confirmationRequired?: boolean;
  intentId?: string;
  outAmount?: string;
  transaction?: string;
}

const BUY_STEPS = [
  "Connect your wallet",
  "Choose SOL or USDC to spend",
  "Review and confirm the swap",
] as const;

export function SpcxSwapPanel({ report }: { report: SpcxIntelligenceReport }) {
  const { connected, openLoginModal } = useWalletContext();
  const { ready, anonymousId, agentAddress } = useAgentWallet();

  const liveVenue = bestLiveVenue(report);
  const outputMint = liveVenue?.mint || SPCXX_MINT;
  const outputSymbol = liveVenue?.symbol || "SPCXx";
  const swapDisabled =
    !liveVenue || liveVenue.status === "halted" || liveVenue.tradingHalted === true;

  const [spend, setSpend] = useState<SpendPreset>("USDC");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JupiterSwapData | null>(null);

  const spendMeta = useMemo(
    () => SWAP_PRESET_TOKENS.find((t) => t.label === spend),
    [spend],
  );

  const currentStep = !connected || !anonymousId ? 0 : showConfirm ? 2 : 1;

  const handlePrepare = useCallback(() => {
    setError(null);
    setResult(null);
    if (!connected || !ready || !anonymousId) {
      openLoginModal();
      return;
    }
    if (swapDisabled) {
      setError("Buying is paused until an official pool goes live. Check the Where to buy tab.");
      return;
    }
    const decimals = spendMeta?.decimals ?? 9;
    const base = humanToBaseUnits(amount, decimals);
    if (!base) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setShowConfirm(true);
  }, [amount, anonymousId, connected, openLoginModal, ready, spendMeta, swapDisabled]);

  const handleSwap = useCallback(async () => {
    if (!anonymousId || !spendMeta) return;
    setSubmitting(true);
    setError(null);
    try {
      const base = humanToBaseUnits(amount, spendMeta.decimals);
      if (!base) {
        setError("Invalid amount.");
        return;
      }
      const res = await agentToolsApi.call({
        anonymousId,
        toolId: "jupiter-swap-order",
        params: {
          inputMint: spendMeta.mint,
          outputMint,
          amount: base,
          ...(agentAddress ? { taker: agentAddress } : {}),
        },
      });
      if (!res.success) {
        if (res.insufficientBalance) {
          setError(
            res.message ||
              `Your agent wallet needs USDC for fees (have $${res.usdcBalance?.toFixed(2) ?? "0"}, need $${res.requiredUsdc?.toFixed(4) ?? "?"})`,
          );
        } else {
          setError(res.error || res.message || "Swap failed");
        }
        return;
      }
      const data = res.data as JupiterSwapData;
      setResult(data);
      if (data.submitError) {
        setError(data.submitError);
      } else if (data.confirmationRequired) {
        setError("Extra wallet approval needed. Open agent chat to finish this swap.");
      }
      setShowConfirm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setSubmitting(false);
    }
  }, [agentAddress, amount, anonymousId, outputMint, spendMeta]);

  return (
    <Card id="spcx-trade" className={cn(spcxCardClass, "scroll-mt-28")}>
      <CardHeader className="border-b border-border/40 bg-muted/[0.03]">
        <CardTitle className="flex items-center gap-2 font-display text-base font-semibold">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Buy {outputSymbol} on Solana
        </CardTitle>
        <CardDescription>
          Swap crypto for verified SpaceX token exposure — like buying a product, but on-chain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <ol className="flex flex-col gap-2 sm:flex-row sm:gap-0">
          {BUY_STEPS.map((step, i) => (
            <li
              key={step}
              className={cn(
                "flex flex-1 items-center gap-2 text-xs sm:flex-col sm:px-2 sm:text-center",
                i <= currentStep ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  i <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {i + 1}
              </span>
              <span className="font-medium">{step}</span>
            </li>
          ))}
        </ol>

        {swapDisabled ? (
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            Trading is paused or no verified pool is live yet. Use the Where to buy tab to see other
            routes, or check back after the IPO window opens.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="spcx-spend">Pay with</Label>
            <div className="flex gap-2">
              {(["USDC", "SOL"] as SpendPreset[]).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={spend === p ? "default" : "outline"}
                  size="sm"
                  className="flex-1 rounded-xl"
                  onClick={() => setSpend(p)}
                  disabled={showConfirm || submitting}
                >
                  {p}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {spend === "USDC" ? "Stablecoin — easiest for beginners" : "Solana native token"}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="spcx-amount">Amount to spend</Label>
            <Input
              id="spcx-amount"
              type="text"
              inputMode="decimal"
              placeholder={spend === "SOL" ? "0.5" : "50"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={showConfirm || submitting}
              className="rounded-xl font-mono text-base"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/40 bg-muted/[0.04] px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            You receive: <span className="font-semibold text-foreground">{outputSymbol}</span>{" "}
            (verified token)
          </p>
          <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{outputMint}</p>
        </div>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {result?.submittedSignature ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
            <p className="font-medium text-emerald-800 dark:text-emerald-200">Purchase submitted</p>
            <p className="mt-1 truncate font-mono text-xs">{result.submittedSignature}</p>
            <Button variant="link" size="sm" className="mt-1 h-auto gap-1 p-0" asChild>
              <a href={solscanTxUrl(result.submittedSignature)} target="_blank" rel="noopener noreferrer">
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        ) : null}

        {!connected || !anonymousId ? (
          <Button className="w-full gap-2 rounded-xl py-5 text-base font-semibold" onClick={openLoginModal}>
            <Wallet className="h-4 w-4" />
            Step 1 — Connect wallet
          </Button>
        ) : showConfirm ? (
          <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-semibold">Review your purchase</p>
            <p className="text-sm text-muted-foreground">
              Spend <span className="font-mono font-medium text-foreground">{amount} {spend}</span> to
              buy <span className="font-mono font-medium text-foreground">{outputSymbol}</span>.
              A small USDC fee applies.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1 rounded-xl" onClick={handleSwap} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm purchase"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Back
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 rounded-xl py-5 text-base font-semibold"
              onClick={handlePrepare}
              disabled={swapDisabled || submitting}
            >
              {amount ? "Review purchase" : "Enter amount to continue"}
            </Button>
            <Button variant="outline" className="rounded-xl" asChild>
              <Link to="/agent-setup">Add funds to wallet</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
