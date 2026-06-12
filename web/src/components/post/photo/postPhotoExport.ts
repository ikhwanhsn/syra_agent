import { toBlob, toPng } from "html-to-image";

export const POST_PHOTO_WIDTH = 1200;
export const POST_PHOTO_HEIGHT = 675;
export const POST_PHOTO_PIXEL_RATIO = 2;

/** Resolve the fixed-size canvas — never export the CSS-scaled preview wrapper. */
export function resolvePostPhotoExportNode(node: HTMLElement): HTMLElement {
  const canvas = node.querySelector<HTMLElement>(".post-photo-canvas");
  return canvas ?? node;
}

function buildExportOptions() {
  return {
    width: POST_PHOTO_WIDTH,
    height: POST_PHOTO_HEIGHT,
    pixelRatio: POST_PHOTO_PIXEL_RATIO,
    cacheBust: false,
    skipFonts: false,
    backgroundColor: "#030303",
    style: {
      transform: "none",
      transformOrigin: "top left",
      margin: "0",
      padding: "0",
      width: `${POST_PHOTO_WIDTH}px`,
      height: `${POST_PHOTO_HEIGHT}px`,
    },
  } as const;
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

async function waitForPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function preparePhotoCapture(node: HTMLElement): Promise<HTMLElement> {
  const target = resolvePostPhotoExportNode(node);
  await preloadExportAssets(target);
  await waitForPaint();
  return target;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export async function exportPostPhotoPng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const target = await preparePhotoCapture(node);
  const dataUrl = await toPng(target, buildExportOptions());
  const link = document.createElement("a");
  link.download = sanitizeFilename(filename);
  link.href = dataUrl;
  link.click();
}

export async function copyPostPhotoToClipboard(node: HTMLElement): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  try {
    const target = await preparePhotoCapture(node);
    const blob = await toBlob(target, buildExportOptions());
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export function buildPostPhotoFilename(postId: string, cardRole: string): string {
  return `syra-post-${sanitizeFilename(postId)}-${sanitizeFilename(cardRole)}.png`;
}
