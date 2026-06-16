import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

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

export function PostReveal({ isActive, delayMs = 0, children, className }: PostRevealProps) {
  return (
    <div
      className={cn("post-reveal", isActive && "post-reveal-active", className)}
      style={{ "--post-delay": `${delayMs}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
