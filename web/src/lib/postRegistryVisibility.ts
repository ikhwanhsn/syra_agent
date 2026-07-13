import { ALL_POST_UPDATE_BUNDLES, type PostUpdateBundle } from "@/content/posts";
import { isLockedShipLogUpdate } from "@/lib/postLocked";
import { isPostDeleted, getPostXStatus } from "@/lib/postStudioState";

export function isBundlePostedForDisplay(bundle: PostUpdateBundle): boolean {
  const n = bundle.video.meta.updateNumber;
  return getPostXStatus(n, bundle.video.meta.postedOnX ?? false);
}

/** Ship-log bundles visible in the studio (excludes user-deleted updates). Locked template always stays. */
export function getVisiblePostBundles(): PostUpdateBundle[] {
  return ALL_POST_UPDATE_BUNDLES.filter((bundle) => {
    const n = bundle.video.meta.updateNumber;
    if (isLockedShipLogUpdate(n) || bundle.video.meta.locked) return true;
    return !isPostDeleted(n);
  }).sort((a, b) => a.video.meta.updateNumber - b.video.meta.updateNumber);
}

export function getVisiblePostUpdateNumbers(): number[] {
  return getVisiblePostBundles().map((bundle) => bundle.video.meta.updateNumber);
}

/** Latest content update for Video/Photo CTAs — skips the locked format template. */
export function getLatestVisiblePostUpdateNumber(): number {
  const numbers = getVisiblePostUpdateNumbers().filter((n) => !isLockedShipLogUpdate(n));
  return numbers[numbers.length - 1] ?? 1;
}

export function isPostVisible(updateNumber: number): boolean {
  if (isLockedShipLogUpdate(updateNumber)) {
    return ALL_POST_UPDATE_BUNDLES.some((bundle) => bundle.video.meta.updateNumber === updateNumber);
  }
  if (isPostDeleted(updateNumber)) return false;
  return ALL_POST_UPDATE_BUNDLES.some((bundle) => bundle.video.meta.updateNumber === updateNumber);
}
