import { useState } from 'react';
import {
  X,
  Wallet,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Zap,
  ArrowRight,
  Shield,
  Clock,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentDetails, TransactionStatus, WalletState } from '@/types/api';
import { cn } from '@/lib/utils';
import { useWalletContext } from '@/contexts/WalletContext';
import type { X402PaymentOption } from '@/lib/x402Client';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetails: PaymentDetails;
  wallet: WalletState;
  transactionStatus: TransactionStatus;
  /** Connect for the given chain when called with arg; otherwise uses app's selected chain. Pass chain so modal connects for the correct network (Base vs Solana). */
  /** Open connect flow (chain picker, then Privy). */
  onOpenConnectModal: () => void;
  onPay: () => void;
  onRetry: () => void;
  /** When API offers both Solana and Base, show chain selector */
  paymentOptionsByChain?: { solana: X402PaymentOption | null; base: X402PaymentOption | null };
  selectedPaymentChain?: 'solana' | 'base';
  onSelectPaymentChain?: (chain: 'solana' | 'base') => void;
}

// Step definitions for the payment flow
type PaymentStep = 'connect' | 'review' | 'confirm' | 'complete';

export function PaymentModal({
  isOpen,
  onClose,
  paymentDetails,
  wallet,
  transactionStatus,
  onOpenConnectModal,
  onPay,
  onRetry,
  paymentOptionsByChain: _paymentOptionsByChain,
  selectedPaymentChain: _selectedPaymentChain = 'solana',
  onSelectPaymentChain: _onSelectPaymentChain,
}: PaymentModalProps) {
  const walletContext = useWalletContext();
  const [copiedRecipient, setCopiedRecipient] = useState(false);

  if (!isOpen) return null;

  const isPending = transactionStatus.status === 'pending';
  const isConfirmed = transactionStatus.status === 'confirmed';
  const isFailed = transactionStatus.status === 'failed';

  const isBase = paymentDetails.network?.toLowerCase().includes('base');

  const paymentAmount = parseFloat(paymentDetails.amount) || 0;
  const hasEnoughBalance = isBase
    ? (walletContext.baseUsdcBalance ?? 0) >= paymentAmount
    : paymentDetails.token === 'USDC'
      ? (walletContext.usdcBalance || 0) >= paymentAmount
      : (walletContext.solBalance || 0) >= paymentAmount;
  const walletConnectedForChain = isBase ? walletContext.baseConnected : wallet.connected;
  
  // Check if payment details are valid (has recipient address)
  const hasValidPaymentDetails = paymentDetails.recipient && 
    paymentDetails.recipient !== 'Unknown' && 
    paymentDetails.recipient.length > 10;

  const getCurrentStep = (): PaymentStep => {
    if (!walletConnectedForChain) return 'connect';
    if (isConfirmed) return 'complete';
    if (isPending) return 'confirm';
    return 'review';
  };

  const currentStep = getCurrentStep();

  const steps: { id: PaymentStep; label: string; icon: React.ElementType }[] = [
    { id: 'connect', label: 'Connect', icon: Wallet },
    { id: 'review', label: 'Review', icon: Shield },
    { id: 'confirm', label: 'Confirm', icon: Clock },
    { id: 'complete', label: 'Complete', icon: CheckCircle },
  ];

  const getStepStatus = (stepId: PaymentStep): 'done' | 'current' | 'pending' => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const displayWalletShort = isBase
    ? walletContext.baseShortAddress ?? walletContext.baseAddress
    : walletContext.shortAddress ?? walletContext.address;
  const displayUsdc = isBase ? walletContext.baseUsdcBalance : walletContext.usdcBalance;
  const displayNativeBalance = isBase ? null : walletContext.solBalance;

  const copyRecipient = async () => {
    const addr = paymentDetails.recipient;
    if (!addr || addr === 'Not specified') return;
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedRecipient(true);
      window.setTimeout(() => setCopiedRecipient(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const explorerTxHref =
    transactionStatus.hash &&
    (isBase
      ? `https://basescan.org/tx/${transactionStatus.hash}`
      : `https://explorer.solana.com/tx/${transactionStatus.hash}`);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 animate-in fade-in-0 duration-300 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,hsl(var(--ring)/0.12),transparent_55%),hsl(var(--background)/0.88)] backdrop-blur-xl dark:bg-[radial-gradient(ellipse_100%_60%_at_50%_100%,hsl(var(--primary)/0.06),transparent_45%),hsl(220_14%_4%/0.82)]"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal - scrollable on small screens; safe area padding */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overflow-x-hidden safe-area-inset-top safe-area-inset-bottom pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg sm:max-w-xl glass-panel animate-scale-in overflow-hidden my-auto max-h-[min(calc(100dvh-2rem),calc(100svh-2rem))] flex flex-col min-h-0 rounded-2xl ring-1 ring-border/60 dark:ring-white/[0.07] shadow-2xl relative playground-ambient"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
            aria-hidden
          />

          {/* Header */}
          <div className="relative shrink-0 border-b border-border/80 bg-gradient-to-b from-secondary/40 to-transparent px-5 sm:px-7 pt-5 pb-4 sm:pt-6 sm:pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-lg scale-110" aria-hidden />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-foreground/[0.12] to-transparent shadow-inner dark:from-white/[0.08]">
                    <Zap className="h-5 w-5 text-foreground drop-shadow-sm" strokeWidth={2.25} />
                  </div>
                </div>
                <div className="min-w-0 pt-0.5">
                  <h2
                    id="payment-modal-title"
                    className="text-lg sm:text-xl font-semibold tracking-tight text-foreground leading-tight"
                  >
                    Complete payment
                  </h2>
                  <p className="mt-1.5 max-w-md text-[13px] leading-snug text-muted-foreground sm:max-w-lg">
                    Review the amount and recipient, then authorize in your wallet. Funds move on-chain only when you
                    confirm.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="mt-6 flex w-full items-start justify-between gap-1 px-0.5">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const StepIcon = step.icon;
                const nextPending = index < steps.length - 1 && getStepStatus(steps[index + 1].id) === 'pending';
                const segmentActive = index < steps.length - 1 && !nextPending;

                return (
                  <div key={step.id} className="flex min-w-0 flex-1 items-start last:flex-none last:w-auto">
                    <div className="flex w-full flex-col items-center">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300',
                          status === 'done' &&
                            'border-emerald-500/35 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                          status === 'current' &&
                            'border-primary/25 bg-primary text-primary-foreground shadow-[0_0_0_1px_hsl(var(--background)),0_0_24px_hsl(var(--ring)/0.25)] scale-105',
                          status === 'pending' && 'border-border/80 bg-muted/40 text-muted-foreground',
                        )}
                      >
                        {status === 'done' ? (
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        ) : (
                          <StepIcon
                            className={cn(
                              'h-4 w-4',
                              status === 'current' && step.id === 'confirm' && 'animate-pulse',
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          'mt-2 max-w-[5.25rem] text-center text-[11px] font-medium uppercase tracking-wide leading-tight sm:max-w-[6rem]',
                          status === 'done' && 'text-emerald-600/90 dark:text-emerald-400/90',
                          status === 'current' && 'text-foreground',
                          status === 'pending' && 'text-muted-foreground/80',
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          'mx-1 mt-[1.125rem] h-0.5 min-w-[0.5rem] flex-1 max-w-full rounded-full transition-all duration-500 self-start',
                          segmentActive
                            ? 'bg-gradient-to-r from-emerald-500/50 via-foreground/25 to-muted-foreground/30'
                            : 'bg-muted/80',
                        )}
                        aria-hidden
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-3.5 overflow-y-auto min-h-0 flex-1 px-5 py-4 sm:px-7 sm:py-5">
            {/* Amount */}
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-secondary/50 to-secondary/20 p-5 sm:p-6 shadow-[inset_0_1px_0_hsl(var(--border)/0.35)]">
              <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-ring/12 to-transparent blur-2xl" />
              <div className="pointer-events-none absolute -bottom-12 left-1/2 h-28 w-[120%] -translate-x-1/2 bg-gradient-to-t from-primary/[0.04] to-transparent" />
              <div className="relative">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Payment amount
                </span>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <span className="text-4xl sm:text-[2.75rem] font-semibold tabular-nums tracking-tight gradient-text">
                    {paymentDetails.amount}
                  </span>
                  <span className="text-base sm:text-lg font-medium text-muted-foreground">{paymentDetails.token}</span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-[11px] font-medium backdrop-blur-sm"
                  >
                    {paymentDetails.network}
                  </Badge>
                  {paymentDetails.memo && (
                    <Badge variant="outline" className="rounded-full px-3 py-1 font-mono text-[11px]">
                      {paymentDetails.memo}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Recipient */}
            <div className="rounded-xl border border-border/60 bg-card/30 p-4 sm:p-5 backdrop-blur-sm transition-colors hover:border-border">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/80 border border-border/50">
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-medium text-foreground/90">Recipient</span>
                </div>
                {paymentDetails.recipient && paymentDetails.recipient.length > 10 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={copyRecipient}
                  >
                    {copiedRecipient ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="font-mono text-[12px] sm:text-[13px] leading-relaxed text-foreground/95 break-all">
                {paymentDetails.recipient || 'Not specified'}
              </p>
            </div>
            
            {/* Warning for incomplete payment details */}
            {!hasValidPaymentDetails && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="text-sm text-warning font-medium">Incomplete Payment Details</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The API response does not include valid payment details (x402). Check the 402 body for accepts / pricing.
                  </p>
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {transactionStatus.status !== 'idle' && (
              <div className={cn(
                "p-4 rounded-xl flex items-start gap-3 transition-all duration-300",
                isPending && "bg-warning/10 border border-warning/30",
                isConfirmed && "bg-accent/10 border border-accent/30",
                isFailed && "bg-destructive/10 border border-destructive/30"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isPending && "bg-warning/20",
                  isConfirmed && "bg-accent/20",
                  isFailed && "bg-destructive/20"
                )}>
                  {isPending && <Loader2 className="h-5 w-5 text-warning animate-spin" />}
                  {isConfirmed && <CheckCircle className="h-5 w-5 text-accent" />}
                  {isFailed && <XCircle className="h-5 w-5 text-destructive" />}
                </div>
                
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-semibold",
                    isPending && "text-warning",
                    isConfirmed && "text-accent",
                    isFailed && "text-destructive"
                  )}>
                    {isPending && 'Transaction Processing...'}
                    {isConfirmed && 'Payment Successful!'}
                    {isFailed && 'Transaction Failed'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isPending && 'Please wait while your payment is being confirmed'}
                    {isConfirmed && 'Fetching API data automatically...'}
                    {isFailed && 'Something went wrong. Please try again.'}
                  </p>
                  {explorerTxHref && (
                    <a
                      href={explorerTxHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {isBase ? 'View on Basescan' : 'View on Solana Explorer'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {transactionStatus.error && (
                    <p className="text-xs text-destructive mt-1">{transactionStatus.error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Wallet Connection Notice */}
            {!walletConnectedForChain && (
              <div className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-muted/30 p-4 sm:p-5 backdrop-blur-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/50 bg-background/50">
                  <Wallet className="h-5 w-5 text-foreground/80" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Connect a wallet</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Link your {isBase ? 'Base' : 'Solana'} wallet to review balances and send this payment.
                  </p>
                </div>
              </div>
            )}

            {/* Connected wallet */}
            {walletConnectedForChain && !isPending && !isConfirmed && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-r from-primary/[0.04] to-transparent p-4 transition-colors hover:border-border">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Wallet</p>
                    <p className="mt-0.5 truncate font-mono text-xs text-foreground">{displayWalletShort}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-medium tabular-nums text-foreground">
                      {(displayUsdc ?? 0).toFixed(2)} USDC
                    </p>
                    {!isBase && displayNativeBalance != null && (
                      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {displayNativeBalance.toFixed(4)} SOL
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Insufficient Balance Warning */}
                {!hasEnoughBalance && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                    <div>
                      <p className="text-sm text-destructive font-medium">Insufficient Balance</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You need at least {paymentDetails.amount} {paymentDetails.token} to complete this payment
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0 space-y-2 border-t border-border/50 bg-gradient-to-t from-secondary/20 to-transparent px-5 pb-5 pt-4 sm:px-7 sm:pb-6">
            {!walletConnectedForChain ? (
              <Button
                variant="neon"
                className="glow-primary-hover h-12 w-full gap-2 rounded-xl text-[15px] font-semibold shadow-lg"
                onClick={() => onOpenConnectModal()}
              >
                <Wallet className="h-4 w-4" />
                Connect wallet
                <ArrowRight className="h-4 w-4 opacity-80" />
              </Button>
            ) : isConfirmed ? (
              <Button
                variant="secondary"
                className="h-12 w-full gap-2 rounded-xl text-sm font-semibold"
                disabled
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching API response…
              </Button>
            ) : isFailed ? (
              <Button
                variant="neon"
                className="glow-primary-hover h-12 w-full gap-2 rounded-xl text-[15px] font-semibold shadow-lg"
                onClick={onPay}
              >
                <Zap className="h-4 w-4" />
                Try again
              </Button>
            ) : (
              <Button
                variant="neon"
                className="glow-primary-hover h-12 w-full gap-2 rounded-xl text-[15px] font-semibold shadow-lg"
                onClick={onPay}
                disabled={isPending || !hasEnoughBalance || !hasValidPaymentDetails || !walletConnectedForChain}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : !hasValidPaymentDetails ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Missing Payment Details
                  </>
                ) : !hasEnoughBalance ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Insufficient {paymentDetails.token} Balance
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Pay {paymentDetails.amount} {paymentDetails.token}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              className="h-10 w-full text-sm text-muted-foreground hover:bg-transparent hover:text-foreground hover:underline underline-offset-4"
              onClick={onClose}
              disabled={isPending}
            >
              {isConfirmed ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
