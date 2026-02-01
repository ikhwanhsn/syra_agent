import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
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
import { Copy, ChevronDown, Wallet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WalletNav() {
  const { publicKey, disconnect } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const {
    ready,
    agentAddress,
    agentShortAddress,
    connectedWalletShort,
    agentUsdcBalance,
    agentSolBalance,
  } = useAgentWallet();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

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
        className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs sm:text-sm px-2 sm:px-3 touch-manipulation shrink-0"
        onClick={() => setWalletModalVisible(true)}
      >
        <Wallet className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
        Connect Wallet
      </Button>
    );
  }

  const navItemClass =
    "h-9 rounded-lg border border-border bg-background px-2 sm:px-3 gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm inline-flex items-center min-w-0";

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
      {/* Agent wallet – same height & style as connected wallet */}
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
              className={`shrink-0 text-xs tabular-nums ${hasUsdc ? "font-semibold text-emerald-500" : "text-muted-foreground"}`}
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
            className={`${navItemClass} min-w-0 max-w-[140px] sm:max-w-[180px] justify-between`}
          >
            <span className="truncate">{connectedWalletShort ?? "…"}</span>
            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 z-[100]">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Agent wallet (deposit here)
          </DropdownMenuLabel>
          {agentLoading ? (
            <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Creating…</span>
            </div>
          ) : agentAddress ? (
            <>
              <DropdownMenuItem
                className="flex flex-col items-stretch gap-1 cursor-pointer py-2"
                onSelect={(e) => {
                  e.preventDefault();
                  handleCopyAgent();
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs" title={agentAddress}>
                    {agentShortAddress ?? agentAddress}
                  </span>
                  <Copy className="h-3.5 w-3.5 shrink-0 opacity-70" />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {agentUsdcBalance != null && (
                    <span className={hasUsdc ? "font-medium text-emerald-600 dark:text-emerald-400" : ""}>
                      ${formatUsdc(agentUsdcBalance)} USDC
                    </span>
                  )}
                  {agentSolBalance != null && (
                    <span>{agentSolBalance.toFixed(4)} SOL</span>
                  )}
                </div>
              </DropdownMenuItem>
              <p className="px-2 py-1 text-[10px] text-muted-foreground">
                Agent pays for API calls automatically
              </p>
            </>
          ) : (
            <div className="px-2 py-2 text-xs text-muted-foreground">
              Failed to load
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Connected wallet
          </DropdownMenuLabel>
          <DropdownMenuItem
            className="flex items-center justify-between gap-2 cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              handleCopyWallet();
            }}
          >
            <span className="truncate font-mono text-xs">
              {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
            </span>
            <Copy className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onSelect={handleChangeWallet}>
          Change wallet
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={handleDisconnect}
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}
