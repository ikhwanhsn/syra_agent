import { describe, expect, it } from "vitest";
import { AGENT_ECONOMY_APIS_POST } from "../agentEconomyApisUpdate";
import { AGENT_ECONOMY_APIS_PHOTO } from "./agentEconomyApisPhoto";
import { validatePostUpdate } from "../validatePostUpdate";
import { validatePostPhotoUpdate } from "./validatePostPhotoUpdate";
import { validatePhotoCardContent } from "./validatePhotoPostContent";
import { getPostBundleByNumber, LATEST_POST_UPDATE_NUMBER } from "../registry";

describe("agent economy APIs post", () => {
  it("registers as update 49 and passes video/photo validation", () => {
    expect(AGENT_ECONOMY_APIS_POST.meta.updateNumber).toBe(49);
    expect(AGENT_ECONOMY_APIS_POST.meta.id).toBe("agent-economy-apis");
    expect(LATEST_POST_UPDATE_NUMBER).toBe(49);
    expect(getPostBundleByNumber(49)?.video.meta.id).toBe("agent-economy-apis");
    expect(getPostBundleByNumber(49)?.photo.cards).toHaveLength(15);

    expect(() => validatePostUpdate(AGENT_ECONOMY_APIS_POST)).not.toThrow();
    expect(() => validatePostPhotoUpdate(AGENT_ECONOMY_APIS_PHOTO)).not.toThrow();

    const failures: string[] = [];
    for (const card of AGENT_ECONOMY_APIS_PHOTO.cards) {
      const errors = validatePhotoCardContent(card.layout, card.content, card.role);
      if (errors.length > 0) {
        failures.push(`${card.role}: ${errors.join("; ")}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
