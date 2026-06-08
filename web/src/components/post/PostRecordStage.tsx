import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PostRecordStageProps {
  children: ReactNode;
  showGuides: boolean;
}

/** 16:9 stage — fixed size; guides are overlay-only so toggling never resizes the crop box. */
export function PostRecordStage({ children, showGuides }: PostRecordStageProps) {
  return (
    <div className="post-record-wrap">
      <p
        className={cn(
          "post-record-hint font-mono text-[10px] uppercase tracking-[0.22em]",
          showGuides ? "text-white/40" : "invisible",
        )}
        aria-hidden={!showGuides}
      >
        <span className="hidden sm:inline">Record area · 16∶9 · crop screen capture to the frame below</span>
        <span className="sm:hidden">16∶9 record frame</span>
      </p>

      <div className="post-record-stage">
        {showGuides ? (
          <div className="post-record-guides pointer-events-none absolute inset-0 z-40" aria-hidden>
            <span className="post-record-corner post-record-corner-tl" />
            <span className="post-record-corner post-record-corner-tr" />
            <span className="post-record-corner post-record-corner-bl" />
            <span className="post-record-corner post-record-corner-br" />
            <span className="post-record-tag font-mono text-[9px] uppercase tracking-[0.2em] text-[#F3BA2F]/55">
              16:9
            </span>
          </div>
        ) : null}

        <div className="post-ambient pointer-events-none absolute inset-0" aria-hidden />
        <div className="post-orb post-orb-a pointer-events-none absolute rounded-full scale-75" aria-hidden />
        <div className="post-orb post-orb-b pointer-events-none absolute rounded-full scale-75" aria-hidden />
        <div className="post-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />

        <div className="relative h-full min-h-0 w-full">{children}</div>
      </div>
    </div>
  );
}
