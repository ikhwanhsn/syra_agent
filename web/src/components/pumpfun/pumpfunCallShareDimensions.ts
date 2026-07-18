/** Export canvas — 16:9 flex card (native X / timeline aspect). */
export const PUMPFUN_CALL_SHARE_RATIO = 16 / 9;
export const PUMPFUN_CALL_SHARE_WIDTH = 1920;
export const PUMPFUN_CALL_SHARE_HEIGHT = Math.round(
  PUMPFUN_CALL_SHARE_WIDTH / PUMPFUN_CALL_SHARE_RATIO,
);
export const PUMPFUN_CALL_SHARE_BG = "#030303";

/** Modal / page preview width in CSS px. */
export const PUMPFUN_CALL_SHARE_PREVIEW_WIDTH = 640;
export const PUMPFUN_CALL_SHARE_PREVIEW_SCALE =
  PUMPFUN_CALL_SHARE_PREVIEW_WIDTH / PUMPFUN_CALL_SHARE_WIDTH;
export const PUMPFUN_CALL_SHARE_PREVIEW_HEIGHT = Math.round(
  PUMPFUN_CALL_SHARE_HEIGHT * PUMPFUN_CALL_SHARE_PREVIEW_SCALE,
);

/** Shown on flex cards and share captions. */
export const PUMPFUN_CALL_SHARE_SITE_PATH = "syraa.fun/analyzer";
