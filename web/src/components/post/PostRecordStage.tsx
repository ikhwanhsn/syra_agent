import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  POST_VIDEO_LAYOUT_HEIGHT,
  POST_VIDEO_LAYOUT_WIDTH,
} from "@/components/post/postVideoExport";

interface PostRecordStageProps {
  children: ReactNode;
  showGuides: boolean;
}

/**
 * Preview stage: fixed 960×540 layout (same as export), CSS-scaled to fit.
 * Guarantees container-query typography matches the off-screen export stage.
 */
export function PostRecordStage({ children, showGuides }: PostRecordStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const availW = wrap.clientWidth;
      if (availW <= 0) return;
      setScale(Math.min(1, availW / POST_VIDEO_LAYOUT_WIDTH));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const scaledHeight = POST_VIDEO_LAYOUT_HEIGHT * scale;

  return (
    <div ref={wrapRef} className="post-record-wrap">
      <p
        className={cn(
          "post-record-hint font-mono text-[10px] uppercase tracking-[0.22em]",
          showGuides ? "text-white/40" : "invisible",
        )}
        aria-hidden={!showGuides}
      >
        <span className="hidden sm:inline">
          Record area · 16∶9 · crop screen capture to the frame below
        </span>
        <span className="sm:hidden">16∶9 record frame</span>
      </p>

      <div className="post-record-frame-wrap" style={{ height: scaledHeight }}>
        <div
          className="post-record-stage"
          style={{
            width: POST_VIDEO_LAYOUT_WIDTH,
            height: POST_VIDEO_LAYOUT_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          {showGuides ? (
            <div
              className="post-record-guides pointer-events-none absolute inset-0 z-40"
              aria-hidden
            >
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
          <div
            className="post-orb post-orb-a pointer-events-none absolute rounded-full scale-75"
            aria-hidden
          />
          <div
            className="post-orb post-orb-b pointer-events-none absolute rounded-full scale-75"
            aria-hidden
          />
          <div
            className="post-grid pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
          />

          <div className="relative h-full min-h-0 w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
