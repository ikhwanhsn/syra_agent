import { useState, useCallback, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, ChevronDown, Wallet, Loader2, Zap, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FuelAgentModal } from "./FuelAgentModal";

const LAMPORTS_PER_SOL = 1e9;
const USDC_MINT_MAINNET = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export function WalletNav() {
  const { connection } = useConnection();
  const { publicKey, disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const {
    ready,
    agentAddress,
    agentShortAddress,
    connectedWalletShort,
    agentUsdcBalance,
    agentSolBalance,
    lastDebitUsd,
    refetchBalance,
  } = useAgentWallet();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [userUsdcBalance, setUserUsdcBalance] = useState<number | null>(null);
  const [userSolBalance, setUserSolBalance] = useState<number | null>(null);
  const [balanceRefreshing, setBalanceRefreshing] = useState(false);

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
      await Promise.all([refetchBalance(), fetchUserBalance()]);
      toast({ title: "Balances updated", description: "Latest balances loaded." });
    } catch {
      toast({ title: "Refresh failed", variant: "destructive" });
    } finally {
      setBalanceRefreshing(false);
    }
  }, [refetchBalance, fetchUserBalance, toast]);

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
    setOpen(false);
  };

  const handleCopyAgent = () => {
    if (agentAddress) copyToClipboard(agentAddress, "Agent wallet address");
    setOpen(false);
  };

  const handleChangeWallet = () => {
    setWalletModalVisible(true);
    setOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setOpen(false);
  };

  const connected = !!publicKey;
  const agentLoading = connected && !ready;
  const hasUsdc = agentUsdcBalance != null && agentUsdcBalance > 0;

  function formatUsdc(value: number | null | undefined): string {
    if (value == null) return "—";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return value.toFixed(2);
  }

  if (!connected) {
    return (
      <Button
        className="h-10 sm:h-9 min-h-[44px] sm:min-h-0 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs sm:text-sm px-3 sm:px-3 touch-manipulation shrink-0"
        onClick={() => setWalletModalVisible(true)}
      >
        <Wallet className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
        Connect Wallet
      </Button>
    );
  }

  const navItemClass =
    "h-10 sm:h-9 min-h-[44px] sm:min-h-0 rounded-lg border border-border bg-background px-2.5 sm:px-3 gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm inline-flex items-center min-w-0 touch-manipulation";

  const balanceJustReduced = lastDebitUsd != null && lastDebitUsd > 0;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
      {/* Fuel the agent – open top-up modal */}
      {connected && (
        <Button
          variant="outline"
          size="sm"
          className="h-10 sm:h-9 min-h-[44px] sm:min-h-0 rounded-lg font-medium text-xs sm:text-sm px-2.5 sm:px-3 gap-1.5 shrink-0 touch-manipulation"
          onClick={() => setFuelModalOpen(true)}
          title="Add USDC and SOL to agent wallet"
          aria-label="Fuel the agent"
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span>Fuel</span>
        </Button>
      )}
      {/* Agent wallet – same height & style as connected wallet; red blink when balance reduced by tool */}
      <div
        className={`hidden md:flex ${navItemClass} max-w-[180px] lg:max-w-[220px]`}
        title="Agent wallet · Click address to copy"
      >
        <Wallet className="w-4 h-4 shrink-0 text-muted-foreground" />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {agentLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
          ) : agentAddress ? (
            <button
              type="button"
              onClick={() => copyToClipboard(agentAddress, "Agent wallet address")}
              className="font-mono text-xs text-foreground hover:text-primary truncate focus:outline-none focus:underline text-left"
            >
              {agentShortAddress ?? `${agentAddress.slice(0, 4)}...${agentAddress.slice(-4)}`}
            </button>
          ) : (
            <span className="text-xs text-muted-foreground truncate">—</span>
          )}
          {agentUsdcBalance != null && (
            <span
              key={balanceJustReduced ? "blink" : "normal"}
              className={`shrink-0 text-xs tabular-nums rounded px-0.5 ${hasUsdc ? "font-semibold text-emerald-500" : "text-muted-foreground"} ${balanceJustReduced ? "balance-blink-red" : ""}`}
              title="USDC balance"
            >
              ${formatUsdc(agentUsdcBalance)}
            </span>
          )}
        </div>
      </div>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`${navItemClass} min-w-0 max-w-[130px] sm:max-w-[180px] justify-between`}
          >
            <span className="truncate">{connectedWalletShort ?? "…"}</span>
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)] z-[100] p-0 gap-0">
          {/* Header with refresh */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/60">
            <span className="text-xs font-medium text-muted-foreground">Wallets</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground -mr-1"
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

          <div className="p-3 space-y-3">
            {/* Agent wallet card */}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Agent wallet
              </p>
              {agentLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  Creating…
                </div>
              ) : agentAddress ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleCopyAgent()}
                    className="flex items-center justify-between gap-2 w-full rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-muted/50 transition-colors text-left group"
                  >
                    <span className="truncate font-mono text-xs text-foreground" title={agentAddress}>
                      {agentShortAddress ?? agentAddress}
                    </span>
                    <Copy className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-80" />
                  </button>
                  <div className="flex items-center gap-4 text-xs pt-0.5">
                    {agentUsdcBalance != null && (
                      <span className={hasUsdc ? "font-medium text-emerald-600 dark:text-emerald-400 tabular-nums" : "text-muted-foreground tabular-nums"}>
                        ${formatUsdc(agentUsdcBalance)} USDC
                      </span>
                    )}
                    {agentSolBalance != null && (
                      <span className="text-muted-foreground tabular-nums">{agentSolBalance.toFixed(4)} SOL</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground py-1">Failed to load</p>
              )}
            </div>

            {/* Connected wallet card */}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Connected wallet
              </p>
              <button
                type="button"
                onClick={() => handleCopyWallet()}
                className="flex items-center justify-between gap-2 w-full rounded px-1.5 py-0.5 -mx-1.5 -my-0.5 hover:bg-muted/50 transition-colors text-left group"
              >
                <span className="truncate font-mono text-xs text-foreground" title={publicKey?.toBase58()}>
                  {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                </span>
                <Copy className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-80" />
              </button>
              {userUsdcBalance != null && userSolBalance != null && (
                <div className="flex items-center gap-4 text-xs pt-0.5">
                  <span className={userUsdcBalance > 0 ? "font-medium text-emerald-600 dark:text-emerald-400 tabular-nums" : "text-muted-foreground tabular-nums"}>
                    ${userUsdcBalance.toFixed(2)} USDC
                  </span>
                  <span className="text-muted-foreground tabular-nums">{userSolBalance.toFixed(4)} SOL</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border/60 py-1">
            <DropdownMenuItem className="cursor-pointer py-2.5 text-sm rounded-none focus:bg-muted/50" onSelect={handleChangeWallet}>
              Change wallet
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer py-2.5 text-sm text-destructive focus:text-destructive focus:bg-destructive/10 rounded-none"
              onSelect={handleDisconnect}
            >
              Disconnect
            </DropdownMenuItem>
          </div>
      </DropdownMenuContent>
    </DropdownMenu>

      <FuelAgentModal
        open={fuelModalOpen}
        onOpenChange={setFuelModalOpen}
      />
    </div>
  );
}
