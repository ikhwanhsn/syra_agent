/** Shared layout + export constants for ship-log video (preview + Remotion). */

export const POST_VIDEO_LAYOUT_WIDTH = 960;
export const POST_VIDEO_LAYOUT_HEIGHT = 540;
export const POST_VIDEO_WIDTH = 1920;
export const POST_VIDEO_HEIGHT = 1080;
/** Scale factor from layout composition → Full HD export. */
export const POST_VIDEO_EXPORT_SCALE = POST_VIDEO_WIDTH / POST_VIDEO_LAYOUT_WIDTH;
export const POST_VIDEO_BITRATE = 16_000_000;

export type PostVideoExportFormat = "webm" | "mp4";
