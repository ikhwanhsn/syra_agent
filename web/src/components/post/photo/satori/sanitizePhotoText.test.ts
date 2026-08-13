import { describe, expect, it } from "vitest";
import {
  sanitizePhotoText,
  sanitizePhotoValue,
} from "@/components/post/photo/satori/sanitizePhotoText";

describe("sanitizePhotoText", () => {
  it("replaces right arrows used in flow headlines", () => {
    expect(sanitizePhotoText("Resolve → risk → intel → action.")).toBe(
      "Resolve -> risk -> intel -> action.",
    );
  });

  it("replaces other glyphs missing from embedded photo fonts", () => {
    expect(sanitizePhotoText("score ≥ 80 ≠ fail ← back ↔ both")).toBe(
      "score >= 80 != fail <- back <-> both",
    );
  });

  it("leaves supported punctuation alone", () => {
    expect(sanitizePhotoText("Syra × Tokens · open source…")).toBe(
      "Syra × Tokens · open source…",
    );
  });
});

describe("sanitizePhotoValue", () => {
  it("walks nested photo content strings", () => {
    const input = {
      headline: "Resolve → risk → intel → action.",
      steps: [{ title: "Act", description: "Pay → unlock" }],
    };
    expect(sanitizePhotoValue(input)).toEqual({
      headline: "Resolve -> risk -> intel -> action.",
      steps: [{ title: "Act", description: "Pay -> unlock" }],
    });
  });
});
