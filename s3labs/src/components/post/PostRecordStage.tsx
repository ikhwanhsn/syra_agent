import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PostRecordStageProps {
  children: ReactNode;
  showGuides: boolean;
}

/** 16:9 stage — S3 ribbon canvas (not UOF vault grid). */
export function PostRecordStage({ children, showGuides }: PostRecordStageProps) {
  return (
    <div className="post-record-wrap">
      <p
        className={cn(
          "post-record-hint font-mono text-[10px] uppercase tracking-[0.22em]",
          showGuides ? "text-primary/50" : "invisible",
        )}
        aria-hidden={!showGuides}
      >
        <span className="hidden sm:inline">Record area · 16∶9 · crop screen capture to the frame below</span>
        <span className="sm:hidden">16∶9 record frame</span>
      </p>

      <div className="post-record-stage post-record-stage--signal">
        {showGuides ? (
          <div className="post-record-guides post-record-guides--s3 pointer-events-none absolute inset-0 z-40" aria-hidden>
            <span className="post-record-corner post-record-corner-tl" />
            <span className="post-record-corner post-record-corner-tr" />
            <span className="post-record-corner post-record-corner-bl" />
            <span className="post-record-corner post-record-corner-br" />
            <span className="post-record-tag font-mono text-[9px] uppercase tracking-[0.2em] text-primary/65">
              16:9 · S3
            </span>
          </div>
        ) : null}

        <div className="post-s3-stage-ribbon pointer-events-none absolute inset-0" aria-hidden>
          <div className="post-s3-stage-ribbon--a" />
          <div className="post-s3-stage-ribbon--b" />
          <div className="post-s3-stage-mesh" />
        </div>

        <div className="relative h-full min-h-0 w-full">{children}</div>
      </div>
    </div>
  );
}
