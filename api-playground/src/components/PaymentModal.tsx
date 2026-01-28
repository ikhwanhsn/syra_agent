import { useState } from 'react';
import { X, Wallet, CheckCircle, XCircle, Loader2, ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentDetails, TransactionStatus, WalletState } from '@/types/api';
import { cn } from '@/lib/utils';

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
  if (!isOpen) return null;

  const isPending = transactionStatus.status === 'pending';
  const isConfirmed = transactionStatus.status === 'confirmed';
  const isFailed = transactionStatus.status === 'failed';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="w-full max-w-md glass-panel animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">Payment Required</h2>
                <p className="text-xs text-muted-foreground">x402 Payment Protocol</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Payment Details */}
            <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount</span>
                <div className="text-right">
                  <span className="text-xl font-bold gradient-text">
                    {paymentDetails.amount}
                  </span>
                  <span className="ml-2 text-sm font-medium text-foreground">
                    {paymentDetails.token}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network</span>
                <Badge variant="secondary">{paymentDetails.network}</Badge>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Recipient</span>
                <p className="font-mono text-xs text-foreground mt-1 break-all">
                  {paymentDetails.recipient}
                </p>
              </div>

              {paymentDetails.memo && (
                <div className="pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Memo</span>
                  <p className="text-sm text-foreground mt-1">{paymentDetails.memo}</p>
                </div>
              )}
            </div>

            {/* Transaction Status */}
            {transactionStatus.status !== 'idle' && (
              <div className={cn(
                "p-3 rounded-lg flex items-center gap-3",
                isPending && "bg-warning/10 border border-warning/30",
                isConfirmed && "bg-success/10 border border-success/30",
                isFailed && "bg-destructive/10 border border-destructive/30"
              )}>
                {isPending && <Loader2 className="h-5 w-5 text-warning animate-spin" />}
                {isConfirmed && <CheckCircle className="h-5 w-5 text-success" />}
                {isFailed && <XCircle className="h-5 w-5 text-destructive" />}
                
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    isPending && "text-warning",
                    isConfirmed && "text-success",
                    isFailed && "text-destructive"
                  )}>
                    {isPending && 'Transaction Pending...'}
                    {isConfirmed && 'Payment Confirmed!'}
                    {isFailed && 'Transaction Failed'}
                  </p>
                  {transactionStatus.hash && (
                    <a 
                      href={`https://explorer.solana.com/tx/${transactionStatus.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5"
                    >
                      View on Explorer
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {transactionStatus.error && (
                    <p className="text-xs text-destructive mt-0.5">{transactionStatus.error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Wallet Status */}
            {!wallet.connected && (
              <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Connect your wallet to continue
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-2">
            {!wallet.connected ? (
              <Button variant="neon" className="w-full" onClick={onConnectWallet}>
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            ) : isConfirmed ? (
              <Button variant="success" className="w-full" onClick={onRetry}>
                <CheckCircle className="h-4 w-4" />
                Retry Request
              </Button>
            ) : isFailed ? (
              <Button variant="neon" className="w-full" onClick={onPay}>
                Try Again
              </Button>
            ) : (
              <Button 
                variant="neon" 
                className="w-full" 
                onClick={onPay}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {paymentDetails.amount} {paymentDetails.token}
                  </>
                )}
              </Button>
            )}
            
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
