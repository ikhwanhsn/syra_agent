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
      <header className="min-h-14 sm:min-h-16 border-b border-border bg-card/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 safe-area-inset-top flex flex-col justify-center max-w-[100vw] overflow-hidden">
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6 gap-2 min-w-0 overflow-hidden">
          {/* Left: Logo and menu */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleSidebar}
              className="lg:hidden shrink-0 h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/30 to-black/20 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-neon-purple/80 to-black/60 flex items-center justify-center border border-border/30">
                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <div className="hidden min-[420px]:block min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                  <span className="gradient-text">x402</span>
                  <span className="text-foreground truncate">Playground</span>
                  <Badge variant="outline" className="text-xs px-1.5 sm:px-2 py-0.5 h-5 border-primary/30 text-primary bg-primary/10 shrink-0">
                    v2
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5 truncate">HTTP 402 Payment Protocol</p>
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
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Powered by Syra - link to main website */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://syraa.fun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <span>Powered by Syra</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Visit Syra — syraa.fun</p>
              </TooltipContent>
            </Tooltip>

            {/* Try Agent link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <a 
                  href="https://agent.syraa.fun" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <span>Try Agent</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Try the Syra Agent</p>
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
                    <Button variant="glass" size="sm" className="font-mono text-xs gap-1.5 sm:gap-2 h-9 max-w-[140px] sm:max-w-none min-w-0">
                      <Coins className="h-3.5 w-3.5 text-accent shrink-0" />
                      <span className="truncate">{wallet.balance || '0 USDC'}</span>
                      <span className="text-muted-foreground shrink-0 hidden sm:inline">|</span>
                      <span className="truncate hidden sm:inline">{walletContext.shortAddress}</span>
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
