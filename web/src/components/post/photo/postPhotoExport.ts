import { toBlob, toPng } from "html-to-image";
import {
  preloadExportAssets,
  resolveFontEmbedCSS,
  waitForPaint,
} from "@/components/post/postHtmlCapture";
import {
  applyPostPhotoExportFit,
  assertPostPhotoExportDimensions,
} from "@/components/post/photo/postPhotoExportFit";

export const POST_PHOTO_WIDTH = 1200;
export const POST_PHOTO_HEIGHT = 675;
export const POST_PHOTO_PIXEL_RATIO = 2;

/** Resolve the fixed-size canvas — never export the CSS-scaled preview wrapper. */
export function resolvePostPhotoExportNode(node: HTMLElement): HTMLElement {
  if (node.classList.contains("post-photo-canvas")) return node;
  const canvas = node.querySelector<HTMLElement>(".post-photo-canvas");
  return canvas ?? node;
}

function buildExportOptions(fontEmbedCSS: string) {
  return {
    width: POST_PHOTO_WIDTH,
    height: POST_PHOTO_HEIGHT,
    pixelRatio: POST_PHOTO_PIXEL_RATIO,
    cacheBust: false,
    skipFonts: Boolean(fontEmbedCSS),
    fontEmbedCSS: fontEmbedCSS || undefined,
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

async function preparePhotoCapture(node: HTMLElement): Promise<{
  target: HTMLElement;
  options: ReturnType<typeof buildExportOptions>;
  restoreFit: () => void;
}> {
  const target = resolvePostPhotoExportNode(node);
  document.querySelector(".post-photo-export-root")?.classList.add("post-export-capturing");
  await preloadExportAssets(target);
  assertPostPhotoExportDimensions(target);
  const restoreFit = applyPostPhotoExportFit(target);
  const fontEmbedCSS = await resolveFontEmbedCSS(target);
  await waitForPaint();
  return { target, options: buildExportOptions(fontEmbedCSS), restoreFit };
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export async function exportPostPhotoPng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  let restoreFit = () => {};
  try {
    const prepared = await preparePhotoCapture(node);
    restoreFit = prepared.restoreFit;
    const dataUrl = await toPng(prepared.target, prepared.options);
    const link = document.createElement("a");
    link.download = sanitizeFilename(filename);
    link.href = dataUrl;
    link.click();
  } finally {
    restoreFit();
    document.querySelector(".post-photo-export-root")?.classList.remove("post-export-capturing");
  }
}

export async function copyPostPhotoToClipboard(node: HTMLElement): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  let restoreFit = () => {};
  try {
    const prepared = await preparePhotoCapture(node);
    restoreFit = prepared.restoreFit;
    const blob = await toBlob(prepared.target, prepared.options);
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  } finally {
    restoreFit();
    document.querySelector(".post-photo-export-root")?.classList.remove("post-export-capturing");
  }
}

export function buildPostPhotoFilename(postId: string, cardRole: string): string {
  return `syra-post-${sanitizeFilename(postId)}-${sanitizeFilename(cardRole)}.png`;
}
