/** Tailwind `lg` — Qwerti floating launcher is desktop-only. */
export const QWERTI_DESKTOP_MIN_WIDTH_PX = 1024;

export function isQwertiDesktopViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(`(min-width: ${QWERTI_DESKTOP_MIN_WIDTH_PX}px)`).matches;
}

export function subscribeQwertiDesktopViewport(
  listener: (isDesktop: boolean) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(`(min-width: ${QWERTI_DESKTOP_MIN_WIDTH_PX}px)`);
  const notify = () => listener(mq.matches);
  notify();
  mq.addEventListener("change", notify);
  return () => mq.removeEventListener("change", notify);
}
