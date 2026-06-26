import { toBlob, toPng, getFontEmbedCSS } from "html-to-image";

export const KOL_RANK_SHARE_WIDTH = 1920;
export const KOL_RANK_SHARE_HEIGHT = 1080;
export const KOL_RANK_SHARE_PIXEL_RATIO = 2;

async function waitForPaint(): Promise<void> {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
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

function buildExportOptions(fontEmbedCSS: string) {
  return {
    width: KOL_RANK_SHARE_WIDTH,
    height: KOL_RANK_SHARE_HEIGHT,
    pixelRatio: KOL_RANK_SHARE_PIXEL_RATIO,
    cacheBust: true,
    skipFonts: Boolean(fontEmbedCSS),
    fontEmbedCSS: fontEmbedCSS || undefined,
    backgroundColor: "#070c0b",
  } as const;
}

async function prepareCapture(node: HTMLElement) {
  const target = node.classList.contains("kol-rank-share-canvas")
    ? node
    : (node.querySelector<HTMLElement>(".kol-rank-share-canvas") ?? node);

  await preloadExportAssets(target);
  const fontEmbedCSS = await resolveFontEmbedCSS(target);
  await waitForPaint();
  return { target, options: buildExportOptions(fontEmbedCSS) };
}

async function resolveFontEmbedCSS(node: HTMLElement): Promise<string> {
  try {
    return await getFontEmbedCSS(node);
  } catch {
    return "";
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

export const KOL_SHARE_PUBLIC_ORIGIN = "https://s3labs.id";
export const KOL_SHARE_PUBLIC_LABEL = "s3labs.id/kol";

export function buildKolRankShareFilename(handle: string, rank: number): string {
  return `s3labs-kol-rank-${sanitizeFilename(handle)}-#${rank}.png`;
}

export async function exportKolRankSharePng(node: HTMLElement, filename: string): Promise<void> {
  const prepared = await prepareCapture(node);
  const dataUrl = await toPng(prepared.target, prepared.options);
  const link = document.createElement("a");
  link.download = sanitizeFilename(filename);
  link.href = dataUrl;
  link.click();
}

export async function copyKolRankShareToClipboard(node: HTMLElement): Promise<boolean> {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  try {
    const prepared = await prepareCapture(node);
    const blob = await toBlob(prepared.target, prepared.options);
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export function buildKolRankShareUrl(campaignId: string): string {
  return `${KOL_SHARE_PUBLIC_ORIGIN}/kol?campaign=${encodeURIComponent(campaignId)}`;
}

export function buildKolRankShareTweetText(
  handle: string,
  rank: number,
  campaignTitle: string,
  payoutSol: number,
  payoutLabel: string,
  url: string,
): string {
  const ordinal = rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `#${rank}`;
  return `Just hit ${ordinal} on the @s3labs KOL Arena leaderboard for "${campaignTitle}" — ${payoutLabel.toLowerCase()} ${payoutSol.toFixed(3)} SOL.\n\n@${handle}\n\n${url}`;
}
