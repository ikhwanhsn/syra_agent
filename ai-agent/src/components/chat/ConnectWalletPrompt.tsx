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
      <div className={cn("flex flex-col gap-3 px-2 py-4", className)}>
        <p className="text-sm text-muted-foreground text-center">
          Connect wallet to start
        </p>
        <Button
          onClick={onConnectClick}
          size="sm"
          className="w-full gap-2"
        >
          <Wallet className="w-4 h-4" />
          Connect wallet
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center h-full px-4 py-12 gap-6 animate-fade-in",
        className
      )}
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] flex items-center justify-center">
          <Wallet className="w-10 h-10 text-primary-foreground" />
        </div>
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-[hsl(199,89%,48%)]/20 rounded-3xl blur-xl -z-10" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">
          Connect your wallet
        </h2>
        <p className="text-muted-foreground max-w-md">
          Connect a Solana wallet to start chatting with the Syra agent. Your wallet links your chat history and agent payments.
        </p>
      </div>

      <Button onClick={onConnectClick} className="gap-2">
        <Wallet className="w-4 h-4" />
        Connect wallet
      </Button>
    </div>
  );
}
