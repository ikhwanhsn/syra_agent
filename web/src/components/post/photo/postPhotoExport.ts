import { toBlob, toPng } from "html-to-image";

export const POST_PHOTO_WIDTH = 1200;
export const POST_PHOTO_HEIGHT = 675;
export const POST_PHOTO_PIXEL_RATIO = 2;

/** Resolve the fixed-size canvas — never export the CSS-scaled preview wrapper. */
export function resolvePostPhotoExportNode(node: HTMLElement): HTMLElement {
  const canvas = node.querySelector<HTMLElement>(".post-photo-canvas");
  return canvas ?? node;
}

const EXPORT_OPTIONS = {
  width: POST_PHOTO_WIDTH,
  height: POST_PHOTO_HEIGHT,
  pixelRatio: POST_PHOTO_PIXEL_RATIO,
  cacheBust: true,
  skipFonts: false,
  style: {
    transform: "none",
    transformOrigin: "top left",
    margin: "0",
    padding: "0",
    width: `${POST_PHOTO_WIDTH}px`,
    height: `${POST_PHOTO_HEIGHT}px`,
  },
} as const;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export async function exportPostPhotoPng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const target = resolvePostPhotoExportNode(node);
  const dataUrl = await toPng(target, EXPORT_OPTIONS);
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
    const target = resolvePostPhotoExportNode(node);
    const blob = await toBlob(target, EXPORT_OPTIONS);
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
