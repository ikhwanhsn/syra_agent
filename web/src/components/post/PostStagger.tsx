import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { RemotionReveal, useIsRemotionReveal } from "@/video/engine/revealContext";

interface PostStaggerProps {
  isActive: boolean;
  children: ReactNode;
  className?: string;
}

/** Wraps slide body; children animate in when the slide becomes active. */
export function PostStagger({ isActive, children, className }: PostStaggerProps) {
  return (
    <div
      className={cn(
        "post-stagger",
        isActive && "post-stagger-active",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PostRevealProps {
  isActive: boolean;
  delayMs?: number;
  children: ReactNode;
  className?: string;
}

/**
 * Entrance reveal. Outside Remotion: CSS keyframes.
 * Inside RemotionRevealProvider: frame-driven styles for deterministic export.
 */
export function PostReveal({ isActive, delayMs = 0, children, className }: PostRevealProps) {
  const remotion = useIsRemotionReveal();

  if (remotion) {
    return (
      <RemotionReveal delayMs={delayMs} className={className}>
        {children}
      </RemotionReveal>
    );
  }

  return (
    <div
      className={cn("post-reveal", isActive && "post-reveal-active", className)}
      style={{ "--post-delay": `${delayMs}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
