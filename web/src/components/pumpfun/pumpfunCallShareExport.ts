import { toBlob, toPng } from "html-to-image";
import {
  preloadExportAssets,
  resolveFontEmbedCSS,
  waitForPaint,
} from "@/components/post/postHtmlCapture";
import {
  PUMPFUN_CALL_SHARE_BG,
  PUMPFUN_CALL_SHARE_HEIGHT,
  PUMPFUN_CALL_SHARE_WIDTH,
} from "@/components/pumpfun/pumpfunCallShareDimensions";

export const PUMPFUN_CALL_SHARE_PIXEL_RATIO = 1;

/** Resolve the fixed-size canvas — never the CSS-scaled preview wrapper. */
export function resolvePumpfunCallShareExportNode(node: HTMLElement): HTMLElement {
  if (node.classList.contains("pumpfun-call-share-canvas")) return node;
  if (node.dataset.exportBg) return node;
  const canvas = node.querySelector<HTMLElement>(".pumpfun-call-share-canvas");
  return canvas ?? node;
}

async function inlineExportImages(root: HTMLElement): Promise<() => void> {
  const restores: Array<() => void> = [];

  await Promise.all(
    Array.from(root.querySelectorAll("img")).map(async (img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;

      try {
        const response = await fetch(src, { mode: "cors", cache: "force-cache" });
        if (!response.ok) return;
        const blob = await response.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        const previous = img.src;
        img.src = dataUrl;
        img.removeAttribute("crossorigin");
        restores.push(() => {
          img.src = previous;
        });
      } catch {
        img.removeAttribute("crossorigin");
      }
    }),
  );

  return () => {
    restores.forEach((restore) => restore());
  };
}

function buildExportOptions(fontEmbedCSS: string) {
  return {
    width: PUMPFUN_CALL_SHARE_WIDTH,
    height: PUMPFUN_CALL_SHARE_HEIGHT,
    pixelRatio: PUMPFUN_CALL_SHARE_PIXEL_RATIO,
    cacheBust: true,
    skipFonts: Boolean(fontEmbedCSS),
    fontEmbedCSS: fontEmbedCSS || undefined,
    backgroundColor: PUMPFUN_CALL_SHARE_BG,
    style: {
      transform: "none",
      transformOrigin: "top left",
      margin: "0",
    },
  } as const;
}

function assertExportDimensions(canvas: HTMLElement): void {
  if (
    canvas.clientWidth !== PUMPFUN_CALL_SHARE_WIDTH ||
    canvas.clientHeight !== PUMPFUN_CALL_SHARE_HEIGHT
  ) {
    throw new Error(
      `Export canvas is ${canvas.clientWidth}×${canvas.clientHeight}, expected ${PUMPFUN_CALL_SHARE_WIDTH}×${PUMPFUN_CALL_SHARE_HEIGHT}`,
    );
  }
}

function findExportRoot(node: HTMLElement): HTMLElement | null {
  if (node.classList.contains("pumpfun-call-share-export-root")) return node;
  return node.closest<HTMLElement>(".pumpfun-call-share-export-root");
}

function setExportCapturing(active: boolean): void {
  document
    .querySelectorAll<HTMLElement>(".pumpfun-call-share-export-root")
    .forEach((root) => root.classList.toggle("pumpfun-call-share-export-capturing", active));
}

async function prepareCapture(node: HTMLElement) {
  const target = resolvePumpfunCallShareExportNode(node);
  const exportRoot = findExportRoot(node);
  setExportCapturing(true);

  try {
    await preloadExportAssets(target);
    const restoreImages = await inlineExportImages(target);
    const fontEmbedCSS = await resolveFontEmbedCSS(target);
    await waitForPaint();
    await new Promise((r) => window.setTimeout(r, 120));
    await waitForPaint();
    assertExportDimensions(target);
    return { target, options: buildExportOptions(fontEmbedCSS), restoreImages, exportRoot };
  } catch (error) {
    setExportCapturing(false);
    throw error;
  }
}

function endCapture(exportRoot: HTMLElement | null, restoreImages: () => void) {
  restoreImages();
  setExportCapturing(false);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

function triggerPngDownload(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = sanitizeFilename(filename);
  link.href = dataUrl;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportPumpfunCallSharePng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const prepared = await prepareCapture(node);
  try {
    const dataUrl = await toPng(prepared.target, prepared.options);
    triggerPngDownload(dataUrl, filename);
  } finally {
    endCapture(prepared.exportRoot, prepared.restoreImages);
  }
}

export async function copyPumpfunCallShareToClipboard(node: HTMLElement): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  const prepared = await prepareCapture(node);
  try {
    const blob = await toBlob(prepared.target, prepared.options);
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } finally {
    endCapture(prepared.exportRoot, prepared.restoreImages);
  }
}

export async function blobFromPumpfunCallShare(node: HTMLElement): Promise<Blob | null> {
  const prepared = await prepareCapture(node);
  try {
    return await toBlob(prepared.target, prepared.options);
  } finally {
    endCapture(prepared.exportRoot, prepared.restoreImages);
  }
}

export function buildPumpfunCallShareFilename(symbol: string, callId: string): string {
  return `syra-pumpfun-${sanitizeFilename(symbol)}-${sanitizeFilename(callId)}.png`;
}
