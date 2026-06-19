import { POST_PHOTO_HEIGHT, POST_PHOTO_WIDTH } from "@/components/post/photo/postPhotoExport";

const MIN_EXPORT_FIT_SCALE = 0.82;

/**
 * Scale down overflowing card content before html-to-image capture.
 * Returns a cleanup fn to restore inline styles.
 */
export function applyPostPhotoExportFit(canvas: HTMLElement): () => void {
  const body = canvas.querySelector<HTMLElement>(".post-photo-body");
  const inner = body?.firstElementChild as HTMLElement | null;
  if (!body || !inner) return () => {};

  const prevTransform = inner.style.transform;
  const prevOrigin = inner.style.transformOrigin;
  const prevWidth = inner.style.width;

  inner.style.transform = "none";
  inner.style.width = `${body.clientWidth}px`;

  const scale = Math.min(
    1,
    body.clientHeight / Math.max(inner.scrollHeight, 1),
    body.clientWidth / Math.max(inner.scrollWidth, 1),
  );
  const next = Math.max(MIN_EXPORT_FIT_SCALE, scale);

  if (next < 1) {
    inner.style.transformOrigin = "center center";
    inner.style.transform = `scale(${next})`;
  }

  return () => {
    inner.style.transform = prevTransform;
    inner.style.transformOrigin = prevOrigin;
    inner.style.width = prevWidth;
  };
}

/** Guard export stage dimensions — catches misconfigured off-screen roots. */
export function assertPostPhotoExportDimensions(canvas: HTMLElement): void {
  if (canvas.clientWidth !== POST_PHOTO_WIDTH || canvas.clientHeight !== POST_PHOTO_HEIGHT) {
    console.warn(
      `[post/photo] export canvas is ${canvas.clientWidth}×${canvas.clientHeight}, expected ${POST_PHOTO_WIDTH}×${POST_PHOTO_HEIGHT}`,
    );
  }
}
