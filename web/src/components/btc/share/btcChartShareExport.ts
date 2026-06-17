import { toBlob, toPng } from "html-to-image";
import { getFontEmbedCSS } from "html-to-image";
import { preloadExportAssets, waitForPaint } from "@/components/post/postHtmlCapture";

export const BTC_CHART_SHARE_WIDTH = 1200;

const DEFAULT_SHARE_BG = "#0a0a0a";

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
  // Allow lightweight-charts canvas to finish layout after theme switches.
  await new Promise((r) => window.setTimeout(r, 120));
  await waitForPaint();

  const height = Math.max(node.offsetHeight, node.scrollHeight);
  const backgroundColor = readExportBackground(node);

  return {
    width: BTC_CHART_SHARE_WIDTH,
    height,
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
      width: `${BTC_CHART_SHARE_WIDTH}px`,
      height: `${height}px`,
    },
  } as const;
}

export async function exportBtcChartSharePng(node: HTMLElement, filename: string): Promise<void> {
  const options = await prepareCapture(node);
  const dataUrl = await toPng(node, options);
  const link = document.createElement("a");
  link.download = sanitizeFilename(filename);
  link.href = dataUrl;
  link.click();
}

export async function copyBtcChartShareToClipboard(node: HTMLElement): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }
  try {
    const options = await prepareCapture(node);
    const blob = await toBlob(node, options);
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function blobFromBtcChartShare(node: HTMLElement): Promise<Blob | null> {
  try {
    const options = await prepareCapture(node);
    return await toBlob(node, options);
  } catch {
    return null;
  }
}

export function buildBtcChartShareFilename(
  exchange: string,
  interval: string,
  variant: string,
  themeMode?: string,
): string {
  const theme = themeMode ? `-${sanitizeFilename(themeMode)}` : "";
  return `syra-btc-${sanitizeFilename(exchange)}-${sanitizeFilename(interval)}-${sanitizeFilename(variant)}${theme}.png`;
}
