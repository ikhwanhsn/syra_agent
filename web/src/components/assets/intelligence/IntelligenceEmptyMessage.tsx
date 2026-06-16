import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function IntelligenceEmptyMessage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "rounded-lg border border-dashed border-border/50 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
