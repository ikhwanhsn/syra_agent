import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { PostSlide } from "@/content/posts/types";
import { SYRA_VIDEO_THEME } from "@/video/style/theme";

interface SceneFrameProps {
  slide: PostSlide;
  durationInFrames: number;
  children: ReactNode;
}

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Motion-only scene wrapper — no floating panels, brackets, or viewfinder chrome.
 * Those were fighting the slide content and making frames look like empty slides.
 */
export function SceneFrame({ slide, durationInFrames, children }: SceneFrameProps) {
  const theme = SYRA_VIDEO_THEME;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const settle = spring({
    frame,
    fps,
    durationInFrames: Math.round(0.55 * fps),
    config: theme.spring.scene,
  });

  const exitStart = Math.max(0, durationInFrames - 0.35 * fps);
  const exit = interpolate(frame, [exitStart, durationInFrames], [0, 1], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

  const y = interpolate(settle, [0, 1], [14, 0]) - exit * 10;
  const scale = interpolate(settle, [0, 1], [0.988, 1]) - exit * 0.01;
  const opacity = interpolate(settle, [0, 1], [0, 1]) * (1 - exit);

  return (
    <AbsoluteFill
      className="post-video-scene-frame"
      data-slide-kind={slide.kind}
      data-slide-layout={slide.layout}
      style={{
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
