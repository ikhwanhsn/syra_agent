import { AbsoluteFill, Series } from "remotion";
import type { PostSlide } from "@/content/posts/types";
import { renderPostSlideTemplate } from "@/components/post/PostSlideTemplates";
import { PostSlideCanvas } from "@/components/post/PostSlideLayout";
import { AmbientBackground } from "@/video/engine/AmbientBackground";
import { RemotionRevealProvider } from "@/video/engine/revealContext";
import { SceneFrame } from "@/video/engine/SceneFrame";
import { SlideTransition } from "@/video/engine/SlideTransition";
import { VideoChrome } from "@/video/engine/VideoChrome";
import { getSlideDurationInFrames } from "@/video/engine/timing";
import {
  POST_VIDEO_LAYOUT_HEIGHT,
  POST_VIDEO_LAYOUT_WIDTH,
} from "@/video/constants";
import { SYRA_VIDEO_THEME } from "@/video/style/theme";

export type PostDeckVideoProps = {
  slides: PostSlide[];
} & Record<string, unknown>;

/**
 * Canonical Remotion composition for every Syra ship-log video.
 * Paint order is back → front (z-index unsupported in web-renderer).
 * Visuals use web-renderer–safe CSS so preview === download.
 */
export function PostDeckVideo({ slides }: PostDeckVideoProps) {
  const theme = SYRA_VIDEO_THEME;

  return (
    <AbsoluteFill
      style={{
        // Solid base first — web-renderer must paint a full opaque frame.
        backgroundColor: theme.bg,
        width: POST_VIDEO_LAYOUT_WIDTH,
        height: POST_VIDEO_LAYOUT_HEIGHT,
        overflow: "hidden",
        color: theme.fg,
        containerType: "size",
        containerName: "post-stage",
        ["--post-frame-inset-inline" as string]: "clamp(2.25rem, 7cqw, 4.5rem)",
        ["--post-frame-inset-block" as string]: "clamp(2rem, 7.5cqh, 3.75rem)",
        ["--syra-video-accent" as string]: theme.accent,
        ["--syra-video-accent-soft" as string]: theme.accentSoft,
        ["--syra-video-card-border" as string]: theme.cardBorder,
        ["--syra-video-card-bg" as string]: theme.cardBg,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        // Kill legacy stage chrome that left unfilled edges on download.
        boxShadow: "none",
        position: "absolute",
        inset: 0,
      }}
      className="post-remotion-stage"
    >
      {/* 1. Background — explicit px size, full composition */}
      <AmbientBackground />

      {/* 2. Slides */}
      <AbsoluteFill style={{ width: POST_VIDEO_LAYOUT_WIDTH, height: POST_VIDEO_LAYOUT_HEIGHT }}>
        <RemotionRevealProvider>
          <Series>
            {slides.map((slide, index) => {
              const durationInFrames = getSlideDurationInFrames(index, slides);
              return (
                <Series.Sequence key={slide.id} durationInFrames={durationInFrames}>
                  <SlideTransition durationInFrames={durationInFrames} slideIndex={index}>
                    <SceneFrame slide={slide} durationInFrames={durationInFrames}>
                      <PostSlideSequence slide={slide} />
                    </SceneFrame>
                  </SlideTransition>
                </Series.Sequence>
              );
            })}
          </Series>
        </RemotionRevealProvider>
      </AbsoluteFill>

      {/* 3. Brand chrome last = on top (no z-index in web-renderer) */}
      <VideoChrome />
    </AbsoluteFill>
  );
}

function PostSlideSequence({ slide }: { slide: PostSlide }) {
  return (
    <AbsoluteFill
      className="post-slide post-slide-active post-slide-from-forward"
      style={{
        opacity: 1,
        transform: "none",
        filter: "none",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      <PostSlideCanvas isActive>{renderPostSlideTemplate(slide, true)}</PostSlideCanvas>
    </AbsoluteFill>
  );
}
