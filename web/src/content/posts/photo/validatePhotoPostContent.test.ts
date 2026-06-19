import { describe, expect, it } from "vitest";
import { PAYAI_X402_PHOTO } from "./payaiX402Photo";
import {
  POST_PHOTO_FIELD_LIMITS,
  validatePhotoCardContent,
} from "./validatePhotoPostContent";

describe("validatePhotoPostContent", () => {
  it("accepts PayAI cover card within limits", () => {
    const cover = PAYAI_X402_PHOTO.cards[0];
    expect(validatePhotoCardContent(cover.layout, cover.content, cover.role)).toEqual([]);
  });

  it("flags title that exceeds export-safe length", () => {
    const errors = validatePhotoCardContent("photo-cover-spotlight", {
      eyebrow: "Ship log",
      badge: "PayAI",
      title: "A".repeat(POST_PHOTO_FIELD_LIMITS.title + 1),
      subtitle: "Short subtitle.",
      kicker: "",
      headline: "",
      body: "",
      quote: "",
      highlights: [],
      steps: [],
      cards: [],
      stats: [],
      narrative: "",
      links: [],
      items: [],
      compareLeft: { title: "", body: "" },
      compareRight: { title: "", body: "" },
      terminalLines: [],
      partnerName: "",
      partnerLogo: "",
    }, "cover");

    expect(errors.some((e) => e.includes("title"))).toBe(true);
  });
});
