/**
 * Bandwidth / egress guards for Render outbound usage.
 * Caps proxy responses, strips oversized base64 media, discovery path helpers.
 */
import crypto from "node:crypto";

/** Max bytes playground-proxy will buffer from upstream (HTTP + Service-Initiated). */
export const PLAYGROUND_PROXY_MAX_RESPONSE_BYTES = 512 * 1024;

/** Soft cap for JSON responses that embed base64 image payloads. */
export const IMAGE_RESPONSE_MAX_JSON_BYTES = 100 * 1024;

/** Max serialized Nansen JSON returned to clients. */
export const NANSEN_RESPONSE_MAX_BYTES = 512 * 1024;

const BINARY_CONTENT_TYPE_RE =
  /^(image\/|video\/|audio\/|application\/octet-stream|application\/pdf|application\/zip|application\/gzip)/i;

/**
 * @param {string | null | undefined} contentType
 * @returns {boolean}
 */
export function isBinaryContentType(contentType) {
  if (!contentType || typeof contentType !== "string") return false;
  return BINARY_CONTENT_TYPE_RE.test(contentType.split(";")[0].trim());
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isDiscoveryBandwidthPath(path) {
  if (!path) return false;
  return (
    path === "/openapi.json" ||
    path === "/mpp-openapi.json" ||
    path === "/.well-known/x402" ||
    path === "/.well-known/x402.json" ||
    path === "/.well-known/x402-verification.json" ||
    path === "/.well-known/shadowfeed-feeds.json" ||
    path === "/.well-known/agent.json"
  );
}

/**
 * Strip inline base64 image fields; keep url fields. Returns slimmed object.
 * @param {unknown} result
 * @returns {{ result: unknown; stripped: boolean; tooLarge: boolean }}
 */
export function slimImageGenerationResult(result) {
  if (!result || typeof result !== "object") {
    return { result, stripped: false, tooLarge: false };
  }
  const cloned = /** @type {Record<string, unknown>} */ (
    JSON.parse(JSON.stringify(result))
  );
  let stripped = false;
  const data = cloned.data;
  if (Array.isArray(data)) {
    cloned.data = data.map((item) => {
      if (!item || typeof item !== "object") return item;
      const row = /** @type {Record<string, unknown>} */ ({ ...item });
      if (typeof row.b64_json === "string" && row.b64_json.length > 0) {
        delete row.b64_json;
        stripped = true;
        if (typeof row.url !== "string" || !row.url.trim()) {
          row.url_missing = true;
          row.note =
            "Inline base64 omitted to reduce egress; request URL output from the model provider.";
        }
      }
      return row;
    });
  }
  const json = JSON.stringify(cloned);
  const tooLarge = Buffer.byteLength(json, "utf8") > IMAGE_RESPONSE_MAX_JSON_BYTES;
  return { result: cloned, stripped, tooLarge };
}

/**
 * In-memory JSON response cache with ETag support.
 * @param {number} ttlMs
 */
export function createJsonBodyCache(ttlMs = 3_600_000) {
  /** @type {Map<string, { body: string; etag: string; expires: number }>} */
  const cache = new Map();

  return {
    /**
     * @param {string} key
     * @param {() => unknown | Promise<unknown>} build
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    async send(key, build, req, res) {
      const now = Date.now();
      let entry = cache.get(key);
      if (!entry || now > entry.expires) {
        const value = await build();
        const body = typeof value === "string" ? value : JSON.stringify(value);
        const etag = `"${crypto.createHash("sha1").update(body).digest("hex")}"`;
        entry = { body, etag, expires: now + ttlMs };
        cache.set(key, entry);
      }
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
      res.setHeader("ETag", entry.etag);
      if (req.headers["if-none-match"] === entry.etag) {
        return res.status(304).end();
      }
      return res.status(200).send(entry.body);
    },
  };
}

/**
 * Simple TTL cache for opaque JSON (Nansen, etc.).
 * @param {number} ttlMs
 * @param {number} [maxEntries]
 */
export function createTtlJsonCache(ttlMs, maxEntries = 200) {
  /** @type {Map<string, { expires: number; value: unknown }>} */
  const map = new Map();

  return {
    /**
     * @param {string} key
     * @returns {unknown | null}
     */
    get(key) {
      const hit = map.get(key);
      if (!hit) return null;
      if (Date.now() > hit.expires) {
        map.delete(key);
        return null;
      }
      return hit.value;
    },
    /**
     * @param {string} key
     * @param {unknown} value
     */
    set(key, value) {
      if (map.size >= maxEntries) {
        const first = map.keys().next().value;
        if (first != null) map.delete(first);
      }
      map.set(key, { value, expires: Date.now() + ttlMs });
    },
  };
}

/**
 * Cap serialized JSON size; truncate arrays at common list keys when present.
 * @param {unknown} data
 * @param {number} maxBytes
 */
export function capJsonPayload(data, maxBytes = NANSEN_RESPONSE_MAX_BYTES) {
  let json = JSON.stringify(data);
  if (Buffer.byteLength(json, "utf8") <= maxBytes) return data;

  if (data && typeof data === "object") {
    const obj = /** @type {Record<string, unknown>} */ ({ ...data });
    for (const key of ["data", "items", "results", "rows"]) {
      if (!Array.isArray(obj[key])) continue;
      let n = Math.min(obj[key].length, 50);
      while (n >= 1) {
        const next = {
          ...obj,
          [key]: obj[key].slice(0, n),
          truncated: true,
          truncation_note: `Response truncated to reduce egress (max ~${Math.floor(maxBytes / 1024)}KB).`,
        };
        json = JSON.stringify(next);
        if (Buffer.byteLength(json, "utf8") <= maxBytes) return next;
        n = Math.floor(n / 2);
      }
    }
    return {
      truncated: true,
      error: "response_too_large",
      message: `Upstream payload exceeded ${maxBytes} bytes and was not returned in full.`,
    };
  }
  return {
    truncated: true,
    error: "response_too_large",
    message: `Upstream payload exceeded ${maxBytes} bytes.`,
  };
}
