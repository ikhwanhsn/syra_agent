import { useCallback, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { buildSolscanAccountUrl } from "@/lib/riseDashboardApi";
import { useWallet } from "@/lib/WalletContext";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY, type DashboardDictionary } from "@/lib/dashboardI18n";

const PHANTOM_ICON = "/images/partners/phantom.png";

const triggerChrome = cn(
  "h-9 min-h-[44px] sm:min-h-0 rounded-xl border border-border/60 bg-muted/25 shadow-sm backdrop-blur-sm",
  "inline-flex items-center gap-2 text-sm font-medium transition-[colors,box-shadow,transform] duration-200",
  "hover:bg-muted/40 active:scale-[0.99] touch-manipulation",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

const menuItemClass =
  "cursor-pointer gap-0 rounded-lg px-4 py-2.5 text-sm focus:bg-muted/60 data-[highlighted]:bg-muted/60";

function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function PhantomMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-background/80 shadow-inner ring-1 ring-white/[0.06]",
        className,
      )}
    >
      <img src={PHANTOM_ICON} alt="" className="h-5 w-5 object-contain" aria-hidden />
    </span>
  );
}

function StatusDot() {
  return (
    <span
      className={cn(
        "relative flex h-2.5 w-2.5 shrink-0 rounded-full bg-uof",
        "shadow-[0_0_0_2px_hsl(var(--background)),0_0_12px_hsl(var(--uof)/0.55)]",
        "before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-uof/40 before:opacity-75",
      )}
      aria-hidden
    />
  );
}

function WalletDropdownPanel({
  publicKey,
  copy,
  solscanUrl,
  disconnecting,
  onCopy,
  onDisconnect,
}: {
  publicKey: string;
  copy: DashboardDictionary["walletButton"];
  solscanUrl: string | null;
  disconnecting: boolean;
  onCopy: () => void;
  onDisconnect: () => void;
}) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-16 -top-20 h-40 w-40 rounded-full bg-uof/12 blur-3xl" />
        <div className="absolute -bottom-16 -right-10 h-36 w-36 rounded-full bg-foreground/[0.04] blur-3xl" />
      </div>

      <div className="relative flex items-center justify-between gap-3 border-b border-border/50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/30 shadow-sm">
            <Wallet className="h-4 w-4 text-foreground" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-foreground">{copy.menuTitle}</p>
            <p className="text-[11px] text-muted-foreground">{copy.walletConnected}</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-uof shadow-[0_0_8px_hsl(var(--uof)/0.5)]" aria-hidden />
          {copy.solana}
        </span>
      </div>

      <div className="relative px-4 py-3">
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-uof/20 p-3.5 shadow-sm ring-1 ring-white/[0.04]",
            "bg-gradient-to-br from-uof/[0.1] via-card/95 to-muted/20",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,hsl(var(--uof)/0.12),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/90">
                {copy.connectedWallet}
              </p>
              <button
                type="button"
                onClick={onCopy}
                className="group mt-2 flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border/50 hover:bg-background/50"
              >
                <span
                  className="min-w-0 truncate font-mono text-[13px] text-foreground sm:text-sm"
                  title={publicKey}
                >
                  {publicKey}
                </span>
                <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
            <PhantomMark />
          </div>
          <div className="relative mt-3 flex items-center gap-2 border-t border-border/40 pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-uof/25 bg-uof/[0.08] px-2 py-1 text-[11px] font-medium text-foreground">
              <ShieldCheck className="h-3 w-3 text-uof" aria-hidden />
              {copy.walletConnected}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3 text-uof" aria-hidden />
              Phantom
            </span>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/50 pb-2 pt-1">
        <DropdownMenuItem className={menuItemClass} onSelect={onCopy}>
          <span className="flex w-8 shrink-0 justify-center text-muted-foreground">
            <Copy className="h-4 w-4 opacity-80" aria-hidden />
          </span>
          <span>{copy.copyAddress}</span>
        </DropdownMenuItem>
        {solscanUrl ? (
          <DropdownMenuItem asChild className={menuItemClass}>
            <a href={solscanUrl} target="_blank" rel="noopener noreferrer">
              <span className="flex w-8 shrink-0 justify-center text-muted-foreground">
                <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
              </span>
              <span>{copy.viewOnSolscan}</span>
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className="mx-3 my-1.5 bg-border/60" />
        <DropdownMenuItem
          className={cn(
            menuItemClass,
            "font-medium text-red-600 dark:text-red-400",
            "focus:bg-red-500/10 focus:text-red-600 dark:focus:text-red-400",
            "data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-600 dark:data-[highlighted]:text-red-400",
          )}
          disabled={disconnecting}
          onSelect={(e) => {
            e.preventDefault();
            onDisconnect();
          }}
        >
          <span className="flex w-8 shrink-0 justify-center text-red-600 dark:text-red-400">
            {disconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin opacity-90" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4 opacity-90" aria-hidden />
            )}
          </span>
          <span>{disconnecting ? copy.disconnecting : copy.disconnect}</span>
        </DropdownMenuItem>
      </div>
    </>
  );
}

export function ConnectWalletButton() {
  const { status, hasProvider, publicKey, connect, disconnect } = useWallet();
  const { language } = useLanguage();
  const wb = DASHBOARD_COPY[language].walletButton;
  const [open, setOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleCopyAddress = useCallback(() => {
    if (!publicKey) return;
    void navigator.clipboard.writeText(publicKey);
    toast.success(wb.walletAddressCopied);
  }, [publicKey, wb.walletAddressCopied]);

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await disconnect();
      setOpen(false);
    } finally {
      setDisconnecting(false);
    }
  }, [disconnect]);

  if (!hasProvider) {
    return (
      <Button
        asChild
        size="sm"
        variant="outline"
        className={cn(
          triggerChrome,
          "gap-2.5 border-dashed px-3 text-foreground hover:border-uof/35 hover:bg-uof/[0.06] sm:px-3.5",
        )}
      >
        <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer">
          <PhantomMark className="h-6 w-6" />
          <span className="max-sm:hidden">{wb.installPhantom}</span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground max-sm:hidden" aria-hidden />
        </a>
      </Button>
    );
  }

  if (!publicKey) {
    const isConnecting = status === "connecting";
    return (
      <Button
        size="sm"
        className={cn(
          "h-9 min-h-[44px] gap-2 rounded-xl px-3.5 font-semibold sm:min-h-0 sm:px-4",
          "border border-uof/35 bg-uof text-uof-foreground shadow-[0_1px_0_0_hsl(var(--uof-foreground)/0.12)_inset,0_10px_28px_-12px_hsl(var(--uof)/0.7)]",
          "hover:bg-uof/92 hover:shadow-[0_1px_0_0_hsl(var(--uof-foreground)/0.14)_inset,0_14px_32px_-12px_hsl(var(--uof)/0.8)]",
          "disabled:pointer-events-none disabled:opacity-75 touch-manipulation active:scale-[0.99]",
        )}
        onClick={() => void connect()}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <PhantomMark className="h-6 w-6 border-uof/20 bg-uof-foreground/10" />
        )}
        <span className="truncate">
          <span className="min-[380px]:hidden">{isConnecting ? "…" : "Connect"}</span>
          <span className="hidden min-[380px]:inline">
            {isConnecting ? wb.connecting : wb.connectWallet}
          </span>
        </span>
      </Button>
    );
  }

  const solscanUrl = buildSolscanAccountUrl(publicKey);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            triggerChrome,
            "max-w-[min(11.5rem,calc(100vw-8rem))] justify-between gap-1.5 px-2.5 font-mono text-xs sm:max-w-[12.5rem] sm:px-3",
            open && "border-uof/30 bg-uof/[0.06] ring-1 ring-uof/15",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <StatusDot />
            <span className="truncate text-foreground">{shortenAddress(publicKey)}</span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(
          "z-[100] w-[min(22rem,calc(100vw-1.25rem-(env(safe-area-inset-left,0px)+env(safe-area-inset-right,0px))))] max-w-[calc(100vw-1rem)] overflow-hidden p-0",
          "rounded-2xl border-border/60 bg-popover/95 shadow-[0_24px_64px_-24px_hsl(0_0%_0%/0.55)] ring-1 ring-white/[0.05] backdrop-blur-xl",
        )}
      >
        <WalletDropdownPanel
          publicKey={publicKey}
          copy={wb}
          solscanUrl={solscanUrl}
          disconnecting={disconnecting}
          onCopy={handleCopyAddress}
          onDisconnect={() => void handleDisconnect()}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
