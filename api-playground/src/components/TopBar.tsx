import { Wallet, Zap, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletState } from '@/types/api';

interface TopBarProps {
  wallet: WalletState;
  onConnectWallet: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function TopBar({ wallet, onConnectWallet, onToggleSidebar, isSidebarOpen }: TopBarProps) {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Logo and menu */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center neon-glow-purple">
                <Zap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight">
                <span className="gradient-text">x402</span>
                <span className="text-foreground ml-1">API Playground</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Tagline */}
        <div className="hidden md:flex items-center">
          <p className="text-sm text-muted-foreground font-medium tracking-wide">
            Send. <span className="text-primary">Pay.</span> Retry. <span className="text-accent">Get Results.</span>
          </p>
        </div>

        {/* Right: Wallet connection */}
        <div className="flex items-center gap-3">
          {wallet.connected ? (
            <div className="flex items-center gap-2">
              <Badge variant="success" className="hidden sm:flex gap-1.5 px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Connected
              </Badge>
              <Button variant="glass" size="sm" className="font-mono text-xs">
                {wallet.address?.slice(0, 4)}...{wallet.address?.slice(-4)}
              </Button>
            </div>
          ) : (
            <Button 
              variant="neon" 
              size="sm" 
              onClick={onConnectWallet}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Connect Wallet</span>
              <span className="sm:hidden">Connect</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
