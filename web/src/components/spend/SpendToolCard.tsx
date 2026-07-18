import { ArrowUpRight } from "lucide-react";
import { Link } from "@/lib/navigation";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { marketplaceApiDetailPath } from "@/lib/marketplaceConstants";
import {
  categorizeSpendTool,
  type SpendTool,
} from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

function formatPrice(usd: number): string {
  if (!Number.isFinite(usd)) return "—";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

type SpendToolCardProps = {
  tool: SpendTool;
  staggerIndex?: number;
};

export function SpendToolCard({ tool, staggerIndex = 0 }: SpendToolCardProps) {
  const category = categorizeSpendTool(tool);
  const method = (tool.method || "GET").toUpperCase();
  const path = tool.path?.trim() || "";

  return (
    <li
      className="min-w-0 animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500 ease-out"
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <Link
        to={marketplaceApiDetailPath(tool.id)}
        className={cn(
          overviewCardShell,
          "group relative flex h-full min-h-[9.5rem] flex-col overflow-hidden no-underline",
          "transition-[box-shadow,border-color,transform] duration-300 ease-out",
          "hover:-translate-y-0.5 hover:border-border/80",
          "hover:shadow-[0_1px_0_0_hsl(var(--border)/0.55),0_28px_56px_-28px_rgba(0,0,0,0.75)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/[0.05] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />

        <div className="relative flex flex-1 flex-col p-4 sm:p-5">
          <div className="mb-2.5 flex items-start justify-between gap-2">
            <span className="inline-flex max-w-full truncate rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground ring-1 ring-border/40">
              {category}
            </span>
            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums tracking-tight text-foreground">
              {formatPrice(tool.priceUsd)}
            </span>
          </div>

          <p className="font-medium tracking-tight text-foreground">{tool.name}</p>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {tool.description}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <p className="min-w-0 truncate font-mono text-[10px] tabular-nums text-muted-foreground/70">
              {method}
              {path ? ` · ${path}` : ""}
            </p>
            <ArrowUpRight
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
              aria-hidden
            />
          </div>
        </div>
      </Link>
    </li>
  );
}
