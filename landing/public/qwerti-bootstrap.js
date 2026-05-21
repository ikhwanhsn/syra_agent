/**
 * Runs before buy.js so manifest/core requests use same-origin /qwerti (Vite/Vercel proxy).
 * Fixes ERR_NAME_NOT_RESOLVED when the browser cannot resolve widget.qwerti.ai.
 */
(function () {
  if (window.__syraQwertiAssetProxy) return;
  window.__syraQwertiAssetProxy = true;

  var CDN = "https://widget.qwerti.ai";
  var prefix = window.location.origin + "/qwerti";

  function rewrite(url) {
    if (typeof url !== "string" || url.indexOf(CDN) !== 0) return url;
    return prefix + url.slice(CDN.length);
  }

  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : String(input);
    var proxied = rewrite(url);
    if (proxied === url) return nativeFetch(input, init);
    if (typeof input === "string") return nativeFetch(proxied, init);
    if (input instanceof Request) return nativeFetch(new Request(proxied, input), init);
    return nativeFetch(proxied, init);
  };

  var scriptSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
  if (scriptSrc && scriptSrc.set) {
    Object.defineProperty(HTMLScriptElement.prototype, "src", {
      configurable: true,
      enumerable: scriptSrc.enumerable,
      get: scriptSrc.get,
      set: function (value) {
        scriptSrc.set.call(this, rewrite(String(value)));
      },
    });
  }

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var nodes = mutations[i].addedNodes;
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        if (node.nodeType !== 1) continue;
        if (node.tagName === "SCRIPT" && node.src && node.src.indexOf("widget.qwerti.ai") !== -1) {
          node.src = rewrite(node.src);
        }
        if (node.tagName === "LINK" && node.href && node.href.indexOf("widget.qwerti.ai") !== -1) {
          node.href = rewrite(node.href);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
