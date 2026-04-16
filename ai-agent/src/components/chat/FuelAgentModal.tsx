import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDownToLine,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  Loader2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useToast } from "@/hooks/use-toast";
import { agentWalletApi } from "@/lib/chatApi";

const LAMPORTS_PER_SOL = 1e9;
const USDC_MINT_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_DECIMALS = 6;

/**
 * Parses amount strings for wallet inputs. Accepts `7.26` or `7,26` (decimal comma).
 * Strips commas used as thousands separators when a dot is present (e.g. `1,234.50`).
 */
function parseAmountInput(raw: string): number {
  let t = raw.trim();
  if (!t) return 0;
  if (t.includes(",") && !t.includes(".")) {
    t = t.replace(",", ".");
  } else {
    t = t.replace(/,/g, "");
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

function getDepositAmountError(params: {
  flowTab: "deposit" | "withdraw";
  hasDepositAmount: boolean;
  depositMode: "usdc" | "native";
  depositUsdcHuman: number;
  depositNativeHuman: number;
  usdcBalanceDisplay: number | null | undefined;
  nativeBalance: number | null | undefined;
  nativeLabel: string;
  isBase: boolean;
}): string | null {
  if (params.flowTab !== "deposit" || !params.hasDepositAmount) return null;
  if (params.depositMode === "usdc") {
    if (params.usdcBalanceDisplay == null || !Number.isFinite(params.usdcBalanceDisplay)) return null;
    if (params.depositUsdcHuman > params.usdcBalanceDisplay + 1e-6) {
      return `You have $${params.usdcBalanceDisplay.toFixed(2)} USDC in your wallet. Lower the amount.`;
    }
    return null;
  }
  if (params.nativeBalance == null || !Number.isFinite(params.nativeBalance)) return null;
  if (params.depositNativeHuman > params.nativeBalance + 1e-8) {
    const dec = params.isBase ? 6 : 4;
    return `You have ${params.nativeBalance.toFixed(dec)} ${params.nativeLabel} in your wallet. Lower the amount.`;
  }
  return null;
}

function getWithdrawAmountError(params: {
  flowTab: "deposit" | "withdraw";
  isBase: boolean;
  hasWithdrawAmount: boolean;
  withdrawMode: "usdc" | "native";
  withdrawUsdcHuman: number;
  withdrawNativeHuman: number;
  agentUsdcDisplay: number | null | undefined;
  agentSolBalance: number | null | undefined;
  nativeLabel: string;
}): string | null {
  if (params.flowTab !== "withdraw" || params.isBase) return null;
  if (!params.hasWithdrawAmount) return null;
  if (params.withdrawMode === "usdc") {
    if (params.agentUsdcDisplay == null || !Number.isFinite(params.agentUsdcDisplay)) return null;
    if (params.withdrawUsdcHuman > params.agentUsdcDisplay + 1e-6) {
      return `The agent only has $${params.agentUsdcDisplay.toFixed(2)} USDC.`;
    }
    return null;
  }
  if (params.agentSolBalance == null || !Number.isFinite(params.agentSolBalance)) return null;
  if (params.withdrawNativeHuman > params.agentSolBalance + 1e-8) {
    return `The agent only has about ${params.agentSolBalance.toFixed(4)} ${params.nativeLabel}.`;
  }
  return null;
}

export interface FuelAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which flow to show when the dialog opens (e.g. from wallet menu shortcuts). */
  initialFlowTab?: "deposit" | "withdraw";
}

export function FuelAgentModal({ open, onOpenChange, initialFlowTab = "deposit" }: FuelAgentModalProps) {
  const {
    connection,
    publicKey,
    sendTransaction,
    baseAddress,
    baseUsdcBalance,
    baseEthBalance,
    sendBaseFuelTransaction,
    solBalance,
    usdcBalance,
    refreshSolanaBalances,
    refreshBaseBalances,
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
    reportDebit,
    reportNativeDebit,
  } = useAgentWallet();
  const { toast } = useToast();
  /** USDC vs native (SOL on Solana, ETH on Base). */
  const [depositMode, setDepositMode] = useState<"usdc" | "native">("usdc");
  const [customUsd, setCustomUsd] = useState("");
  const [customNative, setCustomNative] = useState("");
  /** Withdraw asset (Solana); mirrors depositMode UX. */
  const [withdrawMode, setWithdrawMode] = useState<"usdc" | "native">("usdc");
  const [withdrawCustomUsd, setWithdrawCustomUsd] = useState("");
  const [withdrawCustomNative, setWithdrawCustomNative] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [flowTab, setFlowTab] = useState<"deposit" | "withdraw">("deposit");
  /** Bumps when user taps Add funds so the flow animation replays. */
  const [depositFlowAnimKey, setDepositFlowAnimKey] = useState(0);
  /** Bumps when user taps Move out so the flow animation replays. */
  const [withdrawFlowAnimKey, setWithdrawFlowAnimKey] = useState(0);

  const fuelBodyShellRef = useRef<HTMLDivElement>(null);
  const fuelBodyMeasureRef = useRef<HTMLDivElement>(null);
  const fuelBodyHeightAnimRef = useRef<Animation | null>(null);
  /** First layout after open: set height immediately (no transition from `auto`). */
  const fuelBodySkipHeightAnimRef = useRef(true);

  useLayoutEffect(() => {
    if (!open) {
      fuelBodyHeightAnimRef.current?.cancel();
      fuelBodyHeightAnimRef.current = null;
      fuelBodySkipHeightAnimRef.current = true;
      const shell = fuelBodyShellRef.current;
      if (shell) shell.style.removeProperty("height");
      return;
    }

    fuelBodySkipHeightAnimRef.current = true;

    const measureEl = fuelBodyMeasureRef.current;
    const shellEl = fuelBodyShellRef.current;
    if (!measureEl || !shellEl) return;

    const reducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const applyHeight = (px: number) => {
      shellEl.style.height = `${Math.max(1, Math.round(px))}px`;
    };

    const syncShellHeight = () => {
      const next = Math.max(1, Math.ceil(measureEl.getBoundingClientRect().height));
      const prevVisual = Math.ceil(shellEl.getBoundingClientRect().height) || next;

      if (fuelBodySkipHeightAnimRef.current) {
        fuelBodySkipHeightAnimRef.current = false;
        fuelBodyHeightAnimRef.current?.cancel();
        fuelBodyHeightAnimRef.current = null;
        applyHeight(next);
        return;
      }

      if (reducedMotion || Math.abs(next - prevVisual) < 2) {
        fuelBodyHeightAnimRef.current?.cancel();
        fuelBodyHeightAnimRef.current = null;
        applyHeight(next);
        return;
      }

      fuelBodyHeightAnimRef.current?.cancel();
      applyHeight(prevVisual);

      const anim = shellEl.animate(
        [{ height: `${prevVisual}px` }, { height: `${next}px` }],
        { duration: 280, easing: "cubic-bezier(0.33, 1, 0.68, 1)", fill: "forwards" },
      );
      fuelBodyHeightAnimRef.current = anim;
      const finish = () => {
        applyHeight(next);
        if (fuelBodyHeightAnimRef.current === anim) fuelBodyHeightAnimRef.current = null;
      };
      anim.addEventListener("finish", finish, { once: true });
      anim.addEventListener("cancel", finish, { once: true });
    };

    syncShellHeight();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => syncShellHeight());
    });
    ro.observe(measureEl);
    return () => {
      ro.disconnect();
      fuelBodyHeightAnimRef.current?.cancel();
      fuelBodyHeightAnimRef.current = null;
    };
  }, [open]);

  const isSolana = connectedChain === "solana";
  const isBase = connectedChain === "base";

  const depositUsdcHuman = depositMode === "native" ? 0 : parseAmountInput(customUsd);
  const depositNativeHuman = depositMode === "native" ? parseAmountInput(customNative) : 0;
  const withdrawUsdcHuman = withdrawMode === "native" ? 0 : parseAmountInput(withdrawCustomUsd);
  const withdrawNativeHuman = withdrawMode === "native" ? parseAmountInput(withdrawCustomNative) : 0;

  const runAgentBalanceRefresh = useCallback(async () => {
    await refetchBalance();
  }, [refetchBalance]);

  useEffect(() => {
    if (open) {
      setFlowTab(initialFlowTab);
      setDepositMode("usdc");
      setCustomUsd("");
      setCustomNative("");
      setWithdrawMode("usdc");
      setWithdrawCustomUsd("");
      setWithdrawCustomNative("");
      setDepositFlowAnimKey(0);
      setWithdrawFlowAnimKey(0);
      setWithdrawing(false);
      setSubmitting(false);
    }
  }, [open, initialFlowTab]);

  const buildSolanaTx = useCallback(async () => {
    if (!publicKey || !agentAddress) return null;
    const agentPubkey = new PublicKey(agentAddress);
    const usdcRaw = BigInt(Math.floor(depositUsdcHuman * 10 ** USDC_DECIMALS));
    const solLamports = BigInt(Math.floor(depositNativeHuman * LAMPORTS_PER_SOL));
    if (usdcRaw <= 0n && solLamports <= 0n) return null;

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

    if (usdcRaw > 0n) {
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
  }, [
    depositUsdcHuman,
    depositNativeHuman,
    agentAddress,
    publicKey,
    connection,
  ]);

  const handleFuelSubmit = useCallback(async () => {
    if (!agentAddress || (depositUsdcHuman <= 0 && depositNativeHuman <= 0)) return;
    const depositErr = getDepositAmountError({
      flowTab: "deposit",
      hasDepositAmount: depositUsdcHuman > 0 || depositNativeHuman > 0,
      depositMode,
      depositUsdcHuman,
      depositNativeHuman,
      usdcBalanceDisplay: isBase ? baseUsdcBalance : usdcBalance,
      nativeBalance: isBase ? baseEthBalance : solBalance,
      nativeLabel: isBase ? "ETH" : "SOL",
      isBase,
    });
    if (depositErr) {
      toast({
        title: "Amount too high",
        description: depositErr,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (isBase && sendBaseFuelTransaction) {
        const txHash = await sendBaseFuelTransaction(
          agentAddress,
          depositUsdcHuman,
          depositNativeHuman,
        );
        const parts: string[] = [];
        if (depositUsdcHuman > 0) parts.push(`${depositUsdcHuman.toFixed(2)} USDC`);
        if (depositNativeHuman > 0) parts.push(`${depositNativeHuman.toFixed(6)} ETH`);
        toast({
          title: "Transfer sent",
          description: `${parts.join(" + ")} sent to agent on Base. Tx: ${txHash.slice(0, 10)}…`,
        });
        void runAgentBalanceRefresh();
        void refreshBaseBalances();
        setCustomUsd("");
        setCustomNative("");
        return;
      }

      if (isSolana && publicKey && sendTransaction) {
        const sendOpts = { skipPreflight: false, maxRetries: 3 };
        let lastErr: unknown;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const tx = await buildSolanaTx();
            if (!tx) {
              toast({
                title: "Invalid amount",
                description: "Enter a positive USDC or SOL amount.",
                variant: "destructive",
              });
              return;
            }
            const signature = await sendTransaction(tx, sendOpts);
            const parts: string[] = [];
            if (depositUsdcHuman > 0) parts.push(`$${depositUsdcHuman.toFixed(2)} USDC`);
            if (depositNativeHuman > 0) parts.push(`${depositNativeHuman.toFixed(4)} SOL`);
            toast({
              title: "Transfer sent",
              description: `${parts.join(" + ")} sent to agent. Signature: ${signature.slice(0, 8)}…`,
            });
            void runAgentBalanceRefresh();
            void refreshSolanaBalances();
            setCustomUsd("");
            setCustomNative("");
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
    depositUsdcHuman,
    depositNativeHuman,
    agentAddress,
    isBase,
    isSolana,
    publicKey,
    sendTransaction,
    sendBaseFuelTransaction,
    buildSolanaTx,
    toast,
    runAgentBalanceRefresh,
    refreshSolanaBalances,
    refreshBaseBalances,
    depositMode,
    usdcBalance,
    solBalance,
    baseUsdcBalance,
    baseEthBalance,
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
    const hasW = withdrawUsdcHuman > 0 || withdrawNativeHuman > 0;
    const withdrawErr = getWithdrawAmountError({
      flowTab: "withdraw",
      isBase,
      hasWithdrawAmount: hasW,
      withdrawMode,
      withdrawUsdcHuman,
      withdrawNativeHuman,
      agentUsdcDisplay: agentUsdcBalance,
      agentSolBalance,
      nativeLabel: "SOL",
    });
    if (withdrawErr) {
      toast({
        title: "Cannot withdraw",
        description: withdrawErr,
        variant: "destructive",
      });
      return;
    }
    if (!hasW) {
      toast({
        title: "Enter an amount",
        description: "Choose USDC or SOL and enter how much to move to your wallet.",
        variant: "destructive",
      });
      return;
    }
    setWithdrawing(true);
    let withdrawSignature: string | null = null;
    try {
      const { signature } = await agentWalletApi.withdrawToLinkedWallet(
        anonymousId,
        publicKey.toBase58(),
        withdrawMode === "usdc"
          ? { asset: "usdc" as const, usdcAmount: withdrawUsdcHuman }
          : { asset: "sol" as const, solAmount: withdrawNativeHuman },
      );
      withdrawSignature = signature;
      toast({
        title: "Withdrawal sent",
        description: `Transaction submitted to your wallet. ${signature.slice(0, 8)}…`,
      });
      setWithdrawCustomUsd("");
      setWithdrawCustomNative("");
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
    // Optimistic agent balances + linked-wallet refresh (reportDebit/reportNativeDebit schedule refetchBalance.)
    if (withdrawSignature) {
      if (withdrawMode === "usdc" && withdrawUsdcHuman > 0) {
        reportDebit(withdrawUsdcHuman);
      } else if (withdrawMode === "native" && withdrawNativeHuman > 0) {
        reportNativeDebit(withdrawNativeHuman);
      }
      void refreshSolanaBalances();
    }
  }, [
    anonymousId,
    isBase,
    publicKey,
    reportDebit,
    reportNativeDebit,
    refreshSolanaBalances,
    toast,
    withdrawMode,
    withdrawUsdcHuman,
    withdrawNativeHuman,
    agentUsdcBalance,
    agentSolBalance,
  ]);

  const hasDepositAmount = depositUsdcHuman > 0 || depositNativeHuman > 0;
  const hasWithdrawAmount = withdrawUsdcHuman > 0 || withdrawNativeHuman > 0;

  const formatBalance = (v: number | null | undefined) =>
    v == null ? "—" : v.toFixed(4);

  const nativeLabel = isBase ? "ETH" : "SOL";
  const nativeBalance = isBase ? baseEthBalance : solBalance;
  const usdcBalanceDisplay = isBase ? baseUsdcBalance : usdcBalance;

  const fillUsdcFromWalletFraction = useCallback(
    (fraction: 0.5 | 1) => {
      const b = usdcBalanceDisplay;
      if (b == null || !Number.isFinite(b) || b <= 0) {
        toast({
          title: "No USDC in wallet",
          description: "Connect your wallet or add USDC first.",
          variant: "destructive",
        });
        return;
      }
      const v = fraction === 1 ? b : b * 0.5;
      setCustomUsd(v.toFixed(2));
    },
    [toast, usdcBalanceDisplay],
  );

  const fillNativeFromWalletFraction = useCallback(
    (fraction: 0.5 | 1) => {
      const b = nativeBalance;
      if (b == null || !Number.isFinite(b) || b <= 0) {
        toast({
          title: `No ${nativeLabel} in wallet`,
          description: `Connect your wallet or add ${nativeLabel} first.`,
          variant: "destructive",
        });
        return;
      }
      const v = fraction === 1 ? b : b * 0.5;
      const decimals = isBase ? 6 : 5;
      setCustomNative(Number(v.toFixed(decimals)).toString());
    },
    [isBase, nativeBalance, nativeLabel, toast],
  );

  const walletUsdcReady = usdcBalanceDisplay != null && usdcBalanceDisplay > 0;
  const walletNativeReady = nativeBalance != null && nativeBalance > 0;

  const agentNativeBalance = isBase ? agentBaseEthBalance : agentSolBalance;
  const agentUsdcDisplay = isBase ? agentBaseUsdcBalance : agentUsdcBalance;

  const fillWithdrawUsdcFromAgentFraction = useCallback(
    (fraction: 0.5 | 1) => {
      const b = agentUsdcDisplay;
      if (b == null || !Number.isFinite(b) || b <= 0) {
        toast({
          title: "No USDC on agent",
          description: "The agent wallet has no USDC to withdraw.",
          variant: "destructive",
        });
        return;
      }
      const v = fraction === 1 ? b : b * 0.5;
      setWithdrawCustomUsd(v.toFixed(2));
    },
    [agentUsdcDisplay, toast],
  );

  const fillWithdrawNativeFromAgentFraction = useCallback(
    (fraction: 0.5 | 1) => {
      const b = agentNativeBalance;
      if (b == null || !Number.isFinite(b) || b <= 0) {
        toast({
          title: `No ${nativeLabel} on agent`,
          description: `The agent wallet has no ${nativeLabel} to withdraw.`,
          variant: "destructive",
        });
        return;
      }
      const v = fraction === 1 ? b : b * 0.5;
      setWithdrawCustomNative(Number(v.toFixed(4)).toString());
    },
    [agentNativeBalance, nativeLabel, toast],
  );

  const agentUsdcReadyWithdraw = agentUsdcDisplay != null && agentUsdcDisplay > 0;
  const agentNativeReadyWithdraw = agentNativeBalance != null && agentNativeBalance > 0;

  const depositAmountError = useMemo(
    () =>
      getDepositAmountError({
        flowTab,
        hasDepositAmount,
        depositMode,
        depositUsdcHuman,
        depositNativeHuman,
        usdcBalanceDisplay,
        nativeBalance,
        nativeLabel,
        isBase,
      }),
    [
      flowTab,
      hasDepositAmount,
      depositMode,
      depositUsdcHuman,
      depositNativeHuman,
      usdcBalanceDisplay,
      nativeBalance,
      nativeLabel,
      isBase,
    ],
  );

  const withdrawAmountError = useMemo(
    () =>
      getWithdrawAmountError({
        flowTab,
        isBase,
        hasWithdrawAmount,
        withdrawMode,
        withdrawUsdcHuman,
        withdrawNativeHuman,
        agentUsdcDisplay,
        agentSolBalance,
        nativeLabel,
      }),
    [
      flowTab,
      isBase,
      hasWithdrawAmount,
      withdrawMode,
      withdrawUsdcHuman,
      withdrawNativeHuman,
      agentUsdcDisplay,
      agentSolBalance,
      nativeLabel,
    ],
  );

  const canSubmitDeposit =
    hasDepositAmount &&
    !depositAmountError &&
    !!agentAddress &&
    !submitting &&
    (isBase ? !!baseAddress && !!sendBaseFuelTransaction : !!publicKey && !!sendTransaction);
  const canSubmitWithdraw =
    hasWithdrawAmount &&
    !withdrawAmountError &&
    !!agentAddress &&
    !!anonymousId &&
    (isBase ? !!baseAddress : !!publicKey) &&
    !withdrawing &&
    !submitting &&
    !isBase;

  const modalPadX = "px-4 min-[380px]:px-5 sm:px-6";
  const modalPadAfter =
    "after:left-4 after:right-4 min-[380px]:after:left-5 min-[380px]:after:right-5 sm:after:left-6 sm:after:right-6";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex min-h-0 w-[calc(100vw-1rem-(env(safe-area-inset-left,0px)+env(safe-area-inset-right,0px)))] max-w-[min(44rem,calc(100vw-1rem-(env(safe-area-inset-left,0px)+env(safe-area-inset-right,0px))))] max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-1rem))] flex-col gap-0 overflow-x-hidden overflow-y-auto rounded-2xl border-border/60 bg-gradient-to-b from-card via-card to-muted/20 p-0 shadow-2xl ring-1 ring-white/[0.06] sm:rounded-2xl"
      >
        <DialogHeader
          className={cn(
            "relative shrink-0 space-y-1.5 pb-3 pt-[max(1rem,env(safe-area-inset-top,0px))] text-left pr-10 min-[380px]:pr-11 sm:pr-12",
            modalPadX,
            "after:pointer-events-none after:absolute after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border/80 after:to-transparent",
            modalPadAfter,
          )}
        >
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground min-[380px]:text-xl">
            Agent wallet
          </DialogTitle>
          <DialogDescription className="line-clamp-2 text-[12px] leading-snug text-muted-foreground/90 min-[380px]:text-[13px] sm:text-sm">
            {isBase
              ? "Add USDC or ETH to your agent from the wallet you connected on Base."
              : "Add funds from your wallet to your agent, or move them back to the same connected wallet."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 flex flex-col overflow-hidden">
          <div ref={fuelBodyShellRef} className="overflow-hidden will-change-[height]">
            <div ref={fuelBodyMeasureRef} className={cn("flex flex-col gap-3 pb-2", modalPadX)}>
            {/* Balances — direction hints (deposit vs withdraw) */}
            <div
              className={cn(
                "shrink-0 rounded-2xl border px-3 py-2.5 transition-[border-color,background-color,box-shadow] duration-300 sm:px-4 sm:py-3",
                flowTab === "deposit" &&
                  "border-primary/25 bg-gradient-to-br from-primary/[0.07] via-muted/12 to-amber-500/[0.05] shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.06)]",
                flowTab === "withdraw" &&
                  !isBase &&
                  "border-emerald-500/20 bg-gradient-to-br from-amber-500/[0.06] via-muted/12 to-primary/[0.07] shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.05)]",
                flowTab === "withdraw" && isBase && "border-border/50 bg-muted/10",
              )}
            >
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-3">
                <div
                  className={cn(
                    "min-w-0 rounded-xl px-2 py-1.5 transition-[background-color,box-shadow] duration-300 sm:px-3 sm:py-2.5",
                    flowTab === "deposit" && "bg-primary/[0.11] ring-1 ring-inset ring-primary/20",
                    flowTab === "withdraw" &&
                      !isBase &&
                      "bg-amber-500/[0.09] ring-1 ring-inset ring-amber-500/18",
                  )}
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70 sm:text-[11px]">Agent</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums text-[13px] sm:text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <CoinLogo symbol="USDC" size="xs" />
                      <span className={cn(agentUsdcDisplay != null && agentUsdcDisplay > 0 && "font-medium text-emerald-600 dark:text-emerald-400")}>
                        {agentUsdcDisplay != null ? `$${agentUsdcDisplay.toFixed(2)}` : "—"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <CoinLogo symbol={nativeLabel} size="xs" />
                      <span className="font-medium text-foreground/90">{formatBalance(agentNativeBalance ?? undefined)}</span>
                    </span>
                  </div>
                </div>
                <div
                  className={cn(
                    "items-center justify-center sm:flex sm:w-11 sm:flex-col",
                    flowTab === "deposit" &&
                      "flex min-h-[1.75rem] border-y border-primary/15 py-1 sm:min-h-0 sm:border-x sm:border-y-0 sm:py-0",
                    flowTab === "withdraw" &&
                      !isBase &&
                      "flex min-h-[1.75rem] border-y border-emerald-500/15 py-1 sm:min-h-0 sm:border-x sm:border-y-0 sm:py-0",
                    flowTab === "withdraw" &&
                      isBase &&
                      "hidden border-y border-border/35 py-2 sm:flex sm:border-x sm:border-y-0 sm:border-border/40 sm:py-0",
                  )}
                  aria-hidden
                >
                  {flowTab === "deposit" ? (
                    <span key={depositFlowAnimKey} className="flex flex-col items-center justify-center gap-0.5">
                      <ChevronsUp
                        className="h-5 w-5 text-primary sm:hidden animate-deposit-flow-up"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <ChevronsLeft
                        className="hidden h-7 w-7 text-primary sm:block animate-deposit-flow-left"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                  ) : flowTab === "withdraw" && !isBase ? (
                    <span key={withdrawFlowAnimKey} className="flex flex-col items-center justify-center gap-0.5">
                      <ChevronsDown
                        className="h-5 w-5 text-emerald-500 sm:hidden animate-withdraw-flow-down"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <ChevronsRight
                        className="hidden h-7 w-7 text-emerald-500 sm:block animate-withdraw-flow-right"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    </span>
                  ) : (
                    <div className="h-10 w-px shrink-0 bg-border/50" />
                  )}
                </div>
                <div
                  className={cn(
                    /* Mobile: match Agent horizontal padding; inset rings avoid clipping under overflow-hidden. */
                    "min-w-0 rounded-xl border-t border-border/40 px-2 pb-2.5 pt-3 transition-[background-color,box-shadow,border-color] duration-300 sm:border-0 sm:px-3 sm:py-2.5",
                    flowTab === "deposit" &&
                      "border-primary/15 bg-amber-500/[0.08] ring-1 ring-inset ring-amber-500/15 sm:border-0",
                    flowTab === "withdraw" &&
                      !isBase &&
                      "border-emerald-500/15 bg-primary/[0.1] ring-1 ring-inset ring-primary/18 sm:border-0",
                  )}
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70 sm:text-[11px]">Yours</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums text-[13px] sm:text-sm">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <CoinLogo symbol="USDC" size="xs" />
                      <span className={cn(usdcBalanceDisplay != null && usdcBalanceDisplay > 0 && "font-medium text-emerald-600 dark:text-emerald-400")}>
                        {usdcBalanceDisplay != null ? `$${usdcBalanceDisplay.toFixed(2)}` : "—"}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <CoinLogo symbol={nativeLabel} size="xs" />
                      <span className="font-medium text-foreground/90">{formatBalance(nativeBalance)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary intent — two large choices (not nested tab strips) */}
            <div className="grid min-w-0 shrink-0 grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setFlowTab("deposit");
                  setDepositFlowAnimKey((k) => k + 1);
                }}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-3.5",
                  flowTab === "deposit"
                    ? "border-primary/35 bg-primary/[0.06] shadow-sm ring-1 ring-primary/20"
                    : "border-border/40 bg-background/40 hover:border-border/60 hover:bg-muted/20",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/90 ring-1 ring-border/50 sm:h-10 sm:w-10">
                    <Zap className="h-4 w-4 text-primary sm:h-[18px] sm:w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[13px] font-semibold tracking-tight text-foreground sm:text-sm">Add funds</p>
                    <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">From your wallet into the agent</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                disabled={isBase}
                onClick={() => {
                  if (!isBase) {
                    setFlowTab("withdraw");
                    setWithdrawFlowAnimKey((k) => k + 1);
                  }
                }}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-3.5",
                  isBase && "cursor-not-allowed opacity-40",
                  flowTab === "withdraw" && !isBase
                    ? "border-foreground/25 bg-muted/30 shadow-sm ring-1 ring-border/40"
                    : !isBase && "border-border/40 bg-background/40 hover:border-border/60 hover:bg-muted/20",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/90 ring-1 ring-border/50 sm:h-10 sm:w-10">
                    <ArrowDownToLine className="h-4 w-4 text-muted-foreground sm:h-[18px] sm:w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[13px] font-semibold tracking-tight text-foreground sm:text-sm">Move out</p>
                    <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                      {isBase ? "Not on Base yet" : "From the agent to your wallet"}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex flex-col gap-2 overflow-hidden">
              <div className="space-y-2.5 overflow-x-hidden sm:space-y-3">
            {flowTab === "deposit" && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="deposit-amount" className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                  {depositMode === "usdc" ? "USDC" : nativeLabel} amount
                </Label>
                <div
                  className={cn(
                    "flex h-11 min-h-[44px] min-w-0 items-stretch overflow-hidden rounded-xl border bg-background/60 sm:h-10 sm:min-h-0",
                    depositAmountError ? "border-destructive/55" : "border-border/60",
                  )}
                >
                  <Select
                    value={depositMode}
                    onValueChange={(v) => {
                      const next = v as "usdc" | "native";
                      setDepositMode(next);
                      setCustomUsd("");
                      setCustomNative("");
                    }}
                  >
                    <SelectTrigger
                      id="deposit-asset"
                      title="Change asset"
                      className={cn(
                        "h-full min-h-[44px] w-auto min-w-[3.25rem] shrink-0 rounded-none rounded-l-xl border-0 border-r border-border/40 bg-transparent py-0 pl-2 pr-1.5 shadow-none",
                        "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                        "sm:min-h-0 sm:h-10",
                      )}
                      aria-label={`Asset ${depositMode === "usdc" ? "USDC" : nativeLabel}, open to change`}
                    >
                      <span className="flex items-center gap-1.5">
                        <CoinLogo symbol={depositMode === "usdc" ? "USDC" : nativeLabel} size="sm" />
                        <span className="sr-only">
                          <SelectValue />
                        </span>
                      </span>
                    </SelectTrigger>
                    <SelectContent align="start" className="min-w-[10rem]">
                      <SelectItem value="usdc">
                        <span className="flex items-center gap-2">
                          <CoinLogo symbol="USDC" size="sm" />
                          USDC
                        </span>
                      </SelectItem>
                      <SelectItem value="native">
                        <span className="flex items-center gap-2">
                          <CoinLogo symbol={nativeLabel} size="sm" />
                          {nativeLabel}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {depositMode === "usdc" ? (
                    <>
                      <Input
                        id="deposit-amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="Amount"
                        value={customUsd}
                        onChange={(e) => setCustomUsd(e.target.value)}
                        className="h-full min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 py-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-10 sm:text-sm"
                      />
                      <div className="flex shrink-0 items-center gap-1 pr-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!walletUsdcReady}
                          className="h-8 shrink-0 px-2 text-xs font-semibold"
                          onClick={() => fillUsdcFromWalletFraction(0.5)}
                        >
                          50%
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!walletUsdcReady}
                          className="h-8 shrink-0 px-2 text-xs font-semibold"
                          onClick={() => fillUsdcFromWalletFraction(1)}
                        >
                          Max
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Input
                        id="deposit-amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="Amount"
                        value={customNative}
                        onChange={(e) => setCustomNative(e.target.value)}
                        className="h-full min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 py-0 font-mono text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-10 sm:text-[13px]"
                      />
                      <div className="flex shrink-0 items-center gap-1 pr-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!walletNativeReady}
                          className="h-8 shrink-0 px-2 text-xs font-semibold"
                          onClick={() => fillNativeFromWalletFraction(0.5)}
                        >
                          50%
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!walletNativeReady}
                          className="h-8 shrink-0 px-2 text-xs font-semibold"
                          onClick={() => fillNativeFromWalletFraction(1)}
                        >
                          Max
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                {depositAmountError ? (
                  <p role="alert" className="text-[11px] leading-snug text-destructive sm:text-xs">
                    {depositAmountError}
                  </p>
                ) : null}
              </div>
            )}

            {flowTab === "withdraw" && !isBase && (
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="withdraw-amount" className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                  {withdrawMode === "usdc" ? "USDC" : nativeLabel} amount
                </Label>
                <div
                  className={cn(
                    "flex h-11 min-h-[44px] min-w-0 items-stretch overflow-hidden rounded-xl border bg-background/60 sm:h-10 sm:min-h-0",
                    withdrawAmountError ? "border-destructive/55" : "border-border/60",
                  )}
                >
                  <Select
                    value={withdrawMode}
                    onValueChange={(v) => {
                      const next = v as "usdc" | "native";
                      setWithdrawMode(next);
                      setWithdrawCustomUsd("");
                      setWithdrawCustomNative("");
                    }}
                  >
                    <SelectTrigger
                      id="withdraw-asset"
                      title="Change asset"
                      className={cn(
                        "h-full min-h-[44px] w-auto min-w-[3.25rem] shrink-0 rounded-none rounded-l-xl border-0 border-r border-border/40 bg-transparent py-0 pl-2 pr-1.5 shadow-none",
                        "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                        "sm:min-h-0 sm:h-10",
                      )}
                      aria-label={`Withdraw ${withdrawMode === "usdc" ? "USDC" : nativeLabel}, open to change`}
                    >
                      <span className="flex items-center gap-1.5">
                        <CoinLogo symbol={withdrawMode === "usdc" ? "USDC" : nativeLabel} size="sm" />
                        <span className="sr-only">
                          <SelectValue />
                        </span>
                      </span>
                    </SelectTrigger>
                    <SelectContent align="start" className="min-w-[10rem]">
                      <SelectItem value="usdc">
                        <span className="flex items-center gap-2">
                          <CoinLogo symbol="USDC" size="sm" />
                          USDC
                        </span>
                      </SelectItem>
                      <SelectItem value="native">
                        <span className="flex items-center gap-2">
                          <CoinLogo symbol={nativeLabel} size="sm" />
                          {nativeLabel}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {withdrawMode === "usdc" ? (
                    <>
                      <Input
                        id="withdraw-amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="Amount"
                        value={withdrawCustomUsd}
                        onChange={(e) => setWithdrawCustomUsd(e.target.value)}
                        className="h-full min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 py-0 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-10 sm:text-sm"
                      />
                      <div className="flex shrink-0 items-center gap-1 pr-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!agentUsdcReadyWithdraw}
                          className="h-8 shrink-0 px-2 text-xs font-semibold"
                          onClick={() => fillWithdrawUsdcFromAgentFraction(0.5)}
                        >
                          50%
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!agentUsdcReadyWithdraw}
                          className="h-8 shrink-0 px-2 text-xs font-semibold"
                          onClick={() => fillWithdrawUsdcFromAgentFraction(1)}
                        >
                          Max
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Input
                        id="withdraw-amount"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="Amount"
                        value={withdrawCustomNative}
                        onChange={(e) => setWithdrawCustomNative(e.target.value)}
                        className="h-full min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 py-0 font-mono text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-10 sm:text-[13px]"
                      />
                      <div className="flex shrink-0 items-center gap-1 pr-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!agentNativeReadyWithdraw}
                          className="h-8 shrink-0 px-2 text-xs font-semibold"
                          onClick={() => fillWithdrawNativeFromAgentFraction(0.5)}
                        >
                          50%
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={!agentNativeReadyWithdraw}
                          className="h-8 shrink-0 px-2 text-xs font-semibold"
                          onClick={() => fillWithdrawNativeFromAgentFraction(1)}
                        >
                          Max
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                {withdrawAmountError ? (
                  <p role="alert" className="text-[11px] leading-snug text-destructive sm:text-xs">
                    {withdrawAmountError}
                  </p>
                ) : null}
              </div>
            )}

            {flowTab === "withdraw" && isBase && (
              <p className="rounded-xl border border-border/50 bg-muted/10 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground sm:px-3 sm:py-2.5 sm:text-sm">
                Moving funds out on Base is not available yet. Use Solana for withdrawals, or add funds above.
              </p>
            )}
              </div>

              {(flowTab === "deposit" || (flowTab === "withdraw" && !isBase)) && (
                <div
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-xl border text-[11px] leading-snug",
                    // Same palette as the Agent / Yours balance strip above (primary + amber, or withdraw flip)
                    flowTab === "deposit" && "border-primary/25 shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.05)]",
                    flowTab === "withdraw" &&
                      "border-emerald-500/20 shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.04)]",
                  )}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[inherit]",
                      flowTab === "deposit" &&
                        "bg-gradient-to-br from-primary/[0.07] via-muted/12 to-amber-500/[0.05]",
                      flowTab === "withdraw" &&
                        "bg-gradient-to-br from-amber-500/[0.06] via-muted/12 to-primary/[0.07]",
                    )}
                  />
                  <div className="relative z-[1] px-2.5 py-2 sm:px-3 sm:py-2.5 sm:text-sm">
                    {flowTab === "deposit" && (
                      <>
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70 sm:text-[11px]">
                          Preview
                        </p>
                        {hasDepositAmount ? (
                          <p className="mt-1 leading-snug text-foreground sm:mt-1.5 sm:leading-relaxed">
                            {depositUsdcHuman > 0 && (
                              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                ${depositUsdcHuman.toFixed(2)} USDC
                              </span>
                            )}
                            {depositUsdcHuman > 0 && depositNativeHuman > 0 && (
                              <span className="mx-1.5 font-medium text-muted-foreground">+</span>
                            )}
                            {depositNativeHuman > 0 && (
                              <span className="font-semibold tabular-nums text-foreground">
                                {depositNativeHuman.toFixed(6)} {nativeLabel}
                              </span>
                            )}
                            <span className="mt-1 block text-[11px] font-normal text-muted-foreground sm:text-xs">
                              {isBase
                                ? "From your wallet to the agent on Base."
                                : "From your wallet to the agent."}
                            </span>
                          </p>
                        ) : (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                            Enter an amount above to preview what will move to the agent.
                          </p>
                        )}
                      </>
                    )}
                    {flowTab === "withdraw" && (
                      <>
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70 sm:text-[11px]">
                          Preview
                        </p>
                        {hasWithdrawAmount ? (
                          <p className="mt-1 leading-snug text-foreground sm:mt-1.5 sm:leading-relaxed">
                            {withdrawUsdcHuman > 0 && (
                              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                                ${withdrawUsdcHuman.toFixed(2)} USDC
                              </span>
                            )}
                            {withdrawNativeHuman > 0 && (
                              <span className="font-semibold tabular-nums text-foreground">
                                {withdrawNativeHuman.toFixed(6)} {nativeLabel}
                              </span>
                            )}
                            <span className="mt-1 block text-[11px] font-normal text-muted-foreground sm:text-xs">
                              From agent to your wallet
                            </span>
                          </p>
                        ) : (
                          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                            Enter an amount above to preview what will move to your wallet.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        <DialogFooter
          className={cn(
            "shrink-0 w-full min-w-0 gap-2 border-t border-border/40 py-2 sm:gap-3 sm:space-x-0 sm:py-2.5",
            "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2 sm:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pt-2.5",
            modalPadX,
          )}
        >
          <Button
            variant="ghost"
            className="h-11 min-h-[44px] w-full rounded-lg px-4 text-muted-foreground hover:text-foreground sm:h-10 sm:min-h-0 sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={submitting || withdrawing}
          >
            Close
          </Button>
          {flowTab === "deposit" ? (
            <Button
              className="h-11 min-h-[44px] w-full min-w-0 rounded-lg px-5 text-sm font-semibold shadow-md shadow-primary/15 sm:h-10 sm:min-h-0 sm:w-auto sm:min-w-[8rem]"
              onClick={() => void handleFuelSubmit()}
              disabled={!canSubmitDeposit}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin shrink-0 mr-2" />
                  Sending…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 shrink-0 mr-2 opacity-90" />
                  Add funds
                </>
              )}
            </Button>
          ) : (
            <Button
              className="h-11 min-h-[44px] w-full min-w-0 rounded-lg px-5 text-sm font-semibold shadow-md shadow-primary/15 sm:h-10 sm:min-h-0 sm:w-auto sm:min-w-[8rem]"
              onClick={() => void handleWithdrawToUserWallet()}
              disabled={!canSubmitWithdraw}
            >
              {withdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin shrink-0 mr-2" />
                  Moving…
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-4 w-4 shrink-0 mr-2 opacity-90" />
                  Move to wallet
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
