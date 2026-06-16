import {
  getVideoPostByNumber,
  LATEST_POST_UPDATE_NUMBER,
  POST_REGISTRY,
} from "./registry";

export type { PostSlideLayoutTemplate } from "./layouts";
export { POST_SLIDE_LAYOUTS, POST_LAYOUT_LABELS, POST_LAYOUT_TEMPLATE_COUNT } from "./layouts";

export {
  POST_REGISTRY,
  ALL_POST_UPDATE_BUNDLES,
  LATEST_POST_UPDATE_NUMBER,
  getPostBundleByNumber,
  getVideoPostByNumber,
  getPhotoPostByNumber,
  getNextUpdateNumber,
  getPostUpdateNumbers,
  getAdjacentPostUpdateNumbers,
} from "./registry";
export type { PostUpdateBundle } from "./registry";

/** Latest ship-log video update (convenience for legacy imports). */
export const ACTIVE_POST = getVideoPostByNumber(LATEST_POST_UPDATE_NUMBER)!;

export const POST_SLIDE_COUNT = ACTIVE_POST.slides.length;

export type { PostSlide, PostUpdate, PostUpdateMeta } from "./types";
