import { Wallet, Zap, Menu, Coins, ExternalLink, LogOut, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletState } from '@/types/api';
import { useWalletContext } from '@/contexts/WalletContext';
import { useTheme } from 'next-themes';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  wallet: WalletState;
  onConnectWallet: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export function TopBar({ wallet, onConnectWallet, onToggleSidebar, isSidebarOpen }: TopBarProps) {
  const walletContext = useWalletContext();
  const { theme, setTheme } = useTheme();
  
  return (
    <TooltipProvider>
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
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
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/30 to-black/20 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/80 to-black/60 flex items-center justify-center border border-border/30">
                  <Zap className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold tracking-tight flex items-center gap-2">
                  <span className="gradient-text">x402</span>
                  <span className="text-foreground">Playground</span>
                  <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 border-primary/30 text-primary bg-primary/10">
                    v2
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">HTTP 402 Payment Protocol</p>
              </div>
            </div>
          </div>

          {/* Center: Flow indicator */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
              <span className="text-xs font-medium text-muted-foreground">1. Send Request</span>
              <span className="text-muted-foreground/50">→</span>
              <span className="text-xs font-medium text-warning">2. Pay (402)</span>
              <span className="text-muted-foreground/50">→</span>
              <span className="text-xs font-medium text-success">3. Get Data</span>
            </div>
          </div>

          {/* Right: Wallet connection */}
          <div className="flex items-center gap-3">
            {/* Learn more link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href="https://www.x402.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <span>Learn x402</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Learn about the x402 payment protocol</p>
              </TooltipContent>
            </Tooltip>

            {/* Theme toggle button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="h-9 w-9 relative"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
              </TooltipContent>
            </Tooltip>

            {wallet.connected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-success">Connected</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="glass" size="sm" className="font-mono text-xs gap-2 h-9">
                      <Coins className="h-3.5 w-3.5 text-accent" />
                      <span>{wallet.balance || '0 USDC'}</span>
                      <span className="text-muted-foreground">|</span>
                      <span>{walletContext.shortAddress}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">Wallet Connected</p>
                        <p className="text-xs font-mono text-muted-foreground truncate">
                          {walletContext.address}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-between">
                      <span className="text-muted-foreground">SOL Balance</span>
                      <span className="font-mono">{walletContext.solBalance?.toFixed(4) || '0'} SOL</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="justify-between">
                      <span className="text-muted-foreground">USDC Balance</span>
                      <span className="font-mono">{walletContext.usdcBalance?.toFixed(2) || '0'} USDC</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => walletContext.disconnect()}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="neon" 
                    size="sm" 
                    onClick={onConnectWallet}
                    disabled={walletContext.connecting}
                    className="gap-2 h-9"
                  >
                    <Wallet className="h-4 w-4" />
                    {walletContext.connecting ? (
                      <span className="text-sm">Connecting...</span>
                    ) : (
                      <>
                        <span className="hidden sm:inline text-sm">Connect Wallet</span>
                        <span className="sm:hidden text-sm">Connect</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Connect your Solana wallet to enable payments</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
