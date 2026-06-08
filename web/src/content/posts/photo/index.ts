import { BNB_X402_PHOTO } from "./bnbX402Photo";
import { validatePostPhotoUpdate } from "./validatePostPhotoUpdate";

export type { PostPhotoLayoutTemplate } from "./layouts";
export {
  POST_PHOTO_LAYOUTS,
  POST_PHOTO_LAYOUT_COUNT,
  POST_PHOTO_LAYOUT_LABELS,
} from "./layouts";

export type {
  PostPhotoUpdate,
  PostPhotoContent,
  PostPhotoCard,
  PostPhotoStep,
  PostPhotoStat,
  PostPhotoLink,
} from "./types";

export {
  getPostPhotoPicks,
  getPostPhotoLibraryRest,
  validatePostPhotoUpdate,
} from "./validatePostPhotoUpdate";

/** Swap this export when publishing the next photo-format ship log. */
export const ACTIVE_PHOTO_POST = BNB_X402_PHOTO;

validatePostPhotoUpdate(ACTIVE_PHOTO_POST);
