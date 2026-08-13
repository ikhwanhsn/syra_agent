import type { XLayerCardDef } from "@/content/announce/xlayerCards";
import { renderXLayerSvg } from "@/components/post/photo/satori/renderXLayerSvg";
import { svgToPngBlob, svgToPngDataUrl } from "@/components/post/photo/satori/svgToPng";
import { PHOTO_PIXEL_RATIO, PHOTO_SQUARE } from "@/components/post/photo/satori/tokens";

export const XLAYER_WIDTH = PHOTO_SQUARE.width;
export const XLAYER_HEIGHT = PHOTO_SQUARE.height;
export const XLAYER_PIXEL_RATIO = PHOTO_PIXEL_RATIO;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export function buildXLayerFilename(card: XLayerCardDef): string {
  return `${sanitizeFilename(card.slug)}.png`;
}

export async function exportXLayerPng(card: XLayerCardDef, filename?: string): Promise<void> {
  const svg = await renderXLayerSvg(card);
  const dataUrl = await svgToPngDataUrl(svg);
  const link = document.createElement("a");
  link.download = sanitizeFilename(filename ?? buildXLayerFilename(card));
  link.href = dataUrl;
  link.click();
}

export async function copyXLayerToClipboard(card: XLayerCardDef): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  try {
    const svg = await renderXLayerSvg(card);
    const blob = await svgToPngBlob(svg);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function xLayerPngBlob(card: XLayerCardDef): Promise<Blob> {
  const svg = await renderXLayerSvg(card);
  return svgToPngBlob(svg);
}
