import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/navigation";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import type { GrowRecommendation } from "@/lib/pillarsApi";
import { cn } from "@/lib/utils";

function adapterHref(adapter?: string): string {
  if (adapter === "jupiter") return "/swap";
  return "/invest";
}

function adapterLabel(adapter?: string): string {
  if (adapter === "jupiter") return "Swap";
  return "Invest";
}

type GrowRecommendationCardProps = {
  rec: GrowRecommendation;
  staggerIndex?: number;
};

export function GrowRecommendationCard({
  rec,
  staggerIndex = 0,
}: GrowRecommendationCardProps) {
  return (
    <li
      className="min-w-0 animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500 ease-out"
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <article
        className={cn(
          overviewCardShell,
          "group relative flex h-full min-h-[10rem] flex-col overflow-hidden",
          "transition-[box-shadow,border-color,transform] duration-300 ease-out",
          "hover:-translate-y-0.5 hover:border-border/80",
          "hover:shadow-[0_1px_0_0_hsl(var(--border)/0.55),0_28px_56px_-28px_rgba(0,0,0,0.75)]",
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

        <div className="relative flex flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground ring-1 ring-border/40">
                {rec.priority}
              </span>
              <span className="inline-flex rounded-md bg-muted/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80 ring-1 ring-border/30">
                {rec.type}
              </span>
            </div>
            <p className="font-medium tracking-tight text-foreground">{rec.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{rec.rationale}</p>
          </div>

          {rec.suggestedAdapter ? (
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 -ml-2 rounded-full text-xs"
                asChild
              >
                <Link to={adapterHref(rec.suggestedAdapter)}>
                  {adapterLabel(rec.suggestedAdapter)}
                  <ArrowRight className="ml-1 h-3 w-3" aria-hidden />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </article>
    </li>
  );
}
