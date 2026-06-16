import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

interface PostStudioShellProps {
  children: ReactNode;
  className?: string;
  innerRef?: Ref<HTMLDivElement>;
}

/** S3 ribbon-flow studio shell — not UOF VC-terminal marquee. */
export function PostStudioShell({ children, className, innerRef }: PostStudioShellProps) {
  return (
    <div
      ref={innerRef}
      className={cn(
        "post-root post-studio-s3 relative flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-hidden text-white",
        className,
      )}
    >
      <div className="post-studio-s3-ribbons" aria-hidden>
        <div className="post-studio-s3-ribbon post-studio-s3-ribbon--a" />
        <div className="post-studio-s3-ribbon post-studio-s3-ribbon--b" />
      </div>
      <div className="post-studio-s3-mesh pointer-events-none absolute inset-0 z-[1]" aria-hidden />

      <div className="post-studio-s3-accent-bar relative z-10 shrink-0" aria-hidden />

      <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col">{children}</div>
    </div>
  );
}
