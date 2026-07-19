import { describe, expect, it } from "vitest";
import { ACTIVE_POST } from "@/content/posts";
import {
  frameToSlideIndex,
  getDeckDurationInFrames,
  getSlideDurationInFrames,
  getSlideStartFrames,
  POST_VIDEO_FPS,
} from "@/video/engine/timing";
import { getTotalVideoDurationMs } from "@/components/post/postSlideTiming";

describe("video engine timing", () => {
  const slides = ACTIVE_POST.slides;

  it("deck duration matches postSlideTiming frame count", () => {
    const frames = getDeckDurationInFrames(slides);
    const durationMs = getTotalVideoDurationMs(slides);
    expect(frames).toBeGreaterThan(0);
    expect(frames).toBeLessThanOrEqual(Math.ceil(durationMs / (1000 / POST_VIDEO_FPS)) + slides.length);
  });

  it("slide start frames are strictly increasing", () => {
    const starts = getSlideStartFrames(slides);
    expect(starts).toHaveLength(slides.length);
    expect(starts[0]).toBe(0);
    for (let i = 1; i < starts.length; i += 1) {
      expect(starts[i]).toBe(starts[i - 1] + getSlideDurationInFrames(i - 1, slides));
    }
  });

  it("frameToSlideIndex maps boundaries correctly", () => {
    const starts = getSlideStartFrames(slides);
    expect(frameToSlideIndex(0, slides)).toBe(0);
    if (starts.length > 1) {
      expect(frameToSlideIndex(starts[1], slides)).toBe(1);
      expect(frameToSlideIndex(starts[1] - 1, slides)).toBe(0);
    }
    const last = slides.length - 1;
    expect(frameToSlideIndex(getDeckDurationInFrames(slides) - 1, slides)).toBe(last);
  });
});
