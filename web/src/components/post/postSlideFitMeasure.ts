export const POST_SLIDE_MIN_FIT_SCALE = 0.68;

/** Settled reveal + fit time used before static export captures. */
export const POST_SLIDE_SETTLED_MS = 1000;

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

export function applyPostSlideFitTransform(outer: HTMLElement, inner: HTMLElement): void {
  const scale = computePostSlideFitScale(outer, inner);
  inner.style.transform = scale === 1 ? "none" : `scale(${scale})`;
}

export function applyPostSlideFitToRoot(root: HTMLElement): void {
  const activeFit = root.querySelector<HTMLElement>(".post-slide-active .post-slide-fit");
  if (!activeFit) return;

  const inner = activeFit.querySelector<HTMLElement>(".post-slide-fit-inner");
  if (!inner) return;

  applyPostSlideFitTransform(activeFit, inner);
}
