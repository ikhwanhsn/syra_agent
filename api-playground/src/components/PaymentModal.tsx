import { X, Wallet, CheckCircle, XCircle, Loader2, ExternalLink, Zap, ArrowRight, Shield, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentDetails, TransactionStatus, WalletState } from '@/types/api';
import { cn } from '@/lib/utils';
import { useWalletContext } from '@/contexts/WalletContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentDetails: PaymentDetails;
  wallet: WalletState;
  transactionStatus: TransactionStatus;
  onConnectWallet: () => void;
  onPay: () => void;
  onRetry: () => void;
}

// Step definitions for the payment flow
type PaymentStep = 'connect' | 'review' | 'confirm' | 'complete';

export function PaymentModal({
  isOpen,
  onClose,
  paymentDetails,
  wallet,
  transactionStatus,
  onConnectWallet,
  onPay,
  onRetry,
}: PaymentModalProps) {
  const walletContext = useWalletContext();
  
  if (!isOpen) return null;

  const isPending = transactionStatus.status === 'pending';
  const isConfirmed = transactionStatus.status === 'confirmed';
  const isFailed = transactionStatus.status === 'failed';

  // Check if user has enough balance
  const paymentAmount = parseFloat(paymentDetails.amount) || 0;
  const hasEnoughBalance = paymentDetails.token === 'USDC' 
    ? (walletContext.usdcBalance || 0) >= paymentAmount
    : (walletContext.solBalance || 0) >= paymentAmount;
  
  // Check if payment details are valid (has recipient address)
  const hasValidPaymentDetails = paymentDetails.recipient && 
    paymentDetails.recipient !== 'Unknown' && 
    paymentDetails.recipient.length > 10;

  // Determine current step
  const getCurrentStep = (): PaymentStep => {
    if (!wallet.connected) return 'connect';
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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/90 backdrop-blur-md z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-md glass-panel animate-scale-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="relative px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 via-accent/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-purple/80 to-black/60 flex items-center justify-center border border-border/30">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">x402 Payment</h2>
                  <p className="text-xs text-muted-foreground">Secure API access payment</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose} className="h-9 w-9">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-5 px-2">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const StepIcon = step.icon;
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        status === 'done' && "bg-success text-success-foreground",
                        status === 'current' && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                        status === 'pending' && "bg-muted text-muted-foreground"
                      )}>
                        {status === 'done' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <StepIcon className={cn(
                            "h-4 w-4",
                            status === 'current' && step.id === 'confirm' && "animate-pulse"
                          )} />
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-medium mt-1.5",
                        status === 'done' && "text-success",
                        status === 'current' && "text-foreground",
                        status === 'pending' && "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "w-8 h-0.5 mx-1 mb-5 transition-colors duration-300",
                        getStepStatus(steps[index + 1].id) !== 'pending' ? "bg-success" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Amount Card - Always visible */}
            <div className="relative p-5 rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/40 border border-border overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 blur-3xl" />
              <div className="relative">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Payment Amount</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-bold gradient-text">{paymentDetails.amount}</span>
                  <span className="text-lg font-semibold text-foreground">{paymentDetails.token}</span>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <Badge variant="secondary" className="text-xs px-3 py-1.5">{paymentDetails.network}</Badge>
                  {paymentDetails.memo && (
                    <Badge variant="outline" className="text-xs font-mono px-3 py-1.5">{paymentDetails.memo}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Recipient Address</span>
              </div>
              <p className="font-mono text-xs text-foreground break-all leading-relaxed">
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
                    The API response doesn't contain valid x402 payment information. Check the response body for payment instructions.
                  </p>
                </div>
              </div>
            )}

            {/* Transaction Status */}
            {transactionStatus.status !== 'idle' && (
              <div className={cn(
                "p-4 rounded-xl flex items-start gap-3 transition-all duration-300",
                isPending && "bg-warning/10 border border-warning/30",
                isConfirmed && "bg-success/10 border border-success/30",
                isFailed && "bg-destructive/10 border border-destructive/30"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isPending && "bg-warning/20",
                  isConfirmed && "bg-success/20",
                  isFailed && "bg-destructive/20"
                )}>
                  {isPending && <Loader2 className="h-5 w-5 text-warning animate-spin" />}
                  {isConfirmed && <CheckCircle className="h-5 w-5 text-success" />}
                  {isFailed && <XCircle className="h-5 w-5 text-destructive" />}
                </div>
                
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-semibold",
                    isPending && "text-warning",
                    isConfirmed && "text-success",
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
                  {transactionStatus.hash && (
                    <a 
                      href={`https://explorer.solana.com/tx/${transactionStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 font-medium"
                    >
                      View on Solana Explorer
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
            {!wallet.connected && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Wallet Required</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect your Solana wallet to continue</p>
                </div>
              </div>
            )}

            {/* Connected Wallet Info */}
            {wallet.connected && !isPending && !isConfirmed && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-success/5 border border-success/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-success font-medium">Wallet Connected</p>
                    <p className="text-xs font-mono text-muted-foreground truncate">{walletContext.address}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-foreground">{walletContext.usdcBalance?.toFixed(2) || '0'} USDC</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{walletContext.solBalance?.toFixed(4) || '0'} SOL</p>
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
          <div className="p-5 pt-0 space-y-3">
            {!wallet.connected ? (
              <Button variant="neon" className="w-full h-11 gap-2 text-sm font-semibold" onClick={onConnectWallet}>
                <Wallet className="h-4 w-4" />
                Connect Wallet
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : isConfirmed ? (
              <Button variant="success" className="w-full h-11 gap-2 text-sm font-semibold" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching API Response...
              </Button>
            ) : isFailed ? (
              <Button variant="neon" className="w-full h-11 gap-2 text-sm font-semibold" onClick={onPay}>
                <Zap className="h-4 w-4" />
                Try Again
              </Button>
            ) : (
              <Button 
                variant="neon" 
                className="w-full h-11 gap-2 text-sm font-semibold" 
                onClick={onPay}
                disabled={isPending || !hasEnoughBalance || !hasValidPaymentDetails}
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
              className="w-full h-10 text-sm text-muted-foreground hover:text-foreground" 
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
