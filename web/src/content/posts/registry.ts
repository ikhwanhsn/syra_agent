import { AGENTSCORE_POST } from "./agentscoreUpdate";
import { INDICATOR_POST } from "./indicatorUpdate";
import { BNB_X402_POST } from "./bnbX402Update";
import { LP_AGENT_POST } from "./lpAgentUpdate";
import { LP_REAL_PROFITABILITY_POST } from "./lpRealProfitabilityUpdate";
import { SPCX_POST } from "./spcxUpdate";
import { ASSETS_HUB_POST } from "./assetsHubUpdate";
import { PACT_NETWORK_POST } from "./pactNetworkUpdate";
import { WALLET_PORTFOLIO_POST } from "./walletPortfolioUpdate";
import { BTC_INTELLIGENCE_POST } from "./btcIntelligenceUpdate";
import { PAYAI_X402_POST } from "./payaiX402Update";
import { ALGORAND_X402_POST } from "./algorandX402Update";
import { SAID_PROTOCOL_POST } from "./saidProtocolUpdate";
import { COVENANT_POST } from "./covenantUpdate";
import { SWAP_POST } from "./swapUpdate";
import { SKILL_EARN_POST } from "./skillEarnUpdate";
import { AMPERSEND_MARKETPLACE_POST } from "./ampersendMarketplaceUpdate";
import { AIP_INTEGRATION_POST } from "./aipIntegrationUpdate";
import { OPENROUTER_X402_APIS_POST } from "./openrouterX402ApisUpdate";
import { AGENTSCORE_PHOTO } from "./photo/agentscorePhoto";
import { INDICATOR_PHOTO } from "./photo/indicatorPhoto";
import { BNB_X402_PHOTO } from "./photo/bnbX402Photo";
import { LP_AGENT_PHOTO } from "./photo/lpAgentPhoto";
import { LP_REAL_PROFITABILITY_PHOTO } from "./photo/lpRealProfitabilityPhoto";
import { SPCX_PHOTO } from "./photo/spcxPhoto";
import { ASSETS_HUB_PHOTO } from "./photo/assetsHubPhoto";
import { PACT_NETWORK_PHOTO } from "./photo/pactNetworkPhoto";
import { WALLET_PORTFOLIO_PHOTO } from "./photo/walletPortfolioPhoto";
import { BTC_INTELLIGENCE_PHOTO } from "./photo/btcIntelligencePhoto";
import { PAYAI_X402_PHOTO } from "./photo/payaiX402Photo";
import { ALGORAND_X402_PHOTO } from "./photo/algorandX402Photo";
import { SAID_PROTOCOL_PHOTO } from "./photo/saidProtocolPhoto";
import { COVENANT_PHOTO } from "./photo/covenantPhoto";
import { SWAP_PHOTO } from "./photo/swapPhoto";
import { SKILL_EARN_PHOTO } from "./photo/skillEarnPhoto";
import { AMPERSEND_MARKETPLACE_PHOTO } from "./photo/ampersendMarketplacePhoto";
import { AIP_INTEGRATION_PHOTO } from "./photo/aipIntegrationPhoto";
import { OPENROUTER_X402_APIS_PHOTO } from "./photo/openrouterX402ApisPhoto";
import type { PostPhotoUpdate } from "./photo/types";
import type { PostUpdate } from "./types";
import { validatePostUpdate } from "./validatePostUpdate";
import { validatePostPhotoUpdate } from "./photo/validatePostPhotoUpdate";
import { validatePhotoCardContent } from "./photo/validatePhotoPostContent";

export interface PostUpdateBundle {
  video: PostUpdate;
  photo: PostPhotoUpdate;
}

/**
 * Append new ship-log updates here (oldest first). Remove published entries from the
 * studio via the delete control on /post (localStorage); source files stay in repo
 * until you clean them up manually.
 */
const POST_UPDATE_BUNDLES: PostUpdateBundle[] = [
  { video: LP_AGENT_POST, photo: LP_AGENT_PHOTO },
  { video: BNB_X402_POST, photo: BNB_X402_PHOTO },
  { video: AGENTSCORE_POST, photo: AGENTSCORE_PHOTO },
  { video: LP_REAL_PROFITABILITY_POST, photo: LP_REAL_PROFITABILITY_PHOTO },
  { video: SPCX_POST, photo: SPCX_PHOTO },
  { video: WALLET_PORTFOLIO_POST, photo: WALLET_PORTFOLIO_PHOTO },
  { video: INDICATOR_POST, photo: INDICATOR_PHOTO },
  { video: ASSETS_HUB_POST, photo: ASSETS_HUB_PHOTO },
  { video: PACT_NETWORK_POST, photo: PACT_NETWORK_PHOTO },
  { video: BTC_INTELLIGENCE_POST, photo: BTC_INTELLIGENCE_PHOTO },
  { video: PAYAI_X402_POST, photo: PAYAI_X402_PHOTO },
  { video: ALGORAND_X402_POST, photo: ALGORAND_X402_PHOTO },
  { video: SAID_PROTOCOL_POST, photo: SAID_PROTOCOL_PHOTO },
  { video: COVENANT_POST, photo: COVENANT_PHOTO },
  { video: SWAP_POST, photo: SWAP_PHOTO },
  { video: SKILL_EARN_POST, photo: SKILL_EARN_PHOTO },
  { video: AMPERSEND_MARKETPLACE_POST, photo: AMPERSEND_MARKETPLACE_PHOTO },
  { video: AIP_INTEGRATION_POST, photo: AIP_INTEGRATION_PHOTO },
  { video: OPENROUTER_X402_APIS_POST, photo: OPENROUTER_X402_APIS_PHOTO },
];

function assertBundleMeta(bundle: PostUpdateBundle): void {
  const videoNumber = bundle.video.meta.updateNumber;
  const photoNumber = bundle.photo.meta.updateNumber;

  if (videoNumber !== photoNumber) {
    throw new Error(
      `[post] update #${videoNumber} video/photo meta.updateNumber mismatch (${videoNumber} vs ${photoNumber})`,
    );
  }
}

function buildRegistry(bundles: PostUpdateBundle[]): PostUpdateBundle[] {
  const sorted = [...bundles].sort((a, b) => a.video.meta.updateNumber - b.video.meta.updateNumber);

  const seen = new Set<number>();
  for (const bundle of sorted) {
    assertBundleMeta(bundle);
    const n = bundle.video.meta.updateNumber;
    if (seen.has(n)) {
      throw new Error(`[post] duplicate updateNumber ${n} in registry`);
    }
    seen.add(n);
    validatePostUpdate(bundle.video);
    validatePostPhotoUpdate(bundle.photo);
    for (const card of bundle.photo.cards) {
      const contentErrors = validatePhotoCardContent(card.layout, card.content, card.role);
      if (contentErrors.length > 0 && import.meta.env.DEV) {
        console.warn(
          `[post/photo] "${bundle.photo.meta.id}" card "${card.role}":\n${contentErrors.join("\n")}`,
        );
      }
    }
  }

  return sorted;
}

export const POST_REGISTRY = buildRegistry(POST_UPDATE_BUNDLES);

/** All ship-log bundles defined in source (visibility/delete handled in postRegistryVisibility). */
export const ALL_POST_UPDATE_BUNDLES: PostUpdateBundle[] = POST_UPDATE_BUNDLES;

export const LATEST_POST_UPDATE_NUMBER =
  POST_REGISTRY[POST_REGISTRY.length - 1]?.video.meta.updateNumber ?? 1;

export function getPostBundleByNumber(updateNumber: number): PostUpdateBundle | undefined {
  return POST_REGISTRY.find((bundle) => bundle.video.meta.updateNumber === updateNumber);
}

export function getVideoPostByNumber(updateNumber: number): PostUpdate | undefined {
  return getPostBundleByNumber(updateNumber)?.video;
}

export function getPhotoPostByNumber(updateNumber: number): PostPhotoUpdate | undefined {
  return getPostBundleByNumber(updateNumber)?.photo;
}

export function getPostUpdateNumbers(): number[] {
  return POST_REGISTRY.map((bundle) => bundle.video.meta.updateNumber).sort((a, b) => a - b);
}

export function getAdjacentPostUpdateNumbers(updateNumber: number): {
  prev: number | null;
  next: number | null;
} {
  const numbers = getPostUpdateNumbers();
  const index = numbers.indexOf(updateNumber);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? numbers[index - 1]! : null,
    next: index < numbers.length - 1 ? numbers[index + 1]! : null,
  };
}

/** Next updateNumber to use when creating a new ship log. */
export function getNextUpdateNumber(): number {
  const max = POST_UPDATE_BUNDLES.reduce(
    (highest, bundle) => Math.max(highest, bundle.video.meta.updateNumber),
    0,
  );
  return max + 1;
}
