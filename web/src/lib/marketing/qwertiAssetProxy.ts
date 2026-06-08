const QWERTI_CDN = "https://widget.qwerti.ai";

function getProxyPrefix(): string {
  return `${window.location.origin}/qwerti`;
}

export function rewriteQwertiCdnUrl(url: string): string {
  if (!url.startsWith(QWERTI_CDN)) return url;
  return `${getProxyPrefix()}${url.slice(QWERTI_CDN.length)}`;
}

/** Route widget.qwerti.ai fetches/scripts through same-origin /qwerti when client DNS fails. */
export function installQwertiAssetProxy(): void {
  if (typeof window === "undefined") return;

  const win = window as Window & { __syraQwertiAssetProxy?: boolean };
  if (win.__syraQwertiAssetProxy) return;
  win.__syraQwertiAssetProxy = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input);
    const proxied = rewriteQwertiCdnUrl(url);
    if (proxied === url) return nativeFetch(input, init);
    if (typeof input === "string") return nativeFetch(proxied, init);
    if (input instanceof Request) return nativeFetch(new Request(proxied, input), init);
    return nativeFetch(proxied, init);
  };

  const scriptSrc = Object.getOwnPropertyDescriptor(
    HTMLScriptElement.prototype,
    "src",
  );
  if (scriptSrc?.set) {
    Object.defineProperty(HTMLScriptElement.prototype, "src", {
      configurable: true,
      enumerable: scriptSrc.enumerable,
      get: scriptSrc.get,
      set(value: string) {
        scriptSrc.set!.call(this, rewriteQwertiCdnUrl(String(value)));
      },
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node instanceof HTMLScriptElement && node.src.includes("widget.qwerti.ai")) {
          node.src = rewriteQwertiCdnUrl(node.src);
        }
        if (node instanceof HTMLLinkElement && node.href.includes("widget.qwerti.ai")) {
          node.href = rewriteQwertiCdnUrl(node.href);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
