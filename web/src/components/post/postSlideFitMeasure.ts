export const POST_SLIDE_MIN_FIT_SCALE = 0.68;

/** Settled reveal + fit time used before static export captures. */
export const POST_SLIDE_SETTLED_MS = 1000;

const PREVIEW_STAGE_SELECTOR =
  ".post-chrome-stage .post-record-stage:not(.post-video-export-stage)";

export function computePostSlideFitScale(
  outer: HTMLElement,
  inner: HTMLElement,
): number {
  inner.style.transform = "none";
  const contentHeight = inner.scrollHeight;
  const contentWidth = inner.scrollWidth;
  const availHeight = outer.clientHeight;
  const availWidth = outer.clientWidth;

  if (contentHeight <= 0 || contentWidth <= 0 || availHeight <= 0 || availWidth <= 0) {
    return 1;
  }

  const next = Math.min(1, availHeight / contentHeight, availWidth / contentWidth);
  return Math.max(POST_SLIDE_MIN_FIT_SCALE, next);
}

export function applyPostSlideFitTransform(
  outer: HTMLElement,
  inner: HTMLElement,
  important = false,
): void {
  const scale = computePostSlideFitScale(outer, inner);
  const value = scale === 1 ? "none" : `scale(${scale})`;
  if (important) {
    inner.style.setProperty("transform", value, "important");
    return;
  }
  inner.style.transform = value;
}

export function applyPostSlideFitToRoot(root: HTMLElement, important = false): void {
  const activeFit = root.querySelector<HTMLElement>(".post-slide-active .post-slide-fit");
  if (!activeFit) return;

  const inner = activeFit.querySelector<HTMLElement>(".post-slide-fit-inner");
  if (!inner) return;

  applyPostSlideFitTransform(activeFit, inner, important);
}

/** Mirror the on-screen preview fit so export matches what the user sees. */
export function syncExportFitFromPreview(exportRoot: HTMLElement): void {
  const previewInner = document.querySelector<HTMLElement>(
    `${PREVIEW_STAGE_SELECTOR} .post-slide-active .post-slide-fit-inner`,
  );
  const exportInner = exportRoot.querySelector<HTMLElement>(
    ".post-slide-active .post-slide-fit-inner",
  );

  if (!exportInner) return;

  if (previewInner) {
    const previewOuter = previewInner.parentElement;
    if (previewOuter) {
      applyPostSlideFitTransform(previewOuter, previewInner);
    }

    const inline = previewInner.style.transform;
    const computed = getComputedStyle(previewInner).transform;
    const transform = inline && inline !== "none" ? inline : computed;

    if (transform && transform !== "none") {
      exportInner.style.setProperty("transform", transform, "important");
      return;
    }
  }

  applyPostSlideFitToRoot(exportRoot, true);
}
