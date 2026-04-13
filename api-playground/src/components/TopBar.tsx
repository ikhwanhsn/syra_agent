import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Menu, Coins, LogOut, Sun, Moon, LayoutGrid, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletState } from '@/types/api';
import { useWalletContext } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { BRAND_NAME, BRAND_WORD_MARK } from '@/lib/branding';
import type { RequestStatus } from '@/types/api';
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface TopBarProps {
  wallet: WalletState;
  /** Open the connect flow (app chain picker first, then Privy). */
  onOpenConnectModal: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  /** Current payment network (used for 402). Shown as status in the bar. */
  paymentNetwork?: 'solana' | 'base';
  /** Drives the Request → Pay → Response stepper in the header. */
  flowStatus?: RequestStatus;
}

function flowStepFromStatus(s: RequestStatus): 1 | 2 | 3 {
  if (s === 'payment_required') return 2;
  if (s === 'success' || s === 'error') return 3;
  return 1;
}

interface ConnectedWalletDropdownProps {
  isBase: boolean;
  triggerBalance: string;
  shortAddr: string;
  fullAddr: string;
  solBalance: number | null;
  usdcBalance: number | null;
  baseUsdcBalance: number | null;
  onDisconnect: () => void;
}

function ConnectedWalletDropdown({
  isBase,
  triggerBalance,
  shortAddr,
  fullAddr,
  solBalance,
  usdcBalance,
  baseUsdcBalance,
  onDisconnect,
}: ConnectedWalletDropdownProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(async () => {
    if (!fullAddr) return;
    try {
      await navigator.clipboard.writeText(fullAddr);
      setCopied(true);
      toast({ title: 'Address copied', description: 'Wallet address is on your clipboard.' });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Could not copy', variant: 'destructive' });
    }
  }, [fullAddr, toast]);

  const chainLabel = isBase ? 'Base' : 'Solana';
  const chainDot = isBase ? 'bg-[#0052FF]' : 'bg-[#9945FF]';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-10 min-h-10 shrink-0 gap-2 rounded-full border-border/50 bg-background/90 px-3.5 font-mono text-[11px] shadow-sm backdrop-blur-sm transition-all',
            'hover:border-border hover:bg-muted/30 hover:shadow-md',
            'max-w-[min(220px,52vw)] sm:max-w-[min(340px,34vw)] sm:text-xs',
          )}
        >
          <Coins className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="min-w-0 truncate font-medium tabular-nums text-foreground">{triggerBalance}</span>
          <span className="hidden h-3 w-px shrink-0 bg-border sm:block" aria-hidden />
          <span className="hidden min-w-0 truncate text-muted-foreground sm:inline">{shortAddr}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          'w-[min(calc(100vw-1.5rem),20rem)] sm:w-80 p-0 overflow-hidden rounded-2xl border border-border/50',
          'bg-popover/95 text-popover-foreground shadow-2xl shadow-black/30 backdrop-blur-xl',
        )}
      >
        <DropdownMenuGroup className="p-5 pb-4">
          <div className="min-w-0 space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', chainDot)} />
                {chainLabel}
              </span>
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-foreground">Wallet connected</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Signed in for payments and requests on this network.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5">
              <p className="min-w-0 flex-1 break-all font-mono text-[11px] leading-snug text-muted-foreground sm:text-xs">
                {fullAddr}
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      void copyAddress();
                    }}
                    className="mt-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Copy wallet address"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">{copied ? 'Copied' : 'Copy address'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="m-0 bg-border/50" />

        <DropdownMenuGroup className="space-y-2 px-5 py-4">
          {!isBase && (
            <>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/15 px-3.5 py-3 ring-1 ring-border/30">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  SOL
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
                  {(solBalance ?? 0).toFixed(4)} <span className="text-xs font-medium text-muted-foreground">SOL</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/15 px-3.5 py-3 ring-1 ring-border/30">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  USDC
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
                  {(usdcBalance ?? 0).toFixed(2)}{' '}
                  <span className="text-xs font-medium text-muted-foreground">USDC</span>
                </span>
              </div>
            </>
          )}
          {isBase && (
            <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/15 px-3.5 py-3 ring-1 ring-border/30">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                USDC (Base)
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
                {(baseUsdcBalance ?? 0).toFixed(2)}{' '}
                <span className="text-xs font-medium text-muted-foreground">USDC</span>
              </span>
            </div>
          )}
        </DropdownMenuGroup>

        <div className="border-t border-border/50 bg-muted/10 p-2">
          <DropdownMenuItem
            onClick={onDisconnect}
            className={cn(
              'cursor-pointer gap-2 rounded-xl px-3 py-2.5 text-sm font-medium',
              'text-destructive focus:bg-destructive/10 focus:text-destructive',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-90" />
            Disconnect wallet
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBar({
  wallet,
  onOpenConnectModal,
  onToggleSidebar,
  isSidebarOpen,
  paymentNetwork = 'solana',
  flowStatus = 'idle',
}: TopBarProps) {
  const walletContext = useWalletContext();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const resolvedTheme = mounted ? (theme ?? 'dark') : 'dark';
  const activeFlowStep = flowStepFromStatus(flowStatus);
  const isFlowLoading = flowStatus === 'loading';
  const flowEndedInError = flowStatus === 'error';

  return (
    <TooltipProvider>
      <header className="min-h-14 sm:min-h-16 border-b border-border/60 bg-card/70 dark:bg-card/55 backdrop-blur-2xl backdrop-saturate-150 fixed top-0 left-0 right-0 z-[100] safe-area-inset-top flex flex-col justify-center max-w-[100vw] shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset] dark:shadow-[0_1px_0_0_hsl(0_0%_100%/0.06)_inset]">
        <div
          className={cn(
            'flex h-14 min-h-14 items-center justify-between gap-1.5 overflow-hidden px-2.5 min-w-0 sm:h-16 sm:min-h-16 sm:gap-2 sm:px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-2 lg:px-8',
          )}
        >
          {/* Left: Logo and menu */}
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden sm:gap-3 lg:justify-self-start">
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
                <h1 className="font-display flex items-center gap-2 truncate text-sm font-semibold tracking-tight sm:text-base">
                  <span className="gradient-text">{BRAND_WORD_MARK}</span>
                  <span className="truncate text-foreground/95">Playground</span>
                </h1>
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
            <nav className="hidden md:flex items-center gap-0.5 border-l border-border/60 pl-3 ml-1">
              {(
                [
                  ['/examples', 'Examples'],
                  ['/explorer', 'Explorer'],
                  ['/batch-test', 'Batch Test'],
                  ['/format-test', 'Format Test'],
                ] as const
              ).map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-foreground/[0.06] dark:hover:bg-white/[0.06] transition-colors duration-200"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: flow stepper — grid middle column is true viewport center */}
          <div className="hidden min-w-0 items-center justify-center px-2 lg:flex lg:justify-self-center">
            <div className="flex items-center gap-0 rounded-full border border-border/50 bg-secondary/25 px-0.5 py-0.5 shadow-inner shadow-black/10 dark:bg-black/25">
              {(
                [
                  { step: 1 as const, label: 'Request' },
                  { step: 2 as const, label: 'Pay' },
                  { step: 3 as const, label: 'Response' },
                ] as const
              ).map(({ step, label }, i) => {
                const isActive = activeFlowStep === step;
                const isDone = activeFlowStep > step || (flowStatus === 'success' && step === 3);
                const pulse = isActive && isFlowLoading && step === 1;
                const err = isActive && flowEndedInError && step === 3;
                const showCheck = isDone && !err;
                return (
                  <div key={step} className="flex items-center">
                    {i > 0 && (
                      <div
                        className={cn(
                          'h-px w-3 shrink-0 rounded-full transition-colors sm:w-4',
                          isDone ? 'bg-primary/30' : isActive ? 'bg-border' : 'bg-border/35',
                        )}
                        aria-hidden
                      />
                    )}
                    <div
                      className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-1 transition-all duration-300 sm:gap-1.5 sm:px-2.5 sm:py-1.5',
                        isActive &&
                          'bg-background/90 dark:bg-white/[0.07] shadow-sm ring-1 ring-border/60 dark:ring-white/[0.08]',
                        err && 'ring-destructive/35 bg-destructive/[0.07]',
                        pulse && 'animate-pulse',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums',
                          showCheck && 'bg-primary/12 text-primary',
                          isActive && !isDone && 'bg-primary text-primary-foreground shadow-sm',
                          !isActive && !isDone && 'bg-muted text-muted-foreground',
                          err && 'bg-destructive text-destructive-foreground',
                        )}
                      >
                        {showCheck ? <Check className="h-3 w-3 stroke-[3]" aria-hidden /> : step}
                      </span>
                      <span
                        className={cn(
                          'whitespace-nowrap text-[10px] font-medium tracking-wide sm:text-[11px]',
                          isActive && !err && 'text-foreground',
                          isActive && err && 'text-destructive',
                          !isActive && !isDone && 'text-muted-foreground',
                          isDone && !err && 'text-foreground/85',
                        )}
                      >
                        {step === 2 ? 'Pay' : label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: theme + wallet */}
          <div className="flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-2 lg:justify-self-end">
            {/* Theme toggle */}
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
                  <ConnectedWalletDropdown
                    isBase={isBase}
                    triggerBalance={balance}
                    shortAddr={shortAddr ?? ''}
                    fullAddr={fullAddr ?? ''}
                    solBalance={walletContext.solBalance}
                    usdcBalance={walletContext.usdcBalance}
                    baseUsdcBalance={walletContext.baseUsdcBalance}
                    onDisconnect={handleDisconnect}
                  />
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
                      className="gap-2 h-9 rounded-full px-4 shadow-elevate-sm font-semibold"
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
                    <p className="text-xs">Pick Solana, Base, or email — then Privy wallet list</p>
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
