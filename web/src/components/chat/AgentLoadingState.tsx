"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type AgentLoadingVariant = "drive" | "dots" | "orbit";

const DRIVE_CELLS = 24;

function DriveLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn("grid grid-cols-8 gap-0.5", className)}
      aria-hidden
    >
      {Array.from({ length: DRIVE_CELLS }, (_, i) => (
        <span
          key={i}
          className="agent-loading-drive-cell h-1.5 w-1.5 rounded-[1px] bg-foreground/25"
          style={{ animationDelay: `${(i % 8) * 60 + Math.floor(i / 8) * 40}ms` }}
        />
      ))}
    </div>
  );
}

function DotsLoader({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="typing-dot typing-dot-delay-1 h-1.5 w-1.5 rounded-full bg-primary/85" />
      <span className="typing-dot typing-dot-delay-2 h-1.5 w-1.5 rounded-full bg-primary/70" />
    </span>
  );
}

function OrbitLoader({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-7 w-7", className)} aria-hidden>
      <span className="animate-thinking-orbit absolute inset-0 rounded-full border border-primary/30" />
      <span className="animate-thinking-glow absolute inset-1 rounded-full bg-primary/15 blur-[2px]" />
      <span className="absolute inset-[9px] rounded-full bg-primary/70" />
    </div>
  );
}

export function AgentLoadingState({
  label = "Working",
  variant = "drive",
  className,
}: {
  label?: string;
  variant?: AgentLoadingVariant;
  className?: string;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - started);
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const seconds = (elapsedMs / 1000).toFixed(1);

  return (
    <div
      className={cn(
        "flex min-h-[40px] items-center gap-3 rounded-xl border border-border/45 bg-muted/15 px-3 py-2.5",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`${label}, ${seconds} seconds elapsed`}
    >
      {variant === "orbit" ? (
        <OrbitLoader />
      ) : variant === "dots" ? (
        <DotsLoader />
      ) : (
        <DriveLoader />
      )}
      <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-foreground/90">{label}</span>
        <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
          {seconds}s
        </span>
      </div>
    </div>
  );
}
