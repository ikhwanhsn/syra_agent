import { ALL_POST_UPDATE_BUNDLES, type PostUpdateBundle } from "@/content/posts";
import { isPostDeleted, getPostXStatus } from "@/lib/postStudioState";

export function isBundlePostedForDisplay(bundle: PostUpdateBundle): boolean {
  const n = bundle.video.meta.updateNumber;
  return getPostXStatus(n, bundle.video.meta.postedOnX ?? false);
}

/** Fund brief bundles visible in the studio (excludes user-deleted updates). */
export function getVisiblePostBundles(): PostUpdateBundle[] {
  return ALL_POST_UPDATE_BUNDLES.filter(
    (bundle) => !isPostDeleted(bundle.video.meta.updateNumber),
  ).sort((a, b) => a.video.meta.updateNumber - b.video.meta.updateNumber);
}

export function getVisiblePostUpdateNumbers(): number[] {
  return getVisiblePostBundles().map((bundle) => bundle.video.meta.updateNumber);
}

export function getLatestVisiblePostUpdateNumber(): number {
  const numbers = getVisiblePostUpdateNumbers();
  return numbers[numbers.length - 1] ?? 1;
}

export function isPostVisible(updateNumber: number): boolean {
  if (isPostDeleted(updateNumber)) return false;
  return ALL_POST_UPDATE_BUNDLES.some((bundle) => bundle.video.meta.updateNumber === updateNumber);
}
