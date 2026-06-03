/** Offset aligned with section `scroll-mt-24` (6rem). */
const SECTION_SCROLL_OFFSET_PX = 96;

export function scrollInfoSection(
  container: HTMLDivElement | null,
  sectionId: string,
): void {
  const target = document.getElementById(sectionId);
  if (!target) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = prefersReduced ? "auto" : "smooth";

  if (container) {
    const top =
      target.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      SECTION_SCROLL_OFFSET_PX;
    container.scrollTo({ top: Math.max(0, top), behavior });
  } else {
    target.scrollIntoView({ behavior, block: "start" });
  }

  const hash = `#${sectionId}`;
  if (window.location.hash !== hash) {
    history.replaceState(null, "", hash);
  }
}
