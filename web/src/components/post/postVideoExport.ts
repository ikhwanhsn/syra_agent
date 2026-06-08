import { toCanvas } from "html-to-image";

export const POST_VIDEO_WIDTH = 1920;
export const POST_VIDEO_HEIGHT = 1080;
export const POST_VIDEO_FPS = 30;
/** Supersample capture (3840×2160) then downscale to 1080p for crisp text. */
export const POST_VIDEO_CAPTURE_RATIO = 2;
export const POST_VIDEO_BITRATE = 16_000_000;

/** Time each slide stays visible (tuned for entrance animations). */
export const SLIDE_INTERVAL_MS = 5200;
/** Extra hold on the final slide before stopping. */
export const LAST_SLIDE_DWELL_MS = 7000;

const MIN_FIT_SCALE = 0.68;

const EXPORT_OPTIONS = {
  width: POST_VIDEO_WIDTH,
  height: POST_VIDEO_HEIGHT,
  pixelRatio: POST_VIDEO_CAPTURE_RATIO,
  cacheBust: true,
  skipFonts: false,
  backgroundColor: "#030303",
  style: {
    transform: "none",
    transformOrigin: "top left",
    margin: "0",
    padding: "0",
    width: `${POST_VIDEO_WIDTH}px`,
    height: `${POST_VIDEO_HEIGHT}px`,
  },
} as const;

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

export function getSlideDwellMs(slideIndex: number, slideCount: number): number {
  return slideIndex >= slideCount - 1 ? LAST_SLIDE_DWELL_MS : SLIDE_INTERVAL_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
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
    animation.currentTime = Math.min(slideElapsedMs, endMs);
  }

  applyExportSlideFit(root, slideElapsedMs);
}

/** Mirror PostSlideFit reflow at 450ms / 950ms without waiting on real time. */
function applyExportSlideFit(root: HTMLElement, slideElapsedMs: number): void {
  const activeFit = root.querySelector<HTMLElement>(".post-slide-active .post-slide-fit");
  if (!activeFit) return;

  const inner = activeFit.querySelector<HTMLElement>(".post-slide-fit-inner");
  if (!inner) return;

  if (slideElapsedMs < 450) {
    inner.style.transform = "none";
    return;
  }

  inner.style.transform = "none";
  const contentHeight = inner.scrollHeight;
  const contentWidth = inner.scrollWidth;
  const availHeight = activeFit.clientHeight;
  const availWidth = activeFit.clientWidth;

  if (contentHeight <= 0 || contentWidth <= 0 || availHeight <= 0 || availWidth <= 0) {
    inner.style.transform = "none";
    return;
  }

  const next = Math.min(1, availHeight / contentHeight, availWidth / contentWidth);
  const scale = Math.max(MIN_FIT_SCALE, next);
  inner.style.transform = scale === 1 ? "none" : `scale(${scale})`;
}

async function prepareSlideCapture(target: HTMLElement, callbacks: PostVideoExportCallbacks, slideIndex: number): Promise<void> {
  target.querySelectorAll<HTMLElement>(".post-slide-fit-inner").forEach((inner) => {
    inner.style.transform = "none";
  });

  await callbacks.onSlideChange(slideIndex);
  await waitForPaint();
  await sleep(32);
  pauseExportAnimations(target);
}

export async function exportPostVideoWebm(
  node: HTMLElement,
  slideCount: number,
  postId: string,
  callbacks: PostVideoExportCallbacks,
): Promise<void> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("Video export is not supported in this browser");
  }

  const target = resolvePostVideoExportNode(node);
  await preloadExportAssets(target);

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
    totalFrames += Math.ceil(getSlideDwellMs(slideIndex, slideCount) / frameIntervalMs);
  }

  let capturedFrames = 0;

  try {
    for (let slideIndex = 0; slideIndex < slideCount; slideIndex += 1) {
      await prepareSlideCapture(target, callbacks, slideIndex);

      const dwellMs = getSlideDwellMs(slideIndex, slideCount);
      const slideFrames = Math.ceil(dwellMs / frameIntervalMs);

      for (let frame = 0; frame < slideFrames; frame += 1) {
        const slideElapsedMs = frame * frameIntervalMs;
        seekExportAnimations(target, slideElapsedMs);
        await waitForPaint();

        const frameCanvas = await toCanvas(target, EXPORT_OPTIONS);
        ctx.drawImage(frameCanvas, 0, 0, POST_VIDEO_WIDTH, POST_VIDEO_HEIGHT);
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
