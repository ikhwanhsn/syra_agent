import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SYRA_VIDEO_THEME } from "@/video/style/theme";

interface SlideTransitionProps {
  children: ReactNode;
  durationInFrames: number;
  slideIndex?: number;
}

/** Fade-up + slight scale/lift enter; fade + settle exit. Smooth springs, no bounce. */
export function SlideTransition({
  children,
  durationInFrames,
  slideIndex = 0,
}: SlideTransitionProps) {
  const theme = SYRA_VIDEO_THEME;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: theme.spring.slide,
    durationInFrames: theme.enterFrames,
  });

  const exitStart = Math.max(theme.enterFrames + 4, durationInFrames - theme.exitFrames);
  const exitProgress =
    frame >= exitStart
      ? interpolate(frame, [exitStart, durationInFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        })
      : 0;

  const opacityIn = interpolate(frame, [0, Math.max(1, theme.enterFrames * 0.72)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacityOut = interpolate(exitProgress, [0, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  const dir = slideIndex % 2 === 0 ? 1 : -1;
  const enterX = interpolate(enter, [0, 1], [dir * 12, 0]);
  const enterY = interpolate(enter, [0, 1], [theme.enterY, 0]);
  const enterScale = interpolate(enter, [0, 1], [1.025, 1]);
  const exitY = interpolate(exitProgress, [0, 1], [0, theme.exitY]);
  const exitScale = interpolate(exitProgress, [0, 1], [1, 0.992]);

  return (
    <AbsoluteFill
      style={{
        opacity: opacityIn * opacityOut,
        transform: `translate(${enterX * (1 - exitProgress)}px, ${enterY + exitY}px) scale(${enterScale * exitScale})`,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
