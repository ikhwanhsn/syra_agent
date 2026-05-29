"use client";

import { cn } from "@/lib/utils";

export function ChatSidebarSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-1 px-1 py-1" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-lg px-2.5 py-2.5",
            "bg-muted/40"
          )}
          style={{ opacity: 1 - i * 0.08 }}
        >
          <div className="mb-1.5 h-3.5 w-[72%] rounded bg-muted-foreground/15" />
          <div className="h-2.5 w-[45%] rounded bg-muted-foreground/10" />
        </div>
      ))}
    </div>
  );
}
