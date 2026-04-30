import { Copy, ExternalLink, LogOut, ShieldCheck, Wallet } from "lucide-react";
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
import { useWallet } from "@/lib/WalletContext";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { status, hasProvider, publicKey, connect, disconnect } = useWallet();
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];

  if (!hasProvider) {
    return (
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-9 rounded-xl border-border/65 bg-background/65 px-3 text-foreground shadow-sm backdrop-blur hover:bg-background/85 max-sm:px-2.5"
      >
        <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer">
          <Wallet className="h-4 w-4" />
          <span className="max-sm:hidden">{copy.walletButton.installPhantom}</span>
        </a>
      </Button>
    );
  }

  if (!publicKey) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-9 rounded-xl border-border/65 bg-background/65 px-3 text-foreground shadow-sm backdrop-blur hover:bg-background/85 max-sm:px-2.5"
        onClick={() => void connect()}
        disabled={status === "connecting"}
      >
        <Wallet className={cn("h-4 w-4", status === "connecting" && "animate-pulse")} />
        <span className="max-sm:hidden">
          {status === "connecting" ? copy.walletButton.connecting : copy.walletButton.connectWallet}
        </span>
      </Button>
    );
  }

  const solscanUrl = buildSolscanAccountUrl(publicKey);
  const toneClass = "bg-success";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-2 rounded-xl border-border/65 bg-background/65 px-3 text-foreground shadow-sm backdrop-blur hover:bg-background/85 max-sm:px-2.5"
        >
          <span className={cn("h-2 w-2 rounded-full", toneClass)} aria-hidden />
          <span className="font-mono text-xs">{shortenAddress(publicKey)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[19rem] rounded-2xl border border-border/60 bg-popover p-1.5 shadow-[0_18px_52px_-20px_hsl(0_0%_0%/0.6)] backdrop-blur-xl"
      >
        <DropdownMenuLabel className="rounded-xl border border-border/60 bg-muted/25 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">{copy.walletButton.connectedWallet}</p>
              <p className="mt-1 truncate font-mono text-xs text-foreground">{publicKey}</p>
            </div>
            <span className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", toneClass)} aria-hidden />
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/65 px-2 py-1 text-[0.65rem] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            {copy.walletButton.walletConnected}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-1 my-1" />
        <DropdownMenuItem
          className="rounded-lg px-3 py-2.5 text-sm focus:bg-muted/60"
          onClick={() => {
            void navigator.clipboard.writeText(publicKey);
            toast.success(copy.walletButton.walletAddressCopied);
          }}
        >
          <span className="mr-2 inline-flex w-5 justify-center text-muted-foreground">
            <Copy className="h-4 w-4" />
          </span>
          {copy.walletButton.copyAddress}
        </DropdownMenuItem>
        {solscanUrl ? (
          <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 text-sm focus:bg-muted/60">
            <a href={solscanUrl} target="_blank" rel="noopener noreferrer">
              <span className="mr-2 inline-flex w-5 justify-center text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
              </span>
              {copy.walletButton.viewOnSolscan}
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className="mx-1 my-1" />
        <DropdownMenuItem
          className="rounded-lg px-3 py-2.5 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
          onClick={() => void disconnect()}
        >
          <span className="mr-2 inline-flex w-5 justify-center text-destructive">
            <LogOut className="h-4 w-4" />
          </span>
          {copy.walletButton.disconnect}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
