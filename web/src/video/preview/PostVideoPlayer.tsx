import { Player } from "@remotion/player";
import type { CSSProperties } from "react";
import type { PostSlide } from "@/content/posts/types";
import { PostDeckVideo } from "@/video/compositions/PostDeckVideo";
import {
  POST_VIDEO_LAYOUT_HEIGHT,
  POST_VIDEO_LAYOUT_WIDTH,
} from "@/video/constants";
import { getDeckDurationInFrames, POST_VIDEO_FPS } from "@/video/engine/timing";

export interface PostVideoPlayerProps {
  slides: PostSlide[];
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  className?: string;
  style?: CSSProperties;
  initiallyMuted?: boolean;
}

/**
 * WYSIWYG Remotion Player — same composition as export.
 */
export function PostVideoPlayer({
  slides,
  autoPlay = false,
  controls = true,
  loop = true,
  className,
  style,
  initiallyMuted = true,
}: PostVideoPlayerProps) {
  const durationInFrames = getDeckDurationInFrames(slides);

  return (
    <Player
      component={PostDeckVideo}
      inputProps={{ slides }}
      durationInFrames={durationInFrames}
      compositionWidth={POST_VIDEO_LAYOUT_WIDTH}
      compositionHeight={POST_VIDEO_LAYOUT_HEIGHT}
      fps={POST_VIDEO_FPS}
      autoPlay={autoPlay}
      controls={controls}
      initiallyMuted={initiallyMuted}
      loop={loop}
      className={className}
      style={{
        width: "100%",
        aspectRatio: `${POST_VIDEO_LAYOUT_WIDTH} / ${POST_VIDEO_LAYOUT_HEIGHT}`,
        ...style,
      }}
    />
  );
}
