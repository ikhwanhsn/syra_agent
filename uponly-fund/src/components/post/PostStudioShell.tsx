import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

const STUDIO_TICKER = [
  "BRIEF STUDIO",
  "MANDATE DECK",
  "ALLOCATOR EXPORT",
  "VC FORMAT",
  "RISE ECOSYSTEM",
  "ON-CHAIN",
] as const;

interface PostStudioShellProps {
  children: ReactNode;
  className?: string;
  innerRef?: Ref<HTMLDivElement>;
}

/** Shared VC-terminal shell for /post/video and /post/photo — matches hub aesthetic. */
export function PostStudioShell({ children, className, innerRef }: PostStudioShellProps) {
  return (
    <div
      ref={innerRef}
      className={cn(
        "post-root post-hub post-studio relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden text-white",
        className,
      )}
    >
      <div className="post-hub-scanlines pointer-events-none absolute inset-0 z-[1]" aria-hidden />
      <div className="post-hub-grid pointer-events-none absolute inset-0 z-[1] opacity-40" aria-hidden />

      <div className="relative z-10 shrink-0 overflow-hidden border-b border-emerald-500/20 bg-black/50 py-1.5">
        <div className="post-hub-marquee-track gap-8 px-4 font-mono text-[9px] uppercase tracking-[0.26em] text-emerald-400/60">
          {[...STUDIO_TICKER, ...STUDIO_TICKER].map((item, i) => (
            <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-8">
              {item}
              <span className="text-white/15" aria-hidden>
                //
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col">{children}</div>
    </div>
  );
}
