import { useState, useCallback, useEffect } from "react";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
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
import { Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useToast } from "@/hooks/use-toast";

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
  const { agentAddress, refetchBalance, connectedChain } = useAgentWallet();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(1);
  const [customAmount, setCustomAmount] = useState("");
  const [userSolBalance, setUserSolBalance] = useState<number | null>(null);
  const [userUsdcBalance, setUserUsdcBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1.5">
          <DialogTitle>Fuel the agent</DialogTitle>
          <DialogDescription>
            {isBase
              ? "Add USDC (for paid tools) and ETH (for fees) to your agent wallet on Base. Choose an amount—you'll deposit the same dollar amount in USDC and in ETH."
              : "Add USDC (for paid tools) and SOL (for fees) to your agent wallet. Choose an amount—you'll deposit the same dollar amount in USDC and in SOL."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4 space-y-4">
          {/* Your wallet balance */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1.5">
            <p className="font-medium text-foreground">Your wallet balance</p>
            {balanceLoadingDisplay ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Loading…</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-muted-foreground">
                <span className={cn(usdcBalanceDisplay != null && usdcBalanceDisplay > 0 && "font-medium text-emerald-600 dark:text-emerald-400")}>
                  USDC: ${usdcBalanceDisplay != null ? usdcBalanceDisplay.toFixed(2) : "—"}
                </span>
                <span>{nativeLabel}: {formatBalance(nativeBalance)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Amount</p>
            <div className="flex gap-2">
              {PRESET_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={selectedPreset === value ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePreset(value)}
                >
                  ${value}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground shrink-0">Custom</span>
              <Input
                type="number"
                min={0}
                step={0.5}
                placeholder="0"
                value={customAmount}
                onFocus={handleCustomFocus}
                onChange={handleCustomChange}
                className={cn(
                  "h-9",
                  selectedPreset == null && customAmount !== "" && "ring-2 ring-primary"
                )}
              />
            </div>
          </div>

          {hasAmount && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground mb-1">You’ll add</p>
              <p className="text-muted-foreground">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  ${amountUsd.toFixed(2)} USDC
                </span>
                {" + "}
                <span className="font-medium text-foreground">
                  ${amountUsd.toFixed(2)} {nativeLabel}
                </span>
                <span className="text-muted-foreground"> (same value in {nativeLabel} for network fees)</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-0 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Close
          </Button>
          <Button onClick={handleFuelSubmit} disabled={!canSubmit}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin shrink-0 mr-2" />
                Sending…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 shrink-0 mr-2" />
                Fuel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
