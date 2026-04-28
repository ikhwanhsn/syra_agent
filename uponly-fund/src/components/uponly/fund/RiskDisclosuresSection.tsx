import { useReducedMotion, motion } from "framer-motion";
import { fadeUp, ExternalLink, RISE_DOCS } from "../primitives";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

type RiskDisclosuresSectionProps = { className?: string };

export function RiskDisclosuresSection({ className }: RiskDisclosuresSectionProps) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.aside
      {...fadeUp(reduce)}
      className={cn(
        "mb-16 w-full min-w-0 max-w-full rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-5 text-left min-[500px]:rounded-3xl min-[500px]:px-6 min-[500px]:py-6",
        className,
      )}
      id="risks"
      role="region"
      aria-label="Important risk disclosures"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-relaxed">
          <p className="font-semibold text-foreground/95">Important</p>
          <p className="mt-2 [overflow-wrap:anywhere]">
            Nothing on this page is an offer, solicitation, or financial advice. Cryptocurrency and early-stage
            projects can lose 100% of value. <strong>Do your own research (DYOR)</strong> and only risk capital
            you can afford to lose entirely. Syra, RISE, and third parties are separate; verify on-chain and in
            current documentation—do not trust this page alone. Past and hypothetical outcomes are not indicative
            of future results.
          </p>
          <p className="mt-2 [overflow-wrap:anywhere]">
            Jurisdiction: you are responsible for legality in your place of residence. See{" "}
            <ExternalLink href={RISE_DOCS.security} className="text-sm">
              RISE security
            </ExternalLink>{" "}
            and legal pages linked from the RISE documentation index.
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
