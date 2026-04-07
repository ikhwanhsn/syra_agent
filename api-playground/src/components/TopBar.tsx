import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Menu, Coins, ExternalLink, LogOut, Sun, Moon, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WalletState } from '@/types/api';
import { useWalletContext } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { BRAND_NAME, BRAND_WORD_MARK, BRAND_SUBLINE } from '@/lib/branding';
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
  /** Open the chain-picker modal first (user picks Solana or Base), then Privy modal opens for that chain. */
  onOpenConnectModal: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  /** Current payment network (used for 402). Shown as status in the bar. */
  paymentNetwork?: 'solana' | 'base';
}

export function TopBar({ wallet, onOpenConnectModal, onToggleSidebar, isSidebarOpen, paymentNetwork = 'solana' }: TopBarProps) {
  const walletContext = useWalletContext();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const resolvedTheme = mounted ? (theme ?? 'dark') : 'dark';

  return (
    <TooltipProvider>
      <header className="min-h-14 sm:min-h-16 border-b border-border bg-card/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-[100] safe-area-inset-top flex flex-col justify-center max-w-[100vw]">
        <div className="flex items-center justify-between h-14 sm:h-16 px-2.5 sm:px-4 lg:px-6 gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
          {/* Left: Logo and menu */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 overflow-hidden">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleSidebar}
              className="lg:hidden shrink-0 h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 min-w-0 hover:opacity-90 transition-opacity"
            >
              <div className="relative group shrink-0">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/30 to-muted/40 blur-md opacity-50 transition-opacity group-hover:opacity-70" />
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-primary/40 shadow-sm shadow-primary/20 ring-1 ring-black/5 dark:ring-white/10">
                  <img
                    src="/images/logo.jpg"
                    alt={BRAND_NAME}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="hidden min-[420px]:block min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                  <span className="gradient-text">{BRAND_WORD_MARK}</span>
                  <span className="text-foreground truncate">Playground</span>
                  <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 h-5 border-primary/40 text-primary bg-primary/12 shrink-0 max-sm:max-w-[5.5rem] sm:max-w-none truncate">
                    x402 · MPP
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5 truncate">{BRAND_SUBLINE}</p>
              </div>
            </Link>
            {/* Mobile / small tablet: page links (md+ uses horizontal nav) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden h-9 w-9 shrink-0"
                  aria-label="Pages and tools"
                >
                  <LayoutGrid className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Navigate</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/examples" className="cursor-pointer">
                    Examples
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/explorer" className="cursor-pointer">
                    Explorer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/batch-test" className="cursor-pointer">
                    Batch Test
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/format-test" className="cursor-pointer">
                    Format Test
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <nav className="hidden md:flex items-center gap-0.5 border-l border-border pl-3 ml-1">
              <Link
                to="/examples"
                className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-secondary/50 transition-colors"
              >
                Examples
              </Link>
              <Link
                to="/explorer"
                className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-secondary/50 transition-colors"
              >
                Explorer
              </Link>
              <Link
                to="/batch-test"
                className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-secondary/50 transition-colors"
              >
                Batch Test
              </Link>
              <Link
                to="/format-test"
                className="text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md hover:bg-secondary/50 transition-colors"
              >
                Format Test
              </Link>
            </nav>
          </div>

          {/* Center: Flow indicator */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border/70 shadow-inner shadow-black/20">
              <span className="text-xs font-medium text-muted-foreground">1. Request</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="text-xs font-medium text-primary">2. Pay (402)</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="text-xs font-medium text-muted-foreground">3. Response</span>
            </div>
          </div>

          {/* Right: Network status + Wallet connection */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 min-w-0">
            {/* Payment network status — only show when a wallet is connected */}
            {(wallet.connected || walletContext.baseConnected) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium shrink-0",
                      paymentNetwork === 'base'
                        ? "bg-primary/10 border-primary/25 text-foreground"
                        : "border-border bg-muted/50 text-foreground"
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {paymentNetwork === 'base' ? 'Base' : 'Solana'}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Payment network: {paymentNetwork === 'base' ? 'Base (EVM)' : 'Solana'}. Change in payment modal when both are available.</p>
                </TooltipContent>
              </Tooltip>
            )}

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
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="h-9 w-9 relative"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Toggle {resolvedTheme === 'dark' ? 'light' : 'dark'} mode</p>
              </TooltipContent>
            </Tooltip>

            {(() => {
              const isBase = paymentNetwork === 'base';
              const connected = isBase ? walletContext.baseConnected : wallet.connected;
              const connecting = isBase ? walletContext.baseConnecting : walletContext.connecting;
              const handleConnect = () => onOpenConnectModal();
              if (connected) {
                const balance = isBase
                  ? `${walletContext.baseUsdcBalance?.toFixed(2) ?? '0'} USDC`
                  : (wallet.balance || '0 USDC');
                const shortAddr = isBase ? walletContext.baseShortAddress : walletContext.shortAddress;
                const fullAddr = isBase ? walletContext.baseAddress : walletContext.address;
                const handleDisconnect = isBase ? () => walletContext.disconnectBase() : () => walletContext.disconnect();
                return (
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/[0.08] border border-border text-foreground">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <span className="text-xs font-medium">Connected</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="glass" size="sm" className="font-mono text-xs gap-1 sm:gap-2 h-9 max-w-[min(200px,46vw)] sm:max-w-none min-w-0">
                          <Coins className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="truncate">{balance}</span>
                          <span className="text-muted-foreground shrink-0 hidden sm:inline">|</span>
                          <span className="truncate hidden sm:inline">{shortAddr}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium">Wallet Connected ({isBase ? 'Base' : 'Solana'})</p>
                            <p className="text-xs font-mono text-muted-foreground truncate">
                              {fullAddr}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {!isBase && (
                          <>
                            <DropdownMenuItem className="justify-between">
                              <span className="text-muted-foreground">SOL Balance</span>
                              <span className="font-mono">{walletContext.solBalance?.toFixed(4) || '0'} SOL</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="justify-between">
                              <span className="text-muted-foreground">USDC Balance</span>
                              <span className="font-mono">{walletContext.usdcBalance?.toFixed(2) || '0'} USDC</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        {isBase && (
                          <DropdownMenuItem className="justify-between">
                            <span className="text-muted-foreground">USDC (Base)</span>
                            <span className="font-mono">{walletContext.baseUsdcBalance?.toFixed(2) || '0'} USDC</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={handleDisconnect}
                          className="text-destructive focus:text-destructive"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              }
              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="neon" 
                      size="sm" 
                      onClick={handleConnect}
                      disabled={connecting}
                      className="gap-2 h-9"
                    >
                      <Wallet className="h-4 w-4" />
                      {connecting ? (
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
                    <p className="text-xs">Connect with Email, Solana, or Base</p>
                  </TooltipContent>
                </Tooltip>
              );
            })()}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
