/** Public API for the reusable Syra cinematic video engine (Remotion). */
export { PostDeckVideo, type PostDeckVideoProps } from "./compositions/PostDeckVideo";
export { PostVideoPlayer, type PostVideoPlayerProps } from "./preview/PostVideoPlayer";
export {
  renderPostVideoOnWeb,
  exportPostVideo,
  isPostVideoFormatSupported,
  buildPostVideoFilename,
  type PostVideoExportCallbacks,
  type PostVideoExportFormat,
} from "./render/renderPostVideoOnWeb";
export {
  POST_VIDEO_LAYOUT_WIDTH,
  POST_VIDEO_LAYOUT_HEIGHT,
  POST_VIDEO_WIDTH,
  POST_VIDEO_HEIGHT,
  POST_VIDEO_EXPORT_SCALE,
  POST_VIDEO_BITRATE,
} from "./constants";
export {
  RemotionRevealProvider,
  RemotionReveal,
  useIsRemotionReveal,
  useRevealFrameStyle,
} from "./engine/revealContext";
export {
  getDeckDurationInFrames,
  getSlideDurationInFrames,
  frameToSlideIndex,
  POST_VIDEO_FPS,
} from "./engine/timing";
export { SYRA_VIDEO_THEME, type PostVideoTheme } from "./style/theme";
