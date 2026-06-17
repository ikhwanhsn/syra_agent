export const BTC_SECTION_NAV = [
  { id: "section-hero", label: "Overview" },
  { id: "section-metrics", label: "Metrics" },
  { id: "section-exchanges", label: "Exchanges" },
  { id: "section-bubblemap", label: "Flow chart" },
  { id: "section-technicals", label: "Technicals" },
  { id: "section-performance", label: "Performance" },
  { id: "section-volatility", label: "Volatility" },
  { id: "section-orderbook", label: "Order book" },
  { id: "section-funding", label: "Funding" },
  { id: "section-oi", label: "Open interest" },
  { id: "section-longshort", label: "Long/short" },
  { id: "section-takerflow", label: "Taker flow" },
  { id: "section-correlation", label: "Correlation" },
  { id: "section-feargreed", label: "Fear & Greed" },
  { id: "section-market", label: "Market" },
  { id: "section-news", label: "News" },
  { id: "section-sentiment", label: "Sentiment" },
  { id: "section-signal", label: "Signal" },
  { id: "section-supply", label: "Supply" },
  { id: "section-sources", label: "Sources" },
] as const;

export const BTC_DASHBOARD_SCROLL_ROOT_SELECTOR = "[data-dashboard-scroll-root]";

/** Matches section `scroll-mt-28` + sticky mobile chips. */
const BTC_SCROLL_OFFSET_PX = 112;

/** Dashboard pages scroll inside a nested overflow container, not the window. */
export function getBtcScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(BTC_DASHBOARD_SCROLL_ROOT_SELECTOR);
}

export function getBtcScrollMarker(): number {
  const root = getBtcScrollRoot();
  if (root) {
    return root.getBoundingClientRect().top + 56;
  }
  return BTC_SCROLL_OFFSET_PX;
}

export function scrollToBtcSection(sectionId: string): void {
  const target = document.getElementById(sectionId);
  if (!target) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = prefersReduced ? "auto" : "smooth";

  const root = getBtcScrollRoot();
  if (root) {
    const targetRect = target.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const top = root.scrollTop + (targetRect.top - rootRect.top) - 56;
    root.scrollTo({ top: Math.max(0, top), behavior });
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - BTC_SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }

  const hash = `#${sectionId}`;
  if (window.location.hash !== hash) {
    history.replaceState(null, "", hash);
  }
}

/** Last section whose top has crossed the scroll marker (works with lazy placeholders). */
export function resolveBtcActiveSection(): string {
  const marker = getBtcScrollMarker();
  let active = BTC_SECTION_NAV[0]?.id ?? "section-hero";

  for (const item of BTC_SECTION_NAV) {
    const el = document.getElementById(item.id);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= marker) {
      active = item.id;
    }
  }

  return active;
}

export function subscribeBtcScrollSpy(onScroll: () => void): () => void {
  let raf = 0;
  const handler = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(onScroll);
  };

  const root = getBtcScrollRoot();
  const target: HTMLElement | Window = root ?? window;
  target.addEventListener("scroll", handler, { passive: true });
  window.addEventListener("resize", handler);

  return () => {
    cancelAnimationFrame(raf);
    target.removeEventListener("scroll", handler);
    window.removeEventListener("resize", handler);
  };
}
