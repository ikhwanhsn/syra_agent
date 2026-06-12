import { getFontEmbedCSS, toCanvas } from "html-to-image";
import type { PostSlide } from "@/content/posts/types";
import {
  POST_SLIDE_SETTLED_MS,
  syncExportFitFromPreview,
} from "@/components/post/postSlideFitMeasure";
import { getEntranceCaptureMs, getSlideDwellMs } from "@/components/post/postSlideTiming";

/** Final encoded video resolution. */
export const POST_VIDEO_WIDTH = 1920;
export const POST_VIDEO_HEIGHT = 1080;
/** Matches `.post-record-wrap` max width — same container-query context as the preview. */
export const POST_VIDEO_LAYOUT_WIDTH = 960;
export const POST_VIDEO_LAYOUT_HEIGHT = 540;
export const POST_VIDEO_FPS = 30;
export const POST_VIDEO_BITRATE = 16_000_000;
/** Re-snapshot ambient motion (orbs/grid) during static hold — avoids per-frame DOM walks. */
const HOLD_CAPTURE_INTERVAL_MS = 500;

export { getSlideDwellMs } from "@/components/post/postSlideTiming";

export interface PostVideoLayoutSize {
  width: number;
  height: number;
}

/** Read the on-screen preview stage so export matches what the user sees. */
export function resolvePostVideoLayoutSize(): PostVideoLayoutSize {
  const preview = document.querySelector<HTMLElement>(
    ".post-chrome-stage .post-record-stage:not(.post-video-export-stage)",
  );
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

function applyExportLayoutSize(target: HTMLElement, layout: PostVideoLayoutSize): void {
  target.style.width = `${layout.width}px`;
  target.style.height = `${layout.height}px`;

  const cqw = layout.width / 100;
  const cqh = layout.height / 100;
  target.style.setProperty("--post-export-cqw", `${cqw}px`);
  target.style.setProperty("--post-export-cqh", `${cqh}px`);
  target.style.setProperty(
    "--post-frame-inset-inline",
    `${Math.min(104, Math.max(18, cqw * 7))}px`,
  );
  target.style.setProperty(
    "--post-frame-inset-block",
    `${Math.min(84, Math.max(16, cqh * 8.5))}px`,
  );

  const root = target.closest<HTMLElement>(".post-video-export-root");
  if (root) {
    root.style.width = `${layout.width}px`;
    root.style.height = `${layout.height}px`;
  }
}

function buildExportOptions(layout: PostVideoLayoutSize, fontEmbedCSS: string) {
  const pixelRatio = computeCapturePixelRatio(layout);

  return {
    width: layout.width,
    height: layout.height,
    pixelRatio,
    cacheBust: false,
    skipFonts: Boolean(fontEmbedCSS),
    fontEmbedCSS: fontEmbedCSS || undefined,
    backgroundColor: "#030303",
    filter: (node: Node) => !(node instanceof HTMLElement && node.classList.contains("post-slide-idle")),
    style: {
      transform: "none",
      transformOrigin: "top left",
      margin: "0",
      padding: "0",
      width: `${layout.width}px`,
      height: `${layout.height}px`,
    },
  } as const;
}

export interface PostVideoExportCallbacks {
  onSlideChange: (index: number) => void | Promise<void>;
  onProgress?: (progress: number) => void;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export function buildPostVideoFilename(postId: string): string {
  return `syra-post-${sanitizeFilename(postId)}.webm`;
}

async function waitForPaint(full = true): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  if (full) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

function shouldRefreshDomCapture(
  slideElapsedMs: number,
  lastCaptureMs: number,
  entranceCaptureMs: number,
): boolean {
  if (lastCaptureMs < 0) return true;
  // Capture every frame while reveals run so motion stays in sync with the timeline.
  if (slideElapsedMs < entranceCaptureMs) return true;
  return slideElapsedMs - lastCaptureMs >= HOLD_CAPTURE_INTERVAL_MS;
}

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "video/webm";
}

function requestVideoFrame(track: MediaStreamTrack): void {
  const withRequestFrame = track as MediaStreamTrack & { requestFrame?: () => void };
  withRequestFrame.requestFrame?.();
}

/** Resolve the fixed 1920×1080 stage — never export the responsive preview wrapper. */
export function resolvePostVideoExportNode(node: HTMLElement): HTMLElement {
  const stage = node.querySelector<HTMLElement>(".post-video-export-stage");
  return stage ?? node;
}

async function preloadExportAssets(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
}

function pauseExportAnimations(root: HTMLElement): Animation[] {
  const animations = root.getAnimations({ subtree: true });
  for (const animation of animations) {
    animation.pause();
  }
  return animations;
}

function timingDurationMs(timing: EffectTiming): number {
  const raw = timing.duration;
  if (raw === "auto" || raw == null) return 0;
  return Number(raw) || 0;
}

function timingDelayMs(timing: EffectTiming): number {
  const raw = timing.delay;
  if (raw == null) return 0;
  return Math.max(0, Number(raw) || 0);
}

/** Seek every CSS animation/transition to an exact point on the slide timeline. */
function seekExportAnimations(root: HTMLElement, slideElapsedMs: number): void {
  const animations = root.getAnimations({ subtree: true });

  for (const animation of animations) {
    animation.pause();

    const effect = animation.effect;
    if (!effect) {
      animation.currentTime = slideElapsedMs;
      continue;
    }

    const timing = effect.getTiming();
    const duration = timingDurationMs(timing);
    const delay = timingDelayMs(timing);
    const iterations =
      timing.iterations === Infinity ? Infinity : Math.max(1, Number(timing.iterations) || 1);

    if (iterations === Infinity || duration <= 0) {
      const loopMs = duration > 0 ? duration : 2400;
      animation.currentTime = slideElapsedMs % loopMs;
      continue;
    }

    const endMs = delay + duration * iterations;
    animation.currentTime = Math.min(Math.max(0, slideElapsedMs), endMs);
  }
}

function flushAnimationState(root: HTMLElement): void {
  void root.offsetHeight;
}

async function prepareSlideCapture(target: HTMLElement, callbacks: PostVideoExportCallbacks, slideIndex: number): Promise<void> {
  target.querySelectorAll<HTMLElement>(".post-slide-fit-inner").forEach((inner) => {
    inner.style.transform = "none";
  });

  await callbacks.onSlideChange(slideIndex);
  await waitForPaint();
  pauseExportAnimations(target);
  seekExportAnimations(target, POST_SLIDE_SETTLED_MS);
  syncExportFitFromPreview(target);
  await waitForPaint(false);
}

export async function exportPostVideoWebm(
  node: HTMLElement,
  slides: PostSlide[],
  postId: string,
  callbacks: PostVideoExportCallbacks,
): Promise<void> {
  const slideCount = slides.length;
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Video export is not supported in this browser");
  }

  const target = resolvePostVideoExportNode(node);
  const layout = resolvePostVideoLayoutSize();
  applyExportLayoutSize(target, layout);
  await preloadExportAssets(target);
  const previewStage = document.querySelector<HTMLElement>(
    ".post-chrome-stage .post-record-stage:not(.post-video-export-stage)",
  );
  const fontEmbedCSS = await getFontEmbedCSS(previewStage ?? target);
  await waitForPaint();

  const canvas = document.createElement("canvas");
  canvas.width = POST_VIDEO_WIDTH;
  canvas.height = POST_VIDEO_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0];
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: POST_VIDEO_BITRATE,
  });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType.split(";")[0] ?? "video/webm" }));
    };
    recorder.onerror = () => reject(new Error("Recording failed"));
  });

  recorder.start(250);

  const frameIntervalMs = 1000 / POST_VIDEO_FPS;
  let totalFrames = 0;
  for (let slideIndex = 0; slideIndex < slideCount; slideIndex += 1) {
    totalFrames += Math.ceil(getSlideDwellMs(slideIndex, slides) / frameIntervalMs);
  }

  let capturedFrames = 0;
  const exportOptions = buildExportOptions(layout, fontEmbedCSS);
  let cachedFrame: HTMLCanvasElement | null = null;
  let lastDomCaptureMs = -HOLD_CAPTURE_INTERVAL_MS;

  try {
    for (let slideIndex = 0; slideIndex < slideCount; slideIndex += 1) {
      await prepareSlideCapture(target, callbacks, slideIndex);
      cachedFrame = null;
      lastDomCaptureMs = -HOLD_CAPTURE_INTERVAL_MS;

      const slide = slides[slideIndex];
      const dwellMs = getSlideDwellMs(slideIndex, slides);
      const entranceCaptureMs = slide ? getEntranceCaptureMs(slide) : 1600;
      const slideFrames = Math.ceil(dwellMs / frameIntervalMs);

      for (let frame = 0; frame < slideFrames; frame += 1) {
        const slideElapsedMs = frame * frameIntervalMs;
        seekExportAnimations(target, slideElapsedMs);

        const refreshDom = shouldRefreshDomCapture(
          slideElapsedMs,
          lastDomCaptureMs,
          entranceCaptureMs,
        );

        if (refreshDom || !cachedFrame) {
          syncExportFitFromPreview(target);
          flushAnimationState(target);
          await waitForPaint(false);
          cachedFrame = await toCanvas(target, exportOptions);
          lastDomCaptureMs = slideElapsedMs;
        }

        ctx.drawImage(
          cachedFrame,
          0,
          0,
          cachedFrame.width,
          cachedFrame.height,
          0,
          0,
          POST_VIDEO_WIDTH,
          POST_VIDEO_HEIGHT,
        );
        requestVideoFrame(track);

        capturedFrames += 1;
        callbacks.onProgress?.(capturedFrames / totalFrames);
      }
    }
  } catch (error) {
    recorder.stop();
    throw error;
  }

  recorder.stop();
  const blob = await recorded;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = buildPostVideoFilename(postId);
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
