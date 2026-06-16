import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PostRecordStageProps {
  children: ReactNode;
  showGuides: boolean;
}

/** 16:9 stage — UOF vault canvas; guides are overlay-only. */
export function PostRecordStage({ children, showGuides }: PostRecordStageProps) {
  return (
    <div className="post-record-wrap">
      <p
        className={cn(
          "post-record-hint font-mono text-[10px] uppercase tracking-[0.22em]",
          showGuides ? "text-emerald-400/45" : "invisible",
        )}
        aria-hidden={!showGuides}
      >
        <span className="hidden sm:inline">Record area · 16∶9 · crop screen capture to the frame below</span>
        <span className="sm:hidden">16∶9 record frame</span>
      </p>

      <div className="post-record-stage post-record-stage--uof">
        {showGuides ? (
          <div className="post-record-guides pointer-events-none absolute inset-0 z-40" aria-hidden>
            <span className="post-record-corner post-record-corner-tl" />
            <span className="post-record-corner post-record-corner-tr" />
            <span className="post-record-corner post-record-corner-bl" />
            <span className="post-record-corner post-record-corner-br" />
            <span className="post-record-tag font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-400/60">
              16:9 · UOF
            </span>
          </div>
        ) : null}

        <div className="post-uof-stage-underlay pointer-events-none absolute inset-0" aria-hidden>
          <div className="post-uof-alpha-conic" />
          <div className="post-uof-alpha-radial-tr" />
          <div className="post-uof-alpha-grid" />
          <div className="post-uof-alpha-scanlines" />
        </div>

        <div className="relative h-full min-h-0 w-full">{children}</div>
      </div>
    </div>
  );
}
