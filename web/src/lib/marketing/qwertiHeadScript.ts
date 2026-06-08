import {
  QWERTI_LOADER_SRC_DIRECT,
  buildQwertiEmbedAttrs,
} from "@/data/marketing/qwerti";

function findExistingLoaderScript(): HTMLScriptElement | null {
  const attrs = buildQwertiEmbedAttrs();
  return (
    document.querySelector<HTMLScriptElement>(
      `script[data-campaign="${attrs["data-campaign"]}"]`,
    ) ??
    document.querySelector<HTMLScriptElement>(
      'script[src*="widget.qwerti.ai/buy.js"]',
    )
  );
}

function scriptHasRequiredAttrs(script: HTMLScriptElement): boolean {
  const attrs = buildQwertiEmbedAttrs();
  return (
    script.dataset.widget === attrs["data-widget"] &&
    script.dataset.campaign === attrs["data-campaign"]
  );
}

/** Fallback inject when the Vite HTML transform did not run. */
export function injectQwertiHeadScript(): void {
  if (typeof document === "undefined") return;

  const existing = findExistingLoaderScript();
  if (existing && scriptHasRequiredAttrs(existing)) return;

  if (existing) {
    existing.remove();
  }
  window.Qwerti?.destroy?.();

  const script = document.createElement("script");
  script.async = true;
  script.src = QWERTI_LOADER_SRC_DIRECT;
  for (const [key, value] of Object.entries(buildQwertiEmbedAttrs())) {
    script.setAttribute(key, value);
  }
  document.head.appendChild(script);
}
