import { Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { buildSolscanAccountUrl } from "@/lib/riseDashboardApi";
import { useUponlyAccess } from "@/lib/useUponlyAccess";
import { useWallet } from "@/lib/WalletContext";

function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { status, hasProvider, publicKey, connect, disconnect } = useWallet();
  const access = useUponlyAccess();

  if (!hasProvider) {
    return (
      <Button asChild size="sm" className="h-9 max-sm:px-2.5">
        <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer">
          <Wallet className="h-4 w-4" />
          <span className="max-sm:hidden">Install Phantom</span>
        </a>
      </Button>
    );
  }

  if (!publicKey) {
    return (
      <Button size="sm" className="h-9 max-sm:px-2.5" onClick={() => void connect()} disabled={status === "connecting"}>
        <Wallet className={cn("h-4 w-4", status === "connecting" && "animate-pulse")} />
        <span className="max-sm:hidden">{status === "connecting" ? "Connecting..." : "Connect wallet"}</span>
      </Button>
    );
  }

  const solscanUrl = buildSolscanAccountUrl(publicKey);
  const toneClass =
    access.state === "granted"
      ? "bg-success"
      : access.state === "no-uponly"
        ? "bg-amber-400"
        : "bg-muted-foreground/70";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="h-9 gap-2 max-sm:px-2.5">
          <span className={cn("h-2 w-2 rounded-full", toneClass)} aria-hidden />
          <span className="font-mono text-xs">{shortenAddress(publicKey)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-mono text-xs">{publicKey}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void navigator.clipboard.writeText(publicKey);
            toast.success("Wallet address copied");
          }}
        >
          <Copy className="mr-2 h-4 w-4" /> Copy address
        </DropdownMenuItem>
        {solscanUrl ? (
          <DropdownMenuItem asChild>
            <a href={solscanUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> View on Solscan
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void disconnect()}>
          <LogOut className="mr-2 h-4 w-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
