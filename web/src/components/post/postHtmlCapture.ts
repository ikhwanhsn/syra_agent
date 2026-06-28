import { getFontEmbedCSS } from "html-to-image";

export const POST_VIDEO_PREVIEW_SELECTOR =
  ".post-chrome-stage .post-record-stage:not(.post-video-export-stage)";

export const POST_VIDEO_EXPORT_SELECTOR =
  ".post-video-export-root .post-video-export-stage";

export async function waitForPaint(full = true): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  if (full) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

export async function preloadExportAssets(root: HTMLElement): Promise<void> {
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

export async function resolveFontEmbedCSS(node: HTMLElement): Promise<string> {
  try {
    return await getFontEmbedCSS(node);
  } catch {
    return "";
  }
}

export function resolvePostVideoPreviewStage(): HTMLElement | null {
  return document.querySelector<HTMLElement>(POST_VIDEO_PREVIEW_SELECTOR);
}

export function resolvePostVideoExportStage(): HTMLElement | null {
  return document.querySelector<HTMLElement>(POST_VIDEO_EXPORT_SELECTOR);
}

/** Hide frame guides and freeze reveal motion for static captures. */
export function setPostExportActive(active: boolean): void {
  document.querySelector(".post-root")?.classList.toggle("post-export-active", active);
  document.querySelector(".post-video-export-root")?.classList.toggle("post-export-active", active);
}

export function setPostExportCapturing(active: boolean): void {
  document.querySelector(".post-root")?.classList.toggle("post-export-capturing", active);
  document.querySelector(".post-photo-export-root")?.classList.toggle("post-export-capturing", active);
  document.querySelector(".post-video-export-root")?.classList.toggle("post-export-capturing", active);
}

export const postExportNodeFilter = (node: Node): boolean =>
  !(node instanceof HTMLElement && node.classList.contains("post-slide-idle"));
