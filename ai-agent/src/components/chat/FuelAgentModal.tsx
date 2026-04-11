import { useState, useCallback, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
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
import { ArrowDownToLine, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useToast } from "@/hooks/use-toast";
import { agentWalletApi } from "@/lib/chatApi";

const PRESET_AMOUNTS = [1, 2, 3] as const;
const LAMPORTS_PER_SOL = 1e9;
const USDC_MINT_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_DECIMALS = 6;
/** Rough SOL per USD for "same value in SOL" (e.g. ~$200/SOL => 0.005 SOL per $1). */
const SOL_PER_USD_APPROX = 0.005;
/** Rough ETH per USD for Base (e.g. ~$3000/ETH => 0.00033 ETH per $1). */
const ETH_PER_USD_APPROX = 0.00033;

export interface FuelAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FuelAgentModal({ open, onOpenChange }: FuelAgentModalProps) {
  const {
    connection,
    publicKey,
    sendTransaction,
    baseAddress,
    baseUsdcBalance,
    baseEthBalance,
    sendBaseFuelTransaction,
  } = useWalletContext();
  const {
    agentAddress,
    anonymousId,
    refetchBalance,
    connectedChain,
    agentSolBalance,
    agentUsdcBalance,
    agentBaseEthBalance,
    agentBaseUsdcBalance,
  } = useAgentWallet();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1);
  const [customAmount, setCustomAmount] = useState("");
  const [userSolBalance, setUserSolBalance] = useState<number | null>(null);
  const [userUsdcBalance, setUserUsdcBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const isSolana = connectedChain === "solana";
  const isBase = connectedChain === "base";
  const amountUsd =
    selectedPreset != null ? selectedPreset : (parseFloat(customAmount) || 0);

  // Load Solana balances when modal opens and chain is Solana
  useEffect(() => {
    if (!open || !isSolana || !publicKey) {
      if (!isSolana) {
        setUserSolBalance(null);
        setUserUsdcBalance(null);
      }
      return;
    }
    let cancelled = false;
    setBalanceLoading(true);
    (async () => {
      try {
        const [solLamports, tokenAccounts] = await Promise.all([
          connection.getBalance(publicKey, "confirmed"),
          connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: USDC_MINT_MAINNET,
          }),
        ]);
        if (cancelled) return;
        setUserSolBalance(solLamports / LAMPORTS_PER_SOL);
        const usdc =
          tokenAccounts.value.length > 0
            ? tokenAccounts.value.reduce((sum, acc) => {
                const ui = acc.account.data.parsed?.info?.tokenAmount?.uiAmount;
                return sum + (Number(ui) || 0);
              }, 0)
            : 0;
        setUserUsdcBalance(usdc);
      } catch {
        if (!cancelled) {
          setUserSolBalance(null);
          setUserUsdcBalance(null);
        }
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, isSolana, publicKey, connection]);

  useEffect(() => {
    if (open) {
      void refetchBalance();
    }
  }, [open, refetchBalance]);

  const handlePreset = useCallback((value: number) => {
    setSelectedPreset(value);
    setCustomAmount("");
  }, []);

  const handleCustomFocus = useCallback(() => {
    setSelectedPreset(null);
  }, []);

  const handleCustomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    if (selectedPreset != null) setSelectedPreset(null);
  }, [selectedPreset]);

  const buildSolanaTx = useCallback(async () => {
    if (!publicKey || !agentAddress) return null;
    const agentPubkey = new PublicKey(agentAddress);
    const usdcRaw = BigInt(Math.floor(amountUsd * 10 ** USDC_DECIMALS));
    const solLamports = BigInt(Math.floor(amountUsd * SOL_PER_USD_APPROX * LAMPORTS_PER_SOL));

    const userUsdcAta = await getAssociatedTokenAddress(
      USDC_MINT_MAINNET,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const agentUsdcAta = await getAssociatedTokenAddress(
      USDC_MINT_MAINNET,
      agentPubkey,
      false,
      TOKEN_PROGRAM_ID
    );

    const instructions: Parameters<Transaction["add"]>[0][] = [];

    const agentAtaInfo = await connection.getAccountInfo(agentUsdcAta, "confirmed");
    if (!agentAtaInfo) {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          publicKey,
          agentUsdcAta,
          agentPubkey,
          USDC_MINT_MAINNET
        )
      );
    }

    if (usdcRaw > 0n) {
      instructions.push(
        createTransferInstruction(
          userUsdcAta,
          agentUsdcAta,
          publicKey,
          usdcRaw,
          [],
          TOKEN_PROGRAM_ID
        )
      );
    }

    if (solLamports > 0n) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: agentPubkey,
          lamports: solLamports,
        })
      );
    }

    return new Transaction().add(...instructions);
  }, [amountUsd, agentAddress, publicKey, connection]);

  const handleFuelSubmit = useCallback(async () => {
    if (amountUsd <= 0 || !agentAddress) return;
    setSubmitting(true);
    try {
      if (isBase && sendBaseFuelTransaction) {
        const txHash = await sendBaseFuelTransaction(
          agentAddress,
          amountUsd,
          amountUsd
        );
        toast({
          title: "Transfer sent",
          description: `USDC and ETH sent to agent wallet on Base. Tx: ${txHash.slice(0, 10)}…`,
        });
        refetchBalance();
        onOpenChange(false);
        return;
      }

      if (isSolana && publicKey && sendTransaction) {
        const sendOpts = { skipPreflight: false, maxRetries: 3 };
        let lastErr: unknown;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const tx = await buildSolanaTx();
            if (!tx) break;
            const signature = await sendTransaction(tx, sendOpts);
            toast({
              title: "Transfer sent",
              description: `USDC and SOL sent to agent wallet. Signature: ${signature.slice(0, 8)}…`,
            });
            refetchBalance();
            onOpenChange(false);
            return;
          } catch (e) {
            lastErr = e;
            const msg = e instanceof Error ? e.message : String(e);
            const isBlockhashError = /blockhash not found|block hash not found/i.test(msg);
            if (!isBlockhashError || attempt === 1) throw e;
          }
        }
        throw lastErr;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Transfer failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    amountUsd,
    agentAddress,
    isBase,
    isSolana,
    publicKey,
    sendTransaction,
    sendBaseFuelTransaction,
    buildSolanaTx,
    toast,
    refetchBalance,
    onOpenChange,
  ]);

  const handleWithdrawToUserWallet = useCallback(async () => {
    if (isBase) {
      toast({
        title: "Withdraw on Base",
        description: "Withdrawing agent funds to your Base wallet is not available yet. Use Solana or contact support.",
      });
      return;
    }
    if (!anonymousId || !publicKey) {
      toast({
        title: "Connect wallet",
        description: "Connect your Solana wallet to withdraw agent funds to it.",
        variant: "destructive",
      });
      return;
    }
    setWithdrawing(true);
    try {
      const { signature } = await agentWalletApi.withdrawToLinkedWallet(
        anonymousId,
        publicKey.toBase58(),
      );
      toast({
        title: "Withdrawal sent",
        description: `Funds moved to your wallet. ${signature.slice(0, 8)}…`,
      });
      await refetchBalance();
      setBalanceLoading(true);
      try {
        const [solLamports, tokenAccounts] = await Promise.all([
          connection.getBalance(publicKey, "confirmed"),
          connection.getParsedTokenAccountsByOwner(publicKey, {
            mint: USDC_MINT_MAINNET,
          }),
        ]);
        setUserSolBalance(solLamports / LAMPORTS_PER_SOL);
        const usdc =
          tokenAccounts.value.length > 0
            ? tokenAccounts.value.reduce((sum, acc) => {
                const ui = acc.account.data.parsed?.info?.tokenAmount?.uiAmount;
                return sum + (Number(ui) || 0);
              }, 0)
            : 0;
        setUserUsdcBalance(usdc);
      } catch {
        // ignore refresh errors
      } finally {
        setBalanceLoading(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: "Withdraw failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
  }, [
    anonymousId,
    connection,
    isBase,
    publicKey,
    refetchBalance,
    toast,
  ]);

  const hasAmount = amountUsd > 0;
  const canSubmit =
    hasAmount &&
    !!agentAddress &&
    !submitting &&
    (isBase ? !!baseAddress && !!sendBaseFuelTransaction : !!publicKey && !!sendTransaction);

  const formatBalance = (v: number | null | undefined) =>
    v == null ? "—" : v.toFixed(4);

  const nativeLabel = isBase ? "ETH" : "SOL";
  const nativeBalance = isBase ? baseEthBalance : userSolBalance;
  const usdcBalanceDisplay = isBase ? baseUsdcBalance : userUsdcBalance;
  const balanceLoadingDisplay = isSolana ? balanceLoading : false;

  const agentNativeBalance = isBase ? agentBaseEthBalance : agentSolBalance;
  const agentUsdcDisplay = isBase ? agentBaseUsdcBalance : agentUsdcBalance;
  const canWithdrawFromAgent =
    !!agentAddress && !!anonymousId && (isBase ? !!baseAddress : !!publicKey);

  /**
   * Horizontal inset — synced with header `after` rule. Tighter on very narrow viewports;
   * respects notches via env() on the shell width (below).
   */
  const modalPadX = "px-4 min-[380px]:px-5 sm:px-6";
  const modalPadAfter =
    "after:left-4 after:right-4 min-[380px]:after:left-5 min-[380px]:after:right-5 sm:after:left-6 sm:after:right-6";
  const balanceCardClass =
    "rounded-xl border border-border/70 bg-gradient-to-br from-card to-muted/25 p-3.5 sm:p-4 shadow-sm ring-1 ring-white/[0.04] transition-colors min-w-0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex min-h-0 w-[calc(100vw-1rem-(env(safe-area-inset-left,0px)+env(safe-area-inset-right,0px)))] max-w-[min(44rem,calc(100vw-1rem-(env(safe-area-inset-left,0px)+env(safe-area-inset-right,0px))))] max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-0.75rem))] flex-col gap-0 overflow-hidden rounded-2xl border-border/60 bg-gradient-to-b from-card via-card to-muted/20 p-0 shadow-2xl ring-1 ring-white/[0.06] sm:rounded-2xl"
      >
        <DialogHeader
          className={cn(
            "relative shrink-0 space-y-2 pb-4 pt-[max(1.25rem,env(safe-area-inset-top,0px))] text-left pr-10 min-[380px]:pr-11 sm:pr-12",
            modalPadX,
            "after:pointer-events-none after:absolute after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border/80 after:to-transparent",
            modalPadAfter,
          )}
        >
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground min-[380px]:text-xl">
            Fuel the agent
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground/90 min-[380px]:text-sm">
            {isBase
              ? "Send USDC and ETH from your wallet to your agent on Base. Pick an amount below."
              : "Send USDC and SOL from your wallet to your agent. Pick an amount below."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
          <div className={cn("space-y-4 pb-4", modalPadX)}>
          {/* Agent + your wallet: side by side from sm; stack on narrow phones */}
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-3">
          {/* Agent wallet — destination; withdraw lives here */}
          <div
            className={cn(
              balanceCardClass,
              "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-card/95 to-card dark:from-emerald-500/[0.09]",
            )}
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-0.5 pr-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
                  Agent wallet
                </p>
                <p className="text-sm font-semibold text-foreground">Balance</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-11 min-h-[44px] min-w-0 shrink-0 gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2.5 text-xs font-medium shadow-sm backdrop-blur-sm hover:bg-background/90 sm:h-8 sm:min-h-0"
                title={
                  isBase
                    ? "Withdraw to your Base wallet is not available yet"
                    : "Send agent USDC and SOL to your connected Solana wallet"
                }
                disabled={!canWithdrawFromAgent || withdrawing || submitting}
                onClick={() => void handleWithdrawToUserWallet()}
              >
                {withdrawing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
                ) : (
                  <ArrowDownToLine className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                )}
                {withdrawing ? "Withdrawing…" : "Withdraw"}
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/40 pt-3 tabular-nums text-sm">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  <CoinLogo symbol="USDC" size="xs" />
                  USDC
                </span>
                <span
                  className={cn(
                    "truncate text-sm font-semibold tracking-tight text-foreground sm:text-[0.9375rem]",
                    agentUsdcDisplay != null &&
                      agentUsdcDisplay > 0 &&
                      "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {agentUsdcDisplay != null ? `$${agentUsdcDisplay.toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  <CoinLogo symbol={nativeLabel} size="xs" />
                  {nativeLabel}
                </span>
                <span className="truncate text-sm font-semibold tracking-tight text-foreground/90 sm:text-[0.9375rem]">
                  {formatBalance(agentNativeBalance ?? undefined)}
                </span>
              </div>
            </div>
          </div>

          {/* Your wallet — source */}
          <div className={cn(balanceCardClass, "from-muted/15 to-card/90")}>
            <div className="space-y-0.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
                Your wallet
              </p>
              <p className="text-sm font-semibold text-foreground">Balance</p>
            </div>
            {balanceLoadingDisplay ? (
              <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Loading…</span>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border/40 pt-3 tabular-nums text-sm">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    <CoinLogo symbol="USDC" size="xs" />
                    USDC
                  </span>
                  <span
                    className={cn(
                      "truncate text-sm font-semibold tracking-tight text-foreground sm:text-[0.9375rem]",
                      usdcBalanceDisplay != null &&
                        usdcBalanceDisplay > 0 &&
                        "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {usdcBalanceDisplay != null ? `$${usdcBalanceDisplay.toFixed(2)}` : "—"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    <CoinLogo symbol={nativeLabel} size="xs" />
                    {nativeLabel}
                  </span>
                  <span className="truncate text-sm font-semibold tracking-tight text-foreground/90 sm:text-[0.9375rem]">
                    {formatBalance(nativeBalance)}
                  </span>
                </div>
              </div>
            )}
          </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
              Amount
            </p>
            <div className="flex min-w-0 gap-2">
              {PRESET_AMOUNTS.map((value) => {
                const selected = selectedPreset === value;
                return (
                  <Button
                    key={value}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-11 min-h-[44px] flex-1 rounded-lg text-sm font-semibold transition-all sm:h-10 sm:min-h-0",
                      selected &&
                        "shadow-md shadow-primary/20 ring-1 ring-primary/30",
                      !selected &&
                        "border-border/80 bg-background/40 hover:border-border hover:bg-muted/35",
                    )}
                    onClick={() => handlePreset(value)}
                  >
                    ${value}
                  </Button>
                );
              })}
            </div>
            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
                Custom
              </span>
              <Input
                type="number"
                min={0}
                step={0.5}
                placeholder="0.00"
                inputMode="decimal"
                enterKeyHint="done"
                value={customAmount}
                onFocus={handleCustomFocus}
                onChange={handleCustomChange}
                className={cn(
                  "h-11 min-h-[44px] w-full rounded-lg border-border/70 bg-background/50 text-base font-medium tabular-nums transition-[box-shadow,border-color] sm:h-10 sm:min-h-0 sm:text-sm",
                  "focus-visible:border-primary/40 focus-visible:ring-primary/25",
                  selectedPreset == null && customAmount !== "" && "border-primary/35 ring-2 ring-primary/20",
                )}
              />
            </div>
          </div>

          {hasAmount && (
            <div className="min-w-0 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] via-transparent to-muted/20 p-3.5 text-sm shadow-sm ring-1 ring-inset ring-white/[0.03] sm:p-4">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
                    You&apos;ll add
                  </p>
                  <p className="mt-1.5 text-sm leading-snug text-muted-foreground sm:text-[0.9375rem]">
                    <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      ${amountUsd.toFixed(2)} USDC
                    </span>
                    <span className="mx-1.5 font-medium text-muted-foreground/50">+</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      ${amountUsd.toFixed(2)} {nativeLabel}
                    </span>
                  </p>
                </div>
                <p className="min-w-0 text-xs leading-relaxed text-muted-foreground/85 sm:max-w-[14rem] sm:shrink-0 sm:text-right sm:text-[11px]">
                  Same dollar value in {nativeLabel} covers network fees.
                </p>
              </div>
            </div>
          )}
          </div>
        </div>

        <DialogFooter
          className={cn(
            "shrink-0 w-full min-w-0 gap-2 border-t border-border/40 py-3 sm:gap-3 sm:space-x-0",
            "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3",
            modalPadX,
          )}
        >
          <Button
            variant="ghost"
            className="h-11 min-h-[44px] w-full rounded-lg px-4 text-muted-foreground hover:text-foreground sm:h-10 sm:min-h-0 sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Close
          </Button>
          <Button
            className="h-11 min-h-[44px] w-full min-w-0 rounded-lg px-5 text-sm font-semibold shadow-md shadow-primary/15 sm:h-10 sm:min-h-0 sm:w-auto sm:min-w-[8rem]"
            onClick={handleFuelSubmit}
            disabled={!canSubmit}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0 mr-2" />
                Sending…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 shrink-0 mr-2 opacity-90" />
                Fuel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
