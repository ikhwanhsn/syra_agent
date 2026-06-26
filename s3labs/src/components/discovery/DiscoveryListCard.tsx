import type { ReactNode } from "react";

import { DiscoveryListThumb } from "@/components/discovery/DiscoveryListThumb";
import { cn } from "@/lib/utils";

interface DiscoveryListCardProps {
  onSelect: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  thumbnailAlt?: string;
  meta?: ReactNode;
  badges?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DiscoveryListCard({
  onSelect,
  eyebrow,
  title,
  description,
  thumbnailUrl,
  thumbnailAlt = "",
  meta,
  badges,
  footer,
  className,
}: DiscoveryListCardProps) {
  return (
    <article className={cn("card-premium-hover flex flex-col gap-3 p-5", className)}>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full flex-col gap-3 text-left",
          "rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {eyebrow ? <p className="mb-1 text-xs text-muted-foreground">{eyebrow}</p> : null}
            <h3 className="line-clamp-2 font-semibold tracking-tight text-foreground">
              {title}
            </h3>
          </div>
          <DiscoveryListThumb
            imageUrl={thumbnailUrl}
            label={thumbnailAlt || title}
            className="h-14 w-14"
          />
        </div>

        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}

        {badges ? <div className="flex flex-wrap items-center gap-1.5">{badges}</div> : null}

        {meta ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </button>

      {footer ? <div className="border-t border-border/50 pt-3">{footer}</div> : null}
    </article>
  );
}
