import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "@/lib/navigation";
import { ArrowRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PillarsDiscovery } from "@/lib/pillarsApi";
import { MACHINE_MONEY_FLOW_COPY, MACHINE_MONEY_STEPS, PILLAR_OVERVIEW_META } from "@/lib/machineMoneyOverview";
import { DASHBOARD_PILLAR_NAV } from "@/lib/dashboardPillarNav";
import { PILLAR_COPY, type PillarId } from "@/lib/pillarsApi";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { OverviewGroupLabel } from "@/components/dashboard/overview/OverviewGroupLabel";

const PILLAR_ORDER: PillarId[] = ["earn", "treasury", "invest", "spend", "grow"];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.45, delay },
  };
}

export interface OverviewMachineMoneySectionsProps {
  discovery?: PillarsDiscovery | null;
  discoveryLoading?: boolean;
  className?: string;
}

export function OverviewMachineMoneySections({
  discovery,
  discoveryLoading,
  className,
}: OverviewMachineMoneySectionsProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const pillarsById = new Map(
    (discovery?.pillars ?? []).map((p) => [p.id as PillarId, p]),
  );

  return (
    <div ref={ref} className={cn("space-y-10", className)}>
      <section className="space-y-4">
        <OverviewGroupLabel icon={Layers}>How Machine Money works</OverviewGroupLabel>
        <motion.p {...fadeUp()} className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {discovery?.narrative ?? MACHINE_MONEY_FLOW_COPY}
        </motion.p>

        <ol className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {MACHINE_MONEY_STEPS.map((step, index) => {
            const meta = PILLAR_OVERVIEW_META[step.pillar];
            const nav = DASHBOARD_PILLAR_NAV.find((p) => p.id === step.pillar);
            const copy = PILLAR_COPY[step.pillar];
            const Icon = nav?.icon;
            return (
              <motion.li
                key={step.pillar}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                className={cn(
                  overviewCardShell,
                  "relative flex h-full flex-col p-4 transition-colors",
                  meta.borderHover,
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-40",
                    meta.iconGlow,
                  )}
                  aria-hidden
                />
                <div className="relative flex items-center gap-2">
                  {Icon ? (
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                        meta.iconRing,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", meta.accent)} aria-hidden />
                    </span>
                  ) : null}
                  <span className={cn("text-xs font-bold tabular-nums", meta.accent)}>{meta.step}</span>
                </div>
                <h3 className="relative mt-3 text-sm font-semibold text-foreground">{copy.headline}</h3>
                <p className="relative mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{step.action}</p>
                <Link
                  to={copy.href}
                  className={cn(
                    "relative mt-3 inline-flex items-center gap-1 text-xs font-medium",
                    meta.accent,
                    "hover:underline",
                  )}
                >
                  Open {copy.headline}
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </motion.li>
            );
          })}
        </ol>
      </section>

      <section className="space-y-4">
        <OverviewGroupLabel icon={Layers}>Pillar coverage</OverviewGroupLabel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PILLAR_ORDER.map((id, i) => {
            const meta = PILLAR_OVERVIEW_META[id];
            const copy = PILLAR_COPY[id];
            const nav = DASHBOARD_PILLAR_NAV.find((p) => p.id === id);
            const discoveryMeta = pillarsById.get(id);
            const Icon = nav?.icon;
            return (
              <motion.div
                key={id}
                {...fadeUp(i * 0.05)}
                className={cn(overviewCardShell, "relative p-4", meta.borderHover)}
              >
                <div className={overviewCardGlow} style={{ background: overviewAccentBackground("marketplace") }} />
                <div className="relative flex items-center gap-2">
                  {Icon ? (
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", meta.iconRing)}>
                      <Icon className={cn("h-4 w-4", meta.accent)} aria-hidden />
                    </span>
                  ) : null}
                  <p className={cn("text-sm font-semibold", meta.accent)}>{copy.headline}</p>
                </div>
                <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground">{copy.description}</p>
                <p className="relative mt-3 font-mono text-lg font-semibold tabular-nums text-foreground">
                  {discoveryLoading
                    ? "…"
                    : discoveryMeta
                      ? `${discoveryMeta.routeCount} routes`
                      : "—"}
                </p>
                <p className="relative mt-0.5 text-[11px] text-muted-foreground">
                  {discoveryLoading
                    ? "Loading pillar modules…"
                    : discoveryMeta
                      ? `${discoveryMeta.toolCount} tools · ${discoveryMeta.tagline}`
                      : nav?.description}
                </p>
                <Link
                  to={copy.href}
                  className={cn(
                    "relative mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline",
                    meta.accent,
                  )}
                >
                  Open pillar
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
