import { useCallback, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarWalletButtonProps {
  className?: string;
}

function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

export function NavbarWalletButton({ className }: NavbarWalletButtonProps) {
  const { publicKey, connecting, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();

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
          "navbar-wallet-btn navbar-wallet-btn--loading h-9 rounded-full px-3 sm:px-4",
          className,
        )}
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">Connecting…</span>
      </Button>
    );
  }

  if (connected && address) {
    return (
      <div className={cn("flex items-center gap-1 min-w-0", className)}>
        <Button
          variant="heroOutline"
          size="sm"
          onClick={handleClick}
          title="Click to copy address"
          className="navbar-wallet-btn navbar-wallet-btn--connected h-9 rounded-full px-2.5 sm:px-3 font-mono text-xs max-w-[7.5rem] sm:max-w-none"
        >
          <Wallet className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">{shortenAddress(address, 3)}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnect()}
          className="hidden sm:inline-flex h-9 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
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
        "navbar-wallet-btn navbar-wallet-btn--connect btn-premium h-9 rounded-full px-3 sm:px-4",
        className,
      )}
      aria-label="Connect wallet"
    >
      <Wallet className="w-4 h-4" />
      <span className="hidden sm:inline">Connect Wallet</span>
    </Button>
  );
}
