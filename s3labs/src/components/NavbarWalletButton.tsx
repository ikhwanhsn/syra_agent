import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useQuery } from "@tanstack/react-query";
import { Copy, LogOut, User, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchWalletPoints } from "@/lib/kolApi";
import { siteNavDropdownZ } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

type NavbarWalletLayout = "header" | "drawer";

interface NavbarWalletButtonProps {
  className?: string;
  layout?: NavbarWalletLayout;
}

function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function NavbarWalletButton({
  className,
  layout = "header",
}: NavbarWalletButtonProps) {
  const { publicKey, connecting, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const isDrawer = layout === "drawer";

  const address = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const pointsQuery = useQuery({
    queryKey: ["wallet-points", address],
    queryFn: () => fetchWalletPoints(address!),
    enabled: Boolean(address && connected),
    staleTime: 60_000,
  });

  const totalPoints = pointsQuery.data?.totalPoints ?? 0;

  const copyAddress = useCallback(async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    toast.success("Address copied");
  }, [address]);

  if (connecting) {
    return (
      <Button
        variant="heroOutline"
        size="sm"
        disabled
        className={cn(
          "navbar-wallet-btn navbar-wallet-btn--loading rounded-full",
          isDrawer ? "h-11 w-full px-4" : "h-9 px-3 md:px-4",
          className,
        )}
      >
        <Wallet className="h-4 w-4 shrink-0" />
        <span>Connecting…</span>
      </Button>
    );
  }

  if (connected && address) {
    if (isDrawer) {
      return (
        <div className={cn("flex min-w-0 flex-col gap-2 w-full", className)}>
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Connected wallet</p>
              <p className="font-mono text-sm truncate">{shortenAddress(address, 6)}</p>
            </div>
            {totalPoints > 0 ? (
              <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">
                {formatPoints(totalPoints)} pts
              </Badge>
            ) : null}
          </div>
          <Button asChild variant="outline" className="h-11 w-full rounded-full">
            <Link to="/profile">
              <User className="h-4 w-4 mr-2" />
              View profile
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full rounded-full"
            onClick={() => void copyAddress()}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy address
          </Button>
          <Button
            variant="ghost"
            className="h-11 w-full rounded-full text-muted-foreground"
            onClick={() => disconnect()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="heroOutline"
            size="sm"
            className={cn(
              "navbar-wallet-btn navbar-wallet-btn--connected rounded-full font-mono text-xs gap-1.5",
              "h-9 max-w-[9rem] px-2.5 md:max-w-none md:px-3",
              className,
            )}
          >
            <Wallet className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{shortenAddress(address, 3)}</span>
            {totalPoints > 0 ? (
              <Badge
                variant="outline"
                className="hidden sm:inline-flex h-5 px-1.5 text-[10px] border-primary/30 text-primary shrink-0"
              >
                {formatPoints(totalPoints)} pts
              </Badge>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={10}
          collisionPadding={12}
          className={cn(
            "nav-bar-panel min-w-[200px] rounded-xl border-border/60 p-1.5 shadow-elevated",
            siteNavDropdownZ,
          )}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Wallet</span>
              <span className="font-mono text-xs truncate">{shortenAddress(address, 6)}</span>
              {totalPoints > 0 ? (
                <span className="text-xs text-primary font-medium">
                  {formatPoints(totalPoints)} S3Labs Points
                </span>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
            <Link to="/profile">
              <User className="h-4 w-4 mr-2" />
              View profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => void copyAddress()}>
            <Copy className="h-4 w-4 mr-2" />
            Copy address
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer rounded-lg text-muted-foreground focus:text-destructive"
            onClick={() => disconnect()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      variant="hero"
      size="sm"
      onClick={() => setVisible(true)}
      className={cn(
        "navbar-wallet-btn navbar-wallet-btn--connect btn-premium rounded-full",
        isDrawer ? "h-11 w-full px-4" : "h-9 px-3 md:px-4",
        className,
      )}
      aria-label="Connect wallet"
    >
      <Wallet className="h-4 w-4 shrink-0" />
      <span className={isDrawer ? "inline" : "hidden md:inline"}>Connect Wallet</span>
    </Button>
  );
}
