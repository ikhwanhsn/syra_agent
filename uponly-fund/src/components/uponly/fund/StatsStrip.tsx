import { useReducedMotion, motion } from "framer-motion";
import type { ComponentType } from "react";
import { UP_ONLY_FUND } from "@/data/upOnlyFund";
import { formatInt } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";
import { fadeUp } from "../primitives";
import { Calendar, Layers } from "lucide-react";

function StatPill({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/40 bg-background/30 px-2.5 py-2.5 shadow-sm [overflow-wrap:anywhere] sm:px-3.5">
      <div className="mb-0.5 flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 text-foreground/50" aria-hidden />
        {label}
      </div>
      <p className="mt-0.5 break-words font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

type StatsStripProps = { className?: string };

export function StatsStrip({ className }: StatsStripProps) {
  const reduce = useReducedMotion() ?? false;
  const s = UP_ONLY_FUND.stats;
  const items = [
    {
      label: "Backed projects",
      value: s.positionsCount != null ? formatInt(s.positionsCount) : "TBA",
      icon: Layers,
    },
    {
      label: "Inception",
      value: s.inceptionLabel && s.inceptionLabel.length > 0 ? s.inceptionLabel : "TBA",
      icon: Calendar,
    },
  ] as const;

  return (
    <motion.section
      {...fadeUp(reduce)}
      className={cn("mb-10 min-w-0 sm:mb-14", className)}
      aria-labelledby="uof-stats-heading"
    >
      <h2 id="uof-stats-heading" className="sr-only">
        Fund statistics
      </h2>
      <p className="mb-3 text-center text-xs text-muted-foreground/90 sm:mb-4 sm:text-left">
        Non-financial reference fields only. AUM, NAV, and sizing are not published on this page.
      </p>
      <div className="grid min-w-0 grid-cols-1 gap-2 min-[380px]:grid-cols-2">
        {items.map((p) => (
          <StatPill key={p.label} label={p.label} value={p.value} icon={p.icon} />
        ))}
      </div>
    </motion.section>
  );
}
