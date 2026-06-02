import { Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { playgroundStaggerStyle } from "@/components/playground/playgroundMotion";
import { playgroundApiCardClass } from "@/components/playground/playgroundStyles";
import type { ExampleFlowPreset } from "@/hooks/useApiPlayground";
import { cn } from "@/lib/utils";

interface SyraApiCardProps {
  flow: ExampleFlowPreset;
  detail: string;
  path: string;
  active: boolean;
  isLoading: boolean;
  staggerIndex?: number;
  onTry: () => void;
}

export function SyraApiCard({
  flow,
  detail,
  path,
  active,
  isLoading,
  staggerIndex = 0,
  onTry,
}: SyraApiCardProps) {
  const isGet = flow.method === "GET";

  return (
    <article
      className={playgroundApiCardClass(active)}
      style={playgroundStaggerStyle(staggerIndex)}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge
          variant="secondary"
          className={cn(
            "font-mono text-[10px] uppercase",
            !isGet && "bg-primary/10 text-foreground",
          )}
        >
          {flow.method}
        </Badge>
      </div>

      <h3 className="mb-1 line-clamp-2 text-sm font-medium leading-snug text-foreground">
        {detail}
      </h3>

      <p className="mb-3 truncate font-mono text-[11px] text-muted-foreground" title={path}>
        {path}
      </p>

      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={isLoading && active}
        className={cn(
          "mt-auto h-8 w-full gap-1.5 rounded-lg text-xs font-semibold",
          "transition-[background-color,box-shadow,transform] duration-200",
          "hover:bg-primary/90 hover:shadow-glow-sm hover:brightness-105",
          "active:scale-[0.98]",
          isLoading && active && "opacity-80",
        )}
        onClick={() => onTry()}
      >
        {isLoading && active ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Play className="h-3.5 w-3.5" aria-hidden />
        )}
        Try
      </Button>
    </article>
  );
}
