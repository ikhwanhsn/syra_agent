import { toBlob, toPng } from "html-to-image";
import { getFontEmbedCSS } from "html-to-image";
import { preloadExportAssets, waitForPaint } from "@/components/post/postHtmlCapture";
import {
  PUMPFUN_CALL_SHARE_BG,
  PUMPFUN_CALL_SHARE_HEIGHT,
  PUMPFUN_CALL_SHARE_WIDTH,
} from "@/components/pumpfun/pumpfunCallShareDimensions";

const DEFAULT_SHARE_BG = PUMPFUN_CALL_SHARE_BG;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

function readExportBackground(node: HTMLElement): string {
  const fromDataset = node.dataset.exportBg?.trim();
  if (fromDataset && /^#[0-9a-fA-F]{3,8}$/.test(fromDataset)) return fromDataset;
  const bg = getComputedStyle(node).backgroundColor;
  return bg && bg !== "rgba(0, 0, 0, 0)" ? bg : DEFAULT_SHARE_BG;
}

async function prepareCapture(node: HTMLElement) {
  await preloadExportAssets(node);
  let fontEmbedCSS = "";
  try {
    fontEmbedCSS = await getFontEmbedCSS(node);
  } catch {
    fontEmbedCSS = "";
  }
  await waitForPaint();
  await new Promise((r) => window.setTimeout(r, 80));
  await waitForPaint();

  const backgroundColor = readExportBackground(node);

  return {
    width: PUMPFUN_CALL_SHARE_WIDTH,
    height: PUMPFUN_CALL_SHARE_HEIGHT,
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: Boolean(fontEmbedCSS),
    fontEmbedCSS: fontEmbedCSS || undefined,
    backgroundColor,
    style: {
      transform: "none",
      transformOrigin: "top left",
      margin: "0",
      padding: "0",
      width: `${PUMPFUN_CALL_SHARE_WIDTH}px`,
      height: `${PUMPFUN_CALL_SHARE_HEIGHT}px`,
    },
  } as const;
}

export async function exportPumpfunCallSharePng(
  node: HTMLElement,
  filename: string,
): Promise<void> {
  const options = await prepareCapture(node);
  const dataUrl = await toPng(node, options);
  const link = document.createElement("a");
  link.download = sanitizeFilename(filename);
  link.href = dataUrl;
  link.click();
}

export async function blobFromPumpfunCallShare(node: HTMLElement): Promise<Blob | null> {
  try {
    const options = await prepareCapture(node);
    return await toBlob(node, options);
  } catch {
    return null;
  }
}

export async function copyPumpfunCallShareToClipboard(node: HTMLElement): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }
  try {
    const blob = await blobFromPumpfunCallShare(node);
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export function buildPumpfunCallShareFilename(symbol: string, callId: string): string {
  return `syra-pumpfun-${sanitizeFilename(symbol)}-${sanitizeFilename(callId)}.png`;
}
