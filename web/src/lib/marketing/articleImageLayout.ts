/** Shared frame for all marketing/blog article images — always 16:9. */
export const ARTICLE_IMAGE_ASPECT_CLASS = "aspect-video" as const;

/** Intrinsic dimensions for article covers / inline art (matches exported WebPs). */
export const ARTICLE_IMAGE_WIDTH = 1920 as const;
export const ARTICLE_IMAGE_HEIGHT = 1080 as const;

/**
 * Outer media frame: fixed 16:9 box so every article thumb/hero renders the same size
 * regardless of surrounding card/text height.
 */
export const articleMediaFrameClass =
  "relative aspect-video w-full shrink-0 overflow-hidden bg-muted/20";

/** Fill the frame without letterboxing. */
export const articleMediaImgClass =
  "absolute inset-0 h-full w-full object-cover";
