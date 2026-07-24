import { describe, expect, it } from "vitest";
import { GOPLAUSIBLE_SOLANA_BASE_FAILOVER_POST } from "../goplausibleSolanaBaseFailoverUpdate";
import { GOPLAUSIBLE_SOLANA_BASE_FAILOVER_PHOTO } from "./goplausibleSolanaBaseFailoverPhoto";
import { validatePostUpdate } from "../validatePostUpdate";
import { validatePostPhotoUpdate } from "./validatePostPhotoUpdate";
import { validatePhotoCardContent } from "./validatePhotoPostContent";
import { getPostBundleByNumber, LATEST_POST_UPDATE_NUMBER } from "../registry";

describe("goplausible solana base failover post", () => {
  it("registers as update 39 and passes video/photo validation", () => {
    expect(GOPLAUSIBLE_SOLANA_BASE_FAILOVER_POST.meta.updateNumber).toBe(39);
    expect(LATEST_POST_UPDATE_NUMBER).toBe(39);
    expect(getPostBundleByNumber(39)?.video.meta.id).toBe("goplausible-solana-base-failover");

    expect(() => validatePostUpdate(GOPLAUSIBLE_SOLANA_BASE_FAILOVER_POST)).not.toThrow();
    expect(() => validatePostPhotoUpdate(GOPLAUSIBLE_SOLANA_BASE_FAILOVER_PHOTO)).not.toThrow();

    const failures: string[] = [];
    for (const card of GOPLAUSIBLE_SOLANA_BASE_FAILOVER_PHOTO.cards) {
      const errors = validatePhotoCardContent(card.layout, card.content, card.role);
      if (errors.length > 0) {
        failures.push(`${card.role}: ${errors.join("; ")}`);
      }
    }
    expect(failures).toEqual([]);

    const launch = GOPLAUSIBLE_SOLANA_BASE_FAILOVER_PHOTO.cards.find((c) => c.role === "launch");
    expect(launch?.content.partnerLogo).toBe("/images/partners/goplausible.png");
    expect(launch?.content.partnerName).toBe("GoPlausible");
  });
});
