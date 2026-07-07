import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useWalletContext } from "@/contexts/WalletContext";
import { useJupiterQuote } from "@/hooks/useJupiterQuote";
import { useDelayedMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import {
  buildJupiterSwap,
  formatSwapAmount,
  searchJupiterTokens,
} from "@/lib/jupiterSwapApi";
import {
  executeSignedSwap,
  formatSwapExecutionError,
} from "@/lib/jupiterSwapExecute";
import { fetchWalletTokenBalances } from "@/lib/tokenBalances";
import {
  mintToSwapToken,
  parseSwapUrlParams,
  isPresetMint,
} from "@/lib/swapNavigation";
import { humanToBaseUnits } from "@/lib/swapPresets";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { SwapSettings } from "@/components/swap/SwapSettings";
import { SwapDetails } from "@/components/swap/SwapDetails";
import { SwapStatus, type SwapPhase } from "@/components/swap/SwapStatus";
import {
  DEFAULT_INPUT_TOKEN,
  DEFAULT_OUTPUT_TOKEN,
  TokenSelectButton,
  TokenSelectDialog,
  type SelectedSwapToken,
} from "@/components/swap/TokenSelectDialog";

const PERCENT_PRESETS = [0.25, 0.5, 0.75, 1] as const;

const swapShellClass = cn(
  "overflow-hidden rounded-[22px] border border-border/45 scroll-mt-28",
  "bg-gradient-to-b from-card via-card to-muted/[0.12]",
  "shadow-[0_1px_0_hsl(0_0%_100%/0.04)_inset,0_24px_48px_-28px_rgba(0,0,0,0.65)]",
);

const fieldShellClass = cn(
  "rounded-2xl bg-muted/[0.22] p-4 ring-1 ring-inset ring-border/35",
);

export interface SwapCardProps {
  onTokensChange?: (tokens: {
    input: SelectedSwapToken;
    output: SelectedSwapToken;
  }) => void;
}

export function SwapCard({ onTokensChange }: SwapCardProps) {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const urlSwap = useMemo(
    () => parseSwapUrlParams(searchParams),
    [searchParams],
  );
  const {
    connected,
    address,
    openLoginModal,
    connection,
    signTransaction,
    refreshSolanaBalances,
  } = useWalletContext();

  const [inputToken, setInputToken] = useState<SelectedSwapToken>(() =>
    urlSwap.inputMint
      ? mintToSwapToken(urlSwap.inputMint, urlSwap.inputHints)
      : DEFAULT_INPUT_TOKEN,
  );
  const [outputToken, setOutputToken] = useState<SelectedSwapToken>(() =>
    urlSwap.outputMint
      ? mintToSwapToken(urlSwap.outputMint, urlSwap.outputHints)
      : DEFAULT_OUTPUT_TOKEN,
  );
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectSide, setSelectSide] = useState<"input" | "output" | null>(null);
  const [phase, setPhase] = useState<SwapPhase>("idle");
  const [lastSignature, setLastSignature] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});

  const mintsToResolve = useMemo(() => {
    const mints = new Set<string>();
    if (urlSwap.inputMint && !isPresetMint(urlSwap.inputMint))
      mints.add(urlSwap.inputMint);
    if (urlSwap.outputMint && !isPresetMint(urlSwap.outputMint))
      mints.add(urlSwap.outputMint);
    return [...mints];
  }, [urlSwap.inputMint, urlSwap.outputMint]);

  const bootstrapIconsQ = useQuery({
    queryKey: ["jupiter-tokens", "bootstrap"],
    queryFn: async () => {
      const res = await searchJupiterTokens();
      if (!res.success) throw new Error(res.error);
      return res.data.tokens;
    },
    staleTime: 300_000,
    retry: 1,
  });

  const resolveMintsQ = useQuery({
    queryKey: ["jupiter-tokens", "resolve", mintsToResolve],
    queryFn: async () => {
      const resolved: Record<string, SelectedSwapToken> = {};
      for (const mint of mintsToResolve) {
        const res = await searchJupiterTokens(mint);
        if (!res.success) continue;
        const hit = res.data.tokens.find((t) => t.id === mint);
        if (!hit) continue;
        resolved[mint] = {
          mint: hit.id,
          symbol: hit.symbol,
          name: hit.name,
          decimals: hit.decimals,
          icon: hit.icon,
          isVerified: hit.isVerified,
        };
      }
      return resolved;
    },
    enabled: mintsToResolve.length > 0,
    staleTime: 300_000,
    retry: 1,
  });

  useEffect(() => {
    const parsed = parseSwapUrlParams(searchParams);
    if (parsed.inputMint) {
      setInputToken(mintToSwapToken(parsed.inputMint, parsed.inputHints));
    }
    if (parsed.outputMint) {
      setOutputToken(mintToSwapToken(parsed.outputMint, parsed.outputHints));
    }
    if (parsed.inputMint || parsed.outputMint) {
      setAmount("");
      setShowConfirm(false);
      setActionError(null);
      setPhase("idle");
    }
  }, [searchParams]);

  useEffect(() => {
    const list = bootstrapIconsQ.data;
    if (!list?.length) return;
    const enrich = (prev: SelectedSwapToken): SelectedSwapToken => {
      const hit = list.find((t) => t.id === prev.mint);
      if (!hit?.icon) return prev;
      return {
        ...prev,
        icon: hit.icon ?? prev.icon,
        name: hit.name || prev.name,
        isVerified: hit.isVerified || prev.isVerified,
      };
    };
    setInputToken((prev) => enrich(prev));
    setOutputToken((prev) => enrich(prev));
  }, [bootstrapIconsQ.data]);

  useEffect(() => {
    const map = resolveMintsQ.data;
    if (!map) return;
    const enrich = (prev: SelectedSwapToken): SelectedSwapToken => {
      const hit = map[prev.mint];
      return hit ? { ...hit, icon: hit.icon ?? prev.icon } : prev;
    };
    setInputToken((prev) => enrich(prev));
    setOutputToken((prev) => enrich(prev));
  }, [resolveMintsQ.data]);

  useEffect(() => {
    onTokensChange?.({ input: inputToken, output: outputToken });
  }, [inputToken, onTokensChange, outputToken]);

  const inputBalance = balances[inputToken.mint] ?? null;

  const refreshBalances = useCallback(async () => {
    if (!address) {
      setBalances({});
      return;
    }
    const mints = [inputToken.mint, outputToken.mint];
    const next = await fetchWalletTokenBalances(connection, address, mints);
    setBalances(next);
  }, [address, connection, inputToken.mint, outputToken.mint]);

  useEffect(() => {
    void refreshBalances();
    const id = window.setInterval(() => void refreshBalances(), 20_000);
    return () => window.clearInterval(id);
  }, [refreshBalances]);

  const quoteQuery = useJupiterQuote({
    inputMint: inputToken.mint,
    outputMint: outputToken.mint,
    amountHuman: amount,
    inputDecimals: inputToken.decimals,
    outputDecimals: outputToken.decimals,
    slippageBps,
    enabled: phase === "idle" || phase === "success" || phase === "error",
  });

  const flipTokens = useCallback(() => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setAmount("");
    setShowConfirm(false);
    setActionError(null);
  }, [inputToken, outputToken]);

  const setMaxAmount = useCallback(() => {
    if (inputBalance == null || inputBalance <= 0) return;
    setAmount(formatSwapAmount(inputBalance, inputToken.decimals));
  }, [inputBalance, inputToken.decimals]);

  const handlePrepare = useCallback(() => {
    setActionError(null);
    if (!connected || !address) {
      openLoginModal();
      return;
    }
    const base = humanToBaseUnits(amount, inputToken.decimals);
    if (!base) {
      setActionError("Enter an amount greater than zero.");
      return;
    }
    if (inputToken.mint === outputToken.mint) {
      setActionError("Select different tokens to swap.");
      return;
    }
    if (
      inputBalance != null &&
      Number(amount.replace(/,/g, "")) > inputBalance
    ) {
      setActionError(`Insufficient ${inputToken.symbol} balance.`);
      return;
    }
    if (!quoteQuery.display) {
      setActionError(
        quoteQuery.error?.message ?? "Could not fetch a quote. Try again.",
      );
      return;
    }
    setShowConfirm(true);
  }, [
    address,
    amount,
    connected,
    inputBalance,
    inputToken,
    openLoginModal,
    outputToken.mint,
    quoteQuery.display,
    quoteQuery.error,
  ]);

  const handleSwap = useCallback(async () => {
    if (!address || !quoteQuery.data?.quote) return;
    setActionError(null);
    setPhase("building");
    try {
      const buildRes = await buildJupiterSwap({
        quoteResponse: quoteQuery.data.quote,
        userPublicKey: address,
      });
      if (!buildRes.success) {
        throw new Error(buildRes.error);
      }

      setPhase("signing");
      const { signature } = await executeSignedSwap({
        swapTransactionBase64: buildRes.data.swapTransaction,
        lastValidBlockHeight: buildRes.data.lastValidBlockHeight,
        signTransaction,
      });

      setLastSignature(signature);
      setPhase("success");
      setShowConfirm(false);
      setAmount("");
      void refreshBalances();
      void refreshSolanaBalances();
      toast({
        title: "Swap submitted",
        description: `Swapped ${inputToken.symbol} for ${outputToken.symbol}. Track on Solscan.`,
      });
    } catch (e) {
      const msg = formatSwapExecutionError(
        e instanceof Error ? e.message : "Swap failed",
      );
      setActionError(msg);
      setPhase("error");
    }
  }, [
    address,
    inputToken.symbol,
    outputToken.symbol,
    quoteQuery.data,
    refreshBalances,
    refreshSolanaBalances,
    signTransaction,
    toast,
  ]);

  const quoteError = useMemo(() => {
    if (actionError) return actionError;
    if (quoteQuery.isError && amount && quoteQuery.hasValidAmount) {
      return quoteQuery.error?.message ?? "Quote unavailable";
    }
    return null;
  }, [actionError, amount, quoteQuery]);

  const busy = phase === "building" || phase === "signing";

  const quoteLoadingActive =
    quoteQuery.hasValidAmount && (quoteQuery.isFetching || quoteQuery.isDebouncing);
  const showQuoteSkeleton = useDelayedMinimumSkeleton(quoteLoadingActive);
  const quoteStale = quoteLoadingActive && Boolean(quoteQuery.display);

  return (
    <>
      <div className={swapShellClass}>
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3.5 sm:px-5">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Swap
            </h2>
            <p className="text-xs text-muted-foreground">
              Best route via Jupiter
            </p>
          </div>
          <SwapSettings
            slippageBps={slippageBps}
            onSlippageChange={setSlippageBps}
            disabled={busy || showConfirm}
          />
        </div>

        <div className="space-y-0 px-3 pb-4 pt-3 sm:px-4">
          <div className={cn(fieldShellClass, "rounded-b-md")}>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  You pay
                </p>
                <TokenSelectButton
                  token={inputToken}
                  onClick={() => setSelectSide("input")}
                  disabled={busy || showConfirm}
                />
              </div>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={busy || showConfirm}
                placeholder="0.00"
                inputMode="decimal"
                className={cn(
                  "h-11 max-w-[10rem] border-0 bg-transparent p-0 text-right font-mono text-2xl font-semibold tabular-nums",
                  "shadow-none focus-visible:ring-0",
                )}
                aria-label="Amount to pay"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {PERCENT_PRESETS.map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    disabled={
                      busy ||
                      showConfirm ||
                      inputBalance == null ||
                      inputBalance <= 0
                    }
                    onClick={() =>
                      setAmount(
                        formatSwapAmount(
                          pct === 1 ? inputBalance! : inputBalance! * pct,
                          inputToken.decimals,
                        ),
                      )
                    }
                    className="rounded-lg border border-border/45 bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  >
                    {pct === 1 ? "Max" : `${pct * 100}%`}
                  </button>
                ))}
              </div>
              {connected && inputBalance != null ? (
                <button
                  type="button"
                  onClick={setMaxAmount}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Balance{" "}
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {formatSwapAmount(inputBalance)}
                  </span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="relative z-[1] -my-3 flex justify-center" aria-hidden>
            <button
              type="button"
              onClick={flipTokens}
              disabled={busy || showConfirm}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border-4 border-card",
                "bg-muted/80 text-muted-foreground shadow-sm ring-1 ring-border/50",
                "transition-transform hover:scale-105 active:scale-95 disabled:opacity-50",
              )}
              aria-label="Flip tokens"
            >
              <ArrowDownUp className="h-4 w-4 opacity-80" strokeWidth={2.25} />
            </button>
          </div>

          <div className={cn(fieldShellClass, "rounded-b-2xl rounded-t-md pt-6 sm:pt-7")}>
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  You receive
                </p>
                <TokenSelectButton
                  token={outputToken}
                  onClick={() => setSelectSide("output")}
                  disabled={busy || showConfirm}
                />
              </div>
              <div className="min-w-[6rem] text-right">
                {showQuoteSkeleton ? (
                  <Skeleton className="ml-auto h-8 w-28 rounded-lg" />
                ) : (
                  <p
                    className={cn(
                      "font-mono text-2xl font-semibold tabular-nums text-foreground/90",
                      quoteStale && "opacity-50 transition-opacity duration-200",
                    )}
                  >
                    {quoteQuery.display ? quoteQuery.display.outFormatted : "—"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <SwapDetails
              display={quoteQuery.display}
              inputSymbol={inputToken.symbol}
              outputSymbol={outputToken.symbol}
              isLoading={showQuoteSkeleton}
              isDebouncing={quoteQuery.isDebouncing && !showQuoteSkeleton}
              error={quoteError && !showConfirm ? quoteError : null}
            />

            <SwapStatus
              phase={phase}
              signature={lastSignature}
              error={phase === "error" ? actionError : null}
              onDismiss={() => {
                setPhase("idle");
                setActionError(null);
              }}
            />

            {!connected ? (
              <Button
                className="h-12 w-full gap-2 rounded-xl text-base font-semibold"
                onClick={openLoginModal}
              >
                <Wallet className="h-4 w-4" />
                Connect wallet to swap
              </Button>
            ) : showConfirm ? (
              <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                  Confirm swap of{" "}
                  <span className="font-mono font-medium text-foreground">
                    {amount} {inputToken.symbol}
                  </span>{" "}
                  for approximately{" "}
                  <span className="font-mono font-medium text-foreground">
                    {quoteQuery.display?.outFormatted ?? "—"}{" "}
                    {outputToken.symbol}
                  </span>
                  {quoteQuery.display?.minReceivedFormatted ? (
                    <span className="block mt-1 text-xs">
                      Minimum received:{" "}
                      {quoteQuery.display.minReceivedFormatted}{" "}
                      {outputToken.symbol}
                    </span>
                  ) : null}
                </p>
                <div className="flex gap-2">
                  <Button
                    className="h-11 flex-1 rounded-xl font-semibold"
                    onClick={() => void handleSwap()}
                    disabled={busy}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Confirm swap"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={() => setShowConfirm(false)}
                    disabled={busy}
                  >
                    Back
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="h-12 w-full rounded-xl text-base font-semibold"
                onClick={handlePrepare}
                disabled={busy || !amount || quoteQuery.isFetching}
              >
                {amount ? `Review swap` : "Enter amount"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <TokenSelectDialog
        open={selectSide != null}
        onOpenChange={(open) => !open && setSelectSide(null)}
        excludeMint={
          selectSide === "input" ? outputToken.mint : inputToken.mint
        }
        balances={balances}
        onSelect={(token) => {
          if (selectSide === "input") setInputToken(token);
          else if (selectSide === "output") setOutputToken(token);
          setSelectSide(null);
          setShowConfirm(false);
        }}
      />
    </>
  );
}
