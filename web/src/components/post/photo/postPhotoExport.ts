import type { PostPhotoCardDef } from "@/content/posts/photo/types";
import { renderPhotoSvg } from "@/components/post/photo/satori/renderPhotoSvg";
import { svgToPngBlob, svgToPngDataUrl } from "@/components/post/photo/satori/svgToPng";
import { PHOTO_PIXEL_RATIO, PHOTO_SIZE } from "@/components/post/photo/satori/tokens";

export const POST_PHOTO_WIDTH = PHOTO_SIZE.width;
export const POST_PHOTO_HEIGHT = PHOTO_SIZE.height;
export const POST_PHOTO_PIXEL_RATIO = PHOTO_PIXEL_RATIO;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export async function exportPostPhotoPng(
  card: PostPhotoCardDef,
  filename: string,
): Promise<void> {
  const svg = await renderPhotoSvg(card);
  const dataUrl = await svgToPngDataUrl(svg);
  const link = document.createElement("a");
  link.download = sanitizeFilename(filename);
  link.href = dataUrl;
  link.click();
}

export async function copyPostPhotoToClipboard(card: PostPhotoCardDef): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  try {
    const svg = await renderPhotoSvg(card);
    const blob = await svgToPngBlob(svg);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export function buildPostPhotoFilename(postId: string, cardRole: string): string {
  return `syra-post-${sanitizeFilename(postId)}-${sanitizeFilename(cardRole)}.png`;
}
