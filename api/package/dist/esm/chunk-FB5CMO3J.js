// src/shared/url.ts
import z from "zod";
function ensureProtocol(target) {
  const trimmed = target.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const host = trimmed.split("/")[0] ?? "";
  const hostname = host.split(":")[0] ?? "";
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  return `${isLocal ? "http" : "https"}://${trimmed}`;
}
var zodUrl = z.string().transform(ensureProtocol).pipe(z.url());

export {
  ensureProtocol,
  zodUrl
};
//# sourceMappingURL=chunk-FB5CMO3J.js.map