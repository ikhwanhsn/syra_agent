import { toCanvas } from "html-to-image";
import type { PostSlide } from "@/content/posts/types";
import {
  postExportNodeFilter,
  preloadExportAssets,
  resolveFontEmbedCSS,
  resolvePostVideoPreviewStage,
  setPostExportActive,
  setPostExportCapturing,
  waitForPaint,
} from "@/components/post/postHtmlCapture";
import {
  canvasToJpegBlob,
  recordScheduledFrames,
  type PostVideoExportFormat,
  type ScheduledFrame,
} from "@/components/post/postVideoRecord";
import {
  getEntranceCaptureMs,
  getSlideDwellMs,
  getSlideHoldMs,
  getTotalVideoFrameCount,
  POST_VIDEO_FPS,
  REVEAL_ANIMATION_MS,
} from "@/components/post/postSlideTiming";

export const POST_VIDEO_WIDTH = 1920;
export const POST_VIDEO_HEIGHT = 1080;
export const POST_VIDEO_LAYOUT_WIDTH = 960;
export const POST_VIDEO_LAYOUT_HEIGHT = 540;
export { POST_VIDEO_FPS };
export const POST_VIDEO_BITRATE = 16_000_000;
const REVEAL_OFFSET_Y = 20;

export { getSlideDwellMs, getTotalVideoDurationMs, getTotalVideoFrameCount } from "@/components/post/postSlideTiming";
export { resolvePostVideoPreviewStage } from "@/components/post/postHtmlCapture";

export interface PostVideoLayoutSize {
  width: number;
  height: number;
}

export function resolvePostVideoLayoutSize(): PostVideoLayoutSize {
  const preview = resolvePostVideoPreviewStage();
  if (preview) {
    const { width } = preview.getBoundingClientRect();
    if (width > 0) {
      const layoutWidth = Math.round(width);
      const layoutHeight = Math.round((layoutWidth * POST_VIDEO_HEIGHT) / POST_VIDEO_WIDTH);
      return { width: layoutWidth, height: layoutHeight };
    }
  }

  return {
    width: POST_VIDEO_LAYOUT_WIDTH,
    height: POST_VIDEO_LAYOUT_HEIGHT,
  };
}

function computeCapturePixelRatio(layout: PostVideoLayoutSize): number {
  const widthRatio = POST_VIDEO_WIDTH / layout.width;
  const heightRatio = POST_VIDEO_HEIGHT / layout.height;
  return Math.max(widthRatio, heightRatio);
}

function buildExportOptions(layout: PostVideoLayoutSize, fontEmbedCSS: string) {
  return {
    width: layout.width,
    height: layout.height,
    pixelRatio: computeCapturePixelRatio(layout),
    cacheBust: false,
    skipFonts: Boolean(fontEmbedCSS),
    fontEmbedCSS: fontEmbedCSS || undefined,
    backgroundColor: "#030303",
    filter: postExportNodeFilter,
  } as const;
}

export type { PostVideoExportFormat } from "@/components/post/postVideoRecord";

export interface PostVideoExportCallbacks {
  onSlideChange: (index: number) => void | Promise<void>;
  onProgress?: (progress: number) => void;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export function buildPostVideoFilename(postId: string, format: PostVideoExportFormat = "webm"): string {
  return `syra-post-${sanitizeFilename(postId)}.${format}`;
}

/** @deprecated Export captures the visible preview directly. */
export function resolvePostVideoExportNode(node: HTMLElement): HTMLElement {
  return resolvePostVideoPreviewStage() ?? node;
}

function parseRevealDelayMs(el: HTMLElement): number {
  const raw = el.style.getPropertyValue("--post-delay") || getComputedStyle(el).getPropertyValue("--post-delay");
  return raw ? parseFloat(raw) || 0 : 0;
}

function easeReveal(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

function clearExportRevealStyles(root: HTMLElement): void {
  for (const el of root.querySelectorAll<HTMLElement>(".post-reveal")) {
    el.style.removeProperty("opacity");
    el.style.removeProperty("transform");
  }
}

function applyExportRevealFrame(root: HTMLElement, slideElapsedMs: number): void {
  for (const el of root.querySelectorAll<HTMLElement>(".post-slide-active .post-reveal")) {
    const delayMs = parseRevealDelayMs(el);
    const elapsed = slideElapsedMs - delayMs;

    if (elapsed <= 0) {
      el.style.opacity = "0";
      el.style.transform = `translateY(${REVEAL_OFFSET_Y}px)`;
      continue;
    }

    const progress = easeReveal(elapsed / REVEAL_ANIMATION_MS);
    el.style.opacity = String(progress);
    el.style.transform = `translateY(${REVEAL_OFFSET_Y * (1 - progress)}px)`;
  }
}

function pauseExportAnimations(root: HTMLElement): void {
  for (const animation of root.getAnimations({ subtree: true })) {
    animation.pause();
  }
}

function timingDurationMs(timing: EffectTiming): number {
  const raw = timing.duration;
  if (raw === "auto" || raw == null) return 0;
  return Number(raw) || 0;
}

function seekAmbientAnimations(root: HTMLElement, slideElapsedMs: number): void {
  for (const animation of root.getAnimations({ subtree: true })) {
    const effect = animation.effect;
    if (!effect) continue;

    const timing = effect.getTiming();
    const duration = timingDurationMs(timing);
    if (timing.iterations !== Infinity) continue;

    animation.pause();
    const loopMs = duration > 0 ? duration : 2400;
    animation.currentTime = slideElapsedMs % loopMs;
  }
}

function flushAnimationState(root: HTMLElement): void {
  void root.offsetHeight;
}

function pinHoldFitTransform(target: HTMLElement): void {
  const inner = target.querySelector<HTMLElement>(".post-slide-active .post-slide-fit-inner");
  if (!inner) {
    target.style.removeProperty("--post-export-fit-transform");
    return;
  }

  const inline = inner.style.transform;
  const computed = getComputedStyle(inner).transform;
  const transform = inline && inline !== "none" ? inline : computed;

  if (transform && transform !== "none") {
    target.style.setProperty("--post-export-fit-transform", transform);
  } else {
    target.style.removeProperty("--post-export-fit-transform");
  }
}

async function captureFrameBlob(
  target: HTMLElement,
  exportOptions: ReturnType<typeof buildExportOptions>,
): Promise<Blob> {
  flushAnimationState(target);
  await waitForPaint(false);
  const canvas = await toCanvas(target, exportOptions);
  return canvasToJpegBlob(canvas);
}

async function prepareSlideCapture(
  target: HTMLElement,
  callbacks: PostVideoExportCallbacks,
  slideIndex: number,
): Promise<void> {
  clearExportRevealStyles(target);
  await callbacks.onSlideChange(slideIndex);
  await waitForPaint();
  pauseExportAnimations(target);
  applyExportRevealFrame(target, 0);
  seekAmbientAnimations(target, 0);
  flushAnimationState(target);
  await waitForPaint(false);
}

async function buildSlideSchedule(
  target: HTMLElement,
  slide: PostSlide | undefined,
  slideIndex: number,
  slides: PostSlide[],
  exportOptions: ReturnType<typeof buildExportOptions>,
  onRenderProgress: (rendered: number, total: number) => void,
  renderedSoFar: number,
  totalFrames: number,
): Promise<{ schedule: ScheduledFrame[]; rendered: number }> {
  const frameIntervalMs = 1000 / POST_VIDEO_FPS;
  const entranceMs = slide ? getEntranceCaptureMs(slide) : 1100;
  const holdMs = getSlideHoldMs(slideIndex, slides);
  const entranceFrames = Math.max(1, Math.ceil(entranceMs / frameIntervalMs));
  const holdFrames = Math.max(0, Math.ceil(holdMs / frameIntervalMs));
  const schedule: ScheduledFrame[] = [];

  let rendered = renderedSoFar;

  for (let frame = 0; frame < entranceFrames; frame += 1) {
    const slideElapsedMs = frame * frameIntervalMs;
    applyExportRevealFrame(target, slideElapsedMs);
    seekAmbientAnimations(target, slideElapsedMs);
    const blob = await captureFrameBlob(target, exportOptions);
    schedule.push({ blob, repeat: 1 });
    rendered += 1;
    onRenderProgress(rendered, totalFrames);
  }

  if (holdFrames > 0) {
    const settledMs = entranceMs + 80;
    applyExportRevealFrame(target, settledMs);
    seekAmbientAnimations(target, settledMs);
    pinHoldFitTransform(target);
    setPostExportCapturing(true);
    const holdBlob = await captureFrameBlob(target, exportOptions);
    setPostExportCapturing(false);
    schedule.push({ blob: holdBlob, repeat: holdFrames });
    rendered += holdFrames;
    onRenderProgress(rendered, totalFrames);
  }

  return { schedule, rendered };
}

export async function exportPostVideo(
  slides: PostSlide[],
  postId: string,
  format: PostVideoExportFormat,
  callbacks: PostVideoExportCallbacks,
): Promise<void> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Video export is not supported in this browser");
  }

  const target = resolvePostVideoPreviewStage();
  if (!target) throw new Error("Preview stage not found");

  const layout = resolvePostVideoLayoutSize();
  const totalFrames = getTotalVideoFrameCount(slides);
  const renderWeight = 0.88;

  setPostExportActive(true);
  await preloadExportAssets(target);
  const fontEmbedCSS = await resolveFontEmbedCSS(target);
  await waitForPaint();

  const exportOptions = buildExportOptions(layout, fontEmbedCSS);
  const schedule: ScheduledFrame[] = [];
  let rendered = 0;

  const reportRender = (current: number, total: number): void => {
    callbacks.onProgress?.((current / total) * renderWeight);
  };

  try {
    for (let slideIndex = 0; slideIndex < slides.length; slideIndex += 1) {
      await prepareSlideCapture(target, callbacks, slideIndex);
      const built = await buildSlideSchedule(
        target,
        slides[slideIndex],
        slideIndex,
        slides,
        exportOptions,
        reportRender,
        rendered,
        totalFrames,
      );
      schedule.push(...built.schedule);
      rendered = built.rendered;
    }

    callbacks.onProgress?.(renderWeight);

    const blob = await recordScheduledFrames(
      schedule,
      POST_VIDEO_WIDTH,
      POST_VIDEO_HEIGHT,
      POST_VIDEO_BITRATE,
      format,
      (encodeProgress) => {
        callbacks.onProgress?.(renderWeight + encodeProgress * (1 - renderWeight));
      },
    );

    setPostExportActive(false);
    setPostExportCapturing(false);
    clearExportRevealStyles(target);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = buildPostVideoFilename(postId, format);
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    setPostExportActive(false);
    setPostExportCapturing(false);
    clearExportRevealStyles(target);
    throw error;
  }
}

/** @deprecated Use exportPostVideo with format "webm". */
export async function exportPostVideoWebm(
  slides: PostSlide[],
  postId: string,
  callbacks: PostVideoExportCallbacks,
): Promise<void> {
  return exportPostVideo(slides, postId, "webm", callbacks);
}
