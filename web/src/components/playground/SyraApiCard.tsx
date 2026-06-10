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
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge
          variant="secondary"
          className={cn(
            "rounded-md border-0 font-mono text-[10px] font-semibold uppercase tracking-wide",
            isGet
              ? "bg-muted/80 text-muted-foreground"
              : "bg-primary/12 text-primary",
          )}
        >
          {flow.method}
        </Badge>
      </div>

      <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground">
        {detail}
      </h3>

      <p
        className="mb-4 truncate rounded-md bg-muted/30 px-2 py-1 font-mono text-[10px] text-muted-foreground"
        title={path}
      >
        {path}
      </p>

      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={isLoading && active}
        className={cn(
          "playground-try-btn mt-auto h-9 w-full gap-1.5 rounded-lg text-xs font-semibold",
          isLoading && active && "opacity-80",
        )}
        onClick={() => onTry()}
      >
        {isLoading && active ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Play className="playground-try-icon h-3.5 w-3.5 transition-transform" aria-hidden />
        )}
        Try endpoint
      </Button>
    </article>
  );
}
