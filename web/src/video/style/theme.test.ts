import { describe, expect, it } from "vitest";
import { SYRA_VIDEO_THEME } from "@/video/style/theme";

describe("SYRA_VIDEO_THEME", () => {
  it("keeps the Syra white canvas / gold accent palette", () => {
    expect(SYRA_VIDEO_THEME.bg).toBe("#FFFFFF");
    expect(SYRA_VIDEO_THEME.accent).toBe("#F3BA2F");
    expect(SYRA_VIDEO_THEME.fg).toContain("0,0,0");
    expect(SYRA_VIDEO_THEME.muted).toContain("0,0,0");
  });

  it("uses smooth professional springs with no bounce", () => {
    expect(SYRA_VIDEO_THEME.spring.reveal.damping).toBe(200);
    expect(SYRA_VIDEO_THEME.spring.slide.damping).toBe(200);
    expect(SYRA_VIDEO_THEME.spring.chrome.damping).toBe(200);
    expect(SYRA_VIDEO_THEME.spring.scene.damping).toBe(200);
  });

  it("defines enter / exit / reveal timing", () => {
    expect(SYRA_VIDEO_THEME.enterFrames).toBeGreaterThan(0);
    expect(SYRA_VIDEO_THEME.exitFrames).toBeGreaterThan(0);
    expect(SYRA_VIDEO_THEME.revealOffsetY).toBeGreaterThan(0);
  });
});
