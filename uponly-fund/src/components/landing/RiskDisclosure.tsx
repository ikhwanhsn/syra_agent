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
        "mb-16 min-w-0 scroll-mt-24 rounded-xl border border-border/50 bg-muted/[0.18] p-5 min-[400px]:p-6 sm:mb-20 sm:rounded-[1.05rem] sm:p-8 md:p-10",
        className,
      )}
      role="note"
    >
      <div className="flex gap-4 sm:gap-5">
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/55 bg-background/70">
          <AlertTriangle className="h-[1.125rem] w-[1.125rem] text-foreground/70" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
            Risk &amp; disclosure
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Up Only Fund describes a venture-style allocator mandate; this is still{" "}
            <strong className="font-medium text-foreground/90">not</strong> personalized investment advice, a registered
            security offering, or a retail subscription product in v1. Token and venue risk can go to zero—read venue terms,
            verify contracts, and size only what you can lose. Past or hypothetical performance is not a guarantee of
            future results.
          </p>
        </div>
      </div>
    </aside>
  );
}
