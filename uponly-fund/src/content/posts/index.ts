import {
  getVideoPostByNumber,
  LATEST_POST_UPDATE_NUMBER,
  POST_REGISTRY,
} from "./registry";

export type { PostSlideLayoutTemplate } from "./layouts";
export { POST_SLIDE_LAYOUTS, POST_LAYOUT_LABELS, POST_LAYOUT_TEMPLATE_COUNT } from "./layouts";

export {
  MAX_POST_UPDATES,
  ALL_POST_UPDATE_BUNDLES,
  POST_REGISTRY,
  LATEST_POST_UPDATE_NUMBER,
  getPostBundleByNumber,
  getVideoPostByNumber,
  getPhotoPostByNumber,
  getNextUpdateNumber,
  getPostUpdateNumbers,
  getAdjacentPostUpdateNumbers,
} from "./registry";
export type { PostUpdateBundle } from "./registry";

/** Latest fund brief video update (convenience for legacy imports). */
export const ACTIVE_POST = getVideoPostByNumber(LATEST_POST_UPDATE_NUMBER)!;

export const POST_SLIDE_COUNT = ACTIVE_POST.slides.length;

export type { PostSlide, PostUpdate, PostUpdateMeta } from "./types";
