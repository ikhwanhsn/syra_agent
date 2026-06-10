import { toBlob, toPng } from "html-to-image";
import {
  METRIC_SHARE_HEIGHT,
  METRIC_SHARE_WIDTH,
} from "@/components/info/metricsShare/types";

const EXPORT_OPTIONS = {
  width: METRIC_SHARE_WIDTH,
  height: METRIC_SHARE_HEIGHT,
  pixelRatio: 2,
  cacheBust: true,
  skipFonts: false,
  style: {
    transform: "none",
    transformOrigin: "top left",
    margin: "0",
    padding: "0",
    width: `${METRIC_SHARE_WIDTH}px`,
    height: `${METRIC_SHARE_HEIGHT}px`,
  },
} as const;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export function resolveMetricsShareExportNode(node: HTMLElement): HTMLElement {
  const canvas = node.querySelector<HTMLElement>(".post-photo-canvas");
  return canvas ?? node;
}

export async function exportMetricSharePng(node: HTMLElement, filename: string): Promise<void> {
  const target = resolveMetricsShareExportNode(node);
  const dataUrl = await toPng(target, EXPORT_OPTIONS);
  const link = document.createElement("a");
  link.download = sanitizeFilename(filename);
  link.href = dataUrl;
  link.click();
}

export async function copyMetricShareToClipboard(node: HTMLElement): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }
  try {
    const target = resolveMetricsShareExportNode(node);
    const blob = await toBlob(target, EXPORT_OPTIONS);
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export function buildMetricShareFilename(sectionId: string, cardId: string, variant: string): string {
  return `syra-metrics-${sanitizeFilename(sectionId)}-${sanitizeFilename(cardId)}-${sanitizeFilename(variant)}.png`;
}
