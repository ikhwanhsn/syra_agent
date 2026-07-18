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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read_failed"));
    reader.readAsDataURL(blob);
  });
}

/** CORS-friendly rewrite so canvas export can include X / unavatar faces. */
function corsProxyImageUrl(url: string): string {
  const cleaned = url.replace(/^https?:\/\//i, "");
  return `https://wsrv.nl/?url=${encodeURIComponent(cleaned)}&output=png&n=-1`;
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      mode: "cors",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "force-cache",
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/") && blob.type !== "application/octet-stream") {
      // Still try — some CDNs omit content-type
    }
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

async function drawImageElementAsDataUrl(img: HTMLImageElement): Promise<string | null> {
  if (!img.complete || img.naturalWidth <= 0) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    // Tainted canvas (remote host without CORS)
    return null;
  }
}

async function resolveRemoteImageDataUrl(img: HTMLImageElement): Promise<string | null> {
  const src = img.currentSrc || img.src || "";
  if (!src) return null;
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;

  const fromCanvas = await drawImageElementAsDataUrl(img);
  if (fromCanvas) return fromCanvas;

  const direct = await fetchImageAsDataUrl(src);
  if (direct) return direct;

  const proxied = await fetchImageAsDataUrl(corsProxyImageUrl(src));
  if (proxied) return proxied;

  return null;
}

/**
 * Swap remote <img> srcs to data URLs for the duration of capture so the
 * exported PNG matches the on-screen card (including X profile photos).
 */
async function inlineRemoteImagesForCapture(root: HTMLElement): Promise<() => void> {
  const images = Array.from(root.querySelectorAll("img"));
  const restores: Array<() => void> = [];

  await Promise.all(
    images.map(async (img) => {
      const prevSrc = img.getAttribute("src");
      const current = img.currentSrc || img.src || "";
      if (!current || current.startsWith("data:") || current.startsWith("blob:")) return;

      const dataUrl = await resolveRemoteImageDataUrl(img);
      if (!dataUrl) return;

      img.setAttribute("src", dataUrl);
      img.removeAttribute("crossorigin");
      restores.push(() => {
        if (prevSrc != null) img.setAttribute("src", prevSrc);
        else img.removeAttribute("src");
        img.setAttribute("crossorigin", "anonymous");
      });
    }),
  );

  await waitForPaint();
  return () => {
    for (const restore of restores) restore();
  };
}

function buildExportOptions(fontEmbedCSS: string) {
  return {
    width: KOL_RANK_SHARE_WIDTH,
    height: KOL_RANK_SHARE_HEIGHT,
    pixelRatio: KOL_RANK_SHARE_PIXEL_RATIO,
    cacheBust: true,
    skipFonts: Boolean(fontEmbedCSS),
    fontEmbedCSS: fontEmbedCSS || undefined,
    backgroundColor: "#030303",
    // Preview cards use CSS scale() — reset so capture is full-resolution and not blank/corrupt.
    style: {
      transform: "none",
      transformOrigin: "top left",
    },
    // After inlining, only skip remaining remote imgs that couldn't be converted (keeps monogram).
    filter: (domNode: HTMLElement) => {
      if (!domNode || typeof domNode.tagName !== "string") return true;
      if (domNode.tagName !== "IMG") return true;
      const img = domNode as HTMLImageElement;
      const src = img.currentSrc || img.src || "";
      return src.startsWith("data:") || src.startsWith("blob:");
    },
  } as const;
}

function findShareCanvas(node: HTMLElement): HTMLElement {
  if (
    node.classList.contains("kol-rank-share-canvas") ||
    node.classList.contains("kol-campaign-earn-share-canvas") ||
    node.classList.contains("kol-profile-share-canvas") ||
    node.classList.contains("kol-earnings-flex-share-canvas")
  ) {
    return node;
  }
  return (
    node.querySelector<HTMLElement>(
      ".kol-rank-share-canvas, .kol-campaign-earn-share-canvas, .kol-profile-share-canvas, .kol-earnings-flex-share-canvas",
    ) ?? node
  );
}

async function prepareCapture(node: HTMLElement) {
  const target = findShareCanvas(node);

  await preloadExportAssets(target);
  const restoreImages = await inlineRemoteImagesForCapture(target);
  const fontEmbedCSS = await resolveFontEmbedCSS(target);
  await waitForPaint();
  return { target, options: buildExportOptions(fontEmbedCSS), restoreImages };
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

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mime = /data:(.*?);base64/.exec(header)?.[1] ?? "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

async function capturePngBlob(node: HTMLElement): Promise<Blob | null> {
  const prepared = await prepareCapture(node);

  try {
    // Prefer toPng → blob: more reliable than toBlob with scaled/transformed nodes.
    try {
      const dataUrl = await toPng(prepared.target, {
        ...prepared.options,
      });
      if (dataUrl?.startsWith("data:image")) {
        return dataUrlToBlob(dataUrl);
      }
    } catch {
      // fall through
    }

    try {
      const blob = await toBlob(prepared.target, prepared.options);
      if (blob) {
        return blob.type === "image/png" ? blob : new Blob([blob], { type: "image/png" });
      }
    } catch {
      // fall through
    }

    // Last resort: lower pixel ratio (some GPUs OOM / fail at 2x)
    try {
      const dataUrl = await toPng(prepared.target, {
        ...prepared.options,
        pixelRatio: 1,
      });
      if (dataUrl?.startsWith("data:image")) {
        return dataUrlToBlob(dataUrl);
      }
    } catch {
      return null;
    }

    return null;
  } finally {
    prepared.restoreImages();
  }
}

export const KOL_SHARE_PUBLIC_ORIGIN = "https://s3labs.xyz";
export const KOL_SHARE_PUBLIC_LABEL = "s3labs.xyz/kol";

export function buildKolRankShareFilename(handle: string, rank: number): string {
  return `s3labs-kol-rank-${sanitizeFilename(handle)}-#${rank}.png`;
}

export async function exportKolRankSharePng(node: HTMLElement, filename: string): Promise<void> {
  const blob = await capturePngBlob(node);
  if (!blob) throw new Error("export_failed");
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.download = sanitizeFilename(filename);
    link.href = url;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Copy share card PNG to the system clipboard.
 * Returns true on success. Remote avatars are inlined so the export matches the preview.
 */
export async function copyKolRankShareToClipboard(node: HTMLElement): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    return false;
  }

  const blob = await capturePngBlob(node);
  if (!blob) return false;

  const pngBlob =
    blob.type === "image/png" ? blob : new Blob([await blob.arrayBuffer()], { type: "image/png" });

  // Chromium: plain Blob. Safari: Promise<Blob>.
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
    return true;
  } catch {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": Promise.resolve(pngBlob) }),
      ]);
      return true;
    } catch {
      return false;
    }
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

export function buildKolCampaignEarnShareFilename(campaignTitle: string): string {
  return `s3labs-kol-campaign-${sanitizeFilename(campaignTitle)}.png`;
}

export function buildKolCampaignEarnShareTweetText(
  campaignTitle: string,
  rewardSol: number,
  timeLeft: string,
  url: string,
): string {
  const timeSnippet = timeLeft !== "Ended" && timeLeft !== "—" ? ` · ${timeLeft}` : "";
  return `${rewardSol.toFixed(2)} SOL up for grabs on @s3labs KOL Arena — "${campaignTitle}"${timeSnippet}\n\nReply or quote on X. Climb the leaderboard. Get paid in SOL.\n\n${url}`;
}

export function buildKolProfileShareUrl(handle: string): string {
  const clean = handle.trim().replace(/^@/, "");
  return `${KOL_SHARE_PUBLIC_ORIGIN}/kol/${encodeURIComponent(clean)}`;
}

export function buildKolProfileShareFilename(handle: string): string {
  const clean = handle.trim().replace(/^@/, "") || "profile";
  return `s3labs-kol-profile-${sanitizeFilename(clean)}.png`;
}

export function buildKolProfileShareTweetText(
  handle: string,
  heroLabel: string,
  heroValue: string,
  earnedSol: number,
  totalPoints: number,
  url: string,
  options?: { thirdPerson?: boolean; displayName?: string },
): string {
  const clean = handle.trim().replace(/^@/, "");
  const earnedSnippet = earnedSol > 0 ? ` · ${earnedSol.toFixed(2)} SOL earned` : "";
  const pointsSnippet = totalPoints > 0 ? ` · ${totalPoints} S3Labs pts` : "";
  const metric = `${heroValue} ${heroLabel.toLowerCase()}${earnedSnippet}${pointsSnippet}`;

  if (options?.thirdPerson) {
    const name = options.displayName?.trim() || clean;
    return `Check out ${name} (@${clean}) on @s3labs KOL Arena — ${metric}\n\n${url}`;
  }

  return `Flexing my @s3labs KOL reputation — ${metric}\n\n@${clean}\n\n${url}`;
}

export function buildKolEarningsCheckUrl(handle?: string): string {
  const base = `${KOL_SHARE_PUBLIC_ORIGIN}/kol?tab=check`;
  const clean = handle?.trim().replace(/^@/, "");
  if (!clean) return base;
  return `${base}&handle=${encodeURIComponent(clean)}`;
}

export function buildKolEarningsFlexFilename(handle: string): string {
  const clean = handle.trim().replace(/^@/, "") || "kol";
  return `s3labs-kol-earnings-${sanitizeFilename(clean)}.png`;
}

export function buildKolEarningsFlexTweetText(input: {
  handle: string;
  displayName?: string;
  totalEarnedSol: number;
  campaignCount: number;
  url: string;
  firstPerson?: boolean;
}): string {
  const clean = input.handle.trim().replace(/^@/, "");
  const sol = input.totalEarnedSol.toFixed(2);
  const campaigns =
    input.campaignCount === 1
      ? "1 campaign"
      : `${input.campaignCount} campaigns`;

  if (input.firstPerson) {
    return `Just checked my bag on @s3labs KOL Arena — ${sol} SOL across ${campaigns}.\n\nReal engagement. Real SOL.\n\nCheck yours → ${input.url}`;
  }

  const name = input.displayName?.trim() || clean;
  return `${name} (@${clean}) pulled ${sol} SOL on @s3labs KOL Arena across ${campaigns}.\n\nWho's next?\n\nCheck your earnings → ${input.url}`;
}
