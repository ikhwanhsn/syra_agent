import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { solscanTxUrl } from "@/lib/jupiterSwapExecute";

export type SwapPhase = "idle" | "building" | "signing" | "confirming" | "success" | "error";

export interface SwapStatusProps {
  phase: SwapPhase;
  signature?: string | null;
  error?: string | null;
  onDismiss?: () => void;
}

export function SwapStatus({ phase, signature, error, onDismiss }: SwapStatusProps) {
  if (phase === "idle") return null;

  if (phase === "building" || phase === "signing" || phase === "confirming") {
    const label =
      phase === "building"
        ? "Building transaction…"
        : phase === "signing"
          ? "Confirm in your wallet…"
          : "Confirming on-chain…";
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        {label}
      </div>
    );
  }

  if (phase === "success" && signature) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
        <p className="font-medium text-emerald-800 dark:text-emerald-200">Swap submitted</p>
        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{signature}</p>
        <div className="mt-2 flex gap-2">
          <Button variant="link" size="sm" className="h-auto gap-1 p-0" asChild>
            <a href={solscanTxUrl(signature)} target="_blank" rel="noopener noreferrer">
              View on Solscan <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
          {onDismiss ? (
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={onDismiss}>
              Dismiss
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (phase === "error" && error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error}
        {onDismiss ? (
          <Button variant="ghost" size="sm" className="mt-2 h-8 text-xs" onClick={onDismiss}>
            Dismiss
          </Button>
        ) : null}
      </div>
    );
  }

  return null;
}
