import { BNB_X402_POST } from "./bnbX402Update";

export type { PostSlideLayoutTemplate } from "./layouts";
export { POST_SLIDE_LAYOUTS, POST_LAYOUT_LABELS, POST_LAYOUT_TEMPLATE_COUNT } from "./layouts";

import { validatePostUpdate } from "./validatePostUpdate";

/** Swap this export when publishing the next ship-log post. */
export const ACTIVE_POST = BNB_X402_POST;

validatePostUpdate(ACTIVE_POST);

export const POST_SLIDE_COUNT = ACTIVE_POST.slides.length;

export type { PostSlide, PostUpdate, PostUpdateMeta } from "./types";
