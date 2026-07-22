import { ArrowRight, Wallet } from "lucide-react";
import { Link } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { useWalletContext } from "@/contexts/WalletContext";
import { cn } from "@/lib/utils";

export type PillarConnectCtaVariant = "banner" | "inline";

type PillarConnectCTAProps = {
  title: string;
  description?: string;
  fundHref?: string;
  fundLabel?: string;
  variant?: PillarConnectCtaVariant;
  className?: string;
  /** When true and wallet is connected, show fund CTA only. */
  hideWhenConnected?: boolean;
};

/** Minimal connect → fund funnel for Machine Money pillars. */
export function PillarConnectCTA({
  title,
  description,
  fundHref = "/wallet",
  fundLabel = "Fund",
  variant = "banner",
  className,
  hideWhenConnected = true,
}: PillarConnectCTAProps) {
  const { openConnectModal } = useConnectModal();
  const { connected } = useWalletContext();

  if (hideWhenConnected && connected) {
    return (
      <div
        className={cn(
          "flex w-full flex-col gap-3 rounded-2xl border border-border/40 bg-muted/15 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5",
          className,
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium tracking-tight text-foreground">{title}</p>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-full shrink-0 rounded-full px-4 sm:h-8 sm:w-auto"
          asChild
        >
          <Link to={fundHref}>
            {fundLabel}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex h-full w-full flex-col items-start justify-between gap-4 rounded-2xl border border-border/40 bg-muted/15 px-5 py-6",
          className,
        )}
      >
        <div className="space-y-1">
          <p className="text-sm font-medium tracking-tight text-foreground">{title}</p>
          {description ? (
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>
          ) : null}
        </div>
        <Button
          size="sm"
          className="h-10 w-full rounded-full px-5 sm:h-9 sm:w-auto"
          onClick={openConnectModal}
        >
          <Wallet className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Connect
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl border border-border/40 bg-muted/15 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium tracking-tight text-foreground">{title}</p>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Button
        size="sm"
        className="h-10 w-full shrink-0 rounded-full px-5 sm:h-9 sm:w-auto"
        onClick={openConnectModal}
      >
        Connect
      </Button>
    </div>
  );
}
