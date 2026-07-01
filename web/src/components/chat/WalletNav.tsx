import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "@/lib/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useAgentTreasuryBalances } from "@/hooks/useAgentTreasuryBalances";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bug,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Lightbulb,
  Loader2,
  LogOut,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  Wallet,
  Wallet2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notify } from "@/lib/notify";
import { buildFeedbackMailto } from "./FeedbackModal";
import { cn } from "@/lib/utils";
import { shortenAgentAddress } from "@/lib/agentWalletCatalog";
import { resolveUserAvatarUrl } from "@/lib/agentAvatar";
import { formatTreasuryUsd } from "@/lib/agentWalletBalanceDisplay";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { useSyraHolderBalance } from "@/hooks/useSyraHolderBalance";
import { SyraHolderProgressCard } from "@/components/syra/SyraHolderProgressCard";

export interface WalletNavProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

function menuRowClass(active?: boolean) {
  return cn(
    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm outline-none transition-colors",
    active
      ? "bg-primary/[0.08] text-foreground ring-1 ring-inset ring-primary/15"
      : "text-foreground hover:bg-muted/50 focus:bg-muted/50",
  );
}

const navAvatarClassName =
  "h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-inset ring-foreground/10";

function ConnectedAgentAvatar({ src }: { src: string }) {
  return (
    <span className="relative flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
      <img
        src={src}
        alt=""
        width={24}
        height={24}
        draggable={false}
        className={navAvatarClassName}
      />
      <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full border-[1.5px] border-background bg-emerald-500" />
    </span>
  );
}

export function WalletNav(props: WalletNavProps = {}) {
  const { isDarkMode = true, onToggleDarkMode } = props;
  const { pathname } = useLocation();
  const { publicKey, disconnect, connected } = useWalletContext();
  const { openConnectModal } = useConnectModal();
  const { ready, agentAddress, connectedWalletShort, lpAgentAddress, avatarUrl, anonymousId } =
    useAgentWallet();
  const { syraAuthReady, syraAuthenticated, ensureSyraAuth } = useSyraAuth();
  const {
    hasAgentTreasury,
    chatUsdcBalance,
    chatSolBalance,
    lpUsdcBalance,
    lpSolBalance,
    totalUsdc: totalAgentUsdc,
    totalSol: totalAgentSol,
    balancesLoading,
    refreshTreasuryBalances,
  } = useAgentTreasuryBalances();
  const hasAnyWallet = connected && !!publicKey;
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const walletAddress = publicKey?.toBase58() ?? null;
  const {
    balance: syraBalance,
    loading: syraBalanceLoading,
    progressPct: syraProgressPct,
    isEligible: syraHolderEligible,
    threshold: syraHolderThreshold,
    refresh: refreshSyraBalance,
  } = useSyraHolderBalance(walletAddress, { enabled: open && connected });

  const walletLabel = publicKey
    ? (connectedWalletShort ?? shortenAgentAddress(publicKey.toBase58()))
    : "…";

  const agentProfileSrc = useMemo(
    () => resolveUserAvatarUrl(avatarUrl, anonymousId) ?? "/logo.jpg",
    [avatarUrl, anonymousId],
  );

  useEffect(() => {
    if (!open || !connected || !publicKey) return;
    let cancelled = false;
    setBalanceRefreshing(true);
    void (async () => {
      if (syraAuthReady && !syraAuthenticated) {
        await ensureSyraAuth();
      }
      if (cancelled) return;
      await Promise.all([refreshTreasuryBalances(), refreshSyraBalance()]);
    })().finally(() => {
      if (!cancelled) setBalanceRefreshing(false);
    });
    return () => {
      cancelled = true;
    };
    // Only refresh when the menu opens — not when refreshTreasuryBalances identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, connected, publicKey, syraAuthReady, syraAuthenticated]);

  const goTo = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate],
  );

  const openFeedbackMailto = useCallback((kind: "feature" | "bug") => {
    setOpen(false);
    window.location.href = buildFeedbackMailto(kind);
  }, []);

  const handleRefreshBalances = useCallback(async () => {
    setBalanceRefreshing(true);
    try {
      await Promise.all([refreshTreasuryBalances(), refreshSyraBalance()]);
      notify.success("Balances updated");
    } catch {
      notify.error("Could not refresh balances");
    } finally {
      setBalanceRefreshing(false);
    }
  }, [refreshTreasuryBalances, refreshSyraBalance]);

  const copyAddress = useCallback(
    (text: string, label: string) => {
      void navigator.clipboard?.writeText(text).then(
        () => {
          setAddressCopied(true);
          toast({ title: "Copied", description: `${label} copied.` });
          window.setTimeout(() => setAddressCopied(false), 2000);
        },
        () => toast({ title: "Copy failed", variant: "destructive" }),
      );
    },
    [toast],
  );

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await disconnect();
      setOpen(false);
    } catch {
      /* WalletContext shows disconnect error toast */
    } finally {
      setDisconnecting(false);
    }
  }, [disconnect]);

  const agentLoading =
    hasAnyWallet &&
    (!ready || balancesLoading || (balanceRefreshing && totalAgentUsdc == null && totalAgentSol == null));

  const showLpSplit = Boolean(lpAgentAddress);
  const onWalletPage = pathname === "/wallet" || pathname.startsWith("/wallet/");
  const onSettingsPage = pathname === "/settings" || pathname.startsWith("/settings/");

  if (!hasAnyWallet) {
    return (
      <div className="flex min-w-0 max-w-full shrink-0 items-center gap-2">
        {onToggleDarkMode ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-border/50 bg-muted/20 shadow-sm hover:bg-muted/35 lg:hidden touch-manipulation sm:min-h-0 sm:min-w-0"
            onClick={onToggleDarkMode}
            title={isDarkMode ? "Light mode" : "Dark mode"}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
          </Button>
        ) : null}
        <Button
          className="h-9 min-h-[44px] min-w-0 max-w-full rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 touch-manipulation sm:min-h-0"
          onClick={openConnectModal}
        >
          <Wallet className="mr-1 h-4 w-4 shrink-0 sm:mr-2" />
          <span className="truncate">
            <span className="min-[380px]:hidden">Connect</span>
            <span className="hidden min-[380px]:inline">Connect wallet</span>
          </span>
        </Button>
      </div>
    );
  }

  const triggerClass = cn(
    "h-9 min-h-[44px] max-w-[min(10rem,calc(100vw-10rem))] gap-2 rounded-xl px-2 pr-2.5 font-normal",
    "border border-[hsl(var(--glass-border)/0.85)] bg-[hsl(var(--glass-bg)/0.65)]",
    "shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.45),var(--glass-shadow)]",
    "backdrop-blur-[16px] backdrop-saturate-[160%]",
    "transition-[background,box-shadow,border-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "hover:border-[hsl(var(--foreground)/0.12)] hover:bg-[hsl(var(--glass-bg)/0.78)]",
    "dark:border-[hsl(0_0%_100%/0.1)] dark:bg-[hsl(var(--glass-bg)/0.42)]",
    "dark:shadow-[inset_0_1px_0_0_hsl(0_0%_100%/0.08),var(--glass-shadow)]",
    "dark:hover:border-[hsl(0_0%_100%/0.14)] dark:hover:bg-[hsl(var(--glass-bg)/0.52)]",
    "data-[state=open]:border-[hsl(var(--foreground)/0.14)] data-[state=open]:bg-[hsl(var(--glass-bg)/0.82)]",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.98] touch-manipulation sm:min-h-9 sm:max-w-[11.5rem]",
  );

  return (
    <div className="flex min-w-0 max-w-full shrink-0 items-center justify-end">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={triggerClass}>
            <ConnectedAgentAvatar src={agentProfileSrc} />
            <span className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-foreground">
              {walletLabel}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className={cn(
            "z-[250] w-[min(21rem,calc(100vw-1.25rem))] overflow-hidden p-0",
            "rounded-2xl border border-border/50 bg-popover/95",
            "shadow-[0_24px_64px_-16px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150",
            "dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)]",
          )}
        >
          {onToggleDarkMode ? (
            <div className="border-b border-border/40 p-1.5 lg:hidden">
              <DropdownMenuItem
                className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm focus:bg-muted/60"
                onSelect={() => onToggleDarkMode()}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            </div>
          ) : null}

          <div className="relative border-b border-border/40 px-4 pb-4 pt-4">
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(120% 80% at 100% 0%, hsl(var(--primary) / 0.12), transparent 55%)",
              }}
              aria-hidden
            />
            <div className="relative flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => publicKey && copyAddress(publicKey.toBase58(), "Wallet address")}
                className="group min-w-0 flex-1 text-left"
                title={publicKey?.toBase58()}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Connected wallet
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground">
                  <span className="truncate">{walletLabel}</span>
                  {addressCopied ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100" />
                  )}
                </p>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => void handleRefreshBalances()}
                disabled={balanceRefreshing}
                aria-label="Refresh balances"
              >
                {balanceRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            <SyraHolderProgressCard
              className="relative mt-3"
              balance={syraBalance}
              loading={syraBalanceLoading}
              progressPct={syraProgressPct}
              isEligible={syraHolderEligible}
              threshold={syraHolderThreshold}
            />

            <div className="relative mt-4 rounded-xl border border-border/50 bg-card/80 px-3.5 py-3 ring-1 ring-inset ring-white/[0.04]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Agent treasuries
              </p>
              {agentLoading ? (
                <div className="mt-2 flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading balances…
                </div>
              ) : hasAgentTreasury ? (
                <>
                  <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                    {formatTreasuryUsd(totalAgentUsdc)}
                  </p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {totalAgentSol != null ? `${formatSol(totalAgentSol)} SOL` : "— SOL"}
                  </p>
                  {showLpSplit ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted/30 px-2.5 py-2 ring-1 ring-inset ring-border/40">
                        <p className="text-[10px] text-muted-foreground">Chat</p>
                        <p className="mt-0.5 font-mono text-xs font-medium tabular-nums text-foreground">
                          {formatTreasuryUsd(chatUsdcBalance)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/30 px-2.5 py-2 ring-1 ring-inset ring-border/40">
                        <p className="text-[10px] text-muted-foreground">LP</p>
                        <p className="mt-0.5 font-mono text-xs font-medium tabular-nums text-foreground">
                          {formatTreasuryUsd(lpUsdcBalance)}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No agent wallet linked yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-0.5 px-2 py-2">
            <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
              Account
            </p>
            <DropdownMenuItem className={menuRowClass(onWalletPage)} onSelect={() => goTo("/wallet")}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 ring-1 ring-inset ring-border/50">
                <Wallet2 className="h-4 w-4 text-foreground/80" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Wallets</span>
                <span className="block text-xs text-muted-foreground">Treasuries & move funds</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            </DropdownMenuItem>
            <DropdownMenuItem className={menuRowClass(onSettingsPage)} onSelect={() => goTo("/settings")}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 ring-1 ring-inset ring-border/50">
                <Settings className="h-4 w-4 text-foreground/80" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Settings</span>
                <span className="block text-xs text-muted-foreground">Agent & preferences</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            </DropdownMenuItem>
          </div>

          <div className="space-y-0.5 border-t border-border/40 px-2 py-2">
            <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
              Support
            </p>
            <DropdownMenuItem
              className={menuRowClass()}
              onSelect={(e) => {
                e.preventDefault();
                openFeedbackMailto("feature");
              }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-inset ring-amber-500/20">
                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Request a feature</span>
                <span className="block text-xs text-muted-foreground">Email the Syra team</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className={menuRowClass()}
              onSelect={(e) => {
                e.preventDefault();
                openFeedbackMailto("bug");
              }}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 ring-1 ring-inset ring-red-500/20">
                <Bug className="h-4 w-4 text-red-600 dark:text-red-400" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Report a bug</span>
                <span className="block text-xs text-muted-foreground">Something broken? Tell us</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            </DropdownMenuItem>
          </div>

          <div className="border-t border-border/40 p-1.5">
            <DropdownMenuItem
              className={cn(
                "cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm focus:bg-destructive/10",
                "text-destructive focus:text-destructive",
              )}
              onSelect={(e) => {
                e.preventDefault();
                void handleDisconnect();
              }}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
