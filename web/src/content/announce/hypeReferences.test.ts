import { describe, expect, it } from "vitest";
import {
  findBestHypeReference,
  HYPE_DEFAULT_ID,
} from "@/content/announce/hypeReferences";

describe("findBestHypeReference", () => {
  it("defaults to the working copy when the brief is vague", () => {
    const match = findBestHypeReference("syra post for agents");
    expect(match.kind).toBe("default");
    expect(match.reference.id).toBe(HYPE_DEFAULT_ID);
  });

  it("picks the working copy for a one-liner invite", () => {
    const match = findBestHypeReference(
      "One-liner manifesto. First call. The catalog is on the other side.",
    );
    expect(match.kind).toBe("match");
    expect(match.reference.id).toBe("hype-working");
  });

  it("picks the original door for a centered foot sticker", () => {
    const match = findBestHypeReference("Centered foot sticker on a mood still. Portal door.");
    expect(match.kind).toBe("match");
    expect(match.reference.id).toBe("hype-door");
  });
});
