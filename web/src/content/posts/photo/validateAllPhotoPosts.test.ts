import { describe, expect, it } from "vitest";
import { validatePhotoCardContent } from "./validatePhotoPostContent";

const PHOTO_MODULES = [
  () => import("./lpAgentPhoto"),
  () => import("./bnbX402Photo"),
  () => import("./agentscorePhoto"),
  () => import("./lpRealProfitabilityPhoto"),
  () => import("./spcxPhoto"),
  () => import("./walletPortfolioPhoto"),
  () => import("./indicatorPhoto"),
  () => import("./assetsHubPhoto"),
  () => import("./pactNetworkPhoto"),
  () => import("./btcIntelligencePhoto"),
  () => import("./payaiX402Photo"),
  () => import("./algorandX402Photo"),
  () => import("./saidProtocolPhoto"),
  () => import("./covenantPhoto"),
  () => import("./aipIntegrationPhoto"),
];

describe("all ship-log photo decks", () => {
  it("every card in every bundle passes export-safe content validation", async () => {
    const failures: string[] = [];

    for (const load of PHOTO_MODULES) {
      const mod = await load();
      const photo = Object.values(mod).find(
        (value) =>
          value &&
          typeof value === "object" &&
          "meta" in value &&
          "cards" in value &&
          Array.isArray((value as { cards: unknown[] }).cards),
      ) as { meta: { id: string }; cards: { role: string; layout: string; content: object }[] } | undefined;

      if (!photo) continue;

      for (const card of photo.cards) {
        const errors = validatePhotoCardContent(
          card.layout as Parameters<typeof validatePhotoCardContent>[0],
          card.content as Parameters<typeof validatePhotoCardContent>[1],
          card.role,
        );
        if (errors.length > 0) {
          failures.push(`${photo.meta.id} / ${card.role}:\n  ${errors.join("\n  ")}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
