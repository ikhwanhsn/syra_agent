import { POST_VIDEO_FPS } from "@/components/post/postSlideTiming";

export type PostVideoExportFormat = "webm" | "mp4";

const WEBM_MIME_CANDIDATES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"] as const;

const MP4_MIME_CANDIDATES = [
  'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
  "video/mp4;codecs=avc1",
  "video/mp4",
] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function isPostVideoFormatSupported(format: PostVideoExportFormat): boolean {
  if (typeof MediaRecorder === "undefined") return false;

  const candidates = format === "mp4" ? MP4_MIME_CANDIDATES : WEBM_MIME_CANDIDATES;
  return candidates.some((type) => MediaRecorder.isTypeSupported(type));
}

function pickMimeType(format: PostVideoExportFormat): string {
  const candidates = format === "mp4" ? MP4_MIME_CANDIDATES : WEBM_MIME_CANDIDATES;

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }

  throw new Error(`${format.toUpperCase()} export is not supported in this browser`);
}

function requestVideoFrame(track: MediaStreamTrack): void {
  const withRequestFrame = track as MediaStreamTrack & { requestFrame?: () => void };
  withRequestFrame.requestFrame?.();
}

/** One JPEG blob played back for `repeat` frames at a fixed fps. */
export interface ScheduledFrame {
  blob: Blob;
  repeat: number;
}

interface DecodedScheduledFrame {
  bitmap: ImageBitmap;
  repeat: number;
}

/**
 * Encode scheduled frames at a fixed fps so playback duration matches frame count,
 * independent of how long DOM capture took (fixes 2min+ videos from slow toCanvas).
 */
export async function recordScheduledFrames(
  schedule: ScheduledFrame[],
  width: number,
  height: number,
  bitrate: number,
  format: PostVideoExportFormat,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const totalFrames = schedule.reduce((sum, entry) => sum + entry.repeat, 0);
  if (totalFrames <= 0) {
    throw new Error("No frames to record");
  }

  const decoded: DecodedScheduledFrame[] = await Promise.all(
    schedule.map(async (entry) => ({
      bitmap: await createImageBitmap(entry.blob),
      repeat: entry.repeat,
    })),
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0];
  const mimeType = pickMimeType(format);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bitrate,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const containerType = format === "mp4" ? "video/mp4" : "video/webm";

  const recorded = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: containerType }));
    };
    recorder.onerror = () => reject(new Error("Recording failed"));
  });

  recorder.start(250);

  const frameIntervalMs = 1000 / POST_VIDEO_FPS;
  const startedAt = performance.now();
  let written = 0;

  try {
    for (const entry of decoded) {
      for (let i = 0; i < entry.repeat; i += 1) {
        const targetTime = startedAt + written * frameIntervalMs;
        const waitMs = targetTime - performance.now();
        if (waitMs > 0) await sleep(waitMs);

        ctx.drawImage(entry.bitmap, 0, 0, width, height);
        requestVideoFrame(track);
        written += 1;
        onProgress?.(written / totalFrames);
      }
    }

    await sleep(frameIntervalMs);
    recorder.stop();
    return await recorded;
  } finally {
    for (const entry of decoded) {
      entry.bitmap.close();
    }
  }
}

/** @deprecated Use recordScheduledFrames with format "webm". */
export async function recordScheduledFramesToWebm(
  schedule: ScheduledFrame[],
  width: number,
  height: number,
  bitrate: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  return recordScheduledFrames(schedule, width, height, bitrate, "webm", onProgress);
}

export async function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.96);
  });
  if (!blob) throw new Error("Failed to encode frame");
  return blob;
}
