import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicKey } from "@solana/web3.js";
import { useWalletContext } from "@/contexts/WalletContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Copy,
  ChevronDown,
  Loader2,
  LogOut,
  MessageSquare,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FuelAgentModal } from "./FuelAgentModal";
import { FeedbackModal } from "./FeedbackModal";
import { cn } from "@/lib/utils";
import { CoinLogo } from "@/components/crypto/CoinLogo";

const LAMPORTS_PER_SOL = 1e9;
const USDC_MINT_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export interface WalletNavProps {
  /** When set with `onToggleDarkMode`, theme moves into the wallet menu below `lg` instead of the top bar. */
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export function WalletNav(props: WalletNavProps = {}) {
  const { isDarkMode = true, onToggleDarkMode } = props;
  const {
    connection,
    publicKey,
    disconnect,
    requestConnect,
    isPrivyMounted,
    connectForChain,
    openLoginModal,
    baseConnected,
    baseAddress,
    baseShortAddress,
    baseUsdcBalance,
    baseEthBalance,
    effectiveChain,
  } = useWalletContext();
  const { openConnectModal } = useConnectModal();
  const {
    ready,
    agentAddress,
    agentShortAddress,
    connectedWalletShort,
    agentUsdcBalance,
    agentSolBalance,
    agentBaseEthBalance,
    agentBaseUsdcBalance,
    lastDebitUsd,
    refetchBalance,
  } = useAgentWallet();
  /** Which chain to show when both are connected; use effectiveChain so Base (MetaMask) shows when user connected with Base */
  const hasAnyWallet = !!publicKey || baseConnected;
  const displaySolana = effectiveChain === "solana";
  const displayBase = effectiveChain === "base";
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [fuelInitialTab, setFuelInitialTab] = useState<"deposit" | "withdraw">("deposit");
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [userUsdcBalance, setUserUsdcBalance] = useState<number | null>(null);
  const [userSolBalance, setUserSolBalance] = useState<number | null>(null);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchUserBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const [solLamports, tokenAccounts] = await Promise.all([
        connection.getBalance(publicKey, "confirmed"),
        connection.getParsedTokenAccountsByOwner(publicKey, { mint: USDC_MINT_MAINNET }),
      ]);
      setUserSolBalance(solLamports / LAMPORTS_PER_SOL);
      const usdc =
        tokenAccounts.value.length > 0
          ? tokenAccounts.value.reduce((sum, acc) => {
              const ui = acc.account.data.parsed?.info?.tokenAmount?.uiAmount;
              return sum + (Number(ui) || 0);
            }, 0)
          : 0;
      setUserUsdcBalance(usdc);
    } catch {
      setUserUsdcBalance(null);
      setUserSolBalance(null);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (!open || !publicKey) {
      setUserUsdcBalance(null);
      setUserSolBalance(null);
      return;
    }
    fetchUserBalance();
  }, [open, publicKey, fetchUserBalance]);

  const handleRefreshBalances = useCallback(async () => {
    setBalanceRefreshing(true);
    try {
      const tasks = [refetchBalance()];
      if (publicKey) tasks.push(fetchUserBalance());
      await Promise.all(tasks);
      toast({ title: "Balances updated", description: "Latest balances loaded." });
    } catch {
      toast({ title: "Refresh failed", variant: "destructive" });
    } finally {
      setBalanceRefreshing(false);
    }
  }, [refetchBalance, fetchUserBalance, publicKey, toast]);

  const copyToClipboard = useCallback(
    (text: string, label: string) => {
      navigator.clipboard?.writeText(text).then(
        () => toast({ title: "Copied", description: `${label} copied to clipboard.` }),
        () => toast({ title: "Copy failed", variant: "destructive" })
      );
    },
    [toast]
  );

  const handleCopyWallet = () => {
    if (publicKey) copyToClipboard(publicKey.toBase58(), "Wallet address");
    else if (baseAddress) copyToClipboard(baseAddress, "Wallet address");
    setOpen(false);
  };

  const handleCopyAgent = () => {
    if (agentAddress) copyToClipboard(agentAddress, "Agent wallet address");
    setOpen(false);
  };

  const handleChangeWallet = () => {
    setOpen(false);
    openConnectModal();
  };

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await disconnect();
      setOpen(false);
    } catch (e) {
      toast({ title: "Disconnect failed", description: String(e), variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  }, [disconnect, toast]);

  const agentLoading = hasAnyWallet && !ready;
  const hasUsdc = agentUsdcBalance != null && agentUsdcBalance > 0;
  const displayShortAddress = displaySolana ? connectedWalletShort : baseShortAddress;

  function formatUsdc(value: number | null | undefined): string {
    if (value == null) return "—";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toFixed(2);
  }

  if (!hasAnyWallet) {
    return (
      <div className="flex min-w-0 max-w-full shrink-0 items-center gap-2">
        {onToggleDarkMode && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-border/50 bg-muted/20 shadow-sm hover:bg-muted/35 lg:hidden touch-manipulation sm:min-h-0 sm:min-w-0"
            onClick={onToggleDarkMode}
            title={isDarkMode ? "Light mode" : "Dark mode"}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-foreground" />
            )}
          </Button>
        )}
        <Button
          className="h-9 min-h-[44px] min-w-0 max-w-full rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 touch-manipulation sm:min-h-0"
          onClick={openConnectModal}
        >
          <Wallet className="mr-1 h-4 w-4 shrink-0 sm:mr-2" />
          <span className="truncate">
            <span className="min-[380px]:hidden">Connect</span>
            <span className="hidden min-[380px]:inline">Connect Wallet</span>
          </span>
        </Button>
      </div>
    );
  }

  /** Shared chrome for chain / agent wallet / connected wallet pills (height, border, depth). */
  const navItemClass =
    "h-9 min-h-[44px] sm:min-h-0 rounded-xl border border-border/60 bg-muted/25 px-2.5 shadow-sm backdrop-blur-sm sm:px-3 gap-2 text-sm font-medium tabular-nums inline-flex items-center min-w-0 touch-manipulation transition-colors hover:bg-muted/40";

  const balanceJustReduced = lastDebitUsd != null && lastDebitUsd > 0;
  const agentUsdcDisplay = displayBase ? agentBaseUsdcBalance : agentUsdcBalance;
  const hasUsdcAgent = agentUsdcDisplay != null && agentUsdcDisplay > 0;

  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-2 sm:flex-nowrap sm:gap-2.5">
      {/* Chain badge – show the chain used for this session (one chain only) */}
      {hasAnyWallet && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "hidden h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-sm lg:flex lg:min-h-0",
                displaySolana
                  ? "border-foreground/20 bg-muted/50 text-foreground ring-1 ring-foreground/10"
                  : "border-border bg-muted/40 text-foreground ring-1 ring-border/80",
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  displaySolana
                    ? "bg-foreground/80 shadow-[0_0_8px_hsl(var(--foreground)/0.35)]"
                    : "bg-muted-foreground shadow-[0_0_8px_hsl(var(--muted-foreground)/0.35)]",
                )}
                aria-hidden
              />
              {displaySolana ? "Solana" : "Base"}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {displaySolana
                ? "Connected with Solana. Agent wallet and paid tools use Solana."
                : "Connected with Base. Agent wallet and paid tools use Base. Use Fuel to add USDC and ETH."}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
      {/* Agent wallet — click opens Fuel modal (copy address from wallet menu) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              navItemClass,
              "max-w-[200px] cursor-pointer border-primary/20 bg-primary/[0.06] text-foreground hover:bg-primary/[0.12] lg:max-w-[220px] xl:max-w-[260px]",
              /* Must be last: navItemClass includes inline-flex which otherwise overrides hidden. */
              "hidden lg:inline-flex",
            )}
            onClick={() => {
              setFuelInitialTab("deposit");
              setFuelModalOpen(true);
            }}
            title={displayBase ? "Add USDC and ETH to your agent wallet" : "Add USDC and SOL to your agent wallet"}
            aria-label={displayBase ? "Open add funds for agent wallet on Base" : "Open add funds for agent wallet on Solana"}
          >
            <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              {agentLoading ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
              ) : agentAddress ? (
                <span className="min-w-0 truncate text-left font-mono text-xs text-foreground">
                  {agentShortAddress ?? `${agentAddress.slice(0, 4)}...${agentAddress.slice(-4)}`}
                </span>
              ) : (
                <span className="truncate text-xs text-muted-foreground">—</span>
              )}
              {agentUsdcDisplay != null && (
                <span
                  key={balanceJustReduced ? "blink" : "normal"}
                  className={cn(
                    "shrink-0 border-l border-border/50 pl-2.5 text-xs tabular-nums",
                    hasUsdcAgent ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                    balanceJustReduced && "balance-blink-red",
                  )}
                >
                  ${formatUsdc(agentUsdcDisplay)}
                </span>
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[220px]">
            Click to add funds to your agent wallet. Copy the agent address from the wallet menu (chevron).
          </p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              navItemClass,
              "max-w-[min(200px,calc(100vw-10rem))] justify-between gap-1.5 font-mono text-xs sm:max-w-[200px]",
            )}
          >
            <span className="min-w-0 truncate text-foreground">{displayShortAddress ?? "…"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn(
            "z-[100] min-w-0 w-[min(22rem,calc(100vw-1.25rem-(env(safe-area-inset-left,0px)+env(safe-area-inset-right,0px))))] max-w-[calc(100vw-1rem)] p-0",
            "rounded-xl border-border/60 bg-popover shadow-lg ring-1 ring-white/[0.04]",
          )}
        >
          {onToggleDarkMode && (
            <div className="border-b border-border/50 p-1 lg:hidden">
              <DropdownMenuItem
                className="cursor-pointer gap-3 rounded-lg px-3 py-2.5 text-sm focus:bg-muted/60"
                onSelect={() => onToggleDarkMode()}
              >
                <span className="flex w-8 shrink-0 justify-center text-foreground" aria-hidden>
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </span>
                <span>{isDarkMode ? "Light mode" : "Dark mode"}</span>
              </DropdownMenuItem>
            </div>
          )}
          {/* Header — same horizontal inset as cards + actions */}
          <div className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
            <span className="text-sm font-semibold tracking-tight text-foreground">Wallets</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              onClick={handleRefreshBalances}
              disabled={balanceRefreshing}
              title="Refresh all balances"
            >
              {balanceRefreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              )}
              Refresh
            </Button>
          </div>

          <div className="space-y-3 px-4 py-3">
            {/* Agent wallet */}
            <div
              className={cn(
                "rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-card/90 to-muted/20 p-3.5 shadow-sm ring-1 ring-white/[0.03] dark:from-emerald-500/[0.08]",
                "space-y-2.5 min-w-0",
              )}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/90">
                Agent wallet {displayBase ? "(Base)" : "(Solana)"}
              </p>
              {agentLoading ? (
                <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  Creating…
                </div>
              ) : agentAddress ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleCopyAgent()}
                    className="group flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border/60 hover:bg-muted/40"
                  >
                    <span className="min-w-0 truncate font-mono text-[13px] text-foreground sm:text-sm" title={agentAddress}>
                      {agentShortAddress ?? agentAddress}
                    </span>
                    <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100" />
                  </button>
                  {displayBase ? (
                    <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-xs tabular-nums">
                      {agentBaseUsdcBalance != null && (
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                            <CoinLogo symbol="USDC" size="xs" />
                            USDC
                          </span>
                          <span
                            className={
                              agentBaseUsdcBalance > 0
                                ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            }
                          >
                            ${agentBaseUsdcBalance.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {agentBaseEthBalance != null && (
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                            <CoinLogo symbol="ETH" size="xs" />
                            ETH
                          </span>
                          <span className="text-muted-foreground">{agentBaseEthBalance.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-xs tabular-nums">
                      {agentUsdcBalance != null && (
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                            <CoinLogo symbol="USDC" size="xs" />
                            USDC
                          </span>
                          <span className={hasUsdc ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                            ${formatUsdc(agentUsdcBalance)}
                          </span>
                        </div>
                      )}
                      {agentSolBalance != null && (
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                            <CoinLogo symbol="SOL" size="xs" />
                            SOL
                          </span>
                          <span className="text-muted-foreground">{agentSolBalance.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 border-t border-border/40 pt-2.5 lg:hidden">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="h-9 min-h-0 flex-1 gap-1.5 text-xs font-semibold touch-manipulation"
                      onClick={() => {
                        setOpen(false);
                        setFuelInitialTab("deposit");
                        setFuelModalOpen(true);
                      }}
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Deposit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 min-h-0 flex-1 gap-1.5 text-xs font-semibold touch-manipulation"
                      onClick={() => {
                        setOpen(false);
                        setFuelInitialTab("withdraw");
                        setFuelModalOpen(true);
                      }}
                    >
                      <ArrowUpFromLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Withdraw
                    </Button>
                  </div>
                </>
              ) : (
                <p className="py-1 text-xs text-muted-foreground">Failed to load</p>
              )}
            </div>

            {/* Connected wallet */}
            <div className="min-w-0 space-y-2.5 rounded-xl border border-border/70 bg-gradient-to-br from-card to-muted/25 p-3.5 shadow-sm ring-1 ring-white/[0.03]">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/90">
                Connected wallet {displaySolana ? "(Solana)" : "(Base)"}
              </p>
              <button
                type="button"
                onClick={() => handleCopyWallet()}
                className="group flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border/60 hover:bg-muted/40"
              >
                <span
                  className="min-w-0 truncate font-mono text-[13px] text-foreground sm:text-sm"
                  title={publicKey?.toBase58() ?? baseAddress ?? undefined}
                >
                  {displaySolana && publicKey
                    ? (connectedWalletShort ?? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`)
                    : baseAddress
                      ? (baseShortAddress ?? `${baseAddress.slice(0, 6)}...${baseAddress.slice(-4)}`)
                      : "…"}
                </span>
                <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100" />
              </button>
              {displaySolana && userUsdcBalance != null && userSolBalance != null && (
                <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-xs tabular-nums">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                      <CoinLogo symbol="USDC" size="xs" />
                      USDC
                    </span>
                    <span className={userUsdcBalance > 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                      ${userUsdcBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                      <CoinLogo symbol="SOL" size="xs" />
                      SOL
                    </span>
                    <span className="text-muted-foreground">{userSolBalance.toFixed(4)}</span>
                  </div>
                </div>
              )}
              {displayBase && (baseUsdcBalance != null || baseEthBalance != null) && (
                <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-xs tabular-nums">
                  {baseUsdcBalance != null && (
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                        <CoinLogo symbol="USDC" size="xs" />
                        USDC
                      </span>
                      <span className={baseUsdcBalance > 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                        ${baseUsdcBalance.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {baseEthBalance != null && (
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                        <CoinLogo symbol="ETH" size="xs" />
                        ETH
                      </span>
                      <span className="text-muted-foreground">{baseEthBalance.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border/50 px-0 pb-2 pt-1">
            <DropdownMenuItem
              className="cursor-pointer gap-0 rounded-lg px-4 py-2.5 text-sm focus:bg-muted/60"
              onSelect={() => {
                setOpen(false);
                navigate("/settings");
              }}
            >
              <span className="flex w-8 shrink-0 justify-center">
                <Settings className="h-4 w-4 opacity-80" aria-hidden />
              </span>
              <span>Profile & settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-0 rounded-lg px-4 py-2.5 text-sm focus:bg-muted/60"
              onSelect={handleChangeWallet}
            >
              <span className="flex w-8 shrink-0 justify-center">
                <ArrowLeftRight className="h-4 w-4 opacity-80" aria-hidden />
              </span>
              <span>Change wallet</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-0 rounded-lg px-4 py-2.5 text-sm focus:bg-muted/60"
              onSelect={() => {
                setOpen(false);
                setFeedbackModalOpen(true);
              }}
            >
              <span className="flex w-8 shrink-0 justify-center">
                <MessageSquare className="h-4 w-4 opacity-80" aria-hidden />
              </span>
              <span>Feedback</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-2 my-1 bg-border/60" />
            <DropdownMenuItem
              className={cn(
                "cursor-pointer gap-0 rounded-lg px-4 py-2.5 text-sm font-medium",
                "text-red-600 dark:text-red-400",
                "focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-400",
                "data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-600 dark:data-[highlighted]:text-red-400",
              )}
              onSelect={(e) => {
                e.preventDefault();
                handleDisconnect();
              }}
              disabled={disconnecting}
            >
              <span className="flex w-8 shrink-0 justify-center text-red-600 dark:text-red-400">
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin opacity-90" aria-hidden />
                ) : (
                  <LogOut className="h-4 w-4 opacity-90" aria-hidden />
                )}
              </span>
              <span>{disconnecting ? "Disconnecting…" : "Disconnect"}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <FuelAgentModal open={fuelModalOpen} onOpenChange={setFuelModalOpen} initialFlowTab={fuelInitialTab} />
      <FeedbackModal open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen} />
    </div>
  );
}
