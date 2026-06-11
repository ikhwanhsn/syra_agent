import { getPhotoPostByNumber, LATEST_POST_UPDATE_NUMBER } from "../registry";

export type { PostPhotoLayoutTemplate } from "./layouts";
export {
  POST_PHOTO_LAYOUTS,
  POST_PHOTO_LAYOUT_COUNT,
  POST_PHOTO_LAYOUT_LABELS,
} from "./layouts";

export {
  POST_PHOTO_CARD_SLOTS,
  POST_PHOTO_CARD_COUNT,
  POST_PHOTO_CARD_SLOT_BY_ROLE,
  type PostPhotoCardRole,
  type PostPhotoCardSlotDef,
} from "./photoCardSlots";

export { photoContent, EMPTY_PHOTO_CONTENT } from "./photoContent";

export { definePhotoUpdate } from "./photoDeck";

export type {
  PostPhotoUpdate,
  PostPhotoContent,
  PostPhotoCardDef,
  PostPhotoCard,
  PostPhotoStep,
  PostPhotoStat,
  PostPhotoLink,
} from "./types";

export { validatePostPhotoUpdate } from "./validatePostPhotoUpdate";

export { getPostPhotoShareCopy } from "./getPostPhotoShareCopy";

/** Latest ship-log photo update (convenience for legacy imports). */
export const ACTIVE_PHOTO_POST = getPhotoPostByNumber(LATEST_POST_UPDATE_NUMBER)!;
