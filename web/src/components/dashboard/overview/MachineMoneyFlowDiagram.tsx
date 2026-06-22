import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_PILLAR_NAV } from "@/lib/dashboardPillarNav";
import { PILLAR_OVERVIEW_META } from "@/lib/machineMoneyOverview";
import type { PillarId } from "@/lib/pillarsApi";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

const PILLAR_ORDER: PillarId[] = ["earn", "treasury", "invest", "spend", "grow"];

const NODE_POSITIONS: Record<PillarId, { x: number; y: number }> = {
  earn: { x: 12, y: 50 },
  treasury: { x: 32, y: 22 },
  invest: { x: 68, y: 22 },
  spend: { x: 88, y: 50 },
  grow: { x: 50, y: 78 },
};

const FLOW_PATH =
  "M 12 50 C 12 32, 22 22, 32 22 L 68 22 C 78 22, 88 32, 88 50 C 88 68, 78 78, 68 78 L 32 78 C 22 78, 12 68, 12 50 Z";

interface MachineMoneyFlowDiagramProps {
  className?: string;
  activePillar?: PillarId | null;
}

export function MachineMoneyFlowDiagram({ className, activePillar = null }: MachineMoneyFlowDiagramProps) {
  const iconsById = Object.fromEntries(
    DASHBOARD_PILLAR_NAV.map((item) => [item.id, item.icon]),
  ) as Record<PillarId, LucideIcon>;

  return (
    <div
      className={cn(overviewCardShell, "relative overflow-hidden p-4 sm:p-6", className)}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(420px 200px at 50% 40%, hsl(var(--primary) / 0.08), transparent 60%)",
        }}
      />

      <svg
        viewBox="0 0 100 100"
        className="relative mx-auto w-full max-w-md aspect-[4/3]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <motion.path
          d={FLOW_PATH}
          fill="none"
          stroke="url(#flow-gradient)"
          strokeWidth="0.6"
          strokeDasharray="2 1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />

        {PILLAR_ORDER.map((id, index) => {
          const pos = NODE_POSITIONS[id];
          const meta = PILLAR_OVERVIEW_META[id];
          const isActive = activePillar === id;
          return (
            <motion.g
              key={id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + index * 0.08, duration: 0.4 }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isActive ? 7.5 : 6.5}
                className={cn(
                  "fill-background stroke-border/60 transition-all duration-300",
                  isActive && "stroke-primary/60",
                )}
                strokeWidth="0.5"
              />
              <text
                x={pos.x}
                y={pos.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground"
                style={{ fontSize: "3.5px", fontWeight: 700 }}
              >
                {meta.step}
              </text>
              <text
                x={pos.x}
                y={pos.y + (id === "treasury" || id === "invest" ? -9 : id === "grow" ? 11 : id === "earn" ? 11 : -9)}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: "3px", fontWeight: 600 }}
              >
                {DASHBOARD_PILLAR_NAV.find((p) => p.id === id)?.label}
              </text>
            </motion.g>
          );
        })}

        <motion.circle
          cx="12"
          cy="50"
          r="1.2"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      <div className="relative mt-2 grid grid-cols-5 gap-1 sm:gap-2">
        {PILLAR_ORDER.map((id) => {
          const Icon = iconsById[id];
          const meta = PILLAR_OVERVIEW_META[id];
          return (
            <div
              key={id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border border-border/40 bg-background/30 px-1 py-2 text-center",
                meta.iconRing.split(" ").find((c) => c.startsWith("border-")),
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", meta.accent)} aria-hidden />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[10px]">
                {DASHBOARD_PILLAR_NAV.find((p) => p.id === id)?.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
