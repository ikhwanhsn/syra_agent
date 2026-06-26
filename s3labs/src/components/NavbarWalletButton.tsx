import { useCallback, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavbarWalletLayout = "header" | "drawer";

interface NavbarWalletButtonProps {
  className?: string;
  layout?: NavbarWalletLayout;
}

function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export function NavbarWalletButton({
  className,
  layout = "header",
}: NavbarWalletButtonProps) {
  const { publicKey, connecting, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const isDrawer = layout === "drawer";

  const address = useMemo(() => publicKey?.toBase58() ?? null, [publicKey]);

  const handleClick = useCallback(() => {
    if (connected && address) {
      void navigator.clipboard.writeText(address);
      return;
    }
    setVisible(true);
  }, [address, connected, setVisible]);

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
    return (
      <div
        className={cn(
          "flex min-w-0 items-center",
          isDrawer ? "w-full flex-col gap-2" : "gap-1",
          className,
        )}
      >
        <Button
          variant="heroOutline"
          size="sm"
          onClick={handleClick}
          title="Click to copy address"
          className={cn(
            "navbar-wallet-btn navbar-wallet-btn--connected rounded-full font-mono text-xs",
            isDrawer
              ? "h-11 w-full px-4"
              : "h-9 max-w-[6.75rem] px-2.5 md:max-w-none md:px-3",
          )}
        >
          <Wallet className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{shortenAddress(address, isDrawer ? 6 : 3)}</span>
        </Button>
        <Button
          variant={isDrawer ? "outline" : "ghost"}
          size="sm"
          onClick={() => disconnect()}
          className={cn(
            "rounded-full text-xs text-muted-foreground hover:text-foreground",
            isDrawer ? "h-11 w-full px-4" : "hidden h-9 px-3 md:inline-flex",
          )}
        >
          Disconnect
        </Button>
      </div>
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
