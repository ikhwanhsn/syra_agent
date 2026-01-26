import { X, Wallet, Coins, LogOut, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useState } from 'react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { isConnected, walletAddress, syraBalance, solBalance, disconnect, connect } = useWallet();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleConnect = () => {
    connect();
    onClose();
  };

  const handleDisconnect = () => {
    disconnect();
    onClose();
  };

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1_000_000) {
      return `${(balance / 1_000_000).toFixed(1)}M`;
    }
    return balance.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card w-full max-w-md p-6 animate-scale-in shadow-[0_0_40px_hsl(270_70%_60%/0.3)]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 hover:rotate-90 rounded-lg p-1 hover:bg-secondary/50"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-6 gradient-text">
          {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
        </h2>

        {isConnected ? (
          <div className="space-y-4">
            {/* Wallet Address */}
            <div className="bg-secondary/50 rounded-lg p-4 border border-border/50 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_hsl(270_70%_60%/0.2)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_hsl(270_70%_60%/0.4)]">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Connected</p>
                    <p className="font-semibold font-mono text-sm">{walletAddress}</p>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-secondary rounded-lg transition-all duration-300 hover:scale-110"
                  aria-label="Copy address"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-status-active animate-scale-in" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-4 border border-border/50 transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_15px_hsl(190_90%_50%/0.2)] hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm text-muted-foreground">SOL Balance</span>
                </div>
                <p className="text-xl font-bold text-accent">{solBalance} SOL</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 border border-border/50 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_hsl(270_70%_60%/0.2)] hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_8px_hsl(270_70%_60%/0.5)]" />
                  <span className="text-sm text-muted-foreground">$SYRA</span>
                </div>
                <p className="text-xl font-bold text-primary">{formatBalance(syraBalance)}</p>
              </div>
            </div>

            {/* SYRA Tier */}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_hsl(270_70%_60%/0.3)]">
              <p className="text-sm text-muted-foreground mb-2">Your Tier</p>
              <p className="font-semibold text-primary text-lg">
                {syraBalance >= 10_000_000
                  ? '🔥 Unlimited Events/Day'
                  : syraBalance >= 1_000_000
                  ? '⭐ 5 Events/Day'
                  : '📊 3 Events/Day'}
              </p>
            </div>

            {/* Disconnect Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDisconnect}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-center mb-6">
              Connect your Solana wallet to start predicting and winning SOL.
            </p>

            {/* Wallet Options */}
            <div className="space-y-3">
              <button
                onClick={handleConnect}
                className="w-full flex items-center gap-4 p-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-all duration-300 border border-border hover:border-primary/40 hover:shadow-[0_0_15px_hsl(270_70%_60%/0.2)] hover:scale-[1.02] active:scale-100"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-300">
                  <span className="text-lg">👻</span>
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Phantom</p>
                  <p className="text-sm text-muted-foreground">Popular Solana wallet</p>
                </div>
              </button>

              <button
                onClick={handleConnect}
                className="w-full flex items-center gap-4 p-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-all duration-300 border border-border hover:border-accent/40 hover:shadow-[0_0_15px_hsl(190_90%_50%/0.2)] hover:scale-[1.02] active:scale-100"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center transition-all duration-300">
                  <span className="text-lg">🌊</span>
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold">Solflare</p>
                  <p className="text-sm text-muted-foreground">Secure Solana wallet</p>
                </div>
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;
