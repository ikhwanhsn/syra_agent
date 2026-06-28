import { useCallback } from "react";
import type { PostSlide } from "@/content/posts/types";
import { PostSlideView } from "@/components/post/PostSlideView";
import {
  POST_VIDEO_LAYOUT_HEIGHT,
  POST_VIDEO_LAYOUT_WIDTH,
} from "@/components/post/postVideoExport";

interface PostVideoExportStageProps {
  slides: PostSlide[];
  slideIndex: number;
  exportRef?: React.RefObject<HTMLDivElement | null>;
}

/** Off-screen 960×540 stage — matches preview layout without CSS scaling. */
export function PostVideoExportStage({
  slides,
  slideIndex,
  exportRef,
}: PostVideoExportStageProps) {
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (exportRef) {
        (exportRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [exportRef],
  );

  return (
    <div ref={setRootRef} className="post-video-export-root" aria-hidden>
      <div
        className="post-record-stage post-video-export-stage"
        style={{ width: POST_VIDEO_LAYOUT_WIDTH, height: POST_VIDEO_LAYOUT_HEIGHT }}
      >
        <div className="post-ambient pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="post-orb post-orb-a pointer-events-none absolute rounded-full scale-75"
          aria-hidden
        />
        <div
          className="post-orb post-orb-b pointer-events-none absolute rounded-full scale-75"
          aria-hidden
        />
        <div className="post-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />

        <div className="relative h-full min-h-0 w-full">
          {slides.map((slide, index) => (
            <PostSlideView
              key={slide.id}
              slide={slide}
              isActive={index === slideIndex}
              direction="forward"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
