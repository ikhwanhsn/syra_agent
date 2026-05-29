import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectWalletPromptProps {
  onConnectClick: () => void;
  /** "center" for chat area (large), "compact" for sidebar */
  variant?: "center" | "compact";
  className?: string;
}

export function ConnectWalletPrompt({
  onConnectClick,
  variant = "center",
  className,
}: ConnectWalletPromptProps) {
  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <div className={cn("mx-1 rounded-xl border border-border/50 bg-muted/20 p-4", className)}>
        <p className="text-center text-[13px] leading-snug text-muted-foreground">
          Connect your wallet to use the agent.
        </p>
        <Button
          type="button"
          onClick={onConnectClick}
          size="sm"
          variant="secondary"
          className="mt-3 h-9 w-full gap-2 text-xs"
        >
          <Wallet className="h-3.5 w-3.5" />
          Connect wallet
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center min-h-full w-full max-w-full px-3 py-8 sm:px-4 sm:py-12 gap-4 sm:gap-6 animate-fade-in overflow-x-hidden",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-muted/30">
        <Wallet className="h-7 w-7 text-foreground/80" />
      </div>

      <div className="space-y-1 px-2">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          Connect your wallet
        </h2>
        <p className="max-w-md text-sm text-muted-foreground sm:text-base">
          You can chat without a wallet. Connect Solana to sync history, use tools, and pay for agent calls.
        </p>
      </div>

      <Button onClick={onConnectClick} className="gap-2 min-h-[48px] touch-manipulation">
        <Wallet className="w-4 h-4 shrink-0" />
        Connect wallet
      </Button>
    </div>
  );
}
