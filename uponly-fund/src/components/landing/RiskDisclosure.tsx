import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type RiskDisclosureProps = {
  className?: string;
};

export function RiskDisclosure({ className }: RiskDisclosureProps) {
  return (
    <aside
      id="risk-disclosure"
      className={cn(
        "mb-16 scroll-mt-24 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.05] to-transparent p-5 sm:mb-20 sm:p-7",
        className,
      )}
      role="note"
    >
      <div className="flex gap-4 sm:gap-5">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-background/60">
          <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-foreground sm:text-lg">Risk &amp; disclosure</h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            This is <strong className="font-medium text-foreground/90">not</strong> investment advice, a security, or a
            pooled “fund” you subscribe to in v1. Token and protocol risk can go to zero. Do your own research and
            read venue terms on RISE. Past or hypothetical performance is not a guarantee of future results.
          </p>
        </div>
      </div>
    </aside>
  );
}
