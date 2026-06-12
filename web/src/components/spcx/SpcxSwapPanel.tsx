import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { ArrowDownUp, ExternalLink, Loader2, Wallet } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { agentToolsApi } from "@/lib/chatApi";
import { solscanTxUrl, bestLiveVenue, type SpcxIntelligenceReport } from "@/lib/spcxApi";
import {
  SWAP_PRESET_TOKENS,
  SPCXX_MINT,
  humanToBaseUnits,
} from "@/lib/swapPresets";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type TradeMode = "buy" | "sell";
type QuoteAsset = "USDC" | "SOL";

interface JupiterSwapData {
  submittedSignature?: string;
  submittedOnChain?: boolean;
  submitError?: string;
  confirmationRequired?: boolean;
  intentId?: string;
  outAmount?: string;
  transaction?: string;
}

const BUY_USDC_PRESETS = [10, 25, 50, 100] as const;
const BUY_SOL_PRESETS = [0.1, 0.5, 1] as const;
const SELL_TOKEN_PRESETS = [1, 5, 10, 25] as const;
const SPCXX_DECIMALS = 8;

function formatSwapError(raw: string): string {
  if (raw === "fetch failed") {
    return "Could not reach the swap service. Check your connection and try again.";
  }
  if (raw === "auth_required" || raw.includes("guest_signing")) {
    return "Sign in with your wallet to trade. Approve the Syra session signature when prompted, then try again.";
  }
  if (raw.includes("tool_not_allowed")) {
    return "Swap is not enabled on your agent wallet yet. Refresh the page and try again.";
  }
  if (raw.includes("Wallet broker refused to sign")) {
    return formatSwapError(raw.replace(/^Wallet broker refused to sign:\s*/i, ""));
  }
  return raw;
}

function formatTokenAmount(amount: number): string {
  if (amount >= 1) return amount.toFixed(4);
  if (amount >= 0.01) return amount.toFixed(5);
  return amount.toFixed(6);
}

function formatUsdAmount(amount: number): string {
  if (amount >= 1) return amount.toFixed(2);
  return amount.toFixed(4);
}

async function fetchMintBalance(
  connection: import("@solana/web3.js").Connection,
  owner: string,
  mint: string,
): Promise<number> {
  try {
    const accounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(owner), {
      mint: new PublicKey(mint),
    });
    return accounts.value.reduce((sum, acc) => {
      const tokenAmount = acc.account.data.parsed?.info?.tokenAmount;
      if (!tokenAmount) return sum;
      const ui =
        tokenAmount.uiAmount != null && Number.isFinite(tokenAmount.uiAmount)
          ? tokenAmount.uiAmount
          : Number.parseFloat(tokenAmount.uiAmountString ?? "0");
      return sum + (Number.isFinite(ui) ? ui : 0);
    }, 0);
  } catch {
    return 0;
  }
}

export function SpcxSwapPanel({ report }: { report: SpcxIntelligenceReport }) {
  const { toast } = useToast();
  const { connected, openLoginModal, connection } = useWalletContext();
  const { requestSyraAuth } = useSyraAuth();
  const { ready, anonymousId, agentAddress, agentUsdcBalance } = useAgentWallet();

  const liveVenue = bestLiveVenue(report);
  const tokenMint = liveVenue?.mint || SPCXX_MINT;
  const tokenSymbol = liveVenue?.symbol || "SPCXx";
  const tokenPrice = liveVenue?.priceUsd ?? null;
  const swapDisabled =
    !liveVenue || liveVenue.status === "halted" || liveVenue.tradingHalted === true;

  const [mode, setMode] = useState<TradeMode>("buy");
  const [quoteAsset, setQuoteAsset] = useState<QuoteAsset>("USDC");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JupiterSwapData | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);

  const quoteMeta = useMemo(
    () => SWAP_PRESET_TOKENS.find((t) => t.label === quoteAsset),
    [quoteAsset],
  );

  const refreshTokenBalance = useCallback(async () => {
    if (!agentAddress) {
      setTokenBalance(null);
      return;
    }
    const bal = await fetchMintBalance(connection, agentAddress, tokenMint);
    setTokenBalance(bal);
  }, [agentAddress, connection, tokenMint]);

  useEffect(() => {
    void refreshTokenBalance();
    const id = window.setInterval(() => void refreshTokenBalance(), 15_000);
    return () => window.clearInterval(id);
  }, [refreshTokenBalance]);

  const inputMint = mode === "buy" ? quoteMeta?.mint : tokenMint;
  const outputMint = mode === "buy" ? tokenMint : quoteMeta?.mint;
  const inputDecimals = mode === "buy" ? (quoteMeta?.decimals ?? 6) : SPCXX_DECIMALS;
  const inputSymbol = mode === "buy" ? quoteAsset : tokenSymbol;
  const outputSymbol = mode === "buy" ? tokenSymbol : quoteAsset;

  const estimatedReceive = useMemo(() => {
    const n = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0 || tokenPrice == null || tokenPrice <= 0) return null;
    if (mode === "buy" && quoteAsset === "USDC") return n / tokenPrice;
    if (mode === "sell" && quoteAsset === "USDC") return n * tokenPrice;
    return null;
  }, [amount, mode, quoteAsset, tokenPrice]);

  const switchMode = (next: TradeMode) => {
    setMode(next);
    setAmount("");
    setShowConfirm(false);
    setError(null);
    setResult(null);
  };

  const handlePrepare = useCallback(() => {
    setError(null);
    setResult(null);
    if (!connected || !ready || !anonymousId) {
      openLoginModal();
      return;
    }
    if (swapDisabled) {
      setError("Trading is paused until an official pool goes live. Check the Where to buy tab.");
      return;
    }
    const base = humanToBaseUnits(amount, inputDecimals);
    if (!base) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (mode === "sell" && tokenBalance != null && Number(amount) > tokenBalance) {
      setError(`Insufficient ${tokenSymbol} balance. You hold ${formatTokenAmount(tokenBalance)}.`);
      return;
    }
    setShowConfirm(true);
  }, [
    amount,
    anonymousId,
    connected,
    inputDecimals,
    mode,
    openLoginModal,
    ready,
    swapDisabled,
    tokenBalance,
    tokenSymbol,
  ]);

  const handleSwap = useCallback(async () => {
    if (!anonymousId || !quoteMeta || !inputMint || !outputMint) return;
    setSubmitting(true);
    setError(null);
    try {
      const auth = await requestSyraAuth();
      if (!auth) {
        setError(
          "Sign in with your wallet to trade. Approve the Syra session signature when prompted.",
        );
        return;
      }

      const base = humanToBaseUnits(amount, inputDecimals);
      if (!base) {
        setError("Invalid amount.");
        return;
      }
      const swapAnonymousId = auth.anonymousId || anonymousId;
      const taker = auth.agentAddress || agentAddress;
      const res = await agentToolsApi.call({
        anonymousId: swapAnonymousId,
        toolId: "jupiter-swap-order",
        params: {
          inputMint,
          outputMint,
          amount: base,
          ...(taker ? { taker } : {}),
        },
      });
      if (!res.success) {
        if (res.insufficientBalance) {
          setError(
            res.message ||
              `Your agent wallet needs USDC for fees (have $${res.usdcBalance?.toFixed(2) ?? "0"}, need $${res.requiredUsdc?.toFixed(4) ?? "?"})`,
          );
        } else {
          setError(formatSwapError(res.error || res.message || "Swap failed"));
        }
        return;
      }
      const data = res.data as JupiterSwapData;
      setResult(data);
      if (data.submitError) {
        setError(formatSwapError(data.submitError));
      } else if (data.confirmationRequired) {
        setError("Extra wallet approval needed. Open agent chat to finish this swap.");
      } else if (data.submittedSignature) {
        void refreshTokenBalance();
        const receiveLabel =
          estimatedReceive != null
            ? mode === "buy"
              ? `~${formatTokenAmount(estimatedReceive)} ${tokenSymbol}`
              : quoteAsset === "USDC"
                ? `~$${formatUsdAmount(estimatedReceive)}`
                : `~${formatTokenAmount(estimatedReceive)} SOL`
            : outputSymbol;
        toast({
          title: mode === "buy" ? `${tokenSymbol} purchased` : `${tokenSymbol} sold`,
          description:
            mode === "buy"
              ? `Swapped ${amount} ${inputSymbol} for ${receiveLabel}.`
              : `Sold ${amount} ${inputSymbol} for ${receiveLabel}.`,
        });
      }
      setShowConfirm(false);
    } catch (e) {
      setError(formatSwapError(e instanceof Error ? e.message : "Swap failed"));
    } finally {
      setSubmitting(false);
    }
  }, [
    agentAddress,
    amount,
    anonymousId,
    estimatedReceive,
    inputDecimals,
    inputMint,
    inputSymbol,
    mode,
    outputMint,
    outputSymbol,
    quoteAsset,
    quoteMeta,
    refreshTokenBalance,
    requestSyraAuth,
    toast,
    tokenSymbol,
  ]);

  const swapShellClass = cn(
    "overflow-hidden rounded-[22px] border border-border/45 scroll-mt-28",
    "bg-gradient-to-b from-card via-card to-muted/[0.12]",
    "shadow-[0_1px_0_hsl(0_0%_100%/0.04)_inset,0_24px_48px_-28px_rgba(0,0,0,0.65)]",
  );

  const fieldShellClass = cn(
    "rounded-2xl bg-muted/[0.22] p-4 ring-1 ring-inset ring-border/35",
  );

  const buyPresets = quoteAsset === "USDC" ? BUY_USDC_PRESETS : BUY_SOL_PRESETS;

  return (
    <div id="spcx-trade" className={swapShellClass}>
      <div className="flex flex-col gap-3 border-b border-border/40 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-border/50 bg-muted/30 p-1">
            {(["buy", "sell"] as TradeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                disabled={showConfirm || submitting}
                onClick={() => switchMode(m)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition-colors",
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Jupiter · verified pool</p>
        </div>
        {connected ? (
          <div className="text-right text-xs text-muted-foreground">
            {mode === "buy" && agentUsdcBalance != null ? (
              <span>
                USDC{" "}
                <span className="font-mono font-medium tabular-nums text-foreground">
                  ${agentUsdcBalance.toFixed(2)}
                </span>
              </span>
            ) : null}
            {mode === "sell" && tokenBalance != null ? (
              <span>
                {tokenSymbol}{" "}
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {formatTokenAmount(tokenBalance)}
                </span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-0 px-3 pb-4 pt-3 sm:px-4">
        {swapDisabled ? (
          <p className="mb-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            Trading is paused or no verified on-chain pool is available yet. Check Where to buy for
            exchange routes.
          </p>
        ) : null}

        <div className={cn(fieldShellClass, "rounded-b-md")}>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                You pay
              </p>
              {mode === "buy" ? (
                <div className="flex gap-1.5">
                  {(["USDC", "SOL"] as QuoteAsset[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setQuoteAsset(p)}
                      disabled={showConfirm || submitting}
                      className={cn(
                        "rounded-lg px-3 py-1 text-sm font-semibold transition-colors",
                        quoteAsset === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="font-display text-lg font-semibold tracking-tight">{tokenSymbol}</p>
              )}
            </div>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={showConfirm || submitting}
              placeholder="0.00"
              inputMode="decimal"
              className={cn(
                "h-11 max-w-[10rem] border-0 bg-transparent p-0 text-right font-mono text-2xl font-semibold tabular-nums",
                "shadow-none focus-visible:ring-0",
              )}
              aria-label="Amount to pay"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {mode === "buy"
              ? buyPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={showConfirm || submitting}
                    onClick={() => setAmount(String(preset))}
                    className="rounded-lg border border-border/45 bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  >
                    {quoteAsset === "USDC" ? `$${preset}` : `${preset} SOL`}
                  </button>
                ))
              : null}
            {mode === "sell"
              ? SELL_TOKEN_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={showConfirm || submitting}
                    onClick={() => setAmount(String(preset))}
                    className="rounded-lg border border-border/45 bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  >
                    {preset} {tokenSymbol}
                  </button>
                ))
              : null}
            {mode === "sell" && tokenBalance != null && tokenBalance > 0 ? (
              <>
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    disabled={showConfirm || submitting}
                    onClick={() =>
                      setAmount(
                        formatTokenAmount(
                          pct === 1 ? tokenBalance : tokenBalance * pct,
                        ),
                      )
                    }
                    className="rounded-lg border border-border/45 bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  >
                    {pct === 1 ? "Max" : `${pct * 100}%`}
                  </button>
                ))}
              </>
            ) : null}
          </div>
        </div>

        <div className="relative z-[1] -my-3 flex justify-center" aria-hidden>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border-4 border-card",
              "bg-muted/80 text-muted-foreground shadow-sm ring-1 ring-border/50",
            )}
          >
            <ArrowDownUp className="h-4 w-4 opacity-80" strokeWidth={2.25} />
          </div>
        </div>

        <div className={cn(fieldShellClass, "rounded-t-md pt-6 sm:pt-7")}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                You receive
              </p>
              {mode === "sell" ? (
                <div className="mt-1 flex gap-1.5">
                  {(["USDC", "SOL"] as QuoteAsset[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setQuoteAsset(p)}
                      disabled={showConfirm || submitting}
                      className={cn(
                        "rounded-lg px-3 py-1 text-sm font-semibold transition-colors",
                        quoteAsset === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <p className="mt-1 font-display text-lg font-semibold tracking-tight">
                    {tokenSymbol}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Verified · 1:1 backed
                  </p>
                </>
              )}
            </div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-foreground/90">
              {estimatedReceive != null
                ? mode === "buy"
                  ? `~${formatTokenAmount(estimatedReceive)}`
                  : quoteAsset === "USDC"
                    ? `~$${formatUsdAmount(estimatedReceive)}`
                    : "—"
                : "—"}
            </p>
          </div>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {result?.submittedSignature ? (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
            <p className="font-medium text-emerald-800 dark:text-emerald-200">
              {mode === "buy" ? "Purchase complete" : "Sale complete"}
            </p>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {result.submittedSignature}
            </p>
            <Button variant="link" size="sm" className="mt-1 h-auto gap-1 p-0" asChild>
              <a
                href={solscanTxUrl(result.submittedSignature)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Solscan <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {!connected || !anonymousId ? (
            <Button
              className="h-12 w-full gap-2 rounded-xl text-base font-semibold"
              onClick={openLoginModal}
            >
              <Wallet className="h-4 w-4" />
              Connect wallet to trade
            </Button>
          ) : showConfirm ? (
            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground">
                Confirm{" "}
                <span className="font-mono font-medium text-foreground">
                  {amount} {inputSymbol}
                </span>{" "}
                →{" "}
                <span className="font-mono font-medium text-foreground">{outputSymbol}</span>
                {estimatedReceive != null ? (
                  <span className="text-muted-foreground">
                    {" "}
                    (~
                    {mode === "buy"
                      ? `${formatTokenAmount(estimatedReceive)} ${tokenSymbol}`
                      : quoteAsset === "USDC"
                        ? `$${formatUsdAmount(estimatedReceive)}`
                        : outputSymbol}
                    )
                  </span>
                ) : null}
              </p>
              <div className="flex gap-2">
                <Button
                  className="h-11 flex-1 rounded-xl font-semibold"
                  onClick={handleSwap}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : mode === "buy" ? (
                    `Buy ${tokenSymbol}`
                  ) : (
                    `Sell ${tokenSymbol}`
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl"
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
                className="h-12 flex-1 rounded-xl text-base font-semibold"
                onClick={handlePrepare}
                disabled={swapDisabled || submitting || !amount}
              >
                {amount
                  ? mode === "buy"
                    ? `Review · Buy ${tokenSymbol}`
                    : `Review · Sell ${tokenSymbol}`
                  : "Enter amount"}
              </Button>
              {mode === "buy" ? (
                <Button variant="outline" className="h-12 rounded-xl sm:w-auto" asChild>
                  <Link to="/agent-setup">Add funds</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
