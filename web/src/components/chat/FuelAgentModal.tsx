import { useState, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWalletContext } from "@/contexts/WalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { resolveAgentTreasuryBalance } from "@/lib/agentWalletBalanceDisplay";
import { agentWalletApi } from "@/lib/chatApi";
import { getSyraSessionWallet, ensureAccessTokenForWallet } from "@/lib/agentAuthApi";
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
import { ArrowDownToLine, Check, Copy, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { AgentTreasuryBalanceRail } from "@/components/chat/AgentTreasuryBalanceRail";
import { AgentWalletSwitcher } from "@/components/chat/AgentWalletSwitcher";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useToast } from "@/hooks/use-toast";
import {
  AGENT_WALLET_ACCENT,
  getAgentWalletSlot,
  shortenAgentAddress,
  type AgentWalletPurpose,
} from "@/lib/agentWalletCatalog";

const LAMPORTS_PER_SOL = 1e9;
const USDC_MINT_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_DECIMALS = 6;
/** Matches api/libs/agentWalletWithdrawSol.js TX_FEE_BUFFER_LAMPORTS (80_000). */
const AGENT_SOL_WITHDRAW_FEE_BUFFER = 80_000 / LAMPORTS_PER_SOL;
/** Above Dialog (`z-[250]`) so asset pickers stay clickable inside the modal. */
const MODAL_SELECT_CONTENT_CLASS = "z-[300] min-w-[10rem]";

function isRadixSelectPortalTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("[data-radix-select-content]") != null;
}

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
    return `You have ${params.nativeBalance.toFixed(4)} ${params.nativeLabel} in your wallet. Lower the amount.`;
  }
  return null;
}

function maxAgentSolWithdrawable(balance: number | null | undefined): number | null {
  if (balance == null || !Number.isFinite(balance)) return null;
  const max = balance - AGENT_SOL_WITHDRAW_FEE_BUFFER;
  return max > 0 ? max : 0;
}

function getWithdrawAmountError(params: {
  flowTab: "deposit" | "withdraw";
  hasWithdrawAmount: boolean;
  withdrawMode: "usdc" | "native";
  withdrawUsdcHuman: number;
  withdrawNativeHuman: number;
  agentUsdcDisplay: number | null | undefined;
  agentSolBalance: number | null | undefined;
  nativeLabel: string;
}): string | null {
  if (params.flowTab !== "withdraw") return null;
  if (!params.hasWithdrawAmount) return null;
  if (params.withdrawMode === "usdc") {
    if (params.agentUsdcDisplay == null || !Number.isFinite(params.agentUsdcDisplay)) return null;
    if (params.withdrawUsdcHuman > params.agentUsdcDisplay + 1e-6) {
      return `The agent only has $${params.agentUsdcDisplay.toFixed(2)} USDC.`;
    }
    return null;
  }
  if (params.agentSolBalance == null || !Number.isFinite(params.agentSolBalance)) return null;
  const maxSol = maxAgentSolWithdrawable(params.agentSolBalance);
  if (maxSol == null) return null;
  if (params.withdrawNativeHuman > maxSol + 1e-8) {
    return `The agent only has about ${params.agentSolBalance.toFixed(4)} ${params.nativeLabel} (max withdraw ~${maxSol.toFixed(4)} after fees).`;
  }
  return null;
}

export interface FuelAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which flow to show when the dialog opens (e.g. from wallet menu shortcuts). */
  initialFlowTab?: "deposit" | "withdraw";
  /** Which agent treasury to focus when opened (chat, LP, …). */
  initialAgentWallet?: AgentWalletPurpose;
  /**
   * @deprecated Prefer `initialAgentWallet`. Locks deposit target to a specific address.
   */
  depositAgentAddress?: string | null;
  /** @deprecated Prefer `initialAgentWallet`. */
  depositAnonymousId?: string | null;
  /** @deprecated Called after deposit when using legacy LP override props. */
  onDepositComplete?: () => void;
  /** @deprecated Prefer switching wallets in-modal. */
  walletLabel?: string;
  /** Inline page layout instead of dialog overlay. */
  variant?: "modal" | "page";
  /** On wallet page: hide duplicate title block (parent supplies section heading). */
  pageEmbed?: boolean;
}

export function FuelAgentModal({
  open,
  onOpenChange,
  initialFlowTab = "deposit",
  initialAgentWallet = "chat",
  depositAgentAddress,
  depositAnonymousId,
  onDepositComplete,
  walletLabel,
  variant = "modal",
  pageEmbed = false,
}: FuelAgentModalProps) {
  const {
    connection,
    publicKey,
    address: connectedAddress,
    sendTransaction,
    solBalance,
    usdcBalance,
    refreshSolanaBalances,
  } = useWalletContext();
  const {
    agentAddress,
    anonymousId,
    agentSolBalance,
    agentUsdcBalance,
    lpAgentAddress,
    lpAnonymousId,
    lpAgentSolBalance,
    lpAgentUsdcBalance,
    refetchBalance,
    refetchLpBalance,
    reportDebit,
    reportNativeDebit,
  } = useAgentWallet();
  const { syraAuthReady, syraAuthenticated, requestSyraAuth } = useSyraAuth();

  const [selectedWallet, setSelectedWallet] = useState<AgentWalletPurpose>(initialAgentWallet);
  const isPage = variant === "page";
  const isPageEmbed = isPage && pageEmbed;
  const isActive = isPage || open;

  const lockedPurpose = useMemo((): AgentWalletPurpose | "external" | null => {
    if (!depositAgentAddress) return null;
    if (depositAgentAddress === lpAgentAddress) return "lp";
    if (depositAgentAddress === agentAddress) return "chat";
    return "external";
  }, [depositAgentAddress, agentAddress, lpAgentAddress]);

  const availableWallets = useMemo((): AgentWalletPurpose[] => {
    const out: AgentWalletPurpose[] = [];
    if (agentAddress) out.push("chat");
    if (lpAgentAddress) out.push("lp");
    return out;
  }, [agentAddress, lpAgentAddress]);

  const activePurpose: AgentWalletPurpose = useMemo(() => {
    if (lockedPurpose === "chat" || lockedPurpose === "lp") return lockedPurpose;
    if (availableWallets.includes(selectedWallet)) return selectedWallet;
    return availableWallets[0] ?? "chat";
  }, [lockedPurpose, availableWallets, selectedWallet]);

  const activeAddress = activePurpose === "lp" ? lpAgentAddress : agentAddress;
  const activeAnonymousId = activePurpose === "lp" ? lpAnonymousId : anonymousId;

  const walletQueriesEnabled = syraAuthReady && syraAuthenticated;

  const chatBalanceQ = useQuery({
    queryKey: ["agent-wallet-balance", anonymousId],
    queryFn: () => agentWalletApi.getBalance(anonymousId!),
    enabled: isActive && Boolean(anonymousId) && walletQueriesEnabled,
    staleTime: 45_000,
    retry: 1,
  });

  const lpBalanceQ = useQuery({
    queryKey: ["agent-wallet-balance", lpAnonymousId],
    queryFn: () => agentWalletApi.getBalance(lpAnonymousId!),
    enabled: isActive && Boolean(lpAnonymousId) && walletQueriesEnabled,
    staleTime: 45_000,
    retry: 1,
  });

  const chatSolResolved = resolveAgentTreasuryBalance(
    true,
    agentSolBalance,
    chatBalanceQ.data?.solBalance,
  );
  const chatUsdcResolved = resolveAgentTreasuryBalance(
    true,
    agentUsdcBalance,
    chatBalanceQ.data?.usdcBalance,
  );
  const lpSolResolved = resolveAgentTreasuryBalance(true, lpAgentSolBalance, lpBalanceQ.data?.solBalance);
  const lpUsdcResolved = resolveAgentTreasuryBalance(true, lpAgentUsdcBalance, lpBalanceQ.data?.usdcBalance);

  const activeSolBalance = activePurpose === "lp" ? lpSolResolved : chatSolResolved;
  const activeUsdcBalance = activePurpose === "lp" ? lpUsdcResolved : chatUsdcResolved;

  const isLockedExternal = lockedPurpose === "external";
  const targetAgentAddress = isLockedExternal ? depositAgentAddress : activeAddress;
  const targetAnonymousId = isLockedExternal ? depositAnonymousId : activeAnonymousId;
  const isExternalTarget = isLockedExternal;
  const showWalletSwitcher = !isLockedExternal && availableWallets.length > 1;
  const activeSlot = getAgentWalletSlot(activePurpose);
  const activeAccent = AGENT_WALLET_ACCENT[activePurpose];
  const displayWalletLabel = walletLabel ?? activeSlot.label;
  const { toast } = useToast();
  const [addressCopied, setAddressCopied] = useState(false);

  const walletSwitcherBalances = useMemo(
    () => ({
      chat: agentAddress != null ? { sol: chatSolResolved, usdc: chatUsdcResolved } : undefined,
      lp: lpAgentAddress != null ? { sol: lpSolResolved, usdc: lpUsdcResolved } : undefined,
    }),
    [
      agentAddress,
      chatSolResolved,
      chatUsdcResolved,
      lpAgentAddress,
      lpSolResolved,
      lpUsdcResolved,
    ],
  );

  useEffect(() => {
    if (!isActive) return;
    void refreshSolanaBalances();
    if (!syraAuthenticated) return;
    void refetchBalance();
    void refetchLpBalance();
  }, [isActive, syraAuthenticated, refreshSolanaBalances, refetchBalance, refetchLpBalance]);
  /** USDC vs native SOL. */
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
    if (!isActive) {
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
  }, [isActive]);

  const depositUsdcHuman = depositMode === "native" ? 0 : parseAmountInput(customUsd);
  const depositNativeHuman = depositMode === "native" ? parseAmountInput(customNative) : 0;
  const withdrawUsdcHuman = withdrawMode === "native" ? 0 : parseAmountInput(withdrawCustomUsd);
  const withdrawNativeHuman = withdrawMode === "native" ? parseAmountInput(withdrawCustomNative) : 0;

  const runAgentBalanceRefresh = useCallback(async () => {
    if (isLockedExternal) {
      onDepositComplete?.();
      return;
    }
    await refreshSolanaBalances();
    if (activePurpose === "lp") {
      await refetchLpBalance();
      await lpBalanceQ.refetch();
    } else {
      await refetchBalance();
      await chatBalanceQ.refetch();
    }
  }, [
    activePurpose,
    chatBalanceQ,
    isLockedExternal,
    lpBalanceQ,
    onDepositComplete,
    refetchBalance,
    refetchLpBalance,
    refreshSolanaBalances,
  ]);

  useEffect(() => {
    if (isActive) {
      const preferred =
        lockedPurpose === "chat" || lockedPurpose === "lp"
          ? lockedPurpose
          : availableWallets.includes(initialAgentWallet)
            ? initialAgentWallet
            : (availableWallets[0] ?? "chat");
      setSelectedWallet(preferred);
      setFlowTab(isExternalTarget ? "deposit" : initialFlowTab);
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
  }, [isActive, initialFlowTab, isExternalTarget, initialAgentWallet, lockedPurpose, availableWallets]);

  const buildSolanaTx = useCallback(async () => {
    if (!publicKey || !targetAgentAddress) return null;
    const agentPubkey = new PublicKey(targetAgentAddress);
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
    targetAgentAddress,
    publicKey,
    connection,
  ]);

  const handleFuelSubmit = useCallback(async () => {
    if (!targetAgentAddress || (depositUsdcHuman <= 0 && depositNativeHuman <= 0)) return;
    const depositErr = getDepositAmountError({
      flowTab: "deposit",
      hasDepositAmount: depositUsdcHuman > 0 || depositNativeHuman > 0,
      depositMode,
      depositUsdcHuman,
      depositNativeHuman,
      usdcBalanceDisplay: usdcBalance,
      nativeBalance: solBalance,
      nativeLabel: "SOL",
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
      if (publicKey && sendTransaction) {
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
    targetAgentAddress,
    publicKey,
    sendTransaction,
    buildSolanaTx,
    toast,
    runAgentBalanceRefresh,
    refreshSolanaBalances,
    depositMode,
    usdcBalance,
    solBalance,
  ]);

  const linkedWithdrawAddress = useMemo(() => {
    const session = getSyraSessionWallet();
    if (session?.address) return session.address;
    return connectedAddress ?? publicKey?.toBase58() ?? null;
  }, [connectedAddress, publicKey]);

  const handleWithdrawToUserWallet = useCallback(async () => {
    if (!targetAnonymousId) {
      toast({
        title: "Agent wallet unavailable",
        description: "Could not resolve the agent treasury. Refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    if (!linkedWithdrawAddress) {
      toast({
        title: "Connect wallet",
        description: "Connect your Solana wallet to withdraw agent funds to it.",
        variant: "destructive",
      });
      return;
    }
    if (!syraAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Approve the wallet sign-in prompt to authorize withdrawals.",
        variant: "destructive",
      });
      void requestSyraAuth();
      return;
    }
    const token = await ensureAccessTokenForWallet(linkedWithdrawAddress);
    if (!token) {
      toast({
        title: "Session expired",
        description: "Sign in with your wallet again, then retry the withdrawal.",
        variant: "destructive",
      });
      void requestSyraAuth();
      return;
    }
    if (connectedAddress && connectedAddress !== linkedWithdrawAddress) {
      toast({
        title: "Wallet mismatch",
        description:
          "Your connected wallet does not match your Syra session. Disconnect and reconnect the same wallet you used to sign in.",
        variant: "destructive",
      });
      return;
    }
    const hasW = withdrawUsdcHuman > 0 || withdrawNativeHuman > 0;
    const withdrawErr = getWithdrawAmountError({
      flowTab: "withdraw",
      hasWithdrawAmount: hasW,
      withdrawMode,
      withdrawUsdcHuman,
      withdrawNativeHuman,
      agentUsdcDisplay: activeUsdcBalance,
      agentSolBalance: activeSolBalance,
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
        targetAnonymousId,
        linkedWithdrawAddress,
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
      const friendly =
        message === "user_confirmation_required"
          ? "This withdrawal needs extra confirmation. Try a smaller amount or contact support."
          : message === "Withdraw only to your linked wallet."
            ? "Withdrawals must go to the wallet linked to your Syra account. Reconnect that wallet and try again."
            : message === "Connect your Solana wallet in Syra before withdrawing."
              ? "Sign in with your Solana wallet before withdrawing from this agent treasury."
              : message === "Nothing to withdraw"
                ? withdrawMode === "native"
                  ? "The agent keeps a small SOL reserve for fees. Try withdrawing USDC or a lower SOL amount."
                  : "The agent treasury has no withdrawable USDC for that amount."
                : message;
      toast({
        title: "Withdraw failed",
        description: friendly,
        variant: "destructive",
      });
    } finally {
      setWithdrawing(false);
    }
    // Optimistic agent balances + linked-wallet refresh (reportDebit/reportNativeDebit schedule refetchBalance.)
    if (withdrawSignature) {
      if (activePurpose === "lp") {
        void refetchLpBalance();
      } else if (withdrawMode === "usdc" && withdrawUsdcHuman > 0) {
        reportDebit(withdrawUsdcHuman);
      } else if (withdrawMode === "native" && withdrawNativeHuman > 0) {
        reportNativeDebit(withdrawNativeHuman);
      }
      void refreshSolanaBalances();
    }
  }, [
    targetAnonymousId,
    activePurpose,
    linkedWithdrawAddress,
    connectedAddress,
    syraAuthenticated,
    requestSyraAuth,
    reportDebit,
    reportNativeDebit,
    refetchLpBalance,
    refreshSolanaBalances,
    toast,
    withdrawMode,
    withdrawUsdcHuman,
    withdrawNativeHuman,
    activeUsdcBalance,
    activeSolBalance,
  ]);

  const hasDepositAmount = depositUsdcHuman > 0 || depositNativeHuman > 0;
  const hasWithdrawAmount = withdrawUsdcHuman > 0 || withdrawNativeHuman > 0;

  const formatBalance = (v: number | null | undefined) =>
    v == null ? "—" : v.toFixed(4);

  const nativeLabel = "SOL";
  const nativeBalance = solBalance;
  const usdcBalanceDisplay = usdcBalance;

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
      setCustomNative(Number(v.toFixed(5)).toString());
    },
    [nativeBalance, nativeLabel, toast],
  );

  const walletUsdcReady = usdcBalanceDisplay != null && usdcBalanceDisplay > 0;
  const walletNativeReady = nativeBalance != null && nativeBalance > 0;

  const agentNativeBalance = activeSolBalance;
  const agentUsdcDisplay = activeUsdcBalance;

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
      const max = maxAgentSolWithdrawable(b);
      if (max == null || max <= 0) {
        toast({
          title: `No ${nativeLabel} on agent`,
          description: `The agent wallet has no ${nativeLabel} to withdraw.`,
          variant: "destructive",
        });
        return;
      }
      const v = fraction === 1 ? max : max * 0.5;
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
    ],
  );

  const withdrawAmountError = useMemo(
    () =>
      getWithdrawAmountError({
        flowTab,
        hasWithdrawAmount,
        withdrawMode,
        withdrawUsdcHuman,
        withdrawNativeHuman,
        agentUsdcDisplay,
        agentSolBalance: agentNativeBalance,
        nativeLabel,
      }),
    [
      flowTab,
      hasWithdrawAmount,
      withdrawMode,
      withdrawUsdcHuman,
      withdrawNativeHuman,
      agentUsdcDisplay,
      agentNativeBalance,
      nativeLabel,
    ],
  );

  const canSubmitDeposit =
    hasDepositAmount &&
    !depositAmountError &&
    !!targetAgentAddress &&
    !submitting &&
    !!publicKey &&
    !!sendTransaction;
  const canSubmitWithdraw =
    !isExternalTarget &&
    hasWithdrawAmount &&
    !withdrawAmountError &&
    !!targetAnonymousId &&
    !!activeAddress &&
    !!linkedWithdrawAddress &&
    syraAuthReady &&
    syraAuthenticated &&
    !withdrawing &&
    !submitting;

  const modalPadX = "px-4 min-[380px]:px-5 sm:px-6";
  const modalPadAfter =
    "after:left-4 after:right-4 min-[380px]:after:left-5 min-[380px]:after:right-5 sm:after:left-6 sm:after:right-6";
  const shellClassName = cn(
    "flex min-h-0 w-full flex-col gap-0 overflow-x-hidden rounded-2xl border-border/50 bg-card p-0 sm:rounded-2xl",
    isPage
      ? "overflow-y-auto border border-border/50 shadow-sm"
      : "min-h-0 flex-1 overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-white/[0.08] dark:shadow-black/40",
  );

  const modalDialogClassName = cn(
    "flex w-[calc(100vw-1.25rem)] max-w-[min(44rem,calc(100vw-1.25rem))] max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem))] flex-col gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:rounded-2xl",
  );

  const panel = (
    <div className={cn(shellClassName, isPage ? "w-full" : "h-full min-h-0 w-full")}>
        <DialogHeader
          className={cn(
            "relative shrink-0 space-y-4 pb-4 text-left",
            isPageEmbed ? "pt-5" : isPage ? "pt-4" : "pt-[max(1rem,env(safe-area-inset-top,0px))] pr-10 min-[380px]:pr-11 sm:pr-12",
            modalPadX,
            !isPageEmbed &&
              "after:pointer-events-none after:absolute after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border/60 after:to-transparent",
            !isPageEmbed && modalPadAfter,
          )}
        >
          {!isPageEmbed ? (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                Treasury
              </p>
              {isPage ? (
                <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Move funds
                </h2>
              ) : (
                <DialogTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  Move funds
                </DialogTitle>
              )}
              {isPage ? (
                <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                  {isExternalTarget
                    ? "Deposit SOL or USDC into this dedicated agent wallet from your connected Solana wallet."
                    : showWalletSwitcher
                      ? `Manage ${displayWalletLabel.toLowerCase()} — deposit from your wallet or withdraw back anytime.`
                      : "Deposit from your Solana wallet or withdraw back to the same connected wallet."}
                </p>
              ) : (
                <DialogDescription className="max-w-md text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                  {isExternalTarget
                    ? "Deposit SOL or USDC into this dedicated agent wallet from your connected Solana wallet."
                    : showWalletSwitcher
                      ? `Manage ${displayWalletLabel.toLowerCase()} — deposit from your wallet or withdraw back anytime.`
                      : "Deposit from your Solana wallet or withdraw back to the same connected wallet."}
                </DialogDescription>
              )}
            </div>
          ) : null}

          {showWalletSwitcher ? (
            <AgentWalletSwitcher
              value={activePurpose}
              onChange={setSelectedWallet}
              available={availableWallets}
              balances={walletSwitcherBalances}
            />
          ) : (
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                activeAccent.pill,
              )}
            >
              {displayWalletLabel}
            </div>
          )}

          {activeAddress && !isLockedExternal ? (
            <button
              type="button"
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-muted/35",
                activeAccent.border,
              )}
              onClick={() => {
                void navigator.clipboard?.writeText(activeAddress).then(
                  () => {
                    setAddressCopied(true);
                    window.setTimeout(() => setAddressCopied(false), 2000);
                  },
                  () => undefined,
                );
              }}
            >
              <span className="min-w-0">
                <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
                  Agent address
                </span>
                <span className="mt-0.5 block truncate font-mono text-xs text-foreground sm:text-[13px]">
                  {shortenAgentAddress(activeAddress)}
                </span>
              </span>
              {addressCopied ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100" aria-hidden />
              )}
            </button>
          ) : null}
        </DialogHeader>

        <div
          className={cn(
            "min-h-0 min-w-0 flex flex-1 flex-col",
            isPage ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
          )}
        >
          <div ref={fuelBodyShellRef} className="overflow-hidden will-change-[height]">
            <div ref={fuelBodyMeasureRef} className={cn("flex flex-col gap-4 pb-2", modalPadX)}>
            <AgentTreasuryBalanceRail
              flowTab={flowTab}
              purpose={activePurpose}
              agentUsdc={agentUsdcDisplay}
              agentSol={agentNativeBalance}
              walletUsdc={usdcBalanceDisplay}
              walletSol={nativeBalance}
              nativeLabel={nativeLabel}
              flowAnimKey={flowTab === "deposit" ? depositFlowAnimKey : withdrawFlowAnimKey}
            />

            <div className="grid min-w-0 shrink-0 grid-cols-2 gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setFlowTab("deposit");
                  setDepositFlowAnimKey((k) => k + 1);
                }}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-3.5",
                  flowTab === "deposit"
                    ? "border-primary/30 bg-primary/[0.05] shadow-sm ring-1 ring-primary/15"
                    : "border-border/45 bg-muted/15 hover:border-border/60 hover:bg-muted/25",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 sm:h-10 sm:w-10">
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
                onClick={() => {
                  setFlowTab("withdraw");
                  setWithdrawFlowAnimKey((k) => k + 1);
                }}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-3.5",
                  flowTab === "withdraw"
                    ? "border-emerald-500/25 bg-emerald-500/[0.04] shadow-sm ring-1 ring-emerald-500/15"
                    : "border-border/45 bg-muted/15 hover:border-border/60 hover:bg-muted/25",
                  isExternalTarget && "pointer-events-none opacity-45",
                )}
                disabled={isExternalTarget}
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 sm:h-10 sm:w-10">
                    <ArrowDownToLine className="h-4 w-4 text-emerald-600 dark:text-emerald-400 sm:h-[18px] sm:w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[13px] font-semibold tracking-tight text-foreground sm:text-sm">Move out</p>
                    <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                      From the agent to your wallet
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
                  <div className="relative z-10 shrink-0">
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
                    <SelectContent align="start" className={MODAL_SELECT_CONTENT_CLASS}>
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
                  </div>
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

            {flowTab === "withdraw" && (
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
                  <div className="relative z-10 shrink-0">
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
                    <SelectContent align="start" className={MODAL_SELECT_CONTENT_CLASS}>
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
                  </div>
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

              </div>

              {(flowTab === "deposit" || flowTab === "withdraw") && (
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
                              From your Solana wallet to the agent.
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
            "shrink-0 w-full min-w-0 gap-2 border-t border-border/40 bg-muted/10 py-2 sm:gap-3 sm:space-x-0 sm:py-3",
            "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2 sm:pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pt-3",
            modalPadX,
          )}
        >
          {!isPage ? (
            <Button
              variant="ghost"
              className="h-11 min-h-[44px] w-full rounded-xl px-4 text-muted-foreground hover:bg-muted/40 hover:text-foreground sm:h-10 sm:min-h-0 sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={submitting || withdrawing}
            >
              Close
            </Button>
          ) : null}
          {flowTab === "deposit" ? (
            <Button
              className="h-11 min-h-[44px] w-full min-w-0 rounded-xl px-5 text-sm font-semibold shadow-lg shadow-primary/20 sm:h-10 sm:min-h-0 sm:w-auto sm:min-w-[9rem]"
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
              className="h-11 min-h-[44px] w-full min-w-0 rounded-xl px-5 text-sm font-semibold shadow-lg shadow-emerald-500/15 sm:h-10 sm:min-h-0 sm:w-auto sm:min-w-[9rem]"
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
    </div>
  );

  if (isPage) {
    return panel;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={modalDialogClassName}
        onPointerDownOutside={(e) => {
          if (isRadixSelectPortalTarget(e.target)) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isRadixSelectPortalTarget(e.target)) e.preventDefault();
        }}
      >
        {panel}
      </DialogContent>
    </Dialog>
  );
}
