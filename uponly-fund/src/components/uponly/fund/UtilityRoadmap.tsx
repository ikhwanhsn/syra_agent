import { useReducedMotion, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { UP_ONLY_FUND, type UpOnlyFundUtilityStatus } from "@/data/upOnlyFund";
import { itemFade, SectionEyebrow, stagger } from "../primitives";
import { cn } from "@/lib/utils";
import { Rocket } from "lucide-react";

function statusLabel(s: UpOnlyFundUtilityStatus): string {
  switch (s) {
    case "live":
      return "Live";
    case "in-progress":
      return "In progress";
    case "planned":
      return "Planned";
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}

function statusVariant(
  s: UpOnlyFundUtilityStatus,
): "default" | "secondary" | "outline" {
  if (s === "live") return "default";
  if (s === "in-progress") return "secondary";
  return "outline";
}

type UtilityRoadmapProps = { className?: string };

export function UtilityRoadmap({ className }: UtilityRoadmapProps) {
  const reduce = useReducedMotion() ?? false;
  const items = UP_ONLY_FUND.utilityRoadmap;
  return (
    <section className={cn("mb-20 min-w-0", className)} id="utility" aria-labelledby="uof-utility-heading">
      <div className="mb-6 min-w-0 max-w-3xl sm:mb-8">
        <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-md border border-border/50 bg-background/40 px-2 py-1 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground/90 sm:text-xs">
          <Rocket className="h-3.5 w-3.5 text-success" aria-hidden />
          What&apos;s next
        </div>
        <SectionEyebrow>Utility roadmap</SectionEyebrow>
        <h2
          id="uof-utility-heading"
          className="text-balance text-xl font-bold tracking-[-0.02em] min-[500px]:text-2xl sm:text-3xl md:text-4xl [overflow-wrap:anywhere]"
        >
          Up Only Fund — more than a label
        </h2>
        <p className="mt-3 break-words text-pretty text-sm text-muted-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-relaxed">
          We will add tooling and surface area over time, always with the same transparency and risk boundaries as this page.
        </p>
      </div>
      <motion.div
        {...stagger(reduce)}
        className="grid min-w-0 max-w-full grid-cols-1 gap-3 min-[500px]:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((u) => (
          <motion.div
            key={u.id}
            {...itemFade(reduce)}
            className="flex min-w-0 flex-col rounded-2xl border border-border/50 bg-card/35 p-3.5 sm:p-4"
          >
            <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
              <p className="min-w-0 text-balance text-base font-semibold text-foreground [overflow-wrap:anywhere] sm:text-lg">
                {u.title}
              </p>
              <Badge
                variant={statusVariant(u.status)}
                className="shrink-0 text-[0.6rem] uppercase tracking-wider"
              >
                {statusLabel(u.status)}
              </Badge>
            </div>
            <p className="min-w-0 text-sm text-muted-foreground [overflow-wrap:anywhere] sm:leading-relaxed">
              {u.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
