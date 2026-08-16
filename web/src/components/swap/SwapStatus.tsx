import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicIsland, DynamicIslandView } from "@/components/motion/dynamic-island";
import { solscanTxUrl } from "@/lib/jupiterSwapExecute";

export type SwapPhase = "idle" | "building" | "signing" | "confirming" | "success" | "error";

export interface SwapStatusProps {
  phase: SwapPhase;
  signature?: string | null;
  error?: string | null;
  onDismiss?: () => void;
}

function phaseView(phase: SwapPhase): string | null {
  if (phase === "idle") return null;
  if (phase === "building" || phase === "signing" || phase === "confirming") return "progress";
  return phase;
}

export function SwapStatus({ phase, signature, error, onDismiss }: SwapStatusProps) {
  const view = phaseView(phase);
  if (!view) return null;

  const progressLabel =
    phase === "building"
      ? "Building transaction"
      : phase === "signing"
        ? "Confirm in your wallet"
        : "Confirming on-chain";

  return (
    <div className="flex justify-center py-1">
      <DynamicIsland
        view={view}
        compact={<span>Swap</span>}
        className="max-w-full"
      >
        <DynamicIslandView id="progress" className="gap-2 px-5 py-3 text-sm">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>{progressLabel}</span>
        </DynamicIslandView>
        <DynamicIslandView id="success" className="flex-col items-start gap-2 px-5 py-4 text-left text-sm">
          <p className="font-medium">Swap submitted</p>
          {signature ? (
            <>
              <p className="max-w-[16rem] truncate font-mono text-xs text-background/70">{signature}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="link" size="sm" className="h-auto gap-1 p-0 text-background" asChild>
                  <a href={solscanTxUrl(signature)} target="_blank" rel="noopener noreferrer">
                    View on Solscan <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                {onDismiss ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-background/80 hover:text-background"
                    onClick={onDismiss}
                  >
                    Dismiss
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DynamicIslandView>
        <DynamicIslandView id="error" className="flex-col items-start gap-2 px-5 py-4 text-left text-sm">
          <p className="max-w-[18rem] font-medium">{error ?? "Swap failed"}</p>
          {onDismiss ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-0 text-xs text-background/80 hover:text-background"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          ) : null}
        </DynamicIslandView>
      </DynamicIsland>
    </div>
  );
}
