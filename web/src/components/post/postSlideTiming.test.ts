import { describe, expect, it } from "vitest";
import type { PostSlide } from "@/content/posts/types";
import {
  getSlideDwellMs,
  getTotalVideoDurationMs,
  getTotalVideoFrameCount,
  POST_VIDEO_FPS,
} from "@/components/post/postSlideTiming";
import { SPCX_POST } from "@/content/posts/spcxUpdate";

describe("postSlideTiming", () => {
  it("keeps ship-log decks under 60 seconds at 30fps", () => {
    const slides = SPCX_POST.slides;
    const durationMs = getTotalVideoDurationMs(slides);
    const frames = getTotalVideoFrameCount(slides);

    expect(slides.length).toBeGreaterThan(0);
    expect(durationMs).toBeLessThanOrEqual(60_000);
    expect(frames).toBeGreaterThan(0);
    expect(frames).toBeLessThanOrEqual(Math.ceil(durationMs / (1000 / POST_VIDEO_FPS)) + slides.length);
    expect(getSlideDwellMs(1, slides)).toBeLessThanOrEqual(5800);
    expect(getSlideDwellMs(1, slides)).toBeGreaterThanOrEqual(4500);
    expect(getSlideDwellMs(slides.length - 1, slides)).toBeLessThanOrEqual(6400);
  });

  it("uses shorter dwell than legacy 5.2s / 7s pacing", () => {
    const slide: PostSlide = SPCX_POST.slides[0];
    const slides = [slide, slide, slide];

    expect(getSlideDwellMs(0, slides)).toBeLessThan(5200);
    expect(getSlideDwellMs(2, slides)).toBeLessThan(7000);
  });
});
