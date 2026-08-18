import { describe, expect, it } from "vitest";
import { AGENT402_MARKETPLACE_POST } from "../agent402MarketplaceUpdate";
import { AGENT402_MARKETPLACE_PHOTO } from "./agent402MarketplacePhoto";
import { validatePostUpdate } from "../validatePostUpdate";
import { validatePostPhotoUpdate } from "./validatePostPhotoUpdate";
import { validatePhotoCardContent } from "./validatePhotoPostContent";
import { getPostBundleByNumber, LATEST_POST_UPDATE_NUMBER } from "../registry";

describe("agent402 marketplace post", () => {
  it("registers as update 46 and passes video/photo validation", () => {
    expect(AGENT402_MARKETPLACE_POST.meta.updateNumber).toBe(46);
    expect(LATEST_POST_UPDATE_NUMBER).toBeGreaterThanOrEqual(46);
    expect(getPostBundleByNumber(46)?.video.meta.id).toBe("agent402-marketplace");
    expect(getPostBundleByNumber(46)?.photo.cards.find((c) => c.role === "launch")?.content.partnerLogo).toBe(
      "/images/partners/agent402.png",
    );

    expect(() => validatePostUpdate(AGENT402_MARKETPLACE_POST)).not.toThrow();
    expect(() => validatePostPhotoUpdate(AGENT402_MARKETPLACE_PHOTO)).not.toThrow();

    const failures: string[] = [];
    for (const card of AGENT402_MARKETPLACE_PHOTO.cards) {
      const errors = validatePhotoCardContent(card.layout, card.content, card.role);
      if (errors.length > 0) {
        failures.push(`${card.role}: ${errors.join("; ")}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
