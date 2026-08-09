import { describe, expect, it } from "vitest";
import { SETTLEMENT_RECOVERY_POST } from "../settlementRecoveryUpdate";
import { SETTLEMENT_RECOVERY_PHOTO } from "./settlementRecoveryPhoto";
import { validatePostUpdate } from "../validatePostUpdate";
import { validatePostPhotoUpdate } from "./validatePostPhotoUpdate";
import { validatePhotoCardContent } from "./validatePhotoPostContent";
import { getPostBundleByNumber, LATEST_POST_UPDATE_NUMBER } from "../registry";

describe("settlement recovery post", () => {
  it("registers as update 43 and passes video/photo validation", () => {
    expect(SETTLEMENT_RECOVERY_POST.meta.updateNumber).toBe(43);
    expect(LATEST_POST_UPDATE_NUMBER).toBeGreaterThanOrEqual(43);
    expect(getPostBundleByNumber(43)?.video.meta.id).toBe("settlement-recovery");

    expect(() => validatePostUpdate(SETTLEMENT_RECOVERY_POST)).not.toThrow();
    expect(() => validatePostPhotoUpdate(SETTLEMENT_RECOVERY_PHOTO)).not.toThrow();

    const failures: string[] = [];
    for (const card of SETTLEMENT_RECOVERY_PHOTO.cards) {
      const errors = validatePhotoCardContent(card.layout, card.content, card.role);
      if (errors.length > 0) {
        failures.push(`${card.role}: ${errors.join("; ")}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
