import { X, Wallet, Coins, LogOut, Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useStaking } from '@/contexts/StakingContext';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { NETWORK } from '@/contexts/SolanaWalletProvider';
import { getTierColor, getTierBgColor, formatSyraAmount, type TierName } from '@/services/stakingApi';
import { useState, useEffect } from 'react';

const CURRENT_NETWORK = NETWORK;

/** Colosseum / Solana UX: list Phantom before other adapters when both are detected. */
function sortPhantomFirst<T extends { adapter: { name: string } }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    if (a.adapter.name === 'Phantom') return -1;
    if (b.adapter.name === 'Phantom') return 1;
    return a.adapter.name.localeCompare(b.adapter.name);
  });
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { isConnected, walletAddress, syraBalance, solBalance, disconnect } = useWallet();
  const { currentTier, stakedAmount, canCreateEvent, remainingEventsToday, dailyLimit } = useStaking();
  const { wallets, select, connecting } = useSolanaWallet();
  const { connection } = useConnection();
  const [copied, setCopied] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<string>(CURRENT_NETWORK);

  // Detect network from connection
  useEffect(() => {
    if (connection) {
      const endpoint = connection.rpcEndpoint;
      if (endpoint.includes('devnet')) {
        setNetworkInfo('devnet');
      } else if (endpoint.includes('testnet')) {
        setNetworkInfo('testnet');
      } else if (endpoint.includes('mainnet')) {
        setNetworkInfo('mainnet-beta');
      } else {
        setNetworkInfo(CURRENT_NETWORK);
      }
    }
  }, [connection]);

  if (!isOpen) return null;

  const handleSelectWallet = (walletName: string) => {
    const wallet = wallets.find(w => w.adapter.name === walletName);
    if (wallet) {
      select(wallet.adapter.name);
      // The wallet will automatically connect after selection due to autoConnect
      onClose();
    }
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

  // Get wallet icon or emoji
  const getWalletIcon = (name: string) => {
    const icons: Record<string, string> = {
      'Phantom': '👻',
      'Solflare': '🔥',
      'Torus': '🔷',
      'Ledger': '🔒',
    };
    return icons[name] || '💳';
  };

  // Get wallet description
  const getWalletDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'Phantom': 'Popular Solana wallet',
      'Solflare': 'Secure Solana wallet',
      'Torus': 'Social login wallet',
      'Ledger': 'Hardware wallet',
    };
    return descriptions[name] || 'Solana wallet';
  };

  // Network indicator config
  const getNetworkConfig = () => {
    switch (networkInfo) {
      case 'devnet':
        return {
          label: 'Devnet',
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/25',
          dot: 'bg-warning',
          description: 'Test Network - No real money',
        };
      case 'testnet':
        return {
          label: 'Testnet',
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          border: 'border-border',
          dot: 'bg-muted-foreground',
          description: 'Test Network - No real money',
        };
      case 'mainnet-beta':
        return {
          label: 'Mainnet',
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/25',
          dot: 'bg-success',
          description: 'Production - Real SOL',
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-muted-foreground',
          bg: 'bg-muted',
          border: 'border-border',
          dot: 'bg-muted-foreground',
          description: 'Unknown network',
        };
    }
  };

  const networkConfig = getNetworkConfig();
  const explorerCluster = networkInfo === 'mainnet-beta' ? '' : `?cluster=${networkInfo}`;

  // Filter installed wallets and detected wallets; Phantom first when multiple choices
  const installedWallets = sortPhantomFirst(wallets.filter(w => w.readyState === 'Installed'));
  const otherWallets = sortPhantomFirst(wallets.filter(w => w.readyState !== 'Installed'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card w-full max-w-md p-6 animate-scale-in shadow-[0_0_40px_hsl(var(--ring)/0.15)]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 hover:rotate-90 rounded-lg p-1 hover:bg-secondary/50"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Network Indicator - Always visible */}
        <div className={`mb-4 p-3 rounded-lg ${networkConfig.bg} border ${networkConfig.border} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${networkConfig.dot} animate-pulse`} />
            <Globe className={`h-4 w-4 ${networkConfig.color}`} />
            <span className={`font-semibold ${networkConfig.color}`}>
              {networkConfig.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {networkConfig.description}
          </span>
        </div>

        <h2 className="text-xl font-bold mb-6 gradient-text">
          {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
        </h2>

        {isConnected ? (
          <div className="space-y-4">
            {/* Wallet Address */}
            <div className="bg-secondary/50 rounded-lg p-4 border border-border/50 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_hsl(var(--ring)/0.12)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_hsl(var(--ring)/0.2)]">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Connected</p>
                    <p className="font-semibold font-mono text-sm">
                      {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <a
                    href={`https://explorer.solana.com/address/${walletAddress}${explorerCluster}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-secondary rounded-lg transition-all duration-300 hover:scale-110"
                    aria-label="View on explorer"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-4 border border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--ring)/0.12)] hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-foreground" />
                  <span className="text-sm text-muted-foreground">SOL Balance</span>
                </div>
                <p className="text-xl font-bold text-foreground">{solBalance.toFixed(4)} SOL</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 border border-border/50 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_15px_hsl(var(--ring)/0.12)] hover:scale-105">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--ring)/0.35)]" />
                  <span className="text-sm text-muted-foreground">$SYRA</span>
                </div>
                <p className="text-xl font-bold text-primary">{formatBalance(syraBalance)}</p>
              </div>
            </div>

            {/* Staking Tier */}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_20px_hsl(var(--ring)/0.15)]">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-muted-foreground">Staking Tier</p>
                {stakedAmount > 0 && (
                  <span className="text-xs text-muted-foreground">{formatSyraAmount(stakedAmount)} staked</span>
                )}
              </div>
              <p className="font-semibold text-primary text-lg">
                {currentTier?.emoji} {currentTier?.name || 'Free'} — {canCreateEvent ? `${remainingEventsToday}/${dailyLimit} Events` : 'Stake to Create'}
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
              Connect with <span className="font-medium text-foreground">Phantom</span> (recommended) or another Solana wallet to start predicting and winning SOL.
            </p>

            {/* Installed Wallets */}
            {installedWallets.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium">Detected Wallets</p>
                {installedWallets.map((wallet) => (
                  <button
                    key={wallet.adapter.name}
                    onClick={() => handleSelectWallet(wallet.adapter.name)}
                    disabled={connecting}
                    className="w-full flex items-center gap-4 p-4 bg-secondary/50 hover:bg-secondary rounded-lg transition-all duration-300 border border-border hover:border-primary/40 hover:shadow-[0_0_15px_hsl(var(--ring)/0.12)] hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-300 overflow-hidden">
                      {wallet.adapter.icon ? (
                        <img 
                          src={wallet.adapter.icon} 
                          alt={wallet.adapter.name} 
                          className="w-6 h-6"
                        />
                      ) : (
                        <span className="text-lg">{getWalletIcon(wallet.adapter.name)}</span>
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold">{wallet.adapter.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getWalletDescription(wallet.adapter.name)}
                      </p>
                    </div>
                    <div className="px-2 py-1 bg-success/15 text-success text-xs rounded-full">
                      Detected
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Other Wallets */}
            {otherWallets.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground font-medium">
                  {installedWallets.length > 0 ? 'Other Wallets' : 'Available Wallets'}
                </p>
                {otherWallets.slice(0, 4).map((wallet) => (
                  <button
                    key={wallet.adapter.name}
                    onClick={() => {
                      // Open wallet's website for installation
                      const urls: Record<string, string> = {
                        'Phantom': 'https://phantom.app/',
                        'Solflare': 'https://solflare.com/',
                      };
                      const url = urls[wallet.adapter.name];
                      if (url) {
                        window.open(url, '_blank');
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all duration-300 border border-border/50 hover:border-primary/25 hover:shadow-[0_0_15px_hsl(var(--foreground)/0.06)] hover:scale-[1.01] active:scale-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 overflow-hidden">
                      {wallet.adapter.icon ? (
                        <img 
                          src={wallet.adapter.icon} 
                          alt={wallet.adapter.name} 
                          className="w-6 h-6 opacity-60"
                        />
                      ) : (
                        <span className="text-lg opacity-60">{getWalletIcon(wallet.adapter.name)}</span>
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-muted-foreground">{wallet.adapter.name}</p>
                      <p className="text-sm text-muted-foreground/70">
                        Click to install
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50" />
                  </button>
                ))}
              </div>
            )}

            {/* No wallets message */}
            {wallets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No Solana wallets detected</p>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://phantom.app/', '_blank')}
                >
                  Get Phantom Wallet
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {connecting && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Connecting...</span>
              </div>
            )}

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
