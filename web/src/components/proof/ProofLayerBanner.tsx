import { Link } from "@/lib/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SYRA_PROOF_FRAMING } from "@/content/syraFocus";

type ProofLayerBannerProps = {
  className?: string;
  compact?: boolean;
};

/** Framing banner for proof-layer pages (experiments, demos). */
export function ProofLayerBanner({ className, compact = false }: ProofLayerBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-primary/15 bg-primary/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" aria-hidden />
        <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          <span className="font-medium text-foreground">Proof layer.</span>{" "}
          {SYRA_PROOF_FRAMING}
        </p>
      </div>
      {!compact ? (
        <Link
          to="/playground"
          className="shrink-0 text-xs font-semibold text-primary no-underline hover:underline"
        >
          Build on the rail →
        </Link>
      ) : null}
    </div>
  );
}
