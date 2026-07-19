import { canRenderMediaOnWeb, renderMediaOnWeb } from "@remotion/web-renderer";
import type { PostSlide } from "@/content/posts/types";
import { PostDeckVideo } from "@/video/compositions/PostDeckVideo";
import {
  POST_VIDEO_BITRATE,
  POST_VIDEO_EXPORT_SCALE,
  POST_VIDEO_LAYOUT_HEIGHT,
  POST_VIDEO_LAYOUT_WIDTH,
  type PostVideoExportFormat,
} from "@/video/constants";
import {
  frameToSlideIndex,
  getDeckDurationInFrames,
  POST_VIDEO_FPS,
} from "@/video/engine/timing";

export type { PostVideoExportFormat };

export interface PostVideoExportCallbacks {
  onSlideChange: (index: number) => void | Promise<void>;
  onProgress?: (progress: number) => void;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export function buildPostVideoFilename(
  postId: string,
  format: PostVideoExportFormat = "webm",
): string {
  return `syra-post-${sanitizeFilename(postId)}.${format}`;
}

function videoCodecFor(format: PostVideoExportFormat): "h264" | "vp8" {
  return format === "mp4" ? "h264" : "vp8";
}

export async function isPostVideoFormatSupported(format: PostVideoExportFormat): Promise<boolean> {
  try {
    const result = await canRenderMediaOnWeb({
      width: POST_VIDEO_LAYOUT_WIDTH * POST_VIDEO_EXPORT_SCALE,
      height: POST_VIDEO_LAYOUT_HEIGHT * POST_VIDEO_EXPORT_SCALE,
      container: format,
      videoCodec: videoCodecFor(format),
      muted: true,
    });
    return result.canRender;
  } catch {
    return false;
  }
}

async function waitForFonts(): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
}

export async function renderPostVideoOnWeb(
  slides: PostSlide[],
  postId: string,
  format: PostVideoExportFormat,
  callbacks: PostVideoExportCallbacks,
): Promise<void> {
  if (slides.length === 0) {
    throw new Error("No slides to render");
  }

  const durationInFrames = getDeckDurationInFrames(slides);
  const container = format;
  const videoCodec = videoCodecFor(format);

  const capability = await canRenderMediaOnWeb({
    width: POST_VIDEO_LAYOUT_WIDTH * POST_VIDEO_EXPORT_SCALE,
    height: POST_VIDEO_LAYOUT_HEIGHT * POST_VIDEO_EXPORT_SCALE,
    container,
    videoCodec,
    muted: true,
  });

  if (!capability.canRender) {
    const detail = capability.issues.map((issue) => issue.message).join("; ");
    throw new Error(detail || `${format.toUpperCase()} export is not supported in this browser`);
  }

  await waitForFonts();

  let lastSlideIndex = -1;
  const reportSlide = async (progress: number): Promise<void> => {
    const frame = Math.min(
      durationInFrames - 1,
      Math.max(0, Math.floor(progress * durationInFrames)),
    );
    const slideIndex = frameToSlideIndex(frame, slides);
    if (slideIndex !== lastSlideIndex) {
      lastSlideIndex = slideIndex;
      await callbacks.onSlideChange(slideIndex);
    }
    callbacks.onProgress?.(progress);
  };

  await reportSlide(0);

  const inputProps = { slides };

  const { getBlob } = await renderMediaOnWeb({
    composition: {
      component: PostDeckVideo,
      id: `post-deck-${sanitizeFilename(postId)}`,
      width: POST_VIDEO_LAYOUT_WIDTH,
      height: POST_VIDEO_LAYOUT_HEIGHT,
      fps: POST_VIDEO_FPS,
      durationInFrames,
      calculateMetadata: null,
      defaultProps: inputProps,
    },
    inputProps,
    container,
    videoCodec,
    muted: true,
    // Opaque frames — avoid unfilled/transparent edges in the downloaded file.
    transparent: false,
    scale: POST_VIDEO_EXPORT_SCALE,
    videoBitrate: POST_VIDEO_BITRATE,
    outputTarget: "arraybuffer",
    onProgress: (progress) => {
      void reportSlide(progress.progress);
    },
  });

  const blob = await getBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = buildPostVideoFilename(postId, format);
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);

  callbacks.onProgress?.(1);
}

export async function exportPostVideo(
  slides: PostSlide[],
  postId: string,
  format: PostVideoExportFormat,
  callbacks: PostVideoExportCallbacks,
): Promise<void> {
  return renderPostVideoOnWeb(slides, postId, format, callbacks);
}
