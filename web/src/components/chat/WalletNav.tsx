import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "@/lib/navigation";
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
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  RefreshCw,
  Sun,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notify } from "@/lib/notify";
import { FeedbackModal } from "./FeedbackModal";
import { cn } from "@/lib/utils";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { shortenAgentAddress } from "@/lib/agentWalletCatalog";

const LAMPORTS_PER_SOL = 1e9;
const USDC_MINT_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export interface WalletNavProps {
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

function formatUsdcDisplay(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatSolDisplay(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 100) return value.toFixed(2);
  if (value >= 1) return value.toFixed(3);
  return value.toFixed(4);
}

export function WalletNav(props: WalletNavProps = {}) {
  const { isDarkMode = true, onToggleDarkMode } = props;
  const { connection, publicKey, disconnect, connected } = useWalletContext();
  const { openConnectModal } = useConnectModal();
  const {
    ready,
    agentAddress,
    connectedWalletShort,
    agentUsdcBalance,
    agentSolBalance,
    lpAgentAddress,
    lpAgentUsdcBalance,
    lpAgentSolBalance,
    refetchBalance,
    refetchLpBalance,
  } = useAgentWallet();
  const hasAnyWallet = connected && !!publicKey;
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [userUsdcBalance, setUserUsdcBalance] = useState<number | null>(null);
  const [userSolBalance, setUserSolBalance] = useState<number | null>(null);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  const walletLabel = publicKey
    ? (connectedWalletShort ?? shortenAgentAddress(publicKey.toBase58()))
    : "…";

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

  const goToWalletPage = useCallback(
    (tab: "deposit" | "withdraw" = "deposit", wallet: "chat" | "lp" = "chat") => {
      setOpen(false);
      navigate(`/wallet?tab=${tab}&wallet=${wallet}#move-funds`);
    },
    [navigate],
  );

  const handleRefreshBalances = useCallback(async () => {
    setBalanceRefreshing(true);
    try {
      const tasks = [refetchBalance(), refetchLpBalance()];
      if (publicKey) tasks.push(fetchUserBalance());
      await Promise.all(tasks);
      notify.success("Balances updated");
    } catch {
      notify.error("Could not refresh balances");
    } finally {
      setBalanceRefreshing(false);
    }
  }, [refetchBalance, refetchLpBalance, fetchUserBalance, publicKey, toast]);

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
  }, [disconnect, toast]);

  const agentLoading = hasAnyWallet && !ready;

  const totalAgentUsdc = useMemo(() => {
    const chat = agentUsdcBalance ?? 0;
    const lp = lpAgentUsdcBalance ?? 0;
    if (agentUsdcBalance == null && lpAgentUsdcBalance == null) return null;
    return chat + lp;
  }, [agentUsdcBalance, lpAgentUsdcBalance]);

  const totalAgentSol = useMemo(() => {
    const chat = agentSolBalance ?? 0;
    const lp = lpAgentSolBalance ?? 0;
    if (agentSolBalance == null && lpAgentSolBalance == null) return null;
    return chat + lp;
  }, [agentSolBalance, lpAgentSolBalance]);

  const showLpSplit = Boolean(lpAgentAddress && (lpAgentUsdcBalance != null || lpAgentSolBalance != null));

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
            {isDarkMode ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
          </Button>
        )}
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

  const navItemClass =
    "h-9 min-h-[44px] sm:min-h-0 rounded-xl border border-border/60 bg-muted/25 px-2.5 shadow-sm backdrop-blur-sm sm:px-3 gap-2 text-sm font-medium inline-flex items-center min-w-0 touch-manipulation transition-colors hover:bg-muted/40";

  return (
    <div className="flex min-w-0 max-w-full shrink-0 items-center justify-end">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(navItemClass, "max-w-[min(12rem,calc(100vw-10rem))] justify-between gap-1.5 font-medium")}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Wallet className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate text-foreground">Wallet</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground/70" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className={cn(
            "z-[100] w-[min(19.5rem,calc(100vw-1.5rem))] overflow-hidden p-0",
            "rounded-2xl border border-border/50 bg-popover/95 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl",
            "dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.65)]",
          )}
        >
          {onToggleDarkMode && (
            <div className="border-b border-border/40 p-1.5 lg:hidden">
              <DropdownMenuItem
                className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm focus:bg-muted/60"
                onSelect={() => onToggleDarkMode()}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
            </div>
          )}

          {/* Connected identity */}
          <div className="border-b border-border/40 bg-muted/20 px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-muted-foreground">Connected</p>
                <button
                  type="button"
                  onClick={() => publicKey && copyAddress(publicKey.toBase58(), "Wallet address")}
                  className="group mt-1 flex max-w-full items-center gap-2 text-left"
                  title={publicKey?.toBase58()}
                >
                  <span className="truncate font-mono text-sm font-medium text-foreground">{walletLabel}</span>
                  {addressCopied ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
                  )}
                </button>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-border/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9945FF]" aria-hidden />
                  Solana
                </span>
              </div>
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
          </div>

          {/* Agent balance — primary focus */}
          <div className="px-4 py-4">
            <p className="text-[11px] font-medium text-muted-foreground">Agent balance</p>
            {agentLoading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Setting up…
              </div>
            ) : (
              <>
                <div className="mt-1 flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-2xl font-semibold tracking-tight text-foreground">
                    ${formatUsdcDisplay(totalAgentUsdc)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">USDC</span>
                </div>
                <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                  {formatSolDisplay(totalAgentSol)} SOL
                </p>

                {showLpSplit ? (
                  <div className="mt-3 space-y-1.5 rounded-xl bg-muted/25 px-3 py-2.5 text-xs tabular-nums ring-1 ring-inset ring-border/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Chat agent</span>
                      <span className="font-medium text-foreground">
                        ${formatUsdcDisplay(agentUsdcBalance)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">LP agent</span>
                      <span className="font-medium text-foreground">
                        ${formatUsdcDisplay(lpAgentUsdcBalance)}
                      </span>
                    </div>
                  </div>
                ) : null}

                <Button
                  type="button"
                  className="mt-4 h-10 w-full rounded-xl text-sm font-semibold shadow-sm"
                  onClick={() => goToWalletPage("deposit", "chat")}
                  disabled={!agentAddress}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add funds
                </Button>

                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => goToWalletPage("withdraw", "chat")}
                >
                  Manage & withdraw
                  <ChevronRight className="h-4 w-4 opacity-70" />
                </button>
              </>
            )}
          </div>

          {/* Your wallet — compact */}
          {userUsdcBalance != null && userSolBalance != null ? (
            <div className="border-t border-border/40 px-4 py-3">
              <p className="text-[11px] font-medium text-muted-foreground">In your wallet</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <CoinLogo symbol="USDC" size="xs" />
                  ${formatUsdcDisplay(userUsdcBalance)}
                </span>
                <span className="text-muted-foreground/40" aria-hidden>
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CoinLogo symbol="SOL" size="xs" />
                  {formatSolDisplay(userSolBalance)} SOL
                </span>
              </div>
            </div>
          ) : null}

          {/* Account actions */}
          <div className="border-t border-border/40 p-1.5">
            <DropdownMenuItem
              className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm focus:bg-muted/60"
              onSelect={() => {
                setOpen(false);
                openConnectModal();
              }}
            >
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
              Switch wallet
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-sm focus:bg-muted/60"
              onSelect={() => {
                setOpen(false);
                setFeedbackModalOpen(true);
              }}
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Feedback
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border/40" />
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

      <FeedbackModal open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen} />
    </div>
  );
}
