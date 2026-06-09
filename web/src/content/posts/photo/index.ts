import { getPhotoPostByNumber, LATEST_POST_UPDATE_NUMBER } from "../registry";

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

export { getPostPhotoShareCopy } from "./getPostPhotoShareCopy";

/** Latest ship-log photo update (convenience for legacy imports). */
export const ACTIVE_PHOTO_POST = getPhotoPostByNumber(LATEST_POST_UPDATE_NUMBER)!;
