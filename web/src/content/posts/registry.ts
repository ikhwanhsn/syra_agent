import { AGENTSCORE_POST } from "./agentscoreUpdate";
import { BNB_X402_POST } from "./bnbX402Update";
import { LP_AGENT_POST } from "./lpAgentUpdate";
import { LP_REAL_PROFITABILITY_POST } from "./lpRealProfitabilityUpdate";
import { PUMPFUN_ALPHA_POST } from "./pumpfunAlphaUpdate";
import { SPCX_POST } from "./spcxUpdate";
import { WALLET_PORTFOLIO_POST } from "./walletPortfolioUpdate";
import { AGENTSCORE_PHOTO } from "./photo/agentscorePhoto";
import { BNB_X402_PHOTO } from "./photo/bnbX402Photo";
import { LP_AGENT_PHOTO } from "./photo/lpAgentPhoto";
import { LP_REAL_PROFITABILITY_PHOTO } from "./photo/lpRealProfitabilityPhoto";
import { PUMPFUN_ALPHA_PHOTO } from "./photo/pumpfunAlphaPhoto";
import { SPCX_PHOTO } from "./photo/spcxPhoto";
import { WALLET_PORTFOLIO_PHOTO } from "./photo/walletPortfolioPhoto";
import type { PostPhotoUpdate } from "./photo/types";
import type { PostUpdate } from "./types";
import { validatePostUpdate } from "./validatePostUpdate";
import { validatePostPhotoUpdate } from "./photo/validatePostPhotoUpdate";

export const MAX_POST_UPDATES = 10;

export interface PostUpdateBundle {
  video: PostUpdate;
  photo: PostPhotoUpdate;
}

/**
 * Append new ship-log updates here (oldest first). The registry keeps only the latest
 * MAX_POST_UPDATES entries — when an 11th is added, the oldest is dropped automatically.
 */
const POST_UPDATE_BUNDLES: PostUpdateBundle[] = [
  { video: LP_AGENT_POST, photo: LP_AGENT_PHOTO },
  { video: BNB_X402_POST, photo: BNB_X402_PHOTO },
  { video: AGENTSCORE_POST, photo: AGENTSCORE_PHOTO },
  { video: PUMPFUN_ALPHA_POST, photo: PUMPFUN_ALPHA_PHOTO },
  { video: LP_REAL_PROFITABILITY_POST, photo: LP_REAL_PROFITABILITY_PHOTO },
  { video: SPCX_POST, photo: SPCX_PHOTO },
  { video: WALLET_PORTFOLIO_POST, photo: WALLET_PORTFOLIO_PHOTO },
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
  const trimmed = sorted.slice(-MAX_POST_UPDATES);

  const seen = new Set<number>();
  for (const bundle of trimmed) {
    assertBundleMeta(bundle);
    const n = bundle.video.meta.updateNumber;
    if (seen.has(n)) {
      throw new Error(`[post] duplicate updateNumber ${n} in registry`);
    }
    seen.add(n);
    validatePostUpdate(bundle.video);
    validatePostPhotoUpdate(bundle.photo);
  }

  return trimmed;
}

export const POST_REGISTRY = buildRegistry(POST_UPDATE_BUNDLES);

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
