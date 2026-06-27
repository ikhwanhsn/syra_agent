import { S3_GROWTH_BRIEF_POST } from "./s3GrowthBriefUpdate";
import { S3_GROWTH_BRIEF_PHOTO } from "./photo/s3GrowthBriefPhoto";
import { KOL_MARKETPLACE_POST } from "./kolMarketplaceUpdate";
import { KOL_MARKETPLACE_PHOTO } from "./photo/kolMarketplacePhoto";
import { S3LABS_POINTS_POST } from "./s3labsPointsUpdate";
import { S3LABS_POINTS_PHOTO } from "./photo/s3labsPointsPhoto";
import type { PostPhotoUpdate } from "./photo/types";
import type { PostUpdate } from "./types";
import { validatePostUpdate } from "./validatePostUpdate";
import { validatePostPhotoUpdate } from "./photo/validatePostPhotoUpdate";

export const MAX_POST_UPDATES = 10;

export interface PostUpdateBundle {
  video: PostUpdate;
  photo: PostPhotoUpdate;
}

const POST_UPDATE_BUNDLES: PostUpdateBundle[] = [
  { video: S3_GROWTH_BRIEF_POST, photo: S3_GROWTH_BRIEF_PHOTO },
  { video: KOL_MARKETPLACE_POST, photo: KOL_MARKETPLACE_PHOTO },
  { video: S3LABS_POINTS_POST, photo: S3LABS_POINTS_PHOTO },
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

export const ALL_POST_UPDATE_BUNDLES: PostUpdateBundle[] = POST_UPDATE_BUNDLES;

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

export function getNextUpdateNumber(): number {
  const max = POST_UPDATE_BUNDLES.reduce(
    (highest, bundle) => Math.max(highest, bundle.video.meta.updateNumber),
    0,
  );
  return max + 1;
}
