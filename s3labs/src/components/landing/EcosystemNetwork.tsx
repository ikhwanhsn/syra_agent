import { useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

interface NodeDef {
  id: string;
  cx: number;
  cy: number;
  r: number;
  label: string;
  delay: number;
}

const NODES: NodeDef[] = [
  { id: "core", cx: 200, cy: 140, r: 18, label: "S3", delay: 0 },
  { id: "ai", cx: 90, cy: 70, r: 11, label: "AI", delay: 0.4 },
  { id: "ops", cx: 310, cy: 60, r: 11, label: "Ops", delay: 0.8 },
  { id: "earn", cx: 340, cy: 180, r: 10, label: "Earn", delay: 1.2 },
  { id: "build", cx: 60, cy: 200, r: 10, label: "Build", delay: 1.6 },
  { id: "comm", cx: 200, cy: 250, r: 10, label: "Community", delay: 2 },
];

const EDGES: [string, string][] = [
  ["core", "ai"],
  ["core", "ops"],
  ["core", "earn"],
  ["core", "build"],
  ["core", "comm"],
  ["ai", "build"],
  ["ops", "earn"],
  ["build", "comm"],
  ["earn", "comm"],
];

function nodeById(id: string): NodeDef {
  const node = NODES.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown node: ${id}`);
  return node;
}

interface EcosystemNetworkProps {
  className?: string;
}

export function EcosystemNetwork({ className }: EcosystemNetworkProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      className={cn("relative w-full max-w-md mx-auto aspect-[4/3]", className)}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-2xl" />
      <svg
        viewBox="0 0 400 300"
        className="relative w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {EDGES.map(([from, to]) => {
          const a = nodeById(from);
          const b = nodeById(to);
          return (
            <line
              key={`${from}-${to}`}
              x1={a.cx}
              y1={a.cy}
              x2={b.cx}
              y2={b.cy}
              stroke="url(#edgeGrad)"
              strokeWidth="1.5"
              className={reduceMotion ? undefined : "ecosystem-edge"}
            />
          );
        })}

        {NODES.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r * 2.4}
              fill="url(#nodeGlow)"
              className={reduceMotion ? undefined : "ecosystem-node-glow"}
              style={
                reduceMotion
                  ? undefined
                  : { animationDelay: `${node.delay}s` }
              }
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              className="fill-primary/20 stroke-primary/60"
              strokeWidth="1.5"
            />
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r * 0.35}
              className="fill-primary"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default EcosystemNetwork;
