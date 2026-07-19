import { Composition, type CalculateMetadataFunction } from "remotion";
import { ACTIVE_POST } from "@/content/posts";
import type { PostSlide } from "@/content/posts/types";
import { PostDeckVideo, type PostDeckVideoProps } from "@/video/compositions/PostDeckVideo";
import {
  POST_VIDEO_LAYOUT_HEIGHT,
  POST_VIDEO_LAYOUT_WIDTH,
} from "@/video/constants";
import { getDeckDurationInFrames, POST_VIDEO_FPS } from "@/video/engine/timing";

const calculateMetadata: CalculateMetadataFunction<PostDeckVideoProps> = ({ props }) => {
  const slides = props.slides ?? [];
  return {
    durationInFrames: Math.max(1, getDeckDurationInFrames(slides)),
    fps: POST_VIDEO_FPS,
    width: POST_VIDEO_LAYOUT_WIDTH,
    height: POST_VIDEO_LAYOUT_HEIGHT,
  };
};

const defaultSlides: PostSlide[] = ACTIVE_POST.slides;

/** Remotion Studio root — single Syra cinematic composition. */
export function RemotionRoot() {
  return (
    <Composition
      id="PostDeck"
      component={PostDeckVideo}
      durationInFrames={getDeckDurationInFrames(defaultSlides)}
      fps={POST_VIDEO_FPS}
      width={POST_VIDEO_LAYOUT_WIDTH}
      height={POST_VIDEO_LAYOUT_HEIGHT}
      defaultProps={{ slides: defaultSlides }}
      calculateMetadata={calculateMetadata}
    />
  );
}
